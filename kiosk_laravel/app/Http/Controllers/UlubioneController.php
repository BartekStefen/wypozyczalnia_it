<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Kontroler ulubionych — zarządza listą obserwowanego sprzętu użytkownika.
 *
 * Klucz unikalny w tabeli ulubione (uzytkownik_id, sprzet_id) zapewnia
 * że ten sam egzemplarz nie może być dodany dwa razy — sprawdzamy to
 * wcześniej żeby zwrócić czytelny komunikat zamiast błędu DB.
 */
class UlubioneController extends Controller
{
    // Zwraca ulubione zalogowanego użytkownika z pełnymi danymi sprzętu i kategorii
    public function index(Request $request)
    {
        $uid = $request->user()->id;

        $ulubione = DB::table('ulubione as u')
            ->join('egzemplarze as e',    'u.sprzet_id',    '=', 'e.id_egzemplarza')
            ->join('modele_sprzetu as ms','e.id_modelu',    '=', 'ms.id_modelu')
            ->leftJoin('kategorie_modele as km',  'e.id_modelu',      '=', 'km.id_modelu')
            ->leftJoin('kategorie_sprzetu as ks', 'km.id_kategorii',  '=', 'ks.id_kategorii')
            ->where('u.uzytkownik_id', $uid)
            ->select(
                'u.id',
                'u.sprzet_id',
                'e.id_egzemplarza',
                DB::raw("CONCAT(ms.marka, ' ', ms.nazwa_modelu) as nazwa"),
                DB::raw("CASE WHEN e.status = 'Dostępny' THEN 1 ELSE 0 END as dostepny"),
                DB::raw("CONCAT(FORMAT(e.cena_wypozyczenia_dzien, 2), ' zł / dzień') as cena"),
                DB::raw('MIN(ks.nazwa) as kategoria')
            )
            ->groupBy(
                'u.id', 'u.sprzet_id', 'e.id_egzemplarza',
                'ms.marka', 'ms.nazwa_modelu', 'e.status', 'e.cena_wypozyczenia_dzien'
            )
            ->get()
            ->map(function ($item) {
                $item->dostepny = (bool) $item->dostepny;
                return $item;
            });

        return response()->json($ulubione);
    }

    // Dodaje egzemplarz do ulubionych — zwraca 409 jeśli już jest na liście
    public function store(Request $request)
    {
        $request->validate([
            'sprzet_id' => 'required|integer|exists:egzemplarze,id_egzemplarza',
        ]);

        $uid = $request->user()->id;

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

    // Usuwa z ulubionych — sprawdza własność rekordu przed usunięciem
    public function destroy(Request $request, $id)
    {
        DB::table('ulubione')
            ->where('id', $id)
            ->where('uzytkownik_id', $request->user()->id)
            ->delete();

        return response()->json(['message' => 'Usunięto z ulubionych.']);
    }
}