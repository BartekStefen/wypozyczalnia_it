<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Model wzorca sprzętu — przechowuje markę i nazwę modelu.
 * Jeden wzorzec może mieć wiele egzemplarzy (fizycznych sztuk).
 */
class ModelSprzetu extends Model
{
    protected $table      = 'modele_sprzetu';
    protected $primaryKey = 'id_modelu';
    public    $timestamps = false;

    protected $fillable = ['marka', 'nazwa_modelu'];

    // Wszystkie fizyczne egzemplarze tego modelu w systemie
    public function egzemplarze(): HasMany
    {
        return $this->hasMany(Egzemplarz::class, 'id_modelu', 'id_modelu');
    }
}