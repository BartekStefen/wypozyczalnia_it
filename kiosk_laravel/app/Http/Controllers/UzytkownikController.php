<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UzytkownikController extends Controller
{
    // Zwraca profil zalogowanego użytkownika z aliasami PL i EN
    public function show(Request $request)
    {
        $u = $request->user();
        return response()->json([
            'id'        => $u->id,
            'firstName' => $u->firstName,
            'lastName'  => $u->lastName,
            'imie'      => $u->firstName,
            'nazwisko'  => $u->lastName,
            'email'     => $u->email,
            'phone'     => $u->phone,
            'role'      => $u->role,
            'rola'      => $u->role,
            'isAdmin'   => $u->role === 'admin',
        ]);
    }

    // Aktualizacja profilu — akceptuje zarówno nazwy PL jak i EN z formularza
    public function update(Request $request)
    {
        $request->validate([
            'firstName' => 'sometimes|string|max:100',
            'imie'      => 'sometimes|string|max:100',
            'lastName'  => 'sometimes|string|max:100',
            'nazwisko'  => 'sometimes|string|max:100',
            'email'     => 'sometimes|email|unique:uzytkownicy,email,' . $request->user()->id,
            'phone'     => 'sometimes|nullable|string|max:20',
        ]);

        // Mapowanie aliasów PL → EN (PanelKlienta wysyła imie/nazwisko)
        $data = array_filter([
            'firstName' => $request->firstName ?? $request->imie,
            'lastName'  => $request->lastName  ?? $request->nazwisko,
            'email'     => $request->email,
            'phone'     => $request->phone,
        ], fn($v) => $v !== null);

        $request->user()->update($data);
        return response()->json($this->show($request)->getData());
    }

    /**
     * Historia wypożyczeń zalogowanego użytkownika.
     *
     * LEFT JOIN na wynajmy używa podwójnego warunku:
     *   id_egzemplarza = egzemplarz z wypożyczenia
     *   id_uzytkownika = zalogowany klient
     *
     * Dzięki temu COALESCE(wy.data_start, w.data_wydania) poprawnie
     * wybiera datę z wynajmy jeśli istnieje, albo z samego wypożyczenia.
     * To obsługuje starsze wypożyczenia które mogą nie mieć rekordu w wynajmy.
     */
    public function myRentals(Request $request)
    {
        $uid = $request->user()->id;

        $rentals = DB::table('wypozyczenia as w')
            ->join('szczegoly_wypozyczenia as sw', 'w.id_wypozyczenia', '=', 'sw.id_wypozyczenia')
            ->join('egzemplarze as e',   'sw.id_egzemplarza', '=', 'e.id_egzemplarza')
            ->join('modele_sprzetu as ms','e.id_modelu',       '=', 'ms.id_modelu')
            ->leftJoin('wynajmy as wy', function ($join) {
                $join->on('wy.id_egzemplarza', '=', 'e.id_egzemplarza')
                     ->on('wy.id_uzytkownika',  '=', 'w.id_uzytkownika');
            })
            ->where('w.id_uzytkownika', $uid)
            ->select(
                DB::raw("CONCAT('ZAM-', LPAD(w.id_wypozyczenia, 4, '0')) as id"),
                DB::raw("CONCAT(ms.marka, ' ', ms.nazwa_modelu) as produkt"),
                'w.status_transakcji as status',
                DB::raw('COALESCE(DATE(wy.data_start),  DATE(w.data_wydania))        as dataOd'),
                DB::raw('COALESCE(DATE(wy.data_koniec), DATE(w.planowana_data_zwrotu)) as dataDo'),
                DB::raw("CONCAT(FORMAT(sw.koszt_pozycji, 2), ' zł') as kwota"),
                'w.id_wypozyczenia as sortKey'
            )
            ->orderByDesc('w.id_wypozyczenia')
            ->get()
            ->map(function ($r) {
                $statusMap = [
                    'Trwa'       => 'aktywne',
                    'Zakończony' => 'zwrócono',
                    'Anulowany'  => 'anulowano',
                ];
                $r->status = $statusMap[$r->status] ?? strtolower($r->status);
                return $r;
            });

        return response()->json($rentals);
    }
}