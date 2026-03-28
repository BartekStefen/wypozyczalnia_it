<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Uzytkownik;

/**
 * Panel administratora — prawdziwe dane z bazy.
 */
class AdminController extends Controller
{
    // Statystyki dashboardu - rzeczywiste liczby z bazy
    public function getDashboardStats(): \Illuminate\Http\JsonResponse
    {
        $totalEquipment = DB::table('egzemplarze')->count();
        $available      = DB::table('egzemplarze')->where('status', 'Dostępny')->count();
        $rented         = DB::table('egzemplarze')->where('status', 'Wypożyczony')->count();
        $service        = DB::table('egzemplarze')->where('status', 'Serwis')->count();
        $totalRentals   = DB::table('wypozyczenia')->count();
        $activeRentals  = DB::table('wypozyczenia')->where('status_transakcji', 'Trwa')->count();
        $totalUsers     = DB::table('uzytkownicy')->where('role', 'klient')->count();
        $totalRevenue   = DB::table('szczegoly_wypozyczenia')->sum('koszt_pozycji') ?? 0;

        // Aktywność z ostatnich 7 dni
        $recentActivity = DB::table('wynajmy')
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as count'))
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json([
            'equipment'      => compact('totalEquipment', 'available', 'rented', 'service'),
            'rentals'        => ['total' => $totalRentals, 'active' => $activeRentals],
            'users'          => $totalUsers,
            'totalRevenue'   => number_format((float) $totalRevenue, 2, '.', ''),
            'recentActivity' => $recentActivity,
        ]);
    }

    // Lista użytkowników z liczbą wypożyczeń
    public function getAllUsers(Request $request): \Illuminate\Http\JsonResponse
    {
        $users = DB::table('uzytkownicy')
            ->leftJoin('wypozyczenia', 'uzytkownicy.id', '=', 'wypozyczenia.id_uzytkownika')
            ->select(
                'uzytkownicy.id', 'uzytkownicy.firstName', 'uzytkownicy.lastName',
                'uzytkownicy.email', 'uzytkownicy.phone', 'uzytkownicy.role',
                'uzytkownicy.created_at',
                DB::raw('COUNT(wypozyczenia.id_wypozyczenia) as rentalsCount')
            )
            ->groupBy('uzytkownicy.id', 'uzytkownicy.firstName', 'uzytkownicy.lastName',
                      'uzytkownicy.email', 'uzytkownicy.phone', 'uzytkownicy.role', 'uzytkownicy.created_at')
            ->orderByDesc('uzytkownicy.created_at')
            ->paginate($request->integer('perPage', 20));

        return response()->json($users);
    }

    public function updateUserRole(Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        $request->validate(['role' => 'required|in:klient,admin']);

        if ($request->user()->id === $id) {
            return response()->json(['message' => 'Nie możesz zmienić własnej roli.'], 403);
        }

        DB::table('uzytkownicy')->where('id', $id)->update(['role' => $request->role]);
        return response()->json(['message' => 'Rola zaktualizowana.']);
    }

    public function deleteUser(int $id): \Illuminate\Http\JsonResponse
    {
        $u = Uzytkownik::findOrFail($id);
        $u->tokens()->delete();
        $u->delete();
        return response()->json(['message' => 'Konto usunięte.']);
    }

    // Lista sprzętu z filtrami
    public function getEquipmentList(Request $request): \Illuminate\Http\JsonResponse
    {
        $query = DB::table('egzemplarze')
            ->join('modele_sprzetu', 'egzemplarze.id_modelu', '=', 'modele_sprzetu.id_modelu')
            ->select('egzemplarze.*', 'modele_sprzetu.marka', 'modele_sprzetu.nazwa_modelu');

        if ($request->filled('status')) $query->where('egzemplarze.status', $request->status);
        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(fn($b) =>
                $b->where('modele_sprzetu.marka', 'LIKE', "%{$q}%")
                  ->orWhere('modele_sprzetu.nazwa_modelu', 'LIKE', "%{$q}%")
                  ->orWhere('egzemplarze.numer_seryjny', 'LIKE', "%{$q}%")
            );
        }

