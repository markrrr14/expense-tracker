<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    // PUT /api/budget  { "monthly_budget": 5000 }
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'monthly_budget' => 'required|numeric|min:0|max:99999999',
        ]);

        $request->user()->update($data);

        return response()->json(['monthly_budget' => $request->user()->monthly_budget]);
    }
}
