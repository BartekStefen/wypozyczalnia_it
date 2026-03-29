<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

/**
 * Kontroler systemu kar finansowych.
 *
 * Przepływ naliczenia kary:
 *   Admin wybiera wypożyczenie → wskazuje rodzaj kary i kwotę
 *   → zapis do naliczone_kary → Mail::send do klienta
 *
 * E-mail jest asynchroniczny (opcjonalny) — kara jest zapisana nawet jeśli
 * mail nie dotrze. W produkcji należy użyć Mail::queue() z kolejką.
 *
 * Tabela rodzaje_kar zawiera predefiniowane typy przewinień z domyślnymi kwotami.
 * Admin może zmienić kwotę przy naliczaniu — domyślna jest tylko podpowiedzią.
 */
class KaryController extends Controller
{
    // Zwraca wszystkie zdefiniowane rodzaje kar (wypełniane przez Seeder)
    public function rodzaje()
    {
        return response()->json(
            DB::table('rodzaje_kar')->orderBy('nazwa_przewinienia')->get()
        );
    }

    // Lista naliczonych kar z danymi klienta i sprzętu — stronicowana, z filtrami
    public function index(Request $request)
    {
        $query = DB::table('naliczone_kary as nk')
            ->leftJoin('rodzaje_kar as rk',          'nk.id_rodzaju',      '=', 'rk.id_rodzaju')
            ->leftJoin('uzytkownicy as u',            'nk.id_uzytkownika',  '=', 'u.id')
            ->leftJoin('wypozyczenia as w',           'nk.id_wypozyczenia', '=', 'w.id_wypozyczenia')
            ->leftJoin('szczegoly_wypozyczenia as sw','w.id_wypozyczenia',  '=', 'sw.id_wypozyczenia')
            ->leftJoin('egzemplarze as e',            'sw.id_egzemplarza',  '=', 'e.id_egzemplarza')
            ->leftJoin('modele_sprzetu as ms',        'e.id_modelu',        '=', 'ms.id_modelu')
            ->select(
                'nk.id_szczegolow',
                'nk.ostateczna_kwota',
                'nk.czy_oplacona',
                'nk.opis',
                'nk.email_wyslany',
                'nk.created_at',
                'rk.nazwa_przewinienia',
                DB::raw("CONCAT(COALESCE(u.firstName,''), ' ', COALESCE(u.lastName,'')) as klient_nazwa"),
                'u.email as klient_email',
                DB::raw("CONCAT(COALESCE(ms.marka,''), ' ', COALESCE(ms.nazwa_modelu,'')) as sprzet_nazwa"),
                'nk.id_wypozyczenia'
            )
            ->orderByDesc('nk.created_at');

        if ($request->filled('oplacona')) {
            $query->where('nk.czy_oplacona', $request->oplacona === 'tak' ? 1 : 0);
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Nakłada karę na użytkownika powiązanego z wypożyczeniem.
     *
     * Identyfikacja użytkownika:
     *   Pobieramy wypożyczenie → z niego id_uzytkownika lub email z klienci
     *   → zapisujemy karę → wysyłamy e-mail na ten adres.
     *
     * id_szczegolow z tabeli szczegoly_wypozyczenia jest wymagane przez schemat naliczone_kary.
     * Jeśli brak szczegółów (np. dane historyczne), używamy 0 jako placeholder.
     */
    public function store(Request $request)
    {
        $request->validate([
            'id_wypozyczenia'  => 'required|integer|exists:wypozyczenia,id_wypozyczenia',
            'id_rodzaju'       => 'required|integer|exists:rodzaje_kar,id_rodzaju',
            'ostateczna_kwota' => 'required|numeric|min:0.01',
            'opis'             => 'nullable|string|max:500',
        ]);

        // Pobierz dane klienta przez JOIN — obsługuje zarówno konto jak i gościa
        $wypozyczenie = DB::table('wypozyczenia as w')
            ->leftJoin('uzytkownicy as u','w.id_uzytkownika','=','u.id')
            ->leftJoin('klienci as k',    'w.id_klienta',    '=','k.id_klienta')
            ->leftJoin('szczegoly_wypozyczenia as sw', 'w.id_wypozyczenia', '=', 'sw.id_wypozyczenia')
            ->leftJoin('egzemplarze as e',  'sw.id_egzemplarza','=','e.id_egzemplarza')
            ->leftJoin('modele_sprzetu as ms','e.id_modelu',    '=','ms.id_modelu')
            ->where('w.id_wypozyczenia', $request->id_wypozyczenia)
            ->select(
                'w.id_wypozyczenia', 'w.id_uzytkownika',
                DB::raw("COALESCE(u.firstName, k.imie,    'Gość') as imie"),
                DB::raw("COALESCE(u.lastName,  k.nazwisko, '')    as nazwisko"),
                DB::raw("COALESCE(u.email,     k.email)           as email"),
                DB::raw("CONCAT(COALESCE(ms.marka,''), ' ', COALESCE(ms.nazwa_modelu,'')) as sprzet_nazwa"),
                'sw.id_szczegolow'
            )
            ->first();

        if (!$wypozyczenie) {
            return response()->json(['message' => 'Wypożyczenie nie istnieje.'], 404);
        }

        $rodzaj = DB::table('rodzaje_kar')->where('id_rodzaju', $request->id_rodzaju)->first();

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

        // Wysyłka e-mail — opcjonalna, kara jest zapisana niezależnie od wyniku
        $emailWyslany = false;
        if ($wypozyczenie->email) {
            try {
                Mail::send('emails.kara', [
                    'imie'         => $wypozyczenie->imie,
                    'sprzet'       => $wypozyczenie->sprzet_nazwa,
                    'przewinienie' => $rodzaj->nazwa_przewinienia,
                    'kwota'        => number_format($request->ostateczna_kwota, 2, ',', ' '),
                    'opis'         => $request->opis,
                ], function ($m) use ($wypozyczenie, $rodzaj) {
                    $m->to($wypozyczenie->email, trim("{$wypozyczenie->imie} {$wypozyczenie->nazwisko}"))
                      ->subject("Kiosk IT — naliczono karę: {$rodzaj->nazwa_przewinienia}");
                });

                // Oznacz e-mail jako wysłany w ostatnim dodanym rekordzie kary
                DB::table('naliczone_kary')
                    ->where('id_uzytkownika',  $wypozyczenie->id_uzytkownika)
                    ->where('id_wypozyczenia', $request->id_wypozyczenia)
                    ->orderByDesc('created_at')
                    ->limit(1)
                    ->update(['email_wyslany' => 1]);

                $emailWyslany = true;
            } catch (\Exception $e) {
                // Loguj błąd w produkcji: Log::error('Mail kara: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message'       => 'Kara naliczona pomyślnie.',
            'email_wyslany' => $emailWyslany,
        ], 201);
    }

    // Oznacza karę jako opłaconą — używane po przyjęciu płatności przez obsługę
    public function oplacona(int $id)
    {
        DB::table('naliczone_kary')
            ->where('id_szczegolow', $id)
            ->update(['czy_oplacona' => 1]);

        return response()->json(['message' => 'Kara oznaczona jako opłacona.']);
    }
}