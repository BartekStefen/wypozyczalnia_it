<?php

/**
 * bootstrap/app.php — punkt startowy aplikacji Laravel.
 *
 * Rejestracja middleware w odpowiedniej kolejności:
 *   1. HandleCors — musi być PRZED każdym innym middleware, żeby
 *      odpowiedź preflight OPTIONS wróciła do przeglądarki natychmiast
 *      bez przetwarzania reszty stosu.
 *
 *   2. EnsureFrontendRequestsAreStateful — Sanctum, dla session-based auth
 *
 *   3. ThrottleRequests — ograniczenie liczby żądań (rate limiting)
 *
 *   4. SubstituteBindings — wiązanie modeli z parametrami tras
 */

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {

        // CORS musi być pierwszy w kolejce — odpowiada na OPTIONS przed Auth
        $middleware->prepend(\Illuminate\Http\Middleware\HandleCors::class);

        // Aliasy middleware używane w api.php
        $middleware->alias([
            'auth'     => \Illuminate\Auth\Middleware\Authenticate::class,
            'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
            'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
        ]);

        // Middleware grupy API (dodawane automatycznie do tras w api.php)
        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);

    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Globalny handler wyjątków — zwraca JSON dla tras API zamiast HTML
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Brak autoryzacji. Zaloguj się.'], 401);
            }
        });

        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Błąd walidacji.',
                    'errors'  => $e->errors(),
                ], 422);
            }
        });

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Zasób nie istnieje.'], 404);
            }
        });
    })
    ->create();