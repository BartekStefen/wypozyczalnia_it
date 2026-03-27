<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class Uzytkownik extends Model
{
    use HasApiTokens;

    protected $table = 'uzytkownicy';

    protected $fillable = [
        'imie',
        'nazwisko',
        'email',
        'haslo',
        'telefon',
        'rola',
    ];

    protected $hidden = ['haslo'];

    // Mapowanie dla Sanctum — Laravel szuka pola 'password' przy uwierzytelnianiu
    public function getAuthPassword(): string
    {
        return $this->haslo;
    }
}