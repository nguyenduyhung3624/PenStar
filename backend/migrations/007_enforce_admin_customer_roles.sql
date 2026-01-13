-- Rename 'user' to 'customer'
UPDATE roles SET name = 'customer', description = 'Khách hàng' WHERE name = 'user';

-- Ensure all users have valid roles (defaulting 'manager' and 'receptionist' to 'customer')
-- Assuming IDs: 1=admin, 2=manager, 3=receptionist, 4=user(now customer)
UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = 'customer' LIMIT 1)
WHERE role_id IN (
    SELECT id FROM roles WHERE name IN ('manager', 'receptionist')
);

-- Delete unused roles
DELETE FROM roles WHERE name IN ('manager', 'receptionist');
