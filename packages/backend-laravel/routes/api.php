<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ApiController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application.
|
*/

// Auth routes
Route::post('/auth/login', [ApiController::class, 'login']);

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/users', [ApiController::class, 'getUsers']);
    Route::get('/users/{id}', function ($id) {
        $user = \App\Models\User::where('userId', $id)->orWhere('id', $id)->first();
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }
        return response()->json($user);
    });
    Route::get('/kiosks', [ApiController::class, 'getKiosks']);
    Route::get('/rewards', [ApiController::class, 'getRewards']);
    
    // Add other routes here (transactions, analytics, etc.)
});
