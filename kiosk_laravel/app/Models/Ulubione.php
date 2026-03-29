<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model ulubionych — lista obserwowanych egzemplarzy użytkownika.
 * Klucz unikalny (uzytkownik_id, sprzet_id) w DB zapobiega duplikatom.
 */
class Ulubione extends Model
{
    protected $table      = 'ulubione';
    protected $primaryKey = 'id';
    public    $timestamps = false;

    protected $fillable = ['uzytkownik_id', 'sprzet_id', 'created_at'];

    public function uzytkownik(): BelongsTo
    {
        return $this->belongsTo(Uzytkownik::class, 'uzytkownik_id', 'id');
    }

    public function egzemplarz(): BelongsTo
    {
        return $this->belongsTo(Egzemplarz::class, 'sprzet_id', 'id_egzemplarza');
    }
}