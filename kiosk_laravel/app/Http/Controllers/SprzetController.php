<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Kontroler sprzętu — obsługuje listę, szczegóły, kategorie,
 * finalizację zamówienia oraz sprawdzanie dostępności dat.
 */
class SprzetController extends Controller
{
    // Pobiera cały sprzęt z dołączonymi danymi modelu
    public function index(Request $request)
    {
        $query = DB::table('egzemplarze')
            ->join('modele_sprzetu', 'egzemplarze.id_modelu', '=', 'modele_sprzetu.id_modelu')
            ->select(
                'egzemplarze.id_egzemplarza',
                'egzemplarze.numer_seryjny',
                'egzemplarze.status',
                'egzemplarze.cena_wypozyczenia_dzien',
                'egzemplarze.id_modelu',
                'modele_sprzetu.marka',
                'modele_sprzetu.nazwa_modelu'
            );

        // Filtrowanie po kategorii przez tabelę kategorie_modele
        if ($request->filled('kategoria')) {
            $idKategorii = (int) $request->kategoria;

            // Pobierz też wszystkie podkategorie danej kategorii
            $allIds = $this->getAllCategoryIds($idKategorii);

            $query->join('kategorie_modele', 'egzemplarze.id_modelu', '=', 'kategorie_modele.id_modelu')
                  ->whereIn('kategorie_modele.id_kategorii', $allIds);
        }

        // Wyszukiwanie tekstowe
        if ($request->filled('szukaj')) {
            $q = $request->szukaj;
            $query->where(function ($b) use ($q) {
                $b->where('modele_sprzetu.marka', 'LIKE', "%{$q}%")
                  ->orWhere('modele_sprzetu.nazwa_modelu', 'LIKE', "%{$q}%")
                  ->orWhere('egzemplarze.numer_seryjny', 'LIKE', "%{$q}%");
            });
        }

        return response()->json($query->get());
    }

    // Rekurencyjnie pobiera ID kategorii + wszystkich podkategorii
    private function getAllCategoryIds(int $parentId): array
    {
        $ids = [$parentId];
        $children = DB::table('kategorie_sprzetu')
            ->where('id_rodzica', $parentId)
            ->pluck('id_kategorii')
            ->toArray();

        foreach ($children as $childId) {
            $ids = array_merge($ids, $this->getAllCategoryIds($childId));
        }

        return $ids;
    }

    // Szczegóły jednego egzemplarza
    public function show($id)
    {
        $item = DB::table('egzemplarze')
            ->join('modele_sprzetu', 'egzemplarze.id_modelu', '=', 'modele_sprzetu.id_modelu')
            ->select('egzemplarze.*', 'modele_sprzetu.marka', 'modele_sprzetu.nazwa_modelu')
            ->where('egzemplarze.id_egzemplarza', $id)
            ->first();

        if (!$item) {
            return response()->json(['message' => 'Nie znaleziono sprzętu.'], 404);
        }

        return response()->json($item);
    }

    /**
     * Pobiera hierarchię kategorii z podkategoriami.
     * Używane przez MegaMenu w React.
     */
    public function kategorie()
    {
        // Pobierz kategorie główne (bez rodzica)
        $main = DB::table('kategorie_sprzetu')
            ->whereNull('id_rodzica')
            ->orderBy('id_kategorii')
            ->get();

        // Dołącz podkategorie do każdej głównej
        $result = $main->map(function ($kat) {
            $kat->podkategorie = DB::table('kategorie_sprzetu')
                ->where('id_rodzica', $kat->id_kategorii)
                ->orderBy('id_kategorii')
                ->get()
                ->map(function ($sub) {
                    $sub->podkategorie = []; // Trzeci poziom opcjonalny
                    return $sub;
                });
            return $kat;
        });

        return response()->json($result);
    }

    /**
     * Sprawdza czy dany egzemplarz jest dostępny w podanym zakresie dat.
     * Zapobiega podwójnym rezerwacjom na te same daty.
     */
    public function checkAvailability(Request $request)
    {
        $request->validate([
            'id_egzemplarza' => 'required|integer',
            'data_start'     => 'required|date',
            'data_koniec'    => 'required|date|after:data_start',
        ]);

        $conflict = DB::table('wynajmy')
            ->where('id_egzemplarza', $request->id_egzemplarza)
            ->whereNotIn('status', ['Anulowany'])
            ->where(function ($q) use ($request) {
                // Kolizja: nowa rezerwacja nakłada się na istniejącą
                $q->whereBetween('data_start', [$request->data_start, $request->data_koniec])
                  ->orWhereBetween('data_koniec', [$request->data_start, $request->data_koniec])
                  ->orWhere(function ($q2) use ($request) {
                      $q2->where('data_start', '<=', $request->data_start)
                         ->where('data_koniec', '>=', $request->data_koniec);
                  });
            })
            ->exists();

        return response()->json(['available' => !$conflict]);
    }

