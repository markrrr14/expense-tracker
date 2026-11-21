<?php

use Illuminate\Support\Facades\Route;

$spa = function () {
    $index = public_path('spa/index.html');

    return is_file($index) ? response()->file($index) : view('welcome');
};

Route::get('/', $spa);

Route::get('/{any}', function () {
    $index = public_path('spa/index.html');

    abort_unless(is_file($index), 404);

    return response()->file($index);
})->where('any', '(?!api(?:/|$)|up(?:/|$)|storage(?:/|$)).*');
