<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Model użytkownika — dziedziczy po Authenticatable (nie po Model).
 *
 * Authenticatable dostarcza metody wymagane przez Laravel Auth:
 *   getAuthIdentifier(), getAuthPassword(), getRememberToken() itd.
 *
 * Bez Authenticatable Sanctum nie może poprawnie powiązać tokenu
 * z użytkownikiem przy weryfikacji żądań auth:sanctum.
 *
 * HasApiTokens — trait Sanctum dodający createToken(), tokens() i currentAccessToken().
 * Notifiable — umożliwia wysyłanie powiadomień e-mail (np. o karze).
 */
class Uzytkownik extends Authenticatable
{
    use HasApiTokens, Notifiable;

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

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relacja: jeden użytkownik → wiele wypożyczeń (przez id_uzytkownika)
    public function wypozyczenia(): HasMany
    {
        return $this->hasMany(Wypozyczenie::class, 'id_uzytkownika', 'id');
    }

    // Relacja: jeden użytkownik → wiele rekordów wynajmu (kalendarza rezerwacji)
    public function wynajmy(): HasMany
    {
        return $this->hasMany(Wynajem::class, 'id_uzytkownika', 'id');
    }

    // Relacja: jeden użytkownik → wiele ulubionych egzemplarzy
    public function ulubione(): HasMany
    {
        return $this->hasMany(Ulubione::class, 'uzytkownik_id', 'id');
    }

    // Relacja: jeden użytkownik → wiele naliczonych kar
    public function kary(): HasMany
    {
        return $this->hasMany(NaliczoneKary::class, 'id_uzytkownika', 'id');
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function getFullNameAttribute(): string
    {
        return trim("{$this->firstName} {$this->lastName}");
    }
}