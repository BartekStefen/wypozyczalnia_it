<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Kontroler użytkownika — profil, historia wypożyczeń z prawdziwej bazy.
 */
class UzytkownikController extends Controller
{
    // Zwraca dane zalogowanego użytkownika
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

    // Aktualizacja profilu
    public function update(Request $request)
    {
        $request->validate([
            'firstName' => 'sometimes|string|max:100',
            'lastName'  => 'sometimes|string|max:100',
            'email'     => 'sometimes|email|unique:uzytkownicy,email,' . $request->user()->id,
            'phone'     => 'sometimes|nullable|string|max:20',
        ]);

        $data = array_filter($request->only(['firstName', 'lastName', 'email', 'phone']), fn($v) => $v !== null);
        $request->user()->update($data);

        return response()->json($this->show($request)->getData());
    }

    /**
     * Historia wypożyczeń zalogowanego użytkownika — prawdziwe dane z bazy.
     * Łączy tabele: wypozyczenia → szczegoly → egzemplarze → modele_sprzetu
     */
    public function myRentals(Request $request)
    {
        $uid = $request->user()->id;

        $rentals = DB::table('wypozyczenia')
            ->join('szczegoly_wypozyczenia', 'wypozyczenia.id_wypozyczenia', '=', 'szczegoly_wypozyczenia.id_wypozyczenia')
            ->join('egzemplarze',   'szczegoly_wypozyczenia.id_egzemplarza', '=', 'egzemplarze.id_egzemplarza')
            ->join('modele_sprzetu','egzemplarze.id_modelu', '=', 'modele_sprzetu.id_modelu')
            ->leftJoin('wynajmy', function ($join) {
                $join->on('wynajmy.id_egzemplarza', '=', 'egzemplarze.id_egzemplarza')
                     ->on('wynajmy.id_uzytkownika', '=', 'wypozyczenia.id_uzytkownika');
            })
            ->where('wypozyczenia.id_uzytkownika', $uid)
            ->select(
                DB::raw("CONCAT('ZAM-', LPAD(wypozyczenia.id_wypozyczenia, 4, '0')) as id"),
                DB::raw("CONCAT(modele_sprzetu.marka, ' ', modele_sprzetu.nazwa_modelu) as produkt"),
                'wypozyczenia.status_transakcji as status',
                DB::raw('COALESCE(DATE(wynajmy.data_start), DATE(wypozyczenia.data_wydania)) as dataOd'),
                DB::raw('COALESCE(DATE(wynajmy.data_koniec), DATE(wypozyczenia.planowana_data_zwrotu)) as dataDo'),
                DB::raw("CONCAT(FORMAT(szczegoly_wypozyczenia.koszt_pozycji, 2), ' zł') as kwota"),
                'wypozyczenia.id_wypozyczenia as sortKey'
            )
            ->orderByDesc('wypozyczenia.id_wypozyczenia')
            ->get()
            ->map(function ($r) {
                // Mapuj status_transakcji na polskie etykiety
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