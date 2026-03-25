<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Wynajem extends Model
{
    protected $table = 'wynajmy'; 
    protected $fillable = ['id_egzemplarza', 'data_start', 'data_koniec', 'cena_calkowita', 'status'];
}
