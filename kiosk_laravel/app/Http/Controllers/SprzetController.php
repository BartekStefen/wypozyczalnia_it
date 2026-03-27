<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SprzetController extends Controller
{
    public function index()
    {
        return response()->json(
            DB::table('egzemplarze')
                ->join('modele_sprzetu', 'egzemplarze.id_modelu', '=', 'modele_sprzetu.id_modelu')
                ->select('egzemplarze.*', 'modele_sprzetu.marka', 'modele_sprzetu.nazwa_modelu')
                ->get()
        );
    }

    public function show($id)
    {
        $item = DB::table('egzemplarze')
            ->join('modele_sprzetu', 'egzemplarze.id_modelu', '=', 'modele_sprzetu.id_modelu')
            ->select('egzemplarze.*', 'modele_sprzetu.marka', 'modele_sprzetu.nazwa_modelu')
            ->where('egzemplarze.id_egzemplarza', $id)
            ->first();

        if (!$item) {
            return response()->json(['message' => 'Nie znaleziono sprzętu.'], 404);
        }

        return response()->json($item);
    }

    public function kategorie()
    {
        $kategorie = DB::table('kategorie_sprzetu')
            ->whereNull('id_rodzica')
            ->get();

        $kategorie = $kategorie->map(function ($kat) {
            $kat->podkategorie = DB::table('kategorie_sprzetu')
                ->where('id_rodzica', $kat->id_kategorii)
                ->get()
                ->map(function ($pod) {
                    $pod->podkategorie = [];
                    return $pod;
                });
            return $kat;
        });

        return response()->json($kategorie);
    }

    public function finalize(Request $request)
    {
        $request->validate([
            'produkty'               => 'required|array|min:1',
            'produkty.*.id_egzemplarza' => 'required|integer',
            'produkty.*.data_koniec'    => 'required|date',
            'produkty.*.suma'           => 'required|numeric',
        ]);

        return DB::transaction(function () use ($request) {
            // Zalogowany użytkownik – klient z konta; gość – dane z formularza
            $uzytkownik = $request->user();

            if ($uzytkownik) {
                $id_klienta_lub_uzytkownika = $uzytkownik->id;
                $kolumna = 'id_uzytkownika';
            } else {
                $request->validate([
                    'klient.imie'            => 'required|string',
                    'klient.nazwisko'        => 'required|string',
                    'klient.email'           => 'required|email',
                    'klient.telefon'         => 'required|string',
                    'klient.numer_dokumentu' => 'required|string',
                ]);

                $id_klienta_lub_uzytkownika = DB::table('klienci')->insertGetId([
                    'imie'            => $request->klient['imie'],
                    'nazwisko'        => $request->klient['nazwisko'],
                    'email'           => $request->klient['email'],
                    'telefon'         => $request->klient['telefon'],
                    'numer_dokumentu' => $request->klient['numer_dokumentu'],
                ]);
                $kolumna = 'id_klienta';
            }

            foreach ($request->produkty as $p) {
                $idEgzemplarza = $p['id_egzemplarza'];

                // Sprawdź czy sprzęt jest dostępny
                $status = DB::table('egzemplarze')
                    ->where('id_egzemplarza', $idEgzemplarza)
                    ->value('status');

                if ($status !== 'Dostępny') {
                    DB::rollBack();
                    return response()->json([
                        'message' => "Sprzęt ID {$idEgzemplarza} jest niedostępny."
                    ], 409);
                }

                $id_wyp = DB::table('wypozyczenia')->insertGetId([
                    $kolumna                  => $id_klienta_lub_uzytkownika,
                    'planowana_data_zwrotu'   => $p['data_koniec'],
                    'status_transakcji'       => 'Trwa',
                    'created_at'              => now(),
                    'updated_at'              => now(),
                ]);

                DB::table('szczegoly_wypozyczenia')->insert([
                    'id_wypozyczenia' => $id_wyp,
                    'id_egzemplarza'  => $idEgzemplarza,
                    'koszt_pozycji'   => $p['suma'],
                ]);

                DB::table('egzemplarze')
                    ->where('id_egzemplarza', $idEgzemplarza)
                    ->update(['status' => 'Wypożyczony']);
            }

            return response()->json(['message' => 'Zamówienie złożone pomyślnie.'], 201);
        });
    }

    public function wszystkieWypozyczenia()
    {
        return response()->json(
            DB::table('wypozyczenia')
                ->join('szczegoly_wypozyczenia', 'wypozyczenia.id', '=', 'szczegoly_wypozyczenia.id_wypozyczenia')
                ->join('egzemplarze', 'szczegoly_wypozyczenia.id_egzemplarza', '=', 'egzemplarze.id_egzemplarza')
                ->join('modele_sprzetu', 'egzemplarze.id_modelu', '=', 'modele_sprzetu.id_modelu')
                ->select('wypozyczenia.*', 'modele_sprzetu.marka', 'modele_sprzetu.nazwa_modelu', 'egzemplarze.numer_seryjny')
                ->orderByDesc('wypozyczenia.id')
                ->get()
        );
    }

    public function zmienStatus(Request $request, $id)
    {
        $request->validate(['status' => 'required|in:Dostępny,Wypożyczony,Serwis']);
        DB::table('egzemplarze')->where('id_egzemplarza', $id)->update(['status' => $request->status]);
        return response()->json(['message' => 'Status zaktualizowany.']);
    }
}