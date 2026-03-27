<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\Uzytkownik;

class AuthController extends Controller
{
    public function logowanie(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $uzytkownik = Uzytkownik::where('email', $request->email)->first();

        if (!$uzytkownik || !Hash::check($request->password, $uzytkownik->haslo)) {
            throw ValidationException::withMessages([
                'email' => ['Nieprawidłowy e-mail lub hasło.'],
            ]);
        }

        $token = $uzytkownik->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token'       => $token,
            'uzytkownik'  => [
                'id'      => $uzytkownik->id,
                'imie'    => $uzytkownik->imie,
                'email'   => $uzytkownik->email,
                'rola'    => $uzytkownik->rola,
            ],
        ]);
    }

    public function rejestracja(Request $request)
    {
        $request->validate([
            'imie'     => 'required|string|max:100',
            'nazwisko' => 'nullable|string|max:100',
            'email'    => 'required|email|unique:uzytkownicy,email',
            'password' => 'required|string|min:8',
        ]);

        $uzytkownik = Uzytkownik::create([
            'imie'     => $request->imie,
            'nazwisko' => $request->nazwisko ?? '',
            'email'    => $request->email,
            'haslo'    => Hash::make($request->password),
            'rola'     => 'klient',
        ]);

        $token = $uzytkownik->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token'      => $token,
            'uzytkownik' => [
                'id'    => $uzytkownik->id,
                'imie'  => $uzytkownik->imie,
                'email' => $uzytkownik->email,
                'rola'  => $uzytkownik->rola,
            ],
        ], 201);
    }

    public function wylogowanie(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Wylogowano pomyślnie.']);
    }

    public function zmienHaslo(Request $request)
    {
        $request->validate([
            'obecne_haslo' => 'required|string',
            'nowe_haslo'   => 'required|string|min:8',
        ]);

        $uzytkownik = $request->user();

        if (!Hash::check($request->obecne_haslo, $uzytkownik->haslo)) {
            return response()->json(['message' => 'Nieprawidłowe obecne hasło.'], 422);
        }

        $uzytkownik->update(['haslo' => Hash::make($request->nowe_haslo)]);

        return response()->json(['message' => 'Hasło zostało zmienione.']);
    }
}