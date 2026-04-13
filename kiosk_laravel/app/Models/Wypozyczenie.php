<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Model wypożyczenia — główna transakcja systemu.
 *
 * Schemat powiązań:
 *   wypozyczenia ──→ szczegoly_wypozyczenia ──→ egzemplarze
 *                ──→ uzytkownicy (zalogowany) LUB klienci (gość)
 *
 * Wypożyczenie należy do zarejestrowanego użytkownika (id_uzytkownika)
 * lub do gościa (id_klienta) — nigdy do obu jednocześnie.
 */
class Wypozyczenie extends Model
{
    protected $table      = 'wypozyczenia';
    protected $primaryKey = 'id_wypozyczenia';

    protected $fillable = [
        'id_klienta',
        'id_uzytkownika',
        'planowana_data_zwrotu',
        'status_transakcji',
    ];

    protected $casts = [
        'data_wydania'          => 'datetime',
        'planowana_data_zwrotu' => 'datetime',
    ];

    public function uzytkownik(): BelongsTo
    {
        return $this->belongsTo(Uzytkownik::class, 'id_uzytkownika', 'id');
    }

    public function szczegoly(): HasMany
    {
        return $this->hasMany(SzczegolyWypozyczenia::class, 'id_wypozyczenia', 'id_wypozyczenia');
    }

    public function jest_aktywne(): bool
    {
        return $this->status_transakcji === 'Trwa';
    }
}