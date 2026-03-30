<?php

/**
 * Konfiguracja Laravel Sanctum — config/sanctum.php
 *
 * Sanctum obsługuje dwa tryby uwierzytelniania:
 *
 * 1. Token-based (używamy): token Bearer w nagłówku Authorization.
 *    Frontend przechowuje token w localStorage i dołącza go do każdego żądania.
 *    Odpowiedni dla SPA na osobnej domenie i aplikacji mobilnych.
 *
 * 2. Cookie-based (session): wymaga CSRF cookie i stateful middleware.
 *    Używany gdy front i back są na tej samej domenie.
 *
 * W tym projekcie używamy trybu tokenowego — SANCTUM_STATEFUL_DOMAINS
 * dotyczy tylko trybu cookie i można je pominąć, ale zostawiamy dla kompletności.
 */

use Laravel\Sanctum\Sanctum;

return [

    // Domeny które mogą używać autentykacji cookie (session-based)
    // Nie dotyczy autentykacji tokenowej używanej w tym projekcie
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s%s',
        'localhost,localhost:5173,localhost:3000,127.0.0.1,127.0.0.1:5173',
        env('APP_URL') ? ',' . parse_url(env('APP_URL'), PHP_URL_HOST) : ''
    ))),

    // Grupy middleware — kolejność ma znaczenie dla wydajności
    'guard' => ['web'],

    // Czas wygaśnięcia tokenów w minutach (null = nie wygasają)
    // W produkcji ustaw np. 60*24*7 = 10080 (7 dni)
    'expiration' => null,

    // Model tokenu — można podmienić na własny
    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    // Middleware stosowane do tras Sanctum
    'middleware' => [
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
        'encrypt_cookies'      => Illuminate\Cookie\Middleware\EncryptCookies::class,
        'validate_csrf_token'  => Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ],

];