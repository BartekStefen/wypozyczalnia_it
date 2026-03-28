<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\Uzytkownik;

/**
 * Kontroler autoryzacji — rejestracja, logowanie, wylogowanie, zmiana hasła.
 *
 * JAK DZIAŁA REJESTRACJA:
 * - Użytkownik wypełnia formularz z imieniem, e-mailem i hasłem.
 * - NIE jest wymagany prawdziwy e-mail ani potwierdzenie przez kod (MVP).
 * - Po rejestracji generowany jest token Sanctum i użytkownik jest od razu zalogowany.
 * - Aby dodać weryfikację e-mail: użyj Laravel MustVerifyEmail + mail driver (SMTP).
 */
class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'firstName' => 'required|string|max:100',
            'lastName'  => 'nullable|string|max:100',
            'email'     => 'required|email|unique:uzytkownicy,email',
            'password'  => 'required|string|min:8',
            'phone'     => 'nullable|string|max:20',
        ], [
            'email.unique'    => 'Konto z tym adresem e-mail już istnieje.',
            'password.min'    => 'Hasło musi mieć co najmniej 8 znaków.',
            'firstName.required' => 'Imię jest wymagane.',
        ]);

        $uzytkownik = Uzytkownik::create([
            'firstName' => $request->firstName,
            'lastName'  => $request->lastName  ?? '',
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

        $token = $uzytkownik->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token'      => $token,
            'uzytkownik' => $this->formatUser($uzytkownik),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Wylogowano pomyślnie.']);
    }

    public function me(Request $request)
    {
        return response()->json($this->formatUser($request->user()));
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'currentPassword' => 'required|string',
            'newPassword'     => 'required|string|min:8',
        ]);

        if (!Hash::check($request->currentPassword, $request->user()->password)) {
            return response()->json(['message' => 'Nieprawidłowe obecne hasło.'], 422);
        }

        $request->user()->update(['password' => Hash::make($request->newPassword)]);

        return response()->json(['message' => 'Hasło zostało zmienione.']);
    }

    private function formatUser(Uzytkownik $u): array
    {
        return [
            'id'        => $u->id,
            'firstName' => $u->firstName,
            'lastName'  => $u->lastName,
            'imie'      => $u->firstName,
            'nazwisko'  => $u->lastName,
            'email'     => $u->email,
            'phone'     => $u->phone,
            'role'      => $u->role,
            'rola'      => $u->role,
            'isAdmin'   => $u->role === 'admin',
        ];
    }
}