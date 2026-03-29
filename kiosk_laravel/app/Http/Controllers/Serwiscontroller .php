<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Kontroler serwisu sprzętu — zarządza cyklem życia usterki.
 *
 * Stany egzemplarza w kontekście serwisu:
 *   Dostępny → zgłoś() → Serwis    (blokuje rezerwacje klientów)
 *   Serwis   → przywroc() → Dostępny (odblokowuje rezerwacje)
 *
 * Skutek uboczny zmiany statusu na 'Serwis':
 *   SprzetController::index() nie filtruje po statusie domyślnie, ale klienci
 *   widzą statusbadge 'Serwis' na karcie i przycisk rezerwacji jest nieaktywny
 *   (ProduktSzczegoly sprawdza item.status === 'Dostępny').
 *
 * Tabele: zgloszenia_serwisowe + serwis_egzemplarze (relacja M:1)
 */
class SerwisController extends Controller
{
    // Lista aktywnych zgłoszeń serwisowych z danymi sprzętu
    public function index()
    {
        $serwis = DB::table('zgloszenia_serwisowe as zs')
            ->join('serwis_egzemplarze as se', 'zs.id_serwisu',   '=', 'se.id_serwisu')
            ->join('egzemplarze as e',          'se.id_egzemplarza','=', 'e.id_egzemplarza')
            ->join('modele_sprzetu as ms',       'e.id_modelu',     '=', 'ms.id_modelu')
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
     * Zgłasza egzemplarz do serwisu.
     *
     * Kolejność operacji jest ważna:
     *   1. Blokada statusu (Serwis) — natychmiastowy efekt dla klientów
     *   2. Zapis zgłoszenia — historia usterki
     *   3. Powiązanie serwis_egzemplarze — jeden serwis może dotyczyć jednego egzemplarza
     *
     * Wypożyczonego sprzętu nie można zgłosić — musi być najpierw zwrócony.
     */
    public function zglos(Request $request)
    {
        $request->validate([
            'id_egzemplarza' => 'required|integer|exists:egzemplarze,id_egzemplarza',
            'opis_sytuacji'  => 'required|string|max:1000',
            'koszt_naprawy'  => 'nullable|numeric|min:0',
        ]);

        $egz = DB::table('egzemplarze')
            ->where('id_egzemplarza', $request->id_egzemplarza)
            ->first();

        if ($egz->status === 'Wypożyczony') {
            return response()->json([
                'message' => 'Nie można zgłosić do serwisu sprzętu aktualnie wypożyczonego. Poczekaj na zwrot.'
            ], 409);
        }

        return DB::transaction(function () use ($request) {
            // Zmiana statusu — klienci natychmiast przestają widzieć sprzęt jako dostępny
            DB::table('egzemplarze')
                ->where('id_egzemplarza', $request->id_egzemplarza)
                ->update(['status' => 'Serwis']);

            $idSerwisu = DB::table('zgloszenia_serwisowe')->insertGetId([
                'opis_sytuacji'   => $request->opis_sytuacji,
                'data_zgloszenia' => now(),
            ]);

            DB::table('serwis_egzemplarze')->insert([
                'id_serwisu'     => $idSerwisu,
                'id_egzemplarza' => $request->id_egzemplarza,
                'koszt_naprawy'  => $request->koszt_naprawy,
            ]);

            return response()->json([
                'message'    => 'Sprzęt zgłoszony do serwisu. Status zmieniony na Serwis.',
                'id_serwisu' => $idSerwisu,
            ], 201);
        });
    }

    /**
     * Przywraca sprzęt po naprawie.
     *
     * Zmiana statusu z 'Serwis' → 'Dostępny' sprawia że sprzęt natychmiast
     * wraca do katalogu bez żadnych dodatkowych operacji.
     */
    public function przywroc(Request $request, int $idSerwisu)
    {
        $request->validate([
            'koszt_naprawy' => 'nullable|numeric|min:0',
        ]);

        $powiazanie = DB::table('serwis_egzemplarze')
            ->where('id_serwisu', $idSerwisu)->first();

        if (!$powiazanie) {
            return response()->json(['message' => 'Zgłoszenie serwisowe nie istnieje.'], 404);
        }

        return DB::transaction(function () use ($powiazanie, $request, $idSerwisu) {
            DB::table('egzemplarze')
                ->where('id_egzemplarza', $powiazanie->id_egzemplarza)
                ->update(['status' => 'Dostępny']);

            if ($request->filled('koszt_naprawy')) {
                DB::table('serwis_egzemplarze')
                    ->where('id_serwisu', $idSerwisu)
                    ->update(['koszt_naprawy' => $request->koszt_naprawy]);
            }

            return response()->json(['message' => 'Sprzęt przywrócony do katalogu jako Dostępny.']);
        });
    }
}