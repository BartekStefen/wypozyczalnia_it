<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Seeder wypełniający bazę przykładowymi danymi do testów.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Modele sprzętu (marki + nazwy) ─────────────────────────────
        // idempotentne: insertOrIgnore nie duplikuje przy ponownym uruchomieniu.
        $modele = [
            ['marka' => 'Dell',    'nazwa_modelu' => 'Latitude 5420'],
            ['marka' => 'Dell',    'nazwa_modelu' => 'XPS 15'],
            ['marka' => 'Apple',   'nazwa_modelu' => 'MacBook Pro 14'],
            ['marka' => 'Lenovo',  'nazwa_modelu' => 'ThinkPad X1 Carbon'],
            ['marka' => 'DJI',     'nazwa_modelu' => 'Mavic 3 Pro'],
            ['marka' => 'DJI',     'nazwa_modelu' => 'Mini 3 Pro'],
            ['marka' => 'Sony',    'nazwa_modelu' => 'A7 IV'],
            ['marka' => 'Canon',   'nazwa_modelu' => 'EOS R6 Mark II'],
            ['marka' => 'Epson',   'nazwa_modelu' => 'EB-L200F'],
            ['marka' => 'Samsung', 'nazwa_modelu' => 'Galaxy Tab S9'],
            ['marka' => 'Rode',    'nazwa_modelu' => 'Wireless GO II'],
            ['marka' => 'Manfrotto','nazwa_modelu'=> 'Befree Advanced'],
            ['marka' => 'GoPro',   'nazwa_modelu' => 'HERO 12 Black'],
            ['marka' => 'HP',      'nazwa_modelu' => 'EliteBook 840 G9'],
            ['marka' => 'MSI',     'nazwa_modelu' => 'Katana GF66'],
        ];

        foreach ($modele as $m) {
            DB::table('modele_sprzetu')->insertOrIgnore($m);
        }

        // ── Egzemplarze ─────────────────────────────────────────────────
        // Każdy egzemplarz to fizyczna sztuka sprzętu z numerem seryjnym.
        // Cena dzienna jest ceną brutto (z VAT 23%).
        $egzemplarze = [
            ['id_modelu' => 1,  'numer_seryjny' => 'SN-DELL-001', 'status' => 'Dostępny',    'cena_wypozyczenia_dzien' => 50.00],
            ['id_modelu' => 2,  'numer_seryjny' => 'SN-DELL-002', 'status' => 'Dostępny',    'cena_wypozyczenia_dzien' => 75.00],
            ['id_modelu' => 3,  'numer_seryjny' => 'SN-MBP-001',  'status' => 'Wypożyczony', 'cena_wypozyczenia_dzien' => 140.00],
            ['id_modelu' => 4,  'numer_seryjny' => 'SN-LEN-001',  'status' => 'Dostępny',    'cena_wypozyczenia_dzien' => 70.00],
            ['id_modelu' => 5,  'numer_seryjny' => 'SN-MAV3-001', 'status' => 'Dostępny',    'cena_wypozyczenia_dzien' => 250.00],
            ['id_modelu' => 6,  'numer_seryjny' => 'SN-MINI3-001','status' => 'Dostępny',    'cena_wypozyczenia_dzien' => 120.00],
            ['id_modelu' => 7,  'numer_seryjny' => 'SN-SONY-001', 'status' => 'Dostępny',    'cena_wypozyczenia_dzien' => 140.00],
            ['id_modelu' => 8,  'numer_seryjny' => 'SN-CANON-001','status' => 'Dostępny',    'cena_wypozyczenia_dzien' => 160.00],
            ['id_modelu' => 9,  'numer_seryjny' => 'SN-EPSON-001','status' => 'Dostępny',    'cena_wypozyczenia_dzien' => 90.00],
            ['id_modelu' => 10, 'numer_seryjny' => 'SN-SAM-001',  'status' => 'Dostępny',    'cena_wypozyczenia_dzien' => 55.00],
            ['id_modelu' => 11, 'numer_seryjny' => 'SN-RODE-001', 'status' => 'Dostępny',    'cena_wypozyczenia_dzien' => 35.00],
            ['id_modelu' => 12, 'numer_seryjny' => 'SN-MANF-001', 'status' => 'Serwis',      'cena_wypozyczenia_dzien' => 27.00],
            ['id_modelu' => 13, 'numer_seryjny' => 'SN-GOPRO-001','status' => 'Dostępny',    'cena_wypozyczenia_dzien' => 45.00],
            ['id_modelu' => 14, 'numer_seryjny' => 'SN-HP-001',   'status' => 'Dostępny',    'cena_wypozyczenia_dzien' => 65.00],
            ['id_modelu' => 15, 'numer_seryjny' => 'SN-MSI-001',  'status' => 'Dostępny',    'cena_wypozyczenia_dzien' => 90.00],
        ];

        // Wstaw tylko jeśli tabela egzemplarzy jest pusta
        if (DB::table('egzemplarze')->count() === 0) {
            DB::table('egzemplarze')->insert($egzemplarze);
        }

        // ── Konto admina + testowy klient ───────────────────────────────
        DB::table('uzytkownicy')->insertOrIgnore([
            'firstName'  => 'Admin',
            'lastName'   => 'System',
            'email'      => 'admin@kioskIT.pl',
            'password'   => Hash::make('Admin1234!'),
            'role'       => 'admin',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('uzytkownicy')->insertOrIgnore([
            'firstName'  => 'Jan',
            'lastName'   => 'Kowalski',
            'email'      => 'jan.kowalski@test.pl',
            'password'   => Hash::make('Test1234!'),
            'role'       => 'klient',
            'phone'      => '600 100 200',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ── Kategorie ───────────────────────────────────────────────────
        $kategorie = [
            ['id_kategorii' => 1,  'nazwa' => 'Laptopy',     'id_rodzica' => null],
            ['id_kategorii' => 2,  'nazwa' => 'Drony',       'id_rodzica' => null],
            ['id_kategorii' => 3,  'nazwa' => 'Aparaty',     'id_rodzica' => null],
            ['id_kategorii' => 4,  'nazwa' => 'Projektory',  'id_rodzica' => null],
            ['id_kategorii' => 5,  'nazwa' => 'Tablety',     'id_rodzica' => null],
            ['id_kategorii' => 6,  'nazwa' => 'Akcesoria',   'id_rodzica' => null],
            ['id_kategorii' => 10, 'nazwa' => 'Laptopy biznesowe',  'id_rodzica' => 1],
            ['id_kategorii' => 11, 'nazwa' => 'Laptopy gamingowe',  'id_rodzica' => 1],
            ['id_kategorii' => 20, 'nazwa' => 'Drony fotograficzne','id_rodzica' => 2],
            ['id_kategorii' => 30, 'nazwa' => 'Aparaty bezlusterkowe','id_rodzica' => 3],
        ];

        foreach ($kategorie as $k) {
            DB::table('kategorie_sprzetu')->insertOrIgnore($k);
        }

        // ── Powiązania modeli z kategoriami ─────────────────────────────
        $katModele = [
            ['id_kategorii' => 1,  'id_modelu' => 1],
            ['id_kategorii' => 10, 'id_modelu' => 1],
            ['id_kategorii' => 1,  'id_modelu' => 2],
            ['id_kategorii' => 10, 'id_modelu' => 2],
            ['id_kategorii' => 1,  'id_modelu' => 3],
            ['id_kategorii' => 1,  'id_modelu' => 4],
            ['id_kategorii' => 10, 'id_modelu' => 4],
            ['id_kategorii' => 2,  'id_modelu' => 5],
            ['id_kategorii' => 20, 'id_modelu' => 5],
            ['id_kategorii' => 2,  'id_modelu' => 6],
            ['id_kategorii' => 20, 'id_modelu' => 6],
            ['id_kategorii' => 3,  'id_modelu' => 7],
            ['id_kategorii' => 30, 'id_modelu' => 7],
            ['id_kategorii' => 3,  'id_modelu' => 8],
            ['id_kategorii' => 30, 'id_modelu' => 8],
            ['id_kategorii' => 4,  'id_modelu' => 9],
            ['id_kategorii' => 5,  'id_modelu' => 10],
            ['id_kategorii' => 6,  'id_modelu' => 11],
            ['id_kategorii' => 6,  'id_modelu' => 12],
            ['id_kategorii' => 6,  'id_modelu' => 13],
            ['id_kategorii' => 1,  'id_modelu' => 14],
            ['id_kategorii' => 10, 'id_modelu' => 14],
            ['id_kategorii' => 1,  'id_modelu' => 15],
            ['id_kategorii' => 11, 'id_modelu' => 15],
        ];

        foreach ($katModele as $km) {
            DB::table('kategorie_modele')->insertOrIgnore($km);
        }

        $this->command->info('✅ Seeder zakończony — baza wypełniona danymi testowymi.');
    }
}