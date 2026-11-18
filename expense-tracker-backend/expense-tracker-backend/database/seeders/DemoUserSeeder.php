<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoUserSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'demo@example.com'],
            [
                'name' => 'Demo User',
                'password' => Hash::make('password123'),
                'monthly_budget' => 15000,
            ],
        );

        if ($user->expenses()->exists()) {
            return;
        }

        $samples = [
            ['amount' => 320.00, 'category' => 'Food', 'note' => 'Lunch at canteen', 'days_ago' => 0],
            ['amount' => 150.00, 'category' => 'Transport', 'note' => 'Jeepney fare', 'days_ago' => 0],
            ['amount' => 1200.00, 'category' => 'School', 'note' => 'Notebooks and pens', 'days_ago' => 1],
            ['amount' => 2500.00, 'category' => 'Bills', 'note' => 'Electricity bill', 'days_ago' => 3],
            ['amount' => 899.00, 'category' => 'Shopping', 'note' => 'New shoes', 'days_ago' => 5],
            ['amount' => 480.00, 'category' => 'Health', 'note' => 'Vitamins', 'days_ago' => 7],
            ['amount' => 210.00, 'category' => 'Food', 'note' => 'Coffee and snacks', 'days_ago' => 9],
            ['amount' => 650.00, 'category' => 'Others', 'note' => 'Birthday gift', 'days_ago' => 12],
        ];

        foreach ($samples as $sample) {
            $user->expenses()->create([
                'amount' => $sample['amount'],
                'category' => $sample['category'],
                'date' => now()->subDays($sample['days_ago'])->toDateString(),
                'note' => $sample['note'],
            ]);
        }
    }
}
