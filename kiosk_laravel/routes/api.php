<?php

use App\Http\Controllers\SprzetController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\UlubioneController;
use App\Http\Controllers\UzytkownikController;
use App\Http\Controllers\KaryController;
use App\Http\Controllers\SerwisController;
use App\Http\Controllers\AdresController;
use App\Http\Controllers\OpiniaController;
use Illuminate\Support\Facades\Route;

// ─── Publiczne (bez tokenu) ───────────────────────────────────────────────

Route::get('/sprzet',              [SprzetController::class, 'index']);
Route::get('/sprzet/{id}',         [SprzetController::class, 'show']);
Route::get('/kategorie',           [SprzetController::class, 'kategorie']);
Route::post('/check-availability', [SprzetController::class, 'checkAvailability']);
Route::get('/booked-dates/{id}',   [SprzetController::class, 'getBookedDates']);

// Opinie do odczytu są publiczne — klient może zobaczyć recenzje bez logowania
Route::get('/opinie/{id}',         [OpiniaController::class, 'index']);

// Logowanie z throttle — max 10 prób/min chroni przed atakami słownikowymi
Route::post('/logowanie',   [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/rejestracja', [AuthController::class, 'register']);

// Finalizacja dla gości — bez tokenu, $request->user() === null w kontrolerze
// Zalogowany używa /finalizuj-auth żeby Sanctum na pewno zidentyfikował usera
Route::post('/finalizuj', [SprzetController::class, 'finalize']);

// ─── Chronione tokenem Sanctum ────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Profil i sesja
    Route::get('/mnie',              [AuthController::class,      'me']);
    Route::put('/mnie',              [UzytkownikController::class, 'update']);
    Route::post('/wylogowanie',      [AuthController::class,      'logout']);
    Route::post('/zmien-haslo',      [AuthController::class,      'changePassword']);
    Route::get('/moje-wypozyczenia', [UzytkownikController::class,'myRentals']);

    // Finalizacja dla zalogowanych — token w nagłówku identyfikuje użytkownika
    Route::post('/finalizuj-auth',   [SprzetController::class,    'finalize']);

    // Opinie — tylko zalogowani mogą wystawiać recenzje
    Route::post('/opinie',           [OpiniaController::class,    'store']);

    // Ulubione
    Route::get('/ulubione',          [UlubioneController::class,  'index']);
    Route::post('/ulubione',         [UlubioneController::class,  'store']);
    Route::delete('/ulubione/{id}',  [UlubioneController::class,  'destroy']);

    // Adresy użytkownika
    Route::get('/adresy',                 [AdresController::class, 'index']);
    Route::post('/adresy',                [AdresController::class, 'store']);
    Route::delete('/adresy/{id}',         [AdresController::class, 'destroy']);
    Route::patch('/adresy/{id}/domyslny', [AdresController::class, 'ustawDomyslny']);

    // Panel admina — IsAdmin weryfikuje role === 'admin' po Sanctum
    Route::middleware('App\Http\Middleware\IsAdmin')->prefix('admin')->group(function () {

        // Dashboard
        Route::get('/stats',                  [AdminController::class,  'getDashboardStats']);

        // Użytkownicy
        Route::get('/users',                  [AdminController::class,  'getAllUsers']);
        Route::patch('/users/{id}/role',      [AdminController::class,  'updateUserRole']);
        Route::delete('/users/{id}',          [AdminController::class,  'deleteUser']);

        // Sprzęt
        Route::get('/modele',                 [AdminController::class,  'getModels']);
        Route::get('/equipment',              [AdminController::class,  'getEquipmentList']);
        Route::post('/equipment',             [AdminController::class,  'createEquipment']);
        Route::patch('/equipment/{id}',       [AdminController::class,  'updateEquipment']);
        Route::delete('/equipment/{id}',      [AdminController::class,  'deleteEquipment']);
        Route::patch('/sprzet/{id}/status',   [SprzetController::class, 'zmienStatus']);

        // Wypożyczenia
        Route::get('/rentals',                [AdminController::class,  'getAllRentals']);
        Route::patch('/rentals/{id}',         [AdminController::class,  'updateRentalStatus']);

        // Serwis
        Route::get('/serwis',                 [SerwisController::class, 'index']);
        Route::post('/serwis/zglos',          [SerwisController::class, 'zglos']);
        Route::patch('/serwis/{id}/przywroc', [SerwisController::class, 'przywroc']);

        // Kary
        Route::get('/kary',                   [KaryController::class,   'index']);
        Route::get('/kary/rodzaje',           [KaryController::class,   'rodzaje']);
        Route::post('/kary',                  [KaryController::class,   'store']);
        Route::patch('/kary/{id}/oplacona',   [KaryController::class,   'oplacona']);
    });
});