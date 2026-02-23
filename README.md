# pos-dashboard

## Overview

This project is an AI-assisted Point-of-Sale (POS) dashboard designed to help retail staff manage:
	•	Inventory
	•	Customer loyalty accounts
	•	Shopping carts
	•	Checkout & sales reporting

The system combines:
	•	Bun + Drizzle ORM + PostgreSQL (Backend API)
	•	React + Vite (Frontend dashboard)
	•	Tambo AI SDK (AI assistant with tool calling)

The AI assistant can perform real actions (not simulated), including:
	•	Adding/removing cart items
	•	Checking inventory
	•	Creating new carts
	•	Processing checkout
	•	Displaying sales reports
	•	Viewing customer loyalty points

All actions are executed through backend APIs and database transactions.

⸻

🏗️ Architecture

Frontend
	•	React (Vite)
	•	Tambo React SDK
	•	Component-based UI:
	•	PersistentCart
	•	SalesChart
	•	InventoryStatus
	•	CustomerLoyaltyCard

Backend
	•	Bun runtime
	•	Drizzle ORM
	•	PostgreSQL
	•	REST-style API routes:
	•	/api/cart
	•	/api/inventory
	•	/api/customers
	•	/api/reports/sales/today

Database

PostgreSQL schema includes:
	•	products
	•	inventory
	•	carts
	•	cart_items
	•	sales
	•	sale_items
	•	customers

Checkout is handled inside a database transaction to ensure:
	•	Inventory validation
	•	Inventory deduction
	•	Sale creation
	•	Sale item insertion
	•	Loyalty point updates
	•	Cart status update

All succeed or fail together.

## Running the project

**Backend**
cd backend
bun install
bun run index.ts


**Frontend**
cd frontend
npm install
npm run dev

docker compose exec backend bun run seed

## Tambo AI

| Tool              | Function                                  |
|-------------------|--------------------------------------------|
| search_products   | Search products by name                   |
| get_inventory     | Retrieve product stock                    |
| create_cart       | Create a new cart (guest or customer)     |
| add_to_cart       | Add product to active cart                |
| remove_from_cart  | Remove/decrease quantity                  |
| checkout_cart     | Complete transaction                      |
| sales_today       | Display today’s sales summary             |
| customer_loyalty  | Retrieve customer loyalty info            |

**🛒 Key Features**

1️⃣ Persistent Cart
	•	Cart ID stored in localStorage
	•	Automatically creates new cart if:
	•	No cart exists
	•	Previous cart is checked out
	•	Polls backend for live updates

2️⃣ Checkout System
	•	Transaction-based
	•	Prevents:
	•	Checkout of empty cart
	•	Double checkout
	•	Inventory underflow
	•	Updates loyalty points automatically

3️⃣ Inventory Management
	•	Search by product name
	•	Displays stock across branches
	•	Validates stock before checkout

4️⃣ Customer Loyalty
	•	Displays:
	•	Name
	•	ID
	•	Loyalty points
	•	Loyalty points updated on checkout

5️⃣ Sales Reporting
	•	/api/reports/sales/today
	•	Renders chart via SalesChart component
