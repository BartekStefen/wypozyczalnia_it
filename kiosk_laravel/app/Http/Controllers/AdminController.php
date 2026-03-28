<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\Uzytkownik;

/**
 * Kontroler panelu administratora.
 * Wszystkie endpointy chronione middleware 'auth:sanctum' + sprawdzenie roli admin.
 * Obsługuje: statystyki, zarządzanie użytkownikami, CRUD sprzętu, wypożyczenia.
 */
class AdminController extends Controller
{
    // ─── Statystyki dashboardu ────────────────────────────────────────────────

    /**
     * Zwraca zagregowane statystyki systemu dla widgetu dashboardu admina.
     */
    public function getDashboardStats(): \Illuminate\Http\JsonResponse
    {
        $totalEquipment    = DB::table('egzemplarze')->count();
        $availableCount    = DB::table('egzemplarze')->where('status', 'Dostępny')->count();
        $rentedCount       = DB::table('egzemplarze')->where('status', 'Wypożyczony')->count();
        $serviceCount      = DB::table('egzemplarze')->where('status', 'Serwis')->count();
        $totalRentals      = DB::table('wypozyczenia')->count();
        $activeRentals     = DB::table('wypozyczenia')->where('status_transakcji', 'Trwa')->count();
        $totalUsers        = DB::table('uzytkownicy')->where('role', 'klient')->count();
        $totalRevenue      = DB::table('szczegoly_wypozyczenia')->sum('koszt_pozycji') ?? 0;

        // Wypożyczenia z ostatnich 7 dni (mini wykres)
        $recentActivity = DB::table('wypozyczenia')
            ->select(DB::raw('DATE(data_wydania) as date'), DB::raw('COUNT(*) as count'))
            ->where('data_wydania', '>=', now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json([
            'equipment' => [
                'total'     => $totalEquipment,
                'available' => $availableCount,
                'rented'    => $rentedCount,
                'service'   => $serviceCount,
            ],
            'rentals' => [
                'total'  => $totalRentals,
                'active' => $activeRentals,
            ],
            'users'          => $totalUsers,
            'totalRevenue'   => number_format((float) $totalRevenue, 2, '.', ''),
            'recentActivity' => $recentActivity,
        ]);
    }

    // ─── Zarządzanie użytkownikami ────────────────────────────────────────────

    /**
     * Lista wszystkich użytkowników z liczbą ich wypożyczeń.
     */
    public function getAllUsers(Request $request): \Illuminate\Http\JsonResponse
    {
        $perPage = $request->integer('perPage', 20);

        $users = DB::table('uzytkownicy')
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
            ->groupBy('uzytkownicy.id', 'uzytkownicy.firstName', 'uzytkownicy.lastName',
                      'uzytkownicy.email', 'uzytkownicy.phone', 'uzytkownicy.role', 'uzytkownicy.created_at')
            ->orderByDesc('uzytkownicy.created_at')
            ->paginate($perPage);

        return response()->json($users);
    }

    /**
     * Zmiana roli użytkownika (klient ↔ admin).
     */
    public function updateUserRole(Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        $request->validate(['role' => 'required|in:klient,admin']);

        // Zabezpieczenie przed odebraniem sobie uprawnień
        if ($request->user()->id === $id && $request->role !== 'admin') {
            return response()->json(['message' => 'Nie możesz odebrać sobie uprawnień admina.'], 403);
        }

        DB::table('uzytkownicy')->where('id', $id)->update(['role' => $request->role]);

        return response()->json(['message' => 'Rola użytkownika została zaktualizowana.']);
    }

    /**
     * Usuwa użytkownika (soft delete - tylko dezaktywacja lub twarde usunięcie).
     */
    public function deleteUser(int $id): \Illuminate\Http\JsonResponse
    {
        $uzytkownik = Uzytkownik::findOrFail($id);

        // Usuń tokeny Sanctum przed usunięciem konta
        $uzytkownik->tokens()->delete();
        $uzytkownik->delete();

        return response()->json(['message' => 'Konto użytkownika zostało usunięte.']);
    }

    // ─── Zarządzanie sprzętem (CRUD) ─────────────────────────────────────────

    /**
     * Pełna lista sprzętu z informacjami o modelu.
     */
    public function getEquipmentList(Request $request): \Illuminate\Http\JsonResponse
    {
        $query = DB::table('egzemplarze')
            ->join('modele_sprzetu', 'egzemplarze.id_modelu', '=', 'modele_sprzetu.id_modelu')
            ->select(
                'egzemplarze.id_egzemplarza',
                'egzemplarze.numer_seryjny',
                'egzemplarze.status',
                'egzemplarze.cena_wypozyczenia_dzien',
                'modele_sprzetu.marka',
                'modele_sprzetu.nazwa_modelu',
                'modele_sprzetu.id_modelu'
            );

        // Filtrowanie po statusie
        if ($request->filled('status')) {
            $query->where('egzemplarze.status', $request->status);
        }

        // Wyszukiwanie po frazie
        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($builder) use ($q) {
                $builder->where('modele_sprzetu.marka', 'LIKE', "%{$q}%")
                        ->orWhere('modele_sprzetu.nazwa_modelu', 'LIKE', "%{$q}%")
                        ->orWhere('egzemplarze.numer_seryjny', 'LIKE', "%{$q}%");
            });
        }

