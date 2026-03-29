<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model nałożonej kary finansowej.
 * Powiązana zarówno z wypożyczeniem jak i bezpośrednio z użytkownikiem
 * — ułatwia agregację długów klienta bez JOIN przez wypożyczenia.
 */
class NaliczoneKary extends Model
{
    protected $table      = 'naliczone_kary';
    protected $primaryKey = 'id_szczegolow';
    public    $timestamps = false;

    protected $fillable = [
        'id_szczegolow',
        'id_rodzaju',
        'id_uzytkownika',
        'id_wypozyczenia',
        'ostateczna_kwota',
        'opis',
        'czy_oplacona',
        'email_wyslany',
        'created_at',
    ];

    protected $casts = [
        'ostateczna_kwota' => 'decimal:2',
        'czy_oplacona'     => 'boolean',
        'email_wyslany'    => 'boolean',
        'created_at'       => 'datetime',
    ];

    public function uzytkownik(): BelongsTo
    {
        return $this->belongsTo(Uzytkownik::class, 'id_uzytkownika', 'id');
    }

    public function rodzaj(): BelongsTo
    {
        return $this->belongsTo(RodzajKary::class, 'id_rodzaju', 'id_rodzaju');
    }

    public function wypozyczenie(): BelongsTo
    {
        return $this->belongsTo(Wypozyczenie::class, 'id_wypozyczenia', 'id_wypozyczenia');
    }
}