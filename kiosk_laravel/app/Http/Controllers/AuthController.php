<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\Uzytkownik;

class AuthController extends Controller
{
    // Rejestracja — tworzy konto i od razu loguje (zwraca token)
    public function register(Request $request)
    {
        $request->validate([
            'firstName' => 'required|string|max:100',
            'lastName'  => 'nullable|string|max:100',
            'email'     => 'required|email|unique:uzytkownicy,email',
            'password'  => 'required|string|min:8',
            'phone'     => 'nullable|string|max:20',
        ], [
            'email.unique'       => 'Konto z tym adresem e-mail już istnieje.',
            'password.min'       => 'Hasło musi mieć co najmniej 8 znaków.',
            'firstName.required' => 'Imię jest wymagane.',
        ]);

        $uzytkownik = Uzytkownik::create([
            'firstName' => $request->firstName,
            'lastName'  => $request->lastName ?? '',
            'email'     => $request->email,
            'password'  => Hash::make($request->password),
            'phone'     => $request->phone,
            'role'      => 'klient',
        ]);

        $token = $uzytkownik->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token'      => $token,
            'uzytkownik' => $this->formatUser($uzytkownik),
        ], 201);
    }

    // Logowanie — weryfikuje hasło i wydaje nowy token (usuwa poprzednie tokeny)
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $uzytkownik = Uzytkownik::where('email', $request->email)->first();

        if (!$uzytkownik || !Hash::check($request->password, $uzytkownik->password)) {
            throw ValidationException::withMessages([
                'email' => ['Nieprawidłowy adres e-mail lub hasło.'],
            ]);
        }

        // Jeden aktywny token na użytkownika — zapobiega nagromadzeniu tokenów
        $uzytkownik->tokens()->delete();
        $token = $uzytkownik->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token'      => $token,
            'uzytkownik' => $this->formatUser($uzytkownik),
        ]);
    }

    // Wylogowanie — unieważnia bieżący token (nie wszystkie)
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Wylogowano pomyślnie.']);
    }

    // Zwraca profil zalogowanego użytkownika na podstawie tokenu w nagłówku
    public function me(Request $request)
    {
        return response()->json($this->formatUser($request->user()));
    }

    /**
     * Zmiana hasła — obsługuje dwa warianty nazw pól z frontendu:
     *   - PanelKlienta wysyła: { obecne_haslo, nowe_haslo }
     *   - Inne komponenty:     { currentPassword, newPassword }
     *
     * Akceptujemy oba żeby nie wymuszać zmiany we wszystkich miejscach frontendu.
     */
    public function changePassword(Request $request)
    {
        // Normalizacja nazw pól — alias PL i EN
        $obecne = $request->currentPassword ?? $request->obecne_haslo    ?? '';
        $nowe   = $request->newPassword     ?? $request->nowe_haslo       ?? '';

        if (empty($obecne) || empty($nowe)) {
            return response()->json(['message' => 'Podaj obecne i nowe hasło.'], 422);
        }
        if (strlen($nowe) < 8) {
            return response()->json(['message' => 'Nowe hasło musi mieć co najmniej 8 znaków.'], 422);
        }
        if (!Hash::check($obecne, $request->user()->password)) {
            return response()->json(['message' => 'Nieprawidłowe obecne hasło.'], 422);
        }

        $request->user()->update(['password' => Hash::make($nowe)]);
        return response()->json(['message' => 'Hasło zostało zmienione.']);
    }

    // Formatuje obiekt Uzytkownik do JSON — eksponuje aliasy PL i EN dla kompatybilności
    private function formatUser(Uzytkownik $u): array
    {
        return [
            'id'             => $u->id,
            'firstName'      => $u->firstName,
            'lastName'       => $u->lastName,
            'imie'           => $u->firstName,
            'nazwisko'       => $u->lastName,
            'email'          => $u->email,
            'phone'          => $u->phone,
            'role'           => $u->role,
            'rola'           => $u->role,
            'isAdmin'        => $u->role === 'admin',
        ];
    }
}