        return response()->json($query->orderByDesc('egzemplarze.id_egzemplarza')->paginate(15));
    }

    /**
     * Dodanie nowego egzemplarza sprzętu.
     * Najpierw tworzy/pobiera model, potem dodaje egzemplarz.
     */
    public function createEquipment(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'marka'                   => 'required|string|max:50',
            'nazwa_modelu'            => 'required|string|max:100',
            'numer_seryjny'           => 'required|string|unique:egzemplarze,numer_seryjny',
            'cena_wypozyczenia_dzien' => 'required|numeric|min:0.01',
            'status'                  => 'in:Dostępny,Wypożyczony,Serwis',
        ]);

        return DB::transaction(function () use ($request) {
            // Znajdź lub utwórz model sprzętu
            $model = DB::table('modele_sprzetu')
                ->where('marka', $request->marka)
                ->where('nazwa_modelu', $request->nazwa_modelu)
                ->first();

            if (!$model) {
                $modelId = DB::table('modele_sprzetu')->insertGetId([
                    'marka'        => $request->marka,
                    'nazwa_modelu' => $request->nazwa_modelu,
                ]);
            } else {
                $modelId = $model->id_modelu;
            }

            $id = DB::table('egzemplarze')->insertGetId([
                'id_modelu'               => $modelId,
                'numer_seryjny'           => $request->numer_seryjny,
                'status'                  => $request->status ?? 'Dostępny',
                'cena_wypozyczenia_dzien' => $request->cena_wypozyczenia_dzien,
            ]);

            return response()->json(['id' => $id, 'message' => 'Sprzęt został dodany.'], 201);
        });
    }

    /**
     * Aktualizacja danych egzemplarza sprzętu.
     */
    public function updateEquipment(Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'numer_seryjny'           => "sometimes|string|unique:egzemplarze,numer_seryjny,{$id},id_egzemplarza",
            'cena_wypozyczenia_dzien' => 'sometimes|numeric|min:0.01',
            'status'                  => 'sometimes|in:Dostępny,Wypożyczony,Serwis',
        ]);

        $updated = DB::table('egzemplarze')
            ->where('id_egzemplarza', $id)
            ->update($request->only(['numer_seryjny', 'cena_wypozyczenia_dzien', 'status']));

        if (!$updated) {
            return response()->json(['message' => 'Nie znaleziono sprzętu.'], 404);
        }

        return response()->json(['message' => 'Dane sprzętu zaktualizowane.']);
    }

    /**
     * Usuwa egzemplarz sprzętu jeśli nie jest aktualnie wypożyczony.
     */
    public function deleteEquipment(int $id): \Illuminate\Http\JsonResponse
    {
        $sprzet = DB::table('egzemplarze')->where('id_egzemplarza', $id)->first();

        if (!$sprzet) {
            return response()->json(['message' => 'Nie znaleziono sprzętu.'], 404);
        }

        if ($sprzet->status === 'Wypożyczony') {
            return response()->json(['message' => 'Nie można usunąć aktualnie wypożyczonego sprzętu.'], 409);
        }

        DB::table('egzemplarze')->where('id_egzemplarza', $id)->delete();

        return response()->json(['message' => 'Sprzęt został usunięty.']);
    }

    // ─── Zarządzanie wypożyczeniami ───────────────────────────────────────────

    /**
     * Lista wszystkich wypożyczeń z danymi klienta i sprzętu.
     */
    public function getAllRentals(Request $request): \Illuminate\Http\JsonResponse
    {
        $rentals = DB::table('wypozyczenia')
            ->leftJoin('klienci',              'wypozyczenia.id_klienta',    '=', 'klienci.id_klienta')
            ->leftJoin('uzytkownicy',          'wypozyczenia.id_uzytkownika','=', 'uzytkownicy.id')
            ->leftJoin('szczegoly_wypozyczenia','wypozyczenia.id_wypozyczenia','=','szczegoly_wypozyczenia.id_wypozyczenia')
            ->leftJoin('egzemplarze',          'szczegoly_wypozyczenia.id_egzemplarza','=','egzemplarze.id_egzemplarza')
            ->leftJoin('modele_sprzetu',       'egzemplarze.id_modelu','=','modele_sprzetu.id_modelu')
            ->select(
                'wypozyczenia.id_wypozyczenia',
                'wypozyczenia.data_wydania',
                'wypozyczenia.planowana_data_zwrotu',
                'wypozyczenia.status_transakcji',
                DB::raw("COALESCE(uzytkownicy.firstName, klienci.imie, 'Gość') as clientFirstName"),
                DB::raw("COALESCE(uzytkownicy.lastName,  klienci.nazwisko, '') as clientLastName"),
                DB::raw("COALESCE(uzytkownicy.email,     klienci.email,    '') as clientEmail"),
                DB::raw("CONCAT(modele_sprzetu.marka, ' ', modele_sprzetu.nazwa_modelu) as equipmentName"),
                'szczegoly_wypozyczenia.koszt_pozycji'
            )
            ->orderByDesc('wypozyczenia.id_wypozyczenia')
            ->paginate(20);

        return response()->json($rentals);
    }

    /**
     * Zmiana statusu wypożyczenia (np. Trwa → Zakończony) i aktualizacja stanu sprzętu.
     */
    public function updateRentalStatus(Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        $request->validate(['status' => 'required|in:Trwa,Zakończony,Anulowany']);

        return DB::transaction(function () use ($request, $id) {
            $rental = DB::table('wypozyczenia')->where('id_wypozyczenia', $id)->first();

            if (!$rental) {
                return response()->json(['message' => 'Nie znaleziono wypożyczenia.'], 404);
            }

            DB::table('wypozyczenia')
                ->where('id_wypozyczenia', $id)
                ->update(['status_transakcji' => $request->status]);

            // Jeśli zakończono - zwróć sprzęt do magazynu
            if (in_array($request->status, ['Zakończony', 'Anulowany'])) {
                $detail = DB::table('szczegoly_wypozyczenia')
                    ->where('id_wypozyczenia', $id)
                    ->first();

                if ($detail) {
                    DB::table('egzemplarze')
                        ->where('id_egzemplarza', $detail->id_egzemplarza)
                        ->update(['status' => 'Dostępny']);

                    // Zapisz rzeczywistą datę zwrotu
                    DB::table('szczegoly_wypozyczenia')
                        ->where('id_wypozyczenia', $id)
                        ->update(['rzeczywista_data_zwrotu' => now()]);
                }
            }

            return response()->json(['message' => 'Status wypożyczenia zaktualizowany.']);
        });
    }
}