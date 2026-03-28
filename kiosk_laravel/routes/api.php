<?php

use App\Http\Controllers\SprzetController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\UlubioneController;
use App\Http\Controllers\UzytkownikController;
use Illuminate\Support\Facades\Route;

// ─── Publiczne ────────────────────────────────────────────────────────────
Route::get('/sprzet',                [SprzetController::class, 'index']);
Route::get('/sprzet/{id}',           [SprzetController::class, 'show']);
Route::get('/kategorie',             [SprzetController::class, 'kategorie']);
Route::post('/check-availability',   [SprzetController::class, 'checkAvailability']);
Route::get('/booked-dates/{id}',     [SprzetController::class, 'getBookedDates']);
Route::post('/finalizuj',            [SprzetController::class, 'finalize']);

// ─── Autoryzacja ─────────────────────────────────────────────────────────
Route::post('/rejestracja',  [AuthController::class, 'register']);
Route::post('/logowanie',    [AuthController::class, 'login']);

// ─── Chronione tokenem ───────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/mnie',               [AuthController::class, 'me']);
    Route::put('/mnie',               [UzytkownikController::class, 'update']);
    Route::post('/wylogowanie',       [AuthController::class, 'logout']);
    Route::post('/zmien-haslo',       [AuthController::class, 'changePassword']);
    Route::get('/moje-wypozyczenia',  [UzytkownikController::class, 'myRentals']);
    Route::post('/finalizuj',         [SprzetController::class, 'finalize']);

    Route::get('/ulubione',           [UlubioneController::class, 'index']);
    Route::post('/ulubione',          [UlubioneController::class, 'store']);
    Route::delete('/ulubione/{id}',   [UlubioneController::class, 'destroy']);

    Route::middleware('App\Http\Middleware\IsAdmin')->prefix('admin')->group(function () {
        Route::get('/stats',             [AdminController::class, 'getDashboardStats']);
        Route::get('/users',             [AdminController::class, 'getAllUsers']);
        Route::patch('/users/{id}/role', [AdminController::class, 'updateUserRole']);
        Route::delete('/users/{id}',     [AdminController::class, 'deleteUser']);
        Route::get('/equipment',         [AdminController::class, 'getEquipmentList']);
        Route::post('/equipment',        [AdminController::class, 'createEquipment']);
        Route::patch('/equipment/{id}',  [AdminController::class, 'updateEquipment']);
        Route::delete('/equipment/{id}', [AdminController::class, 'deleteEquipment']);
        Route::get('/rentals',           [AdminController::class, 'getAllRentals']);
        Route::patch('/rentals/{id}',    [AdminController::class, 'updateRentalStatus']);
        Route::patch('/sprzet/{id}/status', [SprzetController::class, 'zmienStatus']);
    });
});