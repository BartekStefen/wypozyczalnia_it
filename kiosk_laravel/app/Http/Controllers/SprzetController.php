<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SprzetController extends Controller
{
    public function index()
    {
        // Łączymy tabelę egzemplarze z modele_sprzetu z bazą kiosk_it
        $sprzet = DB::table('egzemplarze')
            ->join('modele_sprzetu', 'egzemplarze.id_modelu', '=', 'modele_sprzetu.id_modelu')
            ->select('egzemplarze.*', 'modele_sprzetu.marka', 'modele_sprzetu.nazwa_modelu')
            ->get();

        // Zwracamy surowe dane w formacie JSON
        return response()->json($sprzet);
    }
}