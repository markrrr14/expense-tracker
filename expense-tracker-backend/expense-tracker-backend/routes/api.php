<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BudgetController;
use App\Http\Controllers\ExpenseController;
use Illuminate\Support\Facades\Route;

Route::bind('expense', fn (string $value) => request()->user()->expenses()->findOrFail($value));

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/summary', [ExpenseController::class, 'summary']);
    Route::put('/budget', [BudgetController::class, 'update']);
    Route::apiResource('expenses', ExpenseController::class)->except('show');
});
