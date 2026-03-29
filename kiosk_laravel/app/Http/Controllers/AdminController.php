<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Uzytkownik;

class AdminController extends Controller
{
    /**
     * Statystyki dashboardu — agreguje dane z wielu tabel jednym przebiegiem.
     *
     * Każda wartość pochodzi bezpośrednio z bazy:
     *   - equipment.*  → tabela egzemplarze (COUNT z GROUP BY status)
     *   - rentals.*    → tabela wypozyczenia
     *   - users        → uzytkownicy z rolą 'klient'
     *   - totalRevenue → suma koszt_pozycji ze szczegoly_wypozyczenia (tylko zakończone)
     *
     * recentActivity zlicza nowe wynajmy per dzień z ostatnich 7 dni —
     * używane do wykresu słupkowego na dashboardzie.
     */
    public function getDashboardStats(): \Illuminate\Http\JsonResponse
    {
        // Jedno zapytanie agregujące statusy sprzętu zamiast trzech osobnych COUNT
        $statusy = DB::table('egzemplarze')
            ->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Dostępny'    THEN 1 ELSE 0 END) as available,
                SUM(CASE WHEN status = 'Wypożyczony' THEN 1 ELSE 0 END) as rented,
                SUM(CASE WHEN status = 'Serwis'      THEN 1 ELSE 0 END) as service
            ")
            ->first();

        $totalRentals  = DB::table('wypozyczenia')->count();
        $activeRentals = DB::table('wypozyczenia')->where('status_transakcji', 'Trwa')->count();
        $totalUsers    = DB::table('uzytkownicy')->where('role', 'klient')->count();

        // Przychód tylko z zakończonych wypożyczeń — anulowane nie generują przychodu
        $totalRevenue = DB::table('szczegoly_wypozyczenia as sw')
            ->join('wypozyczenia as w', 'sw.id_wypozyczenia', '=', 'w.id_wypozyczenia')
            ->where('w.status_transakcji', 'Zakończony')
            ->sum('sw.koszt_pozycji') ?? 0;

        // Aktywność per dzień — grupowanie po dacie bez czasu
        $recentActivity = DB::table('wynajmy')
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays(7))
            ->whereNotNull('created_at')
            ->groupByRaw('DATE(created_at)')
            ->orderBy('date')
            ->get();

