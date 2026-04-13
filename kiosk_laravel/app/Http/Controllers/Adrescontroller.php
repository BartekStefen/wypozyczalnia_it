<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Kontroler adresów — zarządza adresami odbioru/zwrotu sprzętu użytkownika.
 *
 * Każdy użytkownik może mieć wiele adresów, jeden oznaczony jako domyślny.
 * Przy dodaniu pierwszego adresu staje się on automatycznie domyślnym.
 * Zmiana domyślnego to dwie operacje w transakcji: reset wszystkich → SET nowego.
 */
class AdresController extends Controller
{
    public function index(Request $request)
    {
        $adresy = DB::table('adresy_uzytkownikow')
            ->where('id_uzytk', $request->user()->id)
            ->orderByDesc('domyslny')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($adresy);
    }

    public function store(Request $request)
    {
        $request->validate([
            'etykieta'     => 'nullable|string|max:50',
            'ulica'        => 'required|string|max:150',
            'kod_pocztowy' => 'required|string|max:10',
            'miasto'       => 'required|string|max:80',
        ]);

        $uid        = $request->user()->id;
        $ileAdresow = DB::table('adresy_uzytkownikow')->where('id_uzytk', $uid)->count();

        $id = DB::table('adresy_uzytkownikow')->insertGetId([
            'id_uzytk'     => $uid,
            'etykieta'     => $request->etykieta ?? 'Adres główny',
            'ulica'        => $request->ulica,
            'kod_pocztowy' => $request->kod_pocztowy,
            'miasto'       => $request->miasto,
            'domyslny'     => $ileAdresow === 0 ? 1 : 0,
            'created_at'   => now(),
        ]);

        return response()->json(['id_adresu' => $id, 'message' => 'Adres dodany.'], 201);
    }

    public function destroy(Request $request, int $id)
    {
        $usunieto = DB::table('adresy_uzytkownikow')
            ->where('id_adresu', $id)
            ->where('id_uzytk', $request->user()->id)
            ->delete();

        if (!$usunieto) {
            return response()->json(['message' => 'Adres nie istnieje lub nie należy do Ciebie.'], 404);
        }

        return response()->json(['message' => 'Adres usunięty.']);
    }

    public function ustawDomyslny(Request $request, int $id)
    {
        $uid = $request->user()->id;

        $adres = DB::table('adresy_uzytkownikow')
            ->where('id_adresu', $id)->where('id_uzytk', $uid)->first();

        if (!$adres) {
            return response()->json(['message' => 'Adres nie istnieje.'], 404);
        }

        // Transakcja — obie operacje muszą się wykonać razem
        DB::transaction(function () use ($uid, $id) {
            DB::table('adresy_uzytkownikow')->where('id_uzytk', $uid)->update(['domyslny' => 0]);
            DB::table('adresy_uzytkownikow')->where('id_adresu', $id)->update(['domyslny' => 1]);
        });

        return response()->json(['message' => 'Adres domyślny zaktualizowany.']);
    }
}