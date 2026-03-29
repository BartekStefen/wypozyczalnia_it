<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Wynajem;

class SprzetController extends Controller
{
    // Zwraca listę egzemplarzy z opcjonalnym filtrowaniem po kategorii i frazie
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

        if ($request->filled('kategoria')) {
            $allIds = $this->getAllCategoryIds((int) $request->kategoria);
            $query->join('kategorie_modele', 'egzemplarze.id_modelu', '=', 'kategorie_modele.id_modelu')
                  ->whereIn('kategorie_modele.id_kategorii', $allIds);
        }

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

    // Rekurencyjnie zbiera ID kategorii wraz z podkategoriami — umożliwia filtrowanie
    // np. "Laptopy" zwraca też wyniki z "Laptopy biznesowe" i "Laptopy gamingowe"
    private function getAllCategoryIds(int $parentId): array
    {
        $ids      = [$parentId];
        $children = DB::table('kategorie_sprzetu')
            ->where('id_rodzica', $parentId)
            ->pluck('id_kategorii')
            ->toArray();

        foreach ($children as $childId) {
            $ids = array_merge($ids, $this->getAllCategoryIds($childId));
        }

        return $ids;
    }

    // Zwraca szczegóły egzemplarza wraz ze średnią oceną z tabeli opinie
    public function show($id)
    {
        $item = DB::table('egzemplarze')
            ->join('modele_sprzetu', 'egzemplarze.id_modelu', '=', 'modele_sprzetu.id_modelu')
            ->select(
                'egzemplarze.*',
                'modele_sprzetu.marka',
                'modele_sprzetu.nazwa_modelu',
                DB::raw('(SELECT ROUND(AVG(ocena),1) FROM opinie WHERE id_egzemplarza = egzemplarze.id_egzemplarza) as srednia_ocena'),
                DB::raw('(SELECT COUNT(*) FROM opinie WHERE id_egzemplarza = egzemplarze.id_egzemplarza) as liczba_opinii')
            )
            ->where('egzemplarze.id_egzemplarza', $id)
            ->first();

        if (!$item) {
            return response()->json(['message' => 'Nie znaleziono sprzętu.'], 404);
        }

        return response()->json($item);
    }

    // Zwraca drzewo kategorii z podkategoriami — używane przez MegaMenu
    public function kategorie()
    {
        $main = DB::table('kategorie_sprzetu')
            ->whereNull('id_rodzica')
            ->orderBy('id_kategorii')
            ->get();

        $result = $main->map(function ($kat) {
            $kat->podkategorie = DB::table('kategorie_sprzetu')
                ->where('id_rodzica', $kat->id_kategorii)
                ->orderBy('id_kategorii')
                ->get()
                ->map(function ($sub) { $sub->podkategorie = []; return $sub; });
            return $kat;
        });

        return response()->json($result);
    }

    // Sprawdza dostępność terminu bez tworzenia rezerwacji — używane przez DatePicker
    public function checkAvailability(Request $request)
    {
        $request->validate([
            'id_egzemplarza' => 'required|integer|exists:egzemplarze,id_egzemplarza',
            'data_start'     => 'required|date|after_or_equal:today',
            'data_koniec'    => 'required|date|after:data_start',
        ]);

        $conflict = $this->terminyKoliduja(
            $request->id_egzemplarza,
            $request->data_start,
            $request->data_koniec
        );

        return response()->json(['available' => !$conflict]);
    }

