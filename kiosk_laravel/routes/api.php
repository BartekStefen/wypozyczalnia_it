<?php

use App\Http\Controllers\SprzetController;
use Illuminate\Support\Facades\Route;

// Pobieranie listy sprzętu dla strony głównej
Route::get('/sprzet', [SprzetController::class, 'index']);

// Pobieranie szczegółów jednego przedmiotu
Route::get('/sprzet/{id}', [SprzetController::class, 'show']);

// Finalizacja zamówienia
Route::post('/finalizuj', [SprzetController::class, 'finalize']);