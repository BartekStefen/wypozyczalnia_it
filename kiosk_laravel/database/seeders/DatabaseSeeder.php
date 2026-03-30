<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Seeder danych testowych dla Kiosk IT.
 *
 * Używa INSERT IGNORE zamiast insertOrIgnore() — kompatybilny z MariaDB 10.x.
 * Bezpieczny do wielokrotnego uruchomienia.
 *
 * Uruchomienie: php artisan db:seed
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Modele sprzętu ──────────────────────────────────────────────
        // Wzorce produktów — marka + nazwa modelu (bez ceny, bez stanu fizycznego)
        $modele = [
            [1,  'Dell',     'Latitude 5420'],
            [2,  'Dell',     'XPS 15'],
            [3,  'Apple',    'MacBook Pro 14'],
            [4,  'Lenovo',   'ThinkPad X1 Carbon'],
            [5,  'DJI',      'Mavic 3 Pro'],
            [6,  'DJI',      'Mini 3 Pro'],
            [7,  'Sony',     'A7 IV'],
            [8,  'Canon',    'EOS R6 Mark II'],
            [9,  'Epson',    'EB-L200F'],
            [10, 'Samsung',  'Galaxy Tab S9'],
            [11, 'Rode',     'Wireless GO II'],
            [12, 'Manfrotto','Befree Advanced'],
            [13, 'GoPro',    'HERO 12 Black'],
            [14, 'HP',       'EliteBook 840 G9'],
            [15, 'MSI',      'Katana GF66'],
        ];

        foreach ($modele as [$id, $marka, $model]) {
            DB::statement("INSERT IGNORE INTO modele_sprzetu (id_modelu, marka, nazwa_modelu) VALUES (?, ?, ?)", [$id, $marka, $model]);
        }

        // ── Egzemplarze ─────────────────────────────────────────────────
        // Fizyczne sztuki sprzętu — każda ma numer seryjny i własną cenę
        if (DB::table('egzemplarze')->count() === 0) {
            $egzemplarze = [
                [1,  'SN-DELL-001',  'Dostępny',    50.00],
                [2,  'SN-DELL-002',  'Dostępny',    75.00],
                [3,  'SN-MBP-001',   'Wypożyczony', 140.00],
                [4,  'SN-LEN-001',   'Dostępny',    70.00],
                [5,  'SN-MAV3-001',  'Dostępny',    250.00],
                [6,  'SN-MINI3-001', 'Dostępny',    120.00],
                [7,  'SN-SONY-001',  'Dostępny',    140.00],
                [8,  'SN-CANON-001', 'Dostępny',    160.00],
                [9,  'SN-EPSON-001', 'Dostępny',    90.00],
                [10, 'SN-SAM-001',   'Dostępny',    55.00],
                [11, 'SN-RODE-001',  'Dostępny',    35.00],
                [12, 'SN-MANF-001',  'Serwis',      27.00],
                [13, 'SN-GOPRO-001', 'Dostępny',    45.00],
                [14, 'SN-HP-001',    'Dostępny',    65.00],
                [15, 'SN-MSI-001',   'Dostępny',    90.00],
            ];
            foreach ($egzemplarze as [$idModelu, $sn, $status, $cena]) {
                DB::statement(
                    "INSERT IGNORE INTO egzemplarze (id_modelu, numer_seryjny, status, cena_wypozyczenia_dzien) VALUES (?, ?, ?, ?)",
                    [$idModelu, $sn, $status, $cena]
                );
            }
        }

        // ── Użytkownicy ──────────────────────────────────────────────────
        DB::statement(
            "INSERT IGNORE INTO uzytkownicy (firstName, lastName, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
            ['Admin', 'System', 'admin@kioskIT.pl', Hash::make('Admin1234!'), 'admin']
        );
        DB::statement(
            "INSERT IGNORE INTO uzytkownicy (firstName, lastName, email, password, phone, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())",
            ['Jan', 'Kowalski', 'jan.kowalski@test.pl', Hash::make('Test1234!'), '600 100 200', 'klient']
        );

        // ── Kategorie sprzętu ────────────────────────────────────────────
        $kategorie = [
            [1,  'Laptopy',              null],
            [2,  'Drony',                null],
            [3,  'Aparaty',              null],
            [4,  'Projektory',           null],
            [5,  'Tablety',              null],
            [6,  'Akcesoria',            null],
            [10, 'Laptopy biznesowe',    1],
            [11, 'Laptopy gamingowe',    1],
            [20, 'Drony fotograficzne',  2],
            [30, 'Aparaty bezlusterkowe',3],
        ];
        foreach ($kategorie as [$id, $nazwa, $rodzic]) {
            DB::statement(
                "INSERT IGNORE INTO kategorie_sprzetu (id_kategorii, nazwa, id_rodzica) VALUES (?, ?, ?)",
                [$id, $nazwa, $rodzic]
            );
        }

        // ── Powiązania modeli z kategoriami ──────────────────────────────
        $km = [
            [1,1],[10,1],[1,2],[10,2],[1,3],[1,4],[10,4],
            [2,5],[20,5],[2,6],[20,6],
            [3,7],[30,7],[3,8],[30,8],
            [4,9],[5,10],[6,11],[6,12],[6,13],
            [1,14],[10,14],[1,15],[11,15],
        ];
        foreach ($km as [$idKat, $idMod]) {
            DB::statement(
                "INSERT IGNORE INTO kategorie_modele (id_kategorii, id_modelu) VALUES (?, ?)",
                [$idKat, $idMod]
            );
        }

        // ── Rodzaje kar ──────────────────────────────────────────────────
        $kary = [
            [1, 'Uszkodzenie sprzętu',           500.00],
            [2, 'Przekroczenie terminu zwrotu',    50.00],
            [3, 'Zgubienie akcesoriów',           200.00],
            [4, 'Brak oryginalnego opakowania',    80.00],
            [5, 'Brud lub zabrudzenie sprzętu',    30.00],
        ];
        foreach ($kary as [$id, $nazwa, $kwota]) {
            DB::statement(
                "INSERT IGNORE INTO rodzaje_kar (id_rodzaju, nazwa_przewinienia, domyslna_kwota) VALUES (?, ?, ?)",
                [$id, $nazwa, $kwota]
            );
        }

        $this->command->info('✅ Seeder zakończony — baza wypełniona danymi testowymi.');
        $this->command->info('   Admin: admin@kioskIT.pl / Admin1234!');
        $this->command->info('   Klient: jan.kowalski@test.pl / Test1234!');
    }
}