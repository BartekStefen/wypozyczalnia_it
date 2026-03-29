<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Kontroler serwisu sprzętu — zarządza cyklem życia usterki:
 *   Sprzęt dostępny → admin zgłasza do serwisu (status = 'Serwis')
 *   → naprawa → admin przywraca (status = 'Dostępny').
 *
 * Kluczowy efekt uboczny: zmiana statusu egzemplarza na 'Serwis'
 * natychmiast wyklucza sprzęt z wyników wyszukiwania dla klientów
 * (SprzetController::index filtruje dostępność przez pole status).
 */
class SerwisController extends Controller
{
    // Zwraca wszystkie aktywne zgłoszenia serwisowe z danymi sprzętu
    public function index(): \Illuminate\Http\JsonResponse
    {
        $serwis = DB::table('zgloszenia_serwisowe as zs')
            ->join('serwis_egzemplarze as se', 'zs.id_serwisu', '=', 'se.id_serwisu')
            ->join('egzemplarze as e',          'se.id_egzemplarza', '=', 'e.id_egzemplarza')
            ->join('modele_sprzetu as ms',       'e.id_modelu',       '=', 'ms.id_modelu')
            ->select(
                'zs.id_serwisu',
                'zs.data_zgloszenia',
                'zs.opis_sytuacji',
                'se.koszt_naprawy',
                'e.id_egzemplarza',
                'e.numer_seryjny',
                'e.status',
                DB::raw("CONCAT(ms.marka, ' ', ms.nazwa_modelu) as nazwa_sprzetu")
            )
            ->orderByDesc('zs.data_zgloszenia')
            ->get();

        return response()->json($serwis);
    }

    /**
     * Zgłasza egzemplarz do serwisu:
     *   1. Zmienia status egzemplarza na 'Serwis' — blokuje rezerwacje klientów
     *   2. Tworzy wpis w zgloszenia_serwisowe z opisem usterki
     *   3. Tworzy powiązanie w serwis_egzemplarze
     */
    public function zglos(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'id_egzemplarza' => 'required|integer|exists:egzemplarze,id_egzemplarza',
            'opis_sytuacji'  => 'required|string|max:1000',
            'koszt_naprawy'  => 'nullable|numeric|min:0',
        ]);

        $egz = DB::table('egzemplarze')->where('id_egzemplarza', $request->id_egzemplarza)->first();

        if ($egz->status === 'Wypożyczony') {
            return response()->json(['message' => 'Nie można zgłosić do serwisu sprzętu aktualnie wypożyczonego.'], 409);
        }

        return DB::transaction(function () use ($request) {
            // Zmień status — od tej chwili sprzęt znika z katalogu dla klientów
            DB::table('egzemplarze')
                ->where('id_egzemplarza', $request->id_egzemplarza)
                ->update(['status' => 'Serwis']);

            // Utwórz zgłoszenie serwisowe
            $idSerwisu = DB::table('zgloszenia_serwisowe')->insertGetId([
                'opis_sytuacji'  => $request->opis_sytuacji,
                'data_zgloszenia'=> now(),
            ]);

            // Powiąż zgłoszenie z konkretnym egzemplarzem i kosztem naprawy
            DB::table('serwis_egzemplarze')->insert([
                'id_serwisu'     => $idSerwisu,
                'id_egzemplarza' => $request->id_egzemplarza,
                'koszt_naprawy'  => $request->koszt_naprawy,
            ]);

            return response()->json(['message' => 'Sprzęt zgłoszony do serwisu.', 'id_serwisu' => $idSerwisu], 201);
        });
    }

    /**
     * Przywraca sprzęt po naprawie — zmienia status z 'Serwis' na 'Dostępny'.
     * Sprzęt wraca automatycznie do katalogu dla klientów.
     */
    public function przywroc(Request $request, int $idSerwisu): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'koszt_naprawy' => 'nullable|numeric|min:0',
        ]);

        $powiazanie = DB::table('serwis_egzemplarze')->where('id_serwisu', $idSerwisu)->first();

        if (!$powiazanie) {
            return response()->json(['message' => 'Zgłoszenie serwisowe nie istnieje.'], 404);
        }

        return DB::transaction(function () use ($powiazanie, $request, $idSerwisu) {
            // Przywróć dostępność egzemplarza
            DB::table('egzemplarze')
                ->where('id_egzemplarza', $powiazanie->id_egzemplarza)
                ->update(['status' => 'Dostępny']);

            // Zaktualizuj koszt naprawy jeśli podano
            if ($request->filled('koszt_naprawy')) {
                DB::table('serwis_egzemplarze')
                    ->where('id_serwisu', $idSerwisu)
                    ->update(['koszt_naprawy' => $request->koszt_naprawy]);
            }

            return response()->json(['message' => 'Sprzęt przywrócony do użytku.']);
        });
    }
}