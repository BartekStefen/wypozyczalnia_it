<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

/**
 * Kontroler systemu kar finansowych.
 *
 * Schemat tabeli naliczone_kary po migracji:
 *   id_kary (AUTO_INCREMENT PK) | id_szczegolow (FK → szczegoly_wypozyczenia) |
 *   id_rodzaju | id_uzytkownika | id_wypozyczenia | ostateczna_kwota |
 *   opis | czy_oplacona | email_wyslany | created_at
 *
 * Relacja do wypożyczenia jest redundantna (można by ją wyciągnąć przez JOIN
 * przez szczegoly_wypozyczenia → wypozyczenia), ale przechowywana bezpośrednio
 * dla wydajności filtrowania w panelu admina.
 */
class KaryController extends Controller
{
    // Słownik rodzajów kar z domyślnymi kwotami — wypełniany przez Seeder
    public function rodzaje()
    {
        return response()->json(
            DB::table('rodzaje_kar')->orderBy('nazwa_przewinienia')->get()
        );
    }

    // Lista kar z paginacją — łączy dane z 6 tabel dla pełnego kontekstu
    public function index(Request $request)
    {
        $query = DB::table('naliczone_kary as nk')
            ->leftJoin('rodzaje_kar as rk',           'nk.id_rodzaju',      '=', 'rk.id_rodzaju')
            ->leftJoin('uzytkownicy as u',             'nk.id_uzytkownika',  '=', 'u.id')
            ->leftJoin('wypozyczenia as w',            'nk.id_wypozyczenia', '=', 'w.id_wypozyczenia')
            ->leftJoin('szczegoly_wypozyczenia as sw', 'w.id_wypozyczenia',  '=', 'sw.id_wypozyczenia')
            ->leftJoin('egzemplarze as e',             'sw.id_egzemplarza',  '=', 'e.id_egzemplarza')
            ->leftJoin('modele_sprzetu as ms',         'e.id_modelu',        '=', 'ms.id_modelu')
            ->select(
                'nk.id_kary',
                'nk.ostateczna_kwota',
                'nk.czy_oplacona',
                'nk.opis',
                'nk.email_wyslany',
                'nk.created_at',
                'rk.nazwa_przewinienia',
                DB::raw("TRIM(CONCAT(COALESCE(u.firstName,''), ' ', COALESCE(u.lastName,''))) as klient_nazwa"),
                'u.email as klient_email',
                DB::raw("TRIM(CONCAT(COALESCE(ms.marka,''), ' ', COALESCE(ms.nazwa_modelu,''))) as sprzet_nazwa"),
                'nk.id_wypozyczenia'
            )
            ->orderByDesc('nk.created_at');

        if ($request->filled('oplacona')) {
            $query->where('nk.czy_oplacona', $request->oplacona === 'tak' ? 1 : 0);
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Nakłada karę na klienta powiązanego z wypożyczeniem.
     *
     * Identyfikacja adresata e-mail:
     *   COALESCE(u.email, k.email) — obsługuje konto zarejestrowane i gości.
     *   Goście nie mają konta (id_uzytkownika = NULL), ale mają email w tabeli klienci.
     *
     * id_szczegolow z tabeli szczegoly_wypozyczenia jest wymagany przez FK constraint.
     * Jeśli wypożyczenie ma wiele pozycji (szczegółów), bierzemy pierwsze.
     */
    public function store(Request $request)
    {
        $request->validate([
            'id_wypozyczenia'  => 'required|integer|exists:wypozyczenia,id_wypozyczenia',
            'id_rodzaju'       => 'required|integer|exists:rodzaje_kar,id_rodzaju',
            'ostateczna_kwota' => 'required|numeric|min:0.01',
            'opis'             => 'nullable|string|max:500',
        ]);

        // Pobierz dane wypożyczenia z klientem i pierwszym egzemplarzem
        $wypozyczenie = DB::table('wypozyczenia as w')
            ->leftJoin('uzytkownicy as u',            'w.id_uzytkownika', '=', 'u.id')
            ->leftJoin('klienci as k',                'w.id_klienta',     '=', 'k.id_klienta')
            ->leftJoin('szczegoly_wypozyczenia as sw','w.id_wypozyczenia','=', 'sw.id_wypozyczenia')
            ->leftJoin('egzemplarze as e',            'sw.id_egzemplarza','=', 'e.id_egzemplarza')
            ->leftJoin('modele_sprzetu as ms',        'e.id_modelu',      '=', 'ms.id_modelu')
            ->where('w.id_wypozyczenia', $request->id_wypozyczenia)
            ->select(
                'w.id_wypozyczenia',
                'w.id_uzytkownika',
                DB::raw("COALESCE(u.firstName, k.imie,    'Gość') as imie"),
                DB::raw("COALESCE(u.lastName,  k.nazwisko, '')    as nazwisko"),
                DB::raw("COALESCE(u.email,     k.email)           as email"),
                DB::raw("TRIM(CONCAT(COALESCE(ms.marka,''), ' ', COALESCE(ms.nazwa_modelu,''))) as sprzet_nazwa"),
                'sw.id_szczegolow'
            )
            ->first();

        if (!$wypozyczenie) {
            return response()->json(['message' => 'Wypożyczenie nie istnieje.'], 404);
        }

        $rodzaj = DB::table('rodzaje_kar')->where('id_rodzaju', $request->id_rodzaju)->first();

        // id_szczegolow = 0 jako placeholder gdy brak szczegółów (dane historyczne)
        DB::table('naliczone_kary')->insert([
            'id_szczegolow'    => $wypozyczenie->id_szczegolow ?? 0,
            'id_rodzaju'       => $request->id_rodzaju,
            'id_uzytkownika'   => $wypozyczenie->id_uzytkownika,
            'id_wypozyczenia'  => $request->id_wypozyczenia,
            'ostateczna_kwota' => $request->ostateczna_kwota,
            'opis'             => $request->opis,
            'czy_oplacona'     => 0,
            'email_wyslany'    => 0,
            'created_at'       => now(),
        ]);

        // Pobierz id_kary ostatnio wstawionego rekordu
        $idKary = DB::getPdo()->lastInsertId();

        // Wysyłka e-mail — opcjonalna, nie blokuje odpowiedzi API
        $emailWyslany = false;
        if ($wypozyczenie->email) {
            try {
                Mail::send('emails.kara', [
                    'imie'         => $wypozyczenie->imie,
                    'sprzet'       => $wypozyczenie->sprzet_nazwa,
                    'przewinienie' => $rodzaj->nazwa_przewinienia,
                    'kwota'        => number_format((float) $request->ostateczna_kwota, 2, ',', ' '),
                    'opis'         => $request->opis,
                ], function ($m) use ($wypozyczenie, $rodzaj) {
                    $m->to($wypozyczenie->email,
                           trim("{$wypozyczenie->imie} {$wypozyczenie->nazwisko}"))
                      ->subject("Kiosk IT — naliczono karę: {$rodzaj->nazwa_przewinienia}");
                });

                DB::table('naliczone_kary')
                    ->where('id_kary', $idKary)
                    ->update(['email_wyslany' => 1]);

                $emailWyslany = true;
            } catch (\Exception $e) {
                Log::warning("Mail kary #{$idKary} nie wysłany: " . $e->getMessage());
            }
        }

        return response()->json([
            'message'       => 'Kara naliczona pomyślnie.',
            'email_wyslany' => $emailWyslany,
        ], 201);
    }

    // Oznacza karę jako opłaconą — szuka po id_kary (własnym PK)
    public function oplacona(int $idKary)
    {
        $updated = DB::table('naliczone_kary')
            ->where('id_kary', $idKary)
            ->update(['czy_oplacona' => 1]);

        if (!$updated) {
            return response()->json(['message' => 'Kara nie istnieje.'], 404);
        }

        return response()->json(['message' => 'Kara oznaczona jako opłacona.']);
    }
}