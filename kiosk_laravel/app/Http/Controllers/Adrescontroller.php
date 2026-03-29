<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Kontroler adresów — zarządza adresami odbioru/zwrotu sprzętu użytkownika.
 *
 * Tabela adresy_uzytkownikow nie istnieje w oryginalnym schemacie —
 * musi być utworzona przez migrację migracja_kary_adresy.sql.
 *
 * Każdy użytkownik może mieć wiele adresów, jeden oznaczony jako domyślny.
 * Logika domyślności: przy zapisie pierwszego adresu automatycznie staje się domyślny.
 * Zmiana domyślnego: reset wszystkich, ustawienie nowego (dwa UPDATE w jednej transakcji).
 */
class AdresController extends Controller
{
    // Zwraca adresy zalogowanego użytkownika posortowane: domyślny pierwszy
    public function index(Request $request)
    {
        $adresy = DB::table('adresy_uzytkownikow')
            ->where('id_uzytk', $request->user()->id)
            ->orderByDesc('domyslny')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($adresy);
    }

    // Dodaje nowy adres — pierwszy adres użytkownika staje się automatycznie domyślnym
    public function store(Request $request)
    {
        $request->validate([
            'etykieta'    => 'nullable|string|max:50',
            'ulica'       => 'required|string|max:150',
            'kod_pocztowy'=> 'required|string|max:10',
            'miasto'      => 'required|string|max:80',
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

    // Usuwa adres — weryfikacja własności chroni przed usunięciem cudzego adresu
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

    // Ustawia adres domyślny — reset wszystkich, potem SET dla wybranego
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