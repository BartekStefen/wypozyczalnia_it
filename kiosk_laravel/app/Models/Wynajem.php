<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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

    // Relacja do egzemplarza sprzętu
    public function egzemplarz(): BelongsTo
    {
        return $this->belongsTo(Egzemplarz::class, 'id_egzemplarza', 'id_egzemplarza');
    }

    // Relacja do użytkownika (null jeśli gość)
    public function uzytkownik(): BelongsTo
    {
        return $this->belongsTo(Uzytkownik::class, 'id_uzytkownika', 'id');
    }

    // Sprawdza czy wynajem koliduje z podanym zakresem dat
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