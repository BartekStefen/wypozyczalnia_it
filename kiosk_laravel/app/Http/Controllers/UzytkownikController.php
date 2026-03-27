<?php
// ─── UzytkownikController.php ─────────────────────────────────────────────
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UzytkownikController extends Controller
{
    public function show(Request $request)
    {
        return response()->json($request->user());
    }

    public function update(Request $request)
    {
        $request->validate([
            'imie'     => 'sometimes|string|max:100',
            'nazwisko' => 'sometimes|string|max:100',
            'email'    => 'sometimes|email|unique:uzytkownicy,email,' . $request->user()->id,
            'telefon'  => 'sometimes|nullable|string|max:20',
        ]);

        $request->user()->update($request->only(['imie', 'nazwisko', 'email', 'telefon']));

        return response()->json($request->user()->fresh());
    }

    public function mojeWypozyczenia(Request $request)
    {
        $uzytkownik = $request->user();

        $wypozyczenia = DB::table('wypozyczenia')
            ->join('szczegoly_wypozyczenia', 'wypozyczenia.id', '=', 'szczegoly_wypozyczenia.id_wypozyczenia')
            ->join('egzemplarze', 'szczegoly_wypozyczenia.id_egzemplarza', '=', 'egzemplarze.id_egzemplarza')
            ->join('modele_sprzetu', 'egzemplarze.id_modelu', '=', 'modele_sprzetu.id_modelu')
            ->where('wypozyczenia.id_uzytkownika', $uzytkownik->id)
            ->select(
                DB::raw("CONCAT('ZAM-', wypozyczenia.id) as id"),
                DB::raw("CONCAT(modele_sprzetu.marka, ' ', modele_sprzetu.nazwa_modelu) as produkt"),
                'wypozyczenia.status_transakcji as status',
                DB::raw('DATE(wypozyczenia.created_at) as dataOd'),
                'wypozyczenia.planowana_data_zwrotu as dataDo',
                DB::raw("CONCAT(szczegoly_wypozyczenia.koszt_pozycji, ' zł') as kwota")
            )
            ->orderByDesc('wypozyczenia.id')
            ->get();

        return response()->json($wypozyczenia);
    }
}