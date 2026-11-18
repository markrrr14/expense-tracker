<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ExpenseController extends Controller
{
    // GET /api/expenses?month=2026-11&category=Food&search=lunch
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'month' => 'nullable|date_format:Y-m',
            'category' => ['nullable', Rule::in(Expense::CATEGORIES)],
            'search' => 'nullable|string|max:80',
        ]);

        $query = $request->user()->expenses()
            ->select(['id', 'amount', 'category', 'date', 'note'])
            ->orderByDesc('date')
            ->orderByDesc('id');

        if ($request->filled('month')) {
            $start = Carbon::parse($request->month.'-01');
            $query->whereBetween('date', [$start->toDateString(), $start->copy()->endOfMonth()->toDateString()]);
        }
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }
        if ($request->filled('search')) {
            $query->where('note', 'like', '%'.$request->search.'%');
        }

        return response()->json($query->get());
    }

    // POST /api/expenses
    public function store(Request $request): JsonResponse
    {
        $expense = $request->user()->expenses()->create($this->validated($request));

        return response()->json($expense, 201);
    }

    // PUT/PATCH /api/expenses/{expense}
    public function update(Request $request, Expense $expense): JsonResponse
    {
        $expense->update($this->validated($request));

        return response()->json($expense);
    }

    // DELETE /api/expenses/{expense}
    public function destroy(Expense $expense): JsonResponse
    {
        $expense->delete();

        return response()->json(['message' => 'Deleted']);
    }

    // GET /api/summary?month=2026-11
    public function summary(Request $request): JsonResponse
    {
        $request->validate(['month' => 'required|date_format:Y-m']);

        $start = Carbon::parse($request->month.'-01');
        $range = [$start->toDateString(), $start->copy()->endOfMonth()->toDateString()];
        $query = $request->user()->expenses()->whereBetween('date', $range);

        $totals = (clone $query)
            ->selectRaw('COALESCE(SUM(amount), 0) as total, COUNT(*) as transactions, COUNT(DISTINCT date) as days')
            ->first();

        $total = (float) $totals->total;
        $count = (int) $totals->transactions;
        $days = (int) $totals->days;

        $byCategory = (clone $query)
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => ['category' => $row->category, 'total' => (float) $row->total]);

        $budget = $request->user()->monthly_budget;

        return response()->json([
            'month' => $request->month,
            'total' => $total,
            'transactions' => $count,
            'average_per_day' => $days ? round($total / $days, 2) : 0,
            'by_category' => $byCategory,
            'budget' => $budget,
            'budget_used_percent' => $budget > 0 ? round($total / $budget * 100, 1) : 0,
        ]);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'amount' => 'required|numeric|gt:0|max:99999999',
            'category' => ['required', Rule::in(Expense::CATEGORIES)],
            'date' => 'required|date_format:Y-m-d',
            'note' => 'nullable|string|max:80',
        ]);
    }
}
