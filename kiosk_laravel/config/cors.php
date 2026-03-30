<?php

/**
 * Konfiguracja CORS dla Laravel — config/cors.php
 *
 * CORS (Cross-Origin Resource Sharing) reguluje które domeny mogą
 * wysyłać żądania do API. W developmencie React działa na porcie 5173,
 * Laravel na 8000 — to różne originy, więc CORS musi je jawnie dopuścić.
 *
 * Z proxy Vite (/api → localhost:8000) przeglądarka widzi jeden origin
 * (localhost:5173) i nie wysyła żądań CORS. Konfiguracja poniżej jest
 * potrzebna gdy frontend jest na osobnej domenie (np. produkcja).
 *
 * Wymaganie: HandleCors middleware musi być w bootstrap/app.php lub Kernel.php
 */

return [

    // Trasy API objęte polityką CORS
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    // Metody HTTP dozwolone z innych originów
    'allowed_methods' => ['*'],

    // Dozwolone originy — w produkcji zastąp konkretną domeną frontendu
    'allowed_origins' => [
        'http://localhost:5173',    // React dev server (Vite)
        'http://localhost:3000',    // alternatywny port dev
        'http://127.0.0.1:5173',
        // 'https://kioskIT.pl',    // produkcja — odkomentuj i dodaj swoją domenę
    ],

    // Wzorce originów (opcjonalnie, zamiast listy powyżej)
    'allowed_origins_patterns' => [],

    // Nagłówki dozwolone w żądaniu
    'allowed_headers' => ['*'],

    // Nagłówki eksponowane klientowi (np. paginacja)
    'exposed_headers' => ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],

    // Cache preflight w sekundach
    'max_age' => 3600,

    // Credentials (cookies, Authorization header) — wymagane przez Sanctum
    'supports_credentials' => true,

];