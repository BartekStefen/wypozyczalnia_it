<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware sprawdzający czy zalogowany użytkownik ma rolę 'admin'.
 * Używany na grupie tras /api/admin/*.
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