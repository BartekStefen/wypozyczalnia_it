<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

/**
 * Model użytkownika systemu Kiosk IT.
 * Mapuje tabelę `uzytkownicy` z angielskimi kolumnami.
 * Implementuje HasApiTokens dla autoryzacji przez Sanctum.
 */
class Uzytkownik extends Model
{
    use HasApiTokens;

    protected $table      = 'uzytkownicy';
    protected $primaryKey = 'id';

    protected $fillable = [
        'firstName',
        'lastName',
        'email',
        'password',
        'phone',
        'role',
    ];

    // Ukryj wrażliwe pola w odpowiedziach JSON
    protected $hidden = ['password'];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Sanctum wymaga metody getAuthPassword() jeśli kolumna != 'password'
    // Tu kolumna to 'password' więc domyślna implementacja działa poprawnie.

    // Relacja: jeden użytkownik → wiele wypożyczeń
    public function wypozyczenia(): HasMany
    {
        return $this->hasMany(\Illuminate\Support\Facades\DB::table('wypozyczenia'), 'id_uzytkownika', 'id');
    }

    // Relacja: jeden użytkownik → wiele ulubionych
    public function ulubione(): HasMany
    {
        return $this->hasMany(Ulubione::class, 'uzytkownik_id', 'id');
    }

    // Sprawdza czy użytkownik ma rolę admina
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    // Zwraca pełne imię i nazwisko
    public function getFullNameAttribute(): string
    {
        return trim("{$this->firstName} {$this->lastName}");
    }
}