<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware IsAdmin — chroni trasy panelu administratora.
 *
 * Działa wyłącznie wewnątrz grupy auth:sanctum — token Sanctum jest już
 * zweryfikowany zanim to middleware dostanie żądanie. Tu sprawdzamy tylko
 * czy zalogowany użytkownik ma rolę 'admin' w tabeli uzytkownicy.
 */
class IsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || $user->role !== 'admin') {
            return response()->json([
                'message' => 'Brak uprawnień. Dostęp tylko dla administratorów.'
            ], 403);
        }

        return $next($request);
    }
}