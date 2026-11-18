<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ExpenseApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_and_login_return_a_token(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Juan Dela Cruz',
            'email' => 'juan@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated()->assertJsonStructure(['user' => ['id', 'name', 'email'], 'token']);

        $this->postJson('/api/login', [
            'email' => 'juan@example.com',
            'password' => 'password123',
        ])->assertOk()->assertJsonStructure(['user', 'token']);

        $this->postJson('/api/login', [
            'email' => 'JUAN@EXAMPLE.COM',
            'password' => 'password123',
        ])->assertOk()->assertJsonStructure(['user', 'token']);

        $this->postJson('/api/login', [
            'email' => 'juan@example.com',
            'password' => 'wrong-password',
        ])->assertUnprocessable();
    }

    public function test_expense_crud_and_monthly_summary(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $created = $this->postJson('/api/expenses', [
            'amount' => 250.50,
            'category' => 'Food',
            'date' => '2026-11-16',
            'note' => 'Lunch',
        ])->assertCreated()->assertJsonPath('date', '2026-11-16')->json();

        $this->getJson('/api/expenses?month=2026-11')->assertOk()->assertJsonCount(1);
        $this->getJson('/api/expenses?month=2026-12')->assertOk()->assertJsonCount(0);

        $this->getJson('/api/summary?month=2026-11')
            ->assertOk()
            ->assertJsonPath('total', 250.5)
            ->assertJsonPath('transactions', 1)
            ->assertJsonPath('average_per_day', 250.5)
            ->assertJsonPath('by_category.0.category', 'Food');

        $this->putJson('/api/expenses/'.$created['id'], [
            'amount' => 300,
            'category' => 'Food',
            'date' => '2026-11-16',
            'note' => 'Lunch (edited)',
        ])->assertOk()->assertJsonPath('amount', 300)->assertJsonPath('date', '2026-11-16');

        $this->deleteJson('/api/expenses/'.$created['id'])->assertOk();
        $this->getJson('/api/expenses?month=2026-11')->assertJsonCount(0);
    }

    public function test_users_cannot_touch_each_others_expenses(): void
    {
        $owner = User::factory()->create();
        $expense = $owner->expenses()->create([
            'amount' => 100,
            'category' => 'Food',
            'date' => '2026-11-16',
            'note' => 'Private',
        ]);

        Sanctum::actingAs(User::factory()->create());

        $this->putJson('/api/expenses/'.$expense->id, [
            'amount' => 200,
            'category' => 'Food',
            'date' => '2026-11-16',
        ])->assertNotFound();

        $this->deleteJson('/api/expenses/'.$expense->id)->assertNotFound();
        $this->assertDatabaseHas('expenses', ['id' => $expense->id, 'amount' => 100]);
    }

    public function test_budget_is_saved_and_validation_is_enforced(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->putJson('/api/budget', ['monthly_budget' => 5000])
            ->assertOk()
            ->assertJsonPath('monthly_budget', 5000);

        $this->assertSame(5000.0, $user->fresh()->monthly_budget);

        $this->postJson('/api/expenses', [
            'amount' => 0,
            'category' => 'Food',
            'date' => '2026-11-16',
        ])->assertUnprocessable()->assertJsonValidationErrors('amount');

        $this->postJson('/api/expenses', [
            'amount' => 100,
            'category' => 'NotARealCategory',
            'date' => '2026-11-16',
        ])->assertUnprocessable()->assertJsonValidationErrors('category');
    }
}
