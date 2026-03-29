<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Model egzemplarza sprzętu — reprezentuje fizyczną sztukę urządzenia.
 *
 * Rozróżnienie model/egzemplarz w schemacie:
 *   modele_sprzetu — wzorzec (np. "DJI Mavic 3 Pro")
 *   egzemplarze    — konkretna sztuka z numerem seryjnym i ceną
 *
 * Jeden model może mieć wiele egzemplarzy — np. 3 drony tego samego typu
 * z różnymi numerami seryjnymi i ewentualnie różnymi cenami (różny stan).
 */
class Egzemplarz extends Model
{
    protected $table      = 'egzemplarze';
    protected $primaryKey = 'id_egzemplarza';
    public    $timestamps = false;

    protected $fillable = [
        'id_modelu',
        'numer_seryjny',
        'status',
        'cena_wypozyczenia_dzien',
    ];

    protected $casts = [
        'cena_wypozyczenia_dzien' => 'decimal:2',
    ];

    // Relacja do wzorca produktu (marka, model)
    public function model(): BelongsTo
    {
        return $this->belongsTo(ModelSprzetu::class, 'id_modelu', 'id_modelu');
    }

    // Rezerwacje kalendarza tego egzemplarza
    public function wynajmy(): HasMany
    {
        return $this->hasMany(Wynajem::class, 'id_egzemplarza', 'id_egzemplarza');
    }

    // Opinie wystawione dla tego egzemplarza
    public function opinie(): HasMany
    {
        return $this->hasMany(Opinia::class, 'id_egzemplarza', 'id_egzemplarza');
    }

    // Czy egzemplarz jest aktualnie dostępny do rezerwacji
    public function jest_dostepny(): bool
    {
        return $this->status === 'Dostępny';
    }
}