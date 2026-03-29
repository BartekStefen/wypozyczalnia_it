<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware IsAdmin — chroni trasy panelu administratora.
 *
 * Sprawdza pole `role` w tabeli uzytkownicy po autoryzacji przez Sanctum.
 * Jeśli użytkownik nie ma roli 'admin' lub nie jest zalogowany → 403.
 *
 * Middleware działa TYLKO wewnątrz grupy auth:sanctum — token jest już
 * zweryfikowany zanim ten middleware dostanie żądanie.
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