        return response()->json($query->orderByDesc('egzemplarze.id_egzemplarza')->paginate(15));
    }

    public function createEquipment(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'marka'                   => 'required|string|max:50',
            'nazwa_modelu'            => 'required|string|max:100',
            'numer_seryjny'           => 'required|string|unique:egzemplarze,numer_seryjny',
            'cena_wypozyczenia_dzien' => 'required|numeric|min:0.01',
        ]);

        return DB::transaction(function () use ($request) {
            $model = DB::table('modele_sprzetu')
                ->where('marka', $request->marka)
                ->where('nazwa_modelu', $request->nazwa_modelu)
                ->first();

            $modelId = $model
                ? $model->id_modelu
                : DB::table('modele_sprzetu')->insertGetId(['marka' => $request->marka, 'nazwa_modelu' => $request->nazwa_modelu]);

            $id = DB::table('egzemplarze')->insertGetId([
                'id_modelu'               => $modelId,
                'numer_seryjny'           => $request->numer_seryjny,
                'status'                  => $request->status ?? 'Dostępny',
                'cena_wypozyczenia_dzien' => $request->cena_wypozyczenia_dzien,
            ]);

            return response()->json(['id' => $id, 'message' => 'Sprzęt dodany.'], 201);
        });
    }

    public function updateEquipment(Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        DB::table('egzemplarze')->where('id_egzemplarza', $id)
            ->update($request->only(['numer_seryjny', 'cena_wypozyczenia_dzien', 'status']));

        return response()->json(['message' => 'Zaktualizowano.']);
    }

    public function deleteEquipment(int $id): \Illuminate\Http\JsonResponse
    {
        $s = DB::table('egzemplarze')->where('id_egzemplarza', $id)->first();
        if (!$s) return response()->json(['message' => 'Nie znaleziono.'], 404);
        if ($s->status === 'Wypożyczony') return response()->json(['message' => 'Nie można usunąć wypożyczonego sprzętu.'], 409);

        DB::table('egzemplarze')->where('id_egzemplarza', $id)->delete();
        return response()->json(['message' => 'Usunięto.']);
    }

    // Lista wszystkich wypożyczeń (admin)
    public function getAllRentals(Request $request): \Illuminate\Http\JsonResponse
    {
        $rentals = DB::table('wypozyczenia')
            ->leftJoin('klienci',              'wypozyczenia.id_klienta',    '=', 'klienci.id_klienta')
            ->leftJoin('uzytkownicy',          'wypozyczenia.id_uzytkownika','=', 'uzytkownicy.id')
            ->leftJoin('szczegoly_wypozyczenia','wypozyczenia.id_wypozyczenia','=','szczegoly_wypozyczenia.id_wypozyczenia')
            ->leftJoin('egzemplarze',          'szczegoly_wypozyczenia.id_egzemplarza','=','egzemplarze.id_egzemplarza')
            ->leftJoin('modele_sprzetu',       'egzemplarze.id_modelu','=','modele_sprzetu.id_modelu')
            ->leftJoin('wynajmy',              function($j) {
                $j->on('wynajmy.id_egzemplarza', '=', 'egzemplarze.id_egzemplarza')
                  ->whereColumn('wynajmy.id_uzytkownika', 'wypozyczenia.id_uzytkownika');
            })
            ->select(
                'wypozyczenia.id_wypozyczenia',
                'wypozyczenia.data_wydania',
                'wypozyczenia.planowana_data_zwrotu',
                'wypozyczenia.status_transakcji',
                DB::raw("COALESCE(uzytkownicy.firstName, klienci.imie, 'Gość') as clientFirstName"),
                DB::raw("COALESCE(uzytkownicy.lastName,  klienci.nazwisko, '') as clientLastName"),
                DB::raw("COALESCE(uzytkownicy.email,     klienci.email, '') as clientEmail"),
                DB::raw("CONCAT(COALESCE(modele_sprzetu.marka,''), ' ', COALESCE(modele_sprzetu.nazwa_modelu,'')) as equipmentName"),
                'szczegoly_wypozyczenia.koszt_pozycji',
                'wynajmy.data_start',
                'wynajmy.data_koniec'
            )
            ->orderByDesc('wypozyczenia.id_wypozyczenia')
            ->paginate(20);

        return response()->json($rentals);
    }

    public function updateRentalStatus(Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        $request->validate(['status' => 'required|in:Trwa,Zakończony,Anulowany']);

        return DB::transaction(function () use ($request, $id) {
            DB::table('wypozyczenia')->where('id_wypozyczenia', $id)->update(['status_transakcji' => $request->status]);

            if (in_array($request->status, ['Zakończony', 'Anulowany'])) {
                $detail = DB::table('szczegoly_wypozyczenia')->where('id_wypozyczenia', $id)->first();
                if ($detail) {
                    DB::table('egzemplarze')->where('id_egzemplarza', $detail->id_egzemplarza)->update(['status' => 'Dostępny']);
                    DB::table('szczegoly_wypozyczenia')->where('id_wypozyczenia', $id)->update(['rzeczywista_data_zwrotu' => now()]);
                    DB::table('wynajmy')->where('id_egzemplarza', $detail->id_egzemplarza)->where('status', 'Zarezerwowany')->update(['status' => 'Anulowany', 'updated_at' => now()]);
                }
            }

            return response()->json(['message' => 'Status zaktualizowany.']);
        });
    }
}