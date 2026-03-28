<?php

use App\Http\Controllers\SprzetController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UlubioneController;
use App\Http\Controllers\UzytkownikController;
use Illuminate\Support\Facades\Route;

// ─── Sprzęt (publiczne) ────────────────────────────────────────────────────
Route::get('/sprzet',      [SprzetController::class, 'index']);
Route::get('/sprzet/{id}', [SprzetController::class, 'show']);

// ─── Kategorie (publiczne) ─────────────────────────────────────────────────
Route::get('/kategorie', [SprzetController::class, 'kategorie']);

// ─── Autoryzacja (publiczne) ───────────────────────────────────────────────
Route::post('/logowanie',   [AuthController::class, 'login']);
Route::post('/rejestracja', [AuthController::class, 'register']); // Zmieniono na 'register'

// ─── Zamówienia gości (publiczne) ──────────────────────────────────────────
Route::post('/finalizuj', [SprzetController::class, 'finalize']);

// ─── Chronione (wymaga tokenu) ─────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Profil
    Route::get('/mnie',  [UzytkownikController::class, 'show']);
    Route::put('/mnie',  [UzytkownikController::class, 'update']);
    Route::post('/wylogowanie', [AuthController::class, 'logout']); // Zmieniono na 'logout'
    Route::post('/zmien-haslo', [AuthController::class, 'changePassword']); // Zmieniono na 'changePassword'

    // Historia wypożyczeń zalogowanego użytkownika
    Route::get('/moje-wypozyczenia', [UzytkownikController::class, 'mojeWypozyczenia']);

    // Ulubione
    Route::get('/ulubione',         [UlubioneController::class, 'index']);
    Route::post('/ulubione',        [UlubioneController::class, 'store']);
    Route::delete('/ulubione/{id}', [UlubioneController::class, 'destroy']);

    // Admin
    Route::middleware('can:admin')->group(function () {
        Route::get('/admin/wypozyczenia',              [SprzetController::class, 'wszystkieWypozyczenia']);
        Route::patch('/admin/sprzet/{id}/status',      [SprzetController::class, 'zmienStatus']);
    });
});