<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SprzetController extends Controller
{
    public function index() {
        return response()->json(DB::table('egzemplarze')
            ->join('modele_sprzetu', 'egzemplarze.id_modelu', '=', 'modele_sprzetu.id_modelu')
            ->select('egzemplarze.*', 'modele_sprzetu.marka', 'modele_sprzetu.nazwa_modelu')
            ->get());
    }

    public function show($id) {
        return response()->json(DB::table('egzemplarze')
            ->join('modele_sprzetu', 'egzemplarze.id_modelu', '=', 'modele_sprzetu.id_modelu')
            ->select('egzemplarze.*', 'modele_sprzetu.marka', 'modele_sprzetu.nazwa_modelu')
            ->where('egzemplarze.id_egzemplarza', $id)->first());
    }

    public function finalize(Request $request) {
        return DB::transaction(function () use ($request) {
            // Zapis klienta
            $id_klienta = DB::table('klienci')->insertGetId([
                'imie' => $request->klient['imie'],
                'nazwisko' => $request->klient['nazwisko'],
                'email' => $request->klient['email'],
                'telefon' => $request->klient['telefon'],
                'numer_dokumentu' => $request->klient['numer_dokumentu'],
            ]);

            foreach ($request->produkty as $p) {
                // Nagłówek wypożyczenia
                $id_wyp = DB::table('wypozyczenia')->insertGetId([
                    'id_klienta' => $id_klienta,
                    'planowana_data_zwrotu' => $p['data_koniec'],
                    'status_transakcji' => 'Trwa'
                ]);

                // Szczegóły
                DB::table('szczegoly_wypozyczenia')->insert([
                    'id_wypozyczenia' => $id_wyp,
                    'id_egzemplarza' => $p['id_egzemplarza'],
                    'koszt_pozycji' => $p['suma']
                ]);

                // Update statusu
                DB::table('egzemplarze')->where('id_egzemplarza', $p['id_egzemplarza'])->update(['status' => 'Wypożyczony']);
            }
            return response()->json(['message' => 'Sukces'], 201);
        });
    }
}