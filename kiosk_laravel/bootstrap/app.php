<?php

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

        // CORS musi być pierwszy — odpowiada na OPTIONS preflight zanim Sanctum sprawdzi sesję
        $middleware->prepend(\Illuminate\Http\Middleware\HandleCors::class);

        $middleware->alias([
            'auth'     => \Illuminate\Auth\Middleware\Authenticate::class,
            'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
            'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
            'isAdmin'  => \App\Http\Middleware\IsAdmin::class,
        ]);

        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);

    })
    ->withExceptions(function (Exceptions $exceptions) {

        // Wszystkie wyjątki na /api/* wracają jako JSON zamiast strony HTML z błędem
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

        // W trybie debug zwraca szczegóły wyjątku jako JSON — pomocne przy diagnozie
        $exceptions->render(function (\Throwable $e, $request) {
            if ($request->is('api/*') && config('app.debug')) {
                return response()->json([
                    'message' => $e->getMessage(),
                    'file'    => $e->getFile(),
                    'line'    => $e->getLine(),
                ], 500);
            }
        });

    })
    ->create();