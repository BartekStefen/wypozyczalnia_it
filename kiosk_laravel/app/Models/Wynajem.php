<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model wynajmu — blok kalendarza rezerwacji egzemplarza.
 *
 * Tabela `wynajmy` służy wyłącznie do sprawdzania dostępności dat —
 * nie zastępuje wypozyczenia, tylko blokuje termin.
 *
 * Przepływ tworzenia:
 *   finalize() → INSERT wypozyczenia → INSERT wynajmy (blokada) → UPDATE egzemplarze.status
 *
 * Przy anulowaniu lub zakończeniu:
 *   updateRentalStatus() → wynajmy.status = 'Anulowany' → egzemplarze.status = 'Dostępny'
 */
class Wynajem extends Model
{
    protected $table    = 'wynajmy';
    protected $primaryKey = 'id';

    protected $fillable = [
        'id_egzemplarza',
        'id_uzytkownika',
        'data_start',
        'data_koniec',
        'cena_calkowita',
        'status',
    ];

    protected $casts = [
        'data_start'  => 'date',
        'data_koniec' => 'date',
    ];

    // Egzemplarz którego termin jest zablokowany
    public function egzemplarz(): BelongsTo
    {
        return $this->belongsTo(Egzemplarz::class, 'id_egzemplarza', 'id_egzemplarza');
    }

    // Użytkownik który dokonał rezerwacji (null dla gości)
    public function uzytkownik(): BelongsTo
    {
        return $this->belongsTo(Uzytkownik::class, 'id_uzytkownika', 'id');
    }

    /**
     * Sprawdza kolizję terminu — używana w SprzetController::finalize()
     * i checkAvailability() zamiast duplikowania logiki SQL.
     *
     * Trzy przypadki kolizji (A = istniejąca, B = nowa):
     *   1. data_start B wpada w zakres A
     *   2. data_koniec B wpada w zakres A
     *   3. B całkowicie obejmuje A (A jest wewnątrz B)
     */
    public static function czyKolizja(int $idEgzemplarza, string $start, string $koniec): bool
    {
        return self::where('id_egzemplarza', $idEgzemplarza)
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
}