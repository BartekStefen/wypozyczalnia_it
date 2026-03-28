<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Kontroler ulubionych — CRUD dla listy ulubionych sprzętu użytkownika.
 */
class UlubioneController extends Controller
{
    // Lista ulubionych zalogowanego użytkownika z danymi sprzętu
    public function index(Request $request)
    {
        $uid = $request->user()->id;

        $ulubione = DB::table('ulubione')
            ->join('egzemplarze',   'ulubione.sprzet_id', '=', 'egzemplarze.id_egzemplarza')
            ->join('modele_sprzetu','egzemplarze.id_modelu', '=', 'modele_sprzetu.id_modelu')
            ->leftJoin('kategorie_modele', 'egzemplarze.id_modelu', '=', 'kategorie_modele.id_modelu')
            ->leftJoin('kategorie_sprzetu', 'kategorie_modele.id_kategorii', '=', 'kategorie_sprzetu.id_kategorii')
            ->where('ulubione.uzytkownik_id', $uid)
            ->select(
                'ulubione.id',
                'ulubione.sprzet_id',
                'egzemplarze.id_egzemplarza',
                DB::raw("CONCAT(modele_sprzetu.marka, ' ', modele_sprzetu.nazwa_modelu) as nazwa"),
                DB::raw("CASE WHEN egzemplarze.status = 'Dostępny' THEN 1 ELSE 0 END as dostepny"),
                DB::raw("CONCAT(FORMAT(egzemplarze.cena_wypozyczenia_dzien, 2), ' zł / dzień') as cena"),
                DB::raw("MIN(kategorie_sprzetu.nazwa) as kategoria")
            )
            ->groupBy(
                'ulubione.id', 'ulubione.sprzet_id', 'egzemplarze.id_egzemplarza',
                'modele_sprzetu.marka', 'modele_sprzetu.nazwa_modelu',
                'egzemplarze.status', 'egzemplarze.cena_wypozyczenia_dzien'
            )
            ->get()
            ->map(function ($item) {
                $item->dostepny = (bool) $item->dostepny;
                return $item;
            });

        return response()->json($ulubione);
    }

    // Dodaj do ulubionych (ignoruje duplikaty)
    public function store(Request $request)
    {
        $request->validate(['sprzet_id' => 'required|integer']);

        $uid = $request->user()->id;

        // Sprawdź duplikat
        $exists = DB::table('ulubione')
            ->where('uzytkownik_id', $uid)
            ->where('sprzet_id', $request->sprzet_id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Już w ulubionych.'], 409);
        }

        $id = DB::table('ulubione')->insertGetId([
            'uzytkownik_id' => $uid,
            'sprzet_id'     => $request->sprzet_id,
            'created_at'    => now(),
        ]);

        return response()->json(['id' => $id, 'message' => 'Dodano do ulubionych.'], 201);
    }

    // Usuń z ulubionych (tylko własne)
    public function destroy(Request $request, $id)
    {
        DB::table('ulubione')
            ->where('id', $id)
            ->where('uzytkownik_id', $request->user()->id)
            ->delete();

        return response()->json(['message' => 'Usunięto z ulubionych.']);
    }
}