    /**
     * Finalizacja zamówienia.
     * Naprawiona: nie wstawia created_at/updated_at do wypozyczenia (brak tych kolumn).
     * Obsługuje zarówno gości jak i zalogowanych użytkowników.
     * Tworzy wpisy w wynajmy (do sprawdzania dostępności dat).
     */
    public function finalize(Request $request)
    {
        return DB::transaction(function () use ($request) {
            $uzytkownik = $request->user(); // null jeśli gość

            $produkty = $request->produkty ?? [];

            if (empty($produkty)) {
                return response()->json(['message' => 'Brak produktów w zamówieniu.'], 422);
            }

            // Sprawdź dostępność PRZED zapisem (zapobiega powielaniu)
            foreach ($produkty as $p) {
                $conflict = DB::table('wynajmy')
                    ->where('id_egzemplarza', $p['id_egzemplarza'])
                    ->whereNotIn('status', ['Anulowany'])
                    ->where(function ($q) use ($p) {
                        $q->whereBetween('data_start', [$p['data_start'], $p['data_koniec']])
                          ->orWhereBetween('data_koniec', [$p['data_start'], $p['data_koniec']])
                          ->orWhere(function ($q2) use ($p) {
                              $q2->where('data_start', '<=', $p['data_start'])
                                 ->where('data_koniec', '>=', $p['data_koniec']);
                          });
                    })
                    ->exists();

                if ($conflict) {
                    $sprzet = DB::table('egzemplarze')
                        ->join('modele_sprzetu', 'egzemplarze.id_modelu', '=', 'modele_sprzetu.id_modelu')
                        ->where('id_egzemplarza', $p['id_egzemplarza'])
                        ->first();
                    $nazwa = $sprzet ? "{$sprzet->marka} {$sprzet->nazwa_modelu}" : "ID {$p['id_egzemplarza']}";
                    return response()->json([
            'message' => "Sprzęt '{$nazwa}' jest już zarezerwowany w tym terminie."
        ], 409);
                }
            }

            // Obsługa klienta-gościa lub zalogowanego
            if ($uzytkownik) {
                // Zalogowany: użyj ID konta jako klienta (lub stwórz/znajdź rekord klienta)
                $id_klienta = null;
                $id_uzytkownika = $uzytkownik->id;
            } else {
                // Gość: waliduj dane formularza
                $request->validate([
                    'klient.imie'            => 'required|string|max:50',
                    'klient.nazwisko'        => 'required|string|max:50',
                    'klient.email'           => 'required|email',
                    'klient.telefon'         => 'required|string',
                    'klient.numer_dokumentu' => 'required|string',
                ]);

                // Wstaw lub znajdź klienta po emailu
                $existingClient = DB::table('klienci')
                    ->where('email', $request->klient['email'])
                    ->first();

                if ($existingClient) {
                    $id_klienta = $existingClient->id_klienta;
                } else {
                    $id_klienta = DB::table('klienci')->insertGetId([
                        'imie'            => $request->klient['imie'],
                        'nazwisko'        => $request->klient['nazwisko'],
                        'email'           => $request->klient['email'],
                        'telefon'         => $request->klient['telefon'],
                        'numer_dokumentu' => $request->klient['numer_dokumentu'],
                    ]);
                }
                $id_uzytkownika = null;
            }

            foreach ($produkty as $p) {
                // Wstaw do wypozyczenia (BEZ created_at/updated_at - tabela ich nie ma)
                $id_wyp = DB::table('wypozyczenia')->insertGetId([
                    'id_klienta'            => $id_klienta,
                    'id_uzytkownika'        => $id_uzytkownika,
                    'planowana_data_zwrotu' => $p['data_koniec'],
                    'status_transakcji'     => 'Trwa',
                ]);

                // Szczegóły wypożyczenia
                DB::table('szczegoly_wypozyczenia')->insert([
                    'id_wypozyczenia' => $id_wyp,
                    'id_egzemplarza'  => $p['id_egzemplarza'],
                    'koszt_pozycji'   => $p['suma'],
                ]);

                // Wstaw do wynajmy (do blokowania kalendarza)
                DB::table('wynajmy')->insert([
                    'id_egzemplarza' => $p['id_egzemplarza'],
                    'data_start'     => $p['data_start'],
                    'data_koniec'    => $p['data_koniec'],
                    'cena_calkowita' => $p['suma'],
                    'status'         => 'Zarezerwowany',
                    'id_uzytkownika' => $id_uzytkownika,
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]);

                // Zmień status egzemplarza na wypożyczony
                DB::table('egzemplarze')
                    ->where('id_egzemplarza', $p['id_egzemplarza'])
                    ->update(['status' => 'Wypożyczony']);
            }

            return response()->json(['message' => 'Zamówienie złożone pomyślnie.'], 201);
        });
    }

    // Pobiera zajęte daty dla kalendarza (do blokowania w DatePicker)
    public function getBookedDates(Request $request, $id)
    {
        $bookings = DB::table('wynajmy')
            ->where('id_egzemplarza', $id)
            ->whereNotIn('status', ['Anulowany'])
            ->where('data_koniec', '>=', now()->format('Y-m-d'))
            ->select('data_start', 'data_koniec')
            ->get();

        return response()->json($bookings);
    }

    // Zmiana statusu sprzętu (admin)
    public function zmienStatus(Request $request, $id)
    {
        $request->validate(['status' => 'required|in:Dostępny,Wypożyczony,Serwis']);

        DB::table('egzemplarze')
            ->where('id_egzemplarza', $id)
            ->update(['status' => $request->status]);

        return response()->json(['message' => 'Status zaktualizowany.']);
    }
}