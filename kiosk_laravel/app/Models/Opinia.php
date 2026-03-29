<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model opinii — recenzja wystawiana przez klienta dla egzemplarza sprzętu.
 *
 * Klucz unikalny (id_egzemplarza, id_uzytkownika) w tabeli opinie
 * gwarantuje że jeden użytkownik może ocenić dany egzemplarz tylko raz.
 */
class Opinia extends Model
{
    protected $table      = 'opinie';
    protected $primaryKey = 'id_opinii';

    public $timestamps = false;

    protected $fillable = [
        'id_egzemplarza',
        'id_uzytkownika',
        'ocena',
        'tresc',
        'created_at',
    ];

    protected $casts = [
        'ocena'      => 'integer',
        'created_at' => 'datetime',
    ];

    public function egzemplarz(): BelongsTo
    {
        return $this->belongsTo(Egzemplarz::class, 'id_egzemplarza', 'id_egzemplarza');
    }

    public function uzytkownik(): BelongsTo
    {
        return $this->belongsTo(Uzytkownik::class, 'id_uzytkownika', 'id');
    }
}