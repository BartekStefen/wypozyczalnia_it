<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Kontroler adresów użytkownika — CRUD na tabeli adresy_uzytkownikow.
 * Każdy użytkownik może mieć wiele adresów, jeden oznaczony jako domyślny.
 */
class AdresController extends Controller
{
    // Zwraca wszystkie adresy zalogowanego użytkownika
    public function index(Request $request): \Illuminate\Http\JsonResponse
    {
        $adresy = DB::table('adresy_uzytkownikow')
            ->where('id_uzytk', $request->user()->id)
            ->orderByDesc('domyslny')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($adresy);
    }

    // Dodaje nowy adres — jeśli pierwszy, automatycznie ustawia jako domyślny
    public function store(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'etykieta'    => 'nullable|string|max:50',
            'ulica'       => 'required|string|max:150',
            'kod_pocztowy'=> 'required|string|max:10',
            'miasto'      => 'required|string|max:80',
        ]);

        $uid = $request->user()->id;

        // Sprawdź czy użytkownik ma już jakieś adresy
        $ileAdresow = DB::table('adresy_uzytkownikow')->where('id_uzytk', $uid)->count();

        $id = DB::table('adresy_uzytkownikow')->insertGetId([
            'id_uzytk'     => $uid,
            'etykieta'     => $request->etykieta ?? 'Adres główny',
            'ulica'        => $request->ulica,
            'kod_pocztowy' => $request->kod_pocztowy,
            'miasto'       => $request->miasto,
            // Pierwszy adres staje się automatycznie domyślnym
            'domyslny'     => $ileAdresow === 0 ? 1 : 0,
            'created_at'   => now(),
        ]);

        return response()->json(['id_adresu' => $id, 'message' => 'Adres dodany.'], 201);
    }

    // Usuwa adres należący do zalogowanego użytkownika (sprawdza własność)
    public function destroy(Request $request, int $id): \Illuminate\Http\JsonResponse
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

    // Ustawia wskazany adres jako domyślny (odznacza pozostałe)
    public function ustawDomyslny(Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        $uid = $request->user()->id;

        // Upewnij się że adres należy do użytkownika
        $adres = DB::table('adresy_uzytkownikow')
            ->where('id_adresu', $id)
            ->where('id_uzytk', $uid)
            ->first();

        if (!$adres) {
            return response()->json(['message' => 'Adres nie istnieje.'], 404);
        }

        // Odznacz wszystkie adresy użytkownika, następnie ustaw nowy domyślny
        DB::table('adresy_uzytkownikow')->where('id_uzytk', $uid)->update(['domyslny' => 0]);
        DB::table('adresy_uzytkownikow')->where('id_adresu', $id)->update(['domyslny' => 1]);

        return response()->json(['message' => 'Adres domyślny zaktualizowany.']);
    }
}