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
        // Get user by ID logic here
    });
    Route::get('/kiosks', [ApiController::class, 'getKiosks']);
    Route::get('/rewards', [ApiController::class, 'getRewards']);
    
    // Add other routes here (transactions, analytics, etc.)
});
