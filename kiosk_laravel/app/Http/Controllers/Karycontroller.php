<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

/**
 * Kontroler systemu kar — obsługuje nakładanie kar finansowych na użytkowników
 * za uszkodzenie sprzętu, przekroczenie terminu lub inne przewinienia.
 *
 * Przepływ danych:
 *   Admin wybiera wypożyczenie → wskazuje rodzaj kary i kwotę
 *   → rekord trafia do naliczone_kary → system wysyła e-mail do użytkownika
 */
class KaryController extends Controller
{
    // Zwraca listę zdefiniowanych rodzajów kar z domyślnymi kwotami
    public function rodzaje(): \Illuminate\Http\JsonResponse
    {
        $rodzaje = DB::table('rodzaje_kar')
            ->orderBy('nazwa_przewinienia')
            ->get();

        return response()->json($rodzaje);
    }

    // Zwraca wszystkie naliczone kary z danymi klienta i sprzętu (admin)
    public function index(Request $request): \Illuminate\Http\JsonResponse
    {
        $query = DB::table('naliczone_kary as nk')
            ->leftJoin('rodzaje_kar as rk',          'nk.id_rodzaju',     '=', 'rk.id_rodzaju')
            ->leftJoin('uzytkownicy as u',            'nk.id_uzytkownika', '=', 'u.id')
            ->leftJoin('wypozyczenia as w',           'nk.id_wypozyczenia','=', 'w.id_wypozyczenia')
            ->leftJoin('szczegoly_wypozyczenia as sw','w.id_wypozyczenia', '=', 'sw.id_wypozyczenia')
            ->leftJoin('egzemplarze as e',            'sw.id_egzemplarza', '=', 'e.id_egzemplarza')
            ->leftJoin('modele_sprzetu as ms',        'e.id_modelu',       '=', 'ms.id_modelu')
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

        // Filtrowanie po statusie opłacenia
        if ($request->filled('oplacona')) {
            $query->where('nk.czy_oplacona', $request->oplacona === 'tak' ? 1 : 0);
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Nakłada karę na użytkownika powiązanego z danym wypożyczeniem.
     * Po zapisie automatycznie wysyła powiadomienie e-mail.
     *
     * Waliduje: wypożyczenie musi istnieć, kwota musi być dodatnia.
     */
    public function store(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'id_wypozyczenia' => 'required|integer|exists:wypozyczenia,id_wypozyczenia',
            'id_rodzaju'      => 'required|integer|exists:rodzaje_kar,id_rodzaju',
            'ostateczna_kwota'=> 'required|numeric|min:0.01',
            'opis'            => 'nullable|string|max:500',
        ]);

        // Pobierz dane wypożyczenia — potrzebujemy id_uzytkownika do kary i e-maila
        $wypozyczenie = DB::table('wypozyczenia as w')
            ->leftJoin('uzytkownicy as u', 'w.id_uzytkownika', '=', 'u.id')
            ->leftJoin('klienci as k',     'w.id_klienta',     '=', 'k.id_klienta')
            ->leftJoin('szczegoly_wypozyczenia as sw', 'w.id_wypozyczenia', '=', 'sw.id_wypozyczenia')
            ->leftJoin('egzemplarze as e',  'sw.id_egzemplarza', '=', 'e.id_egzemplarza')
            ->leftJoin('modele_sprzetu as ms','e.id_modelu',     '=', 'ms.id_modelu')
            ->where('w.id_wypozyczenia', $request->id_wypozyczenia)
            ->select(
                'w.id_wypozyczenia',
                'w.id_uzytkownika',
                DB::raw("COALESCE(u.firstName, k.imie, 'Gość') as imie"),
                DB::raw("COALESCE(u.lastName,  k.nazwisko, '') as nazwisko"),
                DB::raw("COALESCE(u.email, k.email) as email"),
                DB::raw("CONCAT(COALESCE(ms.marka,''), ' ', COALESCE(ms.nazwa_modelu,'')) as sprzet_nazwa")
            )
            ->first();

        if (!$wypozyczenie) {
            return response()->json(['message' => 'Wypożyczenie nie istnieje.'], 404);
        }

        $rodzaj = DB::table('rodzaje_kar')->find($request->id_rodzaju);

        // Zapisz karę — łącząc z id_szczegolow z tabeli szczegoly_wypozyczenia
        $idSzczegolow = DB::table('szczegoly_wypozyczenia')
            ->where('id_wypozyczenia', $request->id_wypozyczenia)
            ->value('id_szczegolow') ?? 0;

        DB::table('naliczone_kary')->insert([
            'id_szczegolow'    => $idSzczegolow,
            'id_rodzaju'       => $request->id_rodzaju,
            'id_uzytkownika'   => $wypozyczenie->id_uzytkownika,
            'id_wypozyczenia'  => $request->id_wypozyczenia,
            'ostateczna_kwota' => $request->ostateczna_kwota,
            'opis'             => $request->opis,
            'czy_oplacona'     => 0,
            'email_wyslany'    => 0,
            'created_at'       => now(),
        ]);

        // Wyślij powiadomienie e-mail jeśli użytkownik ma adres
        $emailWyslany = false;
        if ($wypozyczenie->email) {
            try {
                Mail::send('emails.kara', [
                    'imie'        => $wypozyczenie->imie,
                    'sprzet'      => $wypozyczenie->sprzet_nazwa,
                    'przewinienie'=> $rodzaj->nazwa_przewinienia,
                    'kwota'       => number_format($request->ostateczna_kwota, 2, ',', ' '),
                    'opis'        => $request->opis,
                ], function ($m) use ($wypozyczenie, $rodzaj) {
                    $m->to($wypozyczenie->email, trim("{$wypozyczenie->imie} {$wypozyczenie->nazwisko}"))
                      ->subject("Kiosk IT — naliczono karę: {$rodzaj->nazwa_przewinienia}");
                });

                // Oznacz że e-mail został wysłany
                DB::table('naliczone_kary')
                    ->where('id_uzytkownika', $wypozyczenie->id_uzytkownika)
                    ->where('id_wypozyczenia', $request->id_wypozyczenia)
                    ->latest('created_at')
                    ->limit(1)
                    ->update(['email_wyslany' => 1]);

                $emailWyslany = true;
            } catch (\Exception $e) {
                // E-mail opcjonalny — kara zapisana nawet jeśli mail nie dotarł
            }
        }

        return response()->json([
            'message'       => 'Kara naliczona pomyślnie.',
            'email_wyslany' => $emailWyslany,
        ], 201);
    }

    // Oznacza karę jako opłaconą
    public function oplacona(int $id): \Illuminate\Http\JsonResponse
    {
        DB::table('naliczone_kary')
            ->where('id_szczegolow', $id)
            ->update(['czy_oplacona' => 1]);

        return response()->json(['message' => 'Kara oznaczona jako opłacona.']);
    }
}