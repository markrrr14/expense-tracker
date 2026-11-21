-- Optional demo data. Import AFTER schema.sql.
-- Login: demo@example.com / password123

INSERT INTO `users` (`name`, `email`, `password`, `monthly_budget`, `created_at`, `updated_at`)
SELECT 'Demo User', 'demo@example.com',
       '$2y$12$.BeALutBZakccUniKNPjROOY7jHSjjVlCk9NprS4YYMkKsIKsmnwq',
       15000.00, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `users` WHERE `email` = 'demo@example.com');

INSERT INTO `expenses` (`user_id`, `amount`, `category`, `date`, `note`, `created_at`, `updated_at`)
SELECT u.id, x.amount, x.category, DATE_SUB(CURDATE(), INTERVAL x.days_ago DAY), x.note, NOW(), NOW()
FROM `users` u
JOIN (
    SELECT 320.00 AS amount, 'Food' AS category, 'Lunch at canteen' AS note, 0 AS days_ago
    UNION ALL SELECT 150.00, 'Transport', 'Jeepney fare', 0
    UNION ALL SELECT 1200.00, 'School', 'Notebooks and pens', 1
    UNION ALL SELECT 2500.00, 'Bills', 'Electricity bill', 3
    UNION ALL SELECT 899.00, 'Shopping', 'New shoes', 5
    UNION ALL SELECT 480.00, 'Health', 'Vitamins', 7
    UNION ALL SELECT 210.00, 'Food', 'Coffee and snacks', 9
    UNION ALL SELECT 650.00, 'Others', 'Birthday gift', 12
) x
WHERE u.email = 'demo@example.com'
  AND NOT EXISTS (SELECT 1 FROM `expenses` e WHERE e.user_id = u.id);