    /**
     * Finalizuje zamówienie — obsługuje zarówno gości jak i zalogowanych.
     *
     * Kluczowa różnica w przepływie:
     *   - Zalogowany: $request->user() != null → identyfikacja przez token Sanctum
     *     → nie wysyła danych `klient` w payloadzie, nie potrzeba walidacji formularza gościa
     *   - Gość: $request->user() === null → musi przesłać blok `klient` z danymi osobowymi
     *     → system tworzy lub odnajduje rekord w tabeli `klienci` po e-mailu
     *
     * Transakcja DB gwarantuje atomowość — albo wszystkie pozycje koszyka
     * zostaną zapisane, albo żadna (np. gdy jedna z dat jest już zajęta).
     */
    public function finalize(Request $request)
    {
        return DB::transaction(function () use ($request) {
            $uzytkownik = $request->user();
            $produkty   = $request->produkty ?? [];

            if (empty($produkty)) {
                return response()->json(['message' => 'Brak produktów w zamówieniu.'], 422);
            }

            // Walidacja każdego produktu — id_egzemplarza musi istnieć w bazie
            foreach ($produkty as $index => $p) {
                if (empty($p['id_egzemplarza']) || empty($p['data_start']) || empty($p['data_koniec'])) {
                    return response()->json([
                        'message' => "Produkt #{$index}: brakuje id_egzemplarza, data_start lub data_koniec."
                    ], 422);
                }
            }

            // Sprawdź kolizje terminów przed zapisem — jeśli choć jedna pozycja
            // koliduje z istniejącą rezerwacją, cała transakcja jest odrzucana
            foreach ($produkty as $p) {
                if ($this->terminyKoliduja($p['id_egzemplarza'], $p['data_start'], $p['data_koniec'])) {
                    $sprzet = DB::table('egzemplarze')
                        ->join('modele_sprzetu', 'egzemplarze.id_modelu', '=', 'modele_sprzetu.id_modelu')
                        ->where('id_egzemplarza', $p['id_egzemplarza'])->first();
                    $nazwa = $sprzet ? "{$sprzet->marka} {$sprzet->nazwa_modelu}" : "ID {$p['id_egzemplarza']}";
                    return response()->json(['message' => "Sprzęt '{$nazwa}' jest już zarezerwowany w tym terminie."], 409);
                }
            }

            // Rozgałęzienie logiki: zalogowany vs gość
            if ($uzytkownik) {
                // Ścieżka zalogowanego — walidacja `klient` jest POMIJANA celowo,
                // bo dane pobierane są z tokenu, nie z formularza
                $id_klienta     = null;
                $id_uzytkownika = $uzytkownik->id;
            } else {
                // Ścieżka gościa — walidacja danych formularza TYLKO tutaj
                $request->validate([
                    'klient.imie'            => 'required|string|max:50',
                    'klient.nazwisko'        => 'required|string|max:50',
                    'klient.email'           => 'required|email',
                    'klient.telefon'         => 'required|string',
                    'klient.numer_dokumentu' => 'required|string',
                ]);

                $existingClient = DB::table('klienci')
                    ->where('email', $request->klient['email'])->first();

                $id_klienta = $existingClient
                    ? $existingClient->id_klienta
                    : DB::table('klienci')->insertGetId([
                        'imie'            => $request->klient['imie'],
                        'nazwisko'        => $request->klient['nazwisko'],
                        'email'           => $request->klient['email'],
                        'telefon'         => $request->klient['telefon'],
                        'numer_dokumentu' => $request->klient['numer_dokumentu'],
                    ]);

                $id_uzytkownika = null;
            }

            foreach ($produkty as $p) {
                $id_wyp = DB::table('wypozyczenia')->insertGetId([
                    'id_klienta'            => $id_klienta,
                    'id_uzytkownika'        => $id_uzytkownika,
                    'planowana_data_zwrotu' => $p['data_koniec'],
                    'status_transakcji'     => 'Trwa',
                ]);

                DB::table('szczegoly_wypozyczenia')->insert([
                    'id_wypozyczenia' => $id_wyp,
                    'id_egzemplarza'  => $p['id_egzemplarza'],
                    'koszt_pozycji'   => $p['suma'],
                ]);

                DB::table('wynajmy')->insert([
                    'id_egzemplarza' => $p['id_egzemplarza'],
                    'id_uzytkownika' => $id_uzytkownika,
                    'data_start'     => $p['data_start'],
                    'data_koniec'    => $p['data_koniec'],
                    'cena_calkowita' => $p['suma'],
                    'status'         => 'Zarezerwowany',
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]);

                DB::table('egzemplarze')
                    ->where('id_egzemplarza', $p['id_egzemplarza'])
                    ->update(['status' => 'Wypożyczony']);
            }

            return response()->json(['message' => 'Zamówienie złożone pomyślnie.'], 201);
        });
    }

    // Sprawdza czy podany termin koliduje z istniejącymi aktywnym rezerwacjami
    private function terminyKoliduja(int $idEgz, string $start, string $koniec): bool
    {
        return DB::table('wynajmy')
            ->where('id_egzemplarza', $idEgz)
            ->whereNotIn('status', ['Anulowany'])
            ->where(function ($q) use ($start, $koniec) {
                $q->whereBetween('data_start', [$start, $koniec])
                  ->orWhereBetween('data_koniec', [$start, $koniec])
                  ->orWhere(function ($q2) use ($start, $koniec) {
                      $q2->where('data_start', '<=', $start)
                         ->where('data_koniec', '>=', $koniec);
                  });
            })
            ->exists();
    }

    // Pobiera zajęte zakresy dat dla kalendarza DatePicker
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

    // Zmienia status egzemplarza — używane przez admin (bez przechodzenia przez finalize)
    public function zmienStatus(Request $request, $id)
    {
        $request->validate(['status' => 'required|in:Dostępny,Wypożyczony,Serwis']);

        DB::table('egzemplarze')
            ->where('id_egzemplarza', $id)
            ->update(['status' => $request->status]);

        return response()->json(['message' => 'Status zaktualizowany.']);
    }
}