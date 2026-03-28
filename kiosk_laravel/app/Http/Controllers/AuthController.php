<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\Uzytkownik;

/**
 * Kontroler autoryzacji - obsługuje rejestrację, logowanie i wylogowanie.
 * Używa Laravel Sanctum do generowania tokenów Bearer.
 */
class AuthController extends Controller
{
    /**
     * Rejestracja nowego klienta.
     * Mapuje pola z formularza React na kolumny bazy (firstName, lastName itp.)
     */
    public function register(Request $request)
    {
        $request->validate([
            'firstName' => 'required|string|max:100',
            'lastName'  => 'nullable|string|max:100',
            'email'     => 'required|email|unique:uzytkownicy,email',
            'password'  => 'required|string|min:8',
            'phone'     => 'nullable|string|max:20',
        ], [
            'firstName.required' => 'Imię jest wymagane.',
            'email.required'     => 'Adres e-mail jest wymagany.',
            'email.unique'       => 'Konto z tym adresem e-mail już istnieje.',
            'password.min'       => 'Hasło musi mieć co najmniej 8 znaków.',
        ]);

        $uzytkownik = Uzytkownik::create([
            'firstName' => $request->firstName,
            'lastName'  => $request->lastName ?? '',
            'email'     => $request->email,
            'password'  => Hash::make($request->password),
            'phone'     => $request->phone,
            'role'      => 'klient',
        ]);

        // Generuj token Sanctum dla nowego użytkownika
        $token = $uzytkownik->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token'      => $token,
            'uzytkownik' => $this->formatUser($uzytkownik),
        ], 201);
    }

    /**
     * Logowanie istniejącego użytkownika.
     * Weryfikuje hasło i zwraca token + dane użytkownika.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $uzytkownik = Uzytkownik::where('email', $request->email)->first();

        // Weryfikacja hasła przez bcrypt
        if (!$uzytkownik || !Hash::check($request->password, $uzytkownik->password)) {
            throw ValidationException::withMessages([
                'email' => ['Nieprawidłowy adres e-mail lub hasło.'],
            ]);
        }

        // Usuń stare tokeny (jedna sesja na raz) - opcjonalne
        // $uzytkownik->tokens()->delete();

        $token = $uzytkownik->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token'      => $token,
            'uzytkownik' => $this->formatUser($uzytkownik),
        ]);
    }

    /**
     * Wylogowanie - usuwa aktualny token Sanctum.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Wylogowano pomyślnie.']);
    }

    /**
     * Zwraca dane zalogowanego użytkownika (endpoint /api/mnie).
     */
    public function me(Request $request)
    {
        return response()->json($this->formatUser($request->user()));
    }

    /**
     * Zmiana hasła użytkownika przez weryfikację obecnego.
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'currentPassword' => 'required|string',
            'newPassword'     => 'required|string|min:8',
        ]);

        $uzytkownik = $request->user();

        if (!Hash::check($request->currentPassword, $uzytkownik->password)) {
            return response()->json(['message' => 'Nieprawidłowe obecne hasło.'], 422);
        }

        $uzytkownik->update(['password' => Hash::make($request->newPassword)]);

        return response()->json(['message' => 'Hasło zostało zmienione.']);
    }

    /**
     * Formatuje obiekt użytkownika do odpowiedzi JSON.
     * Mapuje pola bazy na strukturę oczekiwaną przez frontend.
     */
    private function formatUser(Uzytkownik $u): array
    {
        return [
            'id'        => $u->id,
            'firstName' => $u->firstName,
            'lastName'  => $u->lastName,
            'imie'      => $u->firstName,        // alias dla kompatybilności z frontendem
            'nazwisko'  => $u->lastName,
            'email'     => $u->email,
            'phone'     => $u->phone,
            'role'      => $u->role,
            'rola'      => $u->role,             // alias dla kompatybilności
            'isAdmin'   => $u->isAdmin(),
            'fullName'  => $u->full_name,
        ];
    }
}