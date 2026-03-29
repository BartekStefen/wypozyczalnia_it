<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Kontroler opinii — zarządza recenzjami sprzętu zostawianymi przez klientów.
 *
 * Model dostępu:
 *   - Czytanie opinii: publiczne (wszyscy widzą recenzje)
 *   - Dodawanie opinii: tylko zalogowani użytkownicy z tokenem Sanctum
 *
 * Klucz unikalności (id_egzemplarza, id_uzytkownika) w tabeli `opinie`
 * gwarantuje, że jeden klient może ocenić dany egzemplarz tylko raz.
 */
class OpiniaController extends Controller
{
    /**
     * Pobiera opinie dla danego egzemplarza wraz z danymi autora.
     * Endpoint publiczny — nie wymaga tokenu.
     */
    public function index(int $idEgzemplarza): \Illuminate\Http\JsonResponse
    {
        $opinie = DB::table('opinie as o')
            ->join('uzytkownicy as u', 'o.id_uzytkownika', '=', 'u.id')
            ->where('o.id_egzemplarza', $idEgzemplarza)
            ->select(
                'o.id_opinii',
                'o.ocena',
                'o.tresc',
                'o.created_at',
                DB::raw("CONCAT(u.firstName, ' ', LEFT(u.lastName, 1), '.') as autor")
            )
            ->orderByDesc('o.created_at')
            ->get();

        return response()->json($opinie);
    }

    /**
     * Zapisuje nową opinię klienta.
     *
     * Weryfikacja przed zapisem:
     *   1. Użytkownik musi być zalogowany (middleware auth:sanctum na trasie)
     *   2. Ocena musi być w zakresie 1-5
     *   3. Klient nie może ocenić tego samego egzemplarza dwa razy (UNIQUE KEY w DB)
     *
     * Przy próbie duplikatu baza zwraca błąd integralności — łapiemy go i
     * zwracamy przyjazny komunikat zamiast 500.
     */
    public function store(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'id_egzemplarza' => 'required|integer|exists:egzemplarze,id_egzemplarza',
            'ocena'          => 'required|integer|min:1|max:5',
            'tresc'          => 'nullable|string|max:1000',
        ]);

        $uid = $request->user()->id;

        // Sprawdź czy użytkownik już ocenił ten egzemplarz — podwójna ochrona
        // (poza UNIQUE KEY — dla czytelniejszego komunikatu błędu)
        $juzOcenil = DB::table('opinie')
            ->where('id_egzemplarza', $request->id_egzemplarza)
            ->where('id_uzytkownika', $uid)
            ->exists();

        if ($juzOcenil) {
            return response()->json(['message' => 'Już oceniłeś ten sprzęt.'], 409);
        }

        try {
            $id = DB::table('opinie')->insertGetId([
                'id_egzemplarza' => $request->id_egzemplarza,
                'id_uzytkownika' => $uid,
                'ocena'          => $request->ocena,
                'tresc'          => $request->tresc,
                'created_at'     => now(),
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json(['message' => 'Już oceniłeś ten sprzęt.'], 409);
        }

        // Zwróć nowo dodaną opinię z danymi autora — frontend doda ją do listy bez przeładowania
        $nowa = DB::table('opinie as o')
            ->join('uzytkownicy as u', 'o.id_uzytkownika', '=', 'u.id')
            ->where('o.id_opinii', $id)
            ->select('o.id_opinii', 'o.ocena', 'o.tresc', 'o.created_at',
                     DB::raw("CONCAT(u.firstName, ' ', LEFT(u.lastName, 1), '.') as autor"))
            ->first();

        return response()->json($nowa, 201);
    }
}