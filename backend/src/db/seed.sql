TRUNCATE sale_items, sales, cart_items, carts, inventory, customers, products, branches RESTART IDENTITY CASCADE;
INSERT INTO branches (name, location)
VALUES 
  ('Downtown', '123 Main St'),
  ('Airport', 'Terminal 1');
INSERT INTO products (name, description, price, sku)
VALUES
  ('Espresso', 'Single shot espresso', 3.50, 'ESP-001'),
  ('Latte', 'Milk coffee', 4.75, 'LAT-001'),
  ('Cappuccino', 'Foamy coffee', 4.50, 'CAP-001'),
  ('Blue Shirt', 'Cotton shirt', 29.99, 'BSH-001'),
  ('Running Shoes', 'Comfort sneakers', 89.99, 'RSH-001');
INSERT INTO customers (name, email, phone, loyalty_points)
VALUES
  ('Anthony Okolie', 'anthony@example.com', '555-1111', 120),
  ('Sarah Smith', 'sarah@example.com', '555-2222', 350),
  ('John Doe', 'john@example.com', '555-3333', 20);
-- Downtown branch inventory (branch_id = 1)
INSERT INTO inventory (product_id, branch_id, quantity)
VALUES
  (1, 1, 50),
  (2, 1, 40),
  (3, 1, 30),
  (4, 1, 15),
  (5, 1, 10);

-- Airport branch inventory (branch_id = 2)
INSERT INTO inventory (product_id, branch_id, quantity)
VALUES
  (1, 2, 20),
  (2, 2, 25),
  (3, 2, 15),
  (4, 2, 5),
  (5, 2, 8);
INSERT INTO carts (customer_id, branch_id, status)
VALUES (1, 1, 'active');
INSERT INTO cart_items (cart_id, product_id, quantity, unit_price)
VALUES
  (1, 1, 2, 3.50),  -- 2 espressos
  (1, 2, 1, 4.75);  -- 1 latte
INSERT INTO carts (customer_id, branch_id, status)
VALUES (2, 1, 'checked_out');
INSERT INTO cart_items (cart_id, product_id, quantity, unit_price)
VALUES
  (2, 4, 1, 29.99),
  (2, 5, 1, 89.99);
INSERT INTO sales (branch_id, customer_id, total_amount)
VALUES (1, 2, 119.98);
INSERT INTO sale_items (sale_id, product_id, quantity, unit_price)
VALUES
  (1, 4, 1, 29.99),
  (1, 5, 1, 89.99);

SELECT * FROM branches;
SELECT * FROM products;
SELECT * FROM customers;
SELECT * FROM inventory;
SELECT * FROM carts;
SELECT * FROM cart_items;
SELECT * FROM sales;
SELECT * FROM sale_items;