        return response()->json([
            'equipment'      => [
                'total'     => (int) ($statusy->total     ?? 0),
                'available' => (int) ($statusy->available ?? 0),
                'rented'    => (int) ($statusy->rented    ?? 0),
                'service'   => (int) ($statusy->service   ?? 0),
            ],
            'rentals'        => ['total' => $totalRentals, 'active' => $activeRentals],
            'users'          => $totalUsers,
            'totalRevenue'   => number_format((float) $totalRevenue, 2, '.', ''),
            'recentActivity' => $recentActivity,
        ]);
    }

    /**
     * Lista użytkowników z liczbą wypożyczeń każdego z nich.
     *
     * LEFT JOIN na wypozyczenia zapewnia że klienci bez wypożyczeń też się pokazują.
     * COUNT(wypozyczenia.id_wypozyczenia) = 0 dla klientów bez rezerwacji (nie NULL).
     */
    public function getAllUsers(Request $request): \Illuminate\Http\JsonResponse
    {
        $query = DB::table('uzytkownicy')
            ->leftJoin('wypozyczenia', 'uzytkownicy.id', '=', 'wypozyczenia.id_uzytkownika')
            ->select(
                'uzytkownicy.id',
                'uzytkownicy.firstName',
                'uzytkownicy.lastName',
                'uzytkownicy.email',
                'uzytkownicy.phone',
                'uzytkownicy.role',
                'uzytkownicy.created_at',
                DB::raw('COUNT(wypozyczenia.id_wypozyczenia) as rentalsCount')
            )
            ->groupBy(
                'uzytkownicy.id', 'uzytkownicy.firstName', 'uzytkownicy.lastName',
                'uzytkownicy.email', 'uzytkownicy.phone', 'uzytkownicy.role',
                'uzytkownicy.created_at'
            )
            ->orderByDesc('uzytkownicy.created_at');

        // Wyszukiwanie po imieniu lub adresie e-mail
        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($b) use ($q) {
                $b->where('uzytkownicy.firstName', 'LIKE', "%{$q}%")
                  ->orWhere('uzytkownicy.lastName',  'LIKE', "%{$q}%")
                  ->orWhere('uzytkownicy.email',     'LIKE', "%{$q}%");
            });
        }

        return response()->json($query->paginate($request->integer('perPage', 20)));
    }

    // Zmiana roli — administrator nie może zmienić własnej roli (zabezpieczenie przed lock-outem)
    public function updateUserRole(Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        $request->validate(['role' => 'required|in:klient,admin']);

        if ($request->user()->id === $id) {
            return response()->json(['message' => 'Nie możesz zmienić własnej roli.'], 403);
        }

        DB::table('uzytkownicy')->where('id', $id)->update(['role' => $request->role]);
        return response()->json(['message' => 'Rola zaktualizowana.']);
    }

    // Usunięcie konta wraz z tokenami Sanctum — zapobiega dostępowi usuniętego usera
    public function deleteUser(int $id): \Illuminate\Http\JsonResponse
    {
        $u = Uzytkownik::findOrFail($id);
        $u->tokens()->delete();
        $u->delete();
        return response()->json(['message' => 'Konto usunięte.']);
    }

    // Lista egzemplarzy z filtrowaniem — perPage=200 używane przez formularz Serwisu
    public function getEquipmentList(Request $request): \Illuminate\Http\JsonResponse
    {
        $query = DB::table('egzemplarze')
            ->join('modele_sprzetu', 'egzemplarze.id_modelu', '=', 'modele_sprzetu.id_modelu')
            ->select('egzemplarze.*', 'modele_sprzetu.marka', 'modele_sprzetu.nazwa_modelu');

        if ($request->filled('status')) {
            $query->where('egzemplarze.status', $request->status);
        }
        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(fn($b) =>
                $b->where('modele_sprzetu.marka',        'LIKE', "%{$q}%")
                  ->orWhere('modele_sprzetu.nazwa_modelu','LIKE', "%{$q}%")
                  ->orWhere('egzemplarze.numer_seryjny',  'LIKE', "%{$q}%")
            );
        }

        $perPage = min($request->integer('perPage', 15), 200);
        return response()->json($query->orderByDesc('egzemplarze.id_egzemplarza')->paginate($perPage));
    }

    /**
     * Dodaje nowy egzemplarz sprzętu.
     *
     * Logika modelu: jeśli marka+model już istnieje w modele_sprzetu, reużywa istniejący rekord.
     * Dzięki temu jeden model (np. "DJI Mavic 3 Pro") może mieć wiele egzemplarzy
     * z różnymi numerami seryjnymi i cenami.
     */
    public function createEquipment(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'marka'                   => 'required|string|max:50',
            'nazwa_modelu'            => 'required|string|max:100',
            'numer_seryjny'           => 'required|string|unique:egzemplarze,numer_seryjny',
            'cena_wypozyczenia_dzien' => 'required|numeric|min:0.01',
        ], [
            'numer_seryjny.unique' => 'Egzemplarz o tym numerze seryjnym już istnieje w systemie.',
        ]);

        return DB::transaction(function () use ($request) {
            // firstOrCreate dla modelu — nie duplikuje istniejących kombinacji marka+model
            $model = DB::table('modele_sprzetu')
                ->where('marka', $request->marka)
                ->where('nazwa_modelu', $request->nazwa_modelu)
                ->first();

            $modelId = $model
                ? $model->id_modelu
                : DB::table('modele_sprzetu')->insertGetId([
                    'marka'        => $request->marka,
                    'nazwa_modelu' => $request->nazwa_modelu,
                ]);

            $id = DB::table('egzemplarze')->insertGetId([
                'id_modelu'               => $modelId,
                'numer_seryjny'           => $request->numer_seryjny,
                'status'                  => $request->status ?? 'Dostępny',
                'cena_wypozyczenia_dzien' => $request->cena_wypozyczenia_dzien,
            ]);

            return response()->json(['id' => $id, 'message' => 'Sprzęt dodany pomyślnie.'], 201);
        });
    }

    // Aktualizacja egzemplarza z walidacją pól liczbowych
    public function updateEquipment(Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'cena_wypozyczenia_dzien' => 'sometimes|numeric|min:0.01',
            'status'                  => 'sometimes|in:Dostępny,Wypożyczony,Serwis',
        ]);

        DB::table('egzemplarze')
            ->where('id_egzemplarza', $id)
            ->update($request->only(['numer_seryjny', 'cena_wypozyczenia_dzien', 'status']));

        return response()->json(['message' => 'Zaktualizowano.']);
    }

    // Usuwanie — blokada dla wypożyczonego sprzętu (integralność danych)
    public function deleteEquipment(int $id): \Illuminate\Http\JsonResponse
    {
        $s = DB::table('egzemplarze')->where('id_egzemplarza', $id)->first();
        if (!$s) return response()->json(['message' => 'Nie znaleziono.'], 404);
        if ($s->status === 'Wypożyczony') {
            return response()->json(['message' => 'Nie można usunąć wypożyczonego sprzętu.'], 409);
        }

        DB::table('egzemplarze')->where('id_egzemplarza', $id)->delete();
        return response()->json(['message' => 'Usunięto.']);
    }

    /**
     * Lista wszystkich wypożyczeń — łączy dane z 6 tabel.
     *
     * COALESCE(uzytkownicy.*, klienci.*, 'Gość') obsługuje dwa przypadki:
     *   - Wypożyczenie powiązane z kontem (id_uzytkownika) → dane z uzytkownicy
     *   - Wypożyczenie gościa (id_klienta) → dane z klienci
     *   - Brak obu → fallback 'Gość'
     */
    public function getAllRentals(Request $request): \Illuminate\Http\JsonResponse
    {
        $query = DB::table('wypozyczenia as w')
            ->leftJoin('klienci as k',               'w.id_klienta',         '=', 'k.id_klienta')
            ->leftJoin('uzytkownicy as u',            'w.id_uzytkownika',     '=', 'u.id')
            ->leftJoin('szczegoly_wypozyczenia as sw','w.id_wypozyczenia',    '=', 'sw.id_wypozyczenia')
            ->leftJoin('egzemplarze as e',            'sw.id_egzemplarza',    '=', 'e.id_egzemplarza')
            ->leftJoin('modele_sprzetu as ms',        'e.id_modelu',          '=', 'ms.id_modelu')
            ->leftJoin('wynajmy as wy', function ($j) {
                $j->on('wy.id_egzemplarza', '=', 'e.id_egzemplarza')
                  ->on('wy.id_uzytkownika',  '=', 'w.id_uzytkownika');
            })
            ->select(
                'w.id_wypozyczenia',
                'w.data_wydania',
                'w.planowana_data_zwrotu',
                'w.status_transakcji',
                DB::raw("COALESCE(u.firstName, k.imie,    'Gość') as clientFirstName"),
                DB::raw("COALESCE(u.lastName,  k.nazwisko, '')    as clientLastName"),
                DB::raw("COALESCE(u.email,     k.email,    '')    as clientEmail"),
                DB::raw("CONCAT(COALESCE(ms.marka,''), ' ', COALESCE(ms.nazwa_modelu,'')) as equipmentName"),
                'sw.koszt_pozycji',
                'wy.data_start',
                'wy.data_koniec'
            )
            ->orderByDesc('w.id_wypozyczenia');

        if ($request->filled('status')) {
            $query->where('w.status_transakcji', $request->status);
        }
        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($b) use ($q) {
                $b->where('u.firstName',    'LIKE', "%{$q}%")
                  ->orWhere('u.email',      'LIKE', "%{$q}%")
                  ->orWhere('k.imie',       'LIKE', "%{$q}%")
                  ->orWhere('ms.marka',     'LIKE', "%{$q}%")
                  ->orWhere('ms.nazwa_modelu','LIKE',"%{$q}%");
            });
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Zmiana statusu wypożyczenia z efektem ubocznym na sprzęt.
     *
     * Zakończony/Anulowany → egzemplarz wraca do 'Dostępny' automatycznie.
     * Blokada kalendarza (wynajmy) jest anulowana — slot terminu zwolniony.
     * Wszystko w transakcji — spójność między tabelami jest gwarantowana.
     */
    public function updateRentalStatus(Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        $request->validate(['status' => 'required|in:Trwa,Zakończony,Anulowany']);

        return DB::transaction(function () use ($request, $id) {
            DB::table('wypozyczenia')
                ->where('id_wypozyczenia', $id)
                ->update(['status_transakcji' => $request->status]);

            if (in_array($request->status, ['Zakończony', 'Anulowany'])) {
                $detail = DB::table('szczegoly_wypozyczenia')
                    ->where('id_wypozyczenia', $id)->first();

                if ($detail) {
                    DB::table('egzemplarze')
                        ->where('id_egzemplarza', $detail->id_egzemplarza)
                        ->update(['status' => 'Dostępny']);

                    DB::table('szczegoly_wypozyczenia')
                        ->where('id_wypozyczenia', $id)
                        ->update(['rzeczywista_data_zwrotu' => now()]);

                    DB::table('wynajmy')
                        ->where('id_egzemplarza', $detail->id_egzemplarza)
                        ->where('status', 'Zarezerwowany')
                        ->update(['status' => 'Anulowany', 'updated_at' => now()]);
                }
            }

            return response()->json(['message' => 'Status zaktualizowany.']);
        });
    }

    // Lista modeli do selectów w formularzach — zwraca unikalne kombinacje marka+model
    public function getModels(): \Illuminate\Http\JsonResponse
    {
        return response()->json(
            DB::table('modele_sprzetu')
                ->select('id_modelu', 'marka', 'nazwa_modelu')
                ->orderBy('marka')->orderBy('nazwa_modelu')
                ->get()
        );
    }
}