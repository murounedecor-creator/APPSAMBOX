/*
# Operational Management App — Initial Schema

1. Purpose
   Operational management system for a business selling plans/products with
   technical support and installation tracking. Three roles: owner, manager, technician.

2. New Tables
   - `technicians` — support/installation staff who execute tickets
   - `plans` — products/plans sold to customers (Ultimate, Mensal, etc.)
   - `customers` — clients with contact info and discount tracking
   - `customer_plans` — junction table: a customer can have multiple plans simultaneously
   - `tickets` — atendimento/installation/support requests linked to a customer and technician
   - `sales` — record of sales with plan, discount, and payment info
   - `ad_metrics` — daily advertising performance metrics (manual entry)

3. Security
   - Single-tenant app (no auth). RLS enabled on all tables.
   - Policies use `TO anon, authenticated` with `USING (true)` — data is intentionally shared.
   - No user_id columns, no auth.uid() references.

4. Notes
   - All monetary values use DECIMAL(10,2) for precision.
   - Ticket statuses: 'pending', 'assigned', 'in_progress', 'completed', 'cancelled'.
   - Ticket types: 'first_install', 'maintenance', 'second_visit', 'other'.
   - Plan names are configurable via the plans table, not hardcoded.
*/

-- Technicians table
CREATE TABLE IF NOT EXISTS technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_technicians" ON technicians;
CREATE POLICY "anon_select_technicians" ON technicians FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_technicians" ON technicians;
CREATE POLICY "anon_insert_technicians" ON technicians FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_technicians" ON technicians;
CREATE POLICY "anon_update_technicians" ON technicians FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_technicians" ON technicians;
CREATE POLICY "anon_delete_technicians" ON technicians FOR DELETE TO anon, authenticated USING (true);

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL DEFAULT 0,
  variation text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_plans" ON plans;
CREATE POLICY "anon_select_plans" ON plans FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_plans" ON plans;
CREATE POLICY "anon_insert_plans" ON plans FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_plans" ON plans;
CREATE POLICY "anon_update_plans" ON plans FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_plans" ON plans;
CREATE POLICY "anon_delete_plans" ON plans FOR DELETE TO anon, authenticated USING (true);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  cpf_cnpj text,
  address text,
  city text,
  state text,
  zipcode text,
  notes text,
  has_discount boolean NOT NULL DEFAULT false,
  discount_value decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_customers" ON customers;
CREATE POLICY "anon_select_customers" ON customers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_customers" ON customers;
CREATE POLICY "anon_insert_customers" ON customers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_customers" ON customers;
CREATE POLICY "anon_update_customers" ON customers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_customers" ON customers;
CREATE POLICY "anon_delete_customers" ON customers FOR DELETE TO anon, authenticated USING (true);

-- Customer-Plans junction (many-to-many)
CREATE TABLE IF NOT EXISTS customer_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  variation text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customer_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_customer_plans" ON customer_plans;
CREATE POLICY "anon_select_customer_plans" ON customer_plans FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_customer_plans" ON customer_plans;
CREATE POLICY "anon_insert_customer_plans" ON customer_plans FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_customer_plans" ON customer_plans;
CREATE POLICY "anon_update_customer_plans" ON customer_plans FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_customer_plans" ON customer_plans;
CREATE POLICY "anon_delete_customer_plans" ON customer_plans FOR DELETE TO anon, authenticated USING (true);

-- Tickets table (atendimentos)
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number serial NOT NULL,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  technician_id uuid REFERENCES technicians(id) ON DELETE SET NULL,
  ticket_type text NOT NULL DEFAULT 'maintenance',
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'normal',
  description text,
  scheduled_date date,
  scheduled_time text,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_tickets" ON tickets;
CREATE POLICY "anon_select_tickets" ON tickets FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_tickets" ON tickets;
CREATE POLICY "anon_insert_tickets" ON tickets FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_tickets" ON tickets;
CREATE POLICY "anon_update_tickets" ON tickets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_tickets" ON tickets;
CREATE POLICY "anon_delete_tickets" ON tickets FOR DELETE TO anon, authenticated USING (true);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number serial NOT NULL,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  plan_id uuid REFERENCES plans(id) ON DELETE SET NULL,
  variation text,
  amount decimal(10,2) NOT NULL DEFAULT 0,
  has_discount boolean NOT NULL DEFAULT false,
  discount_value decimal(10,2) NOT NULL DEFAULT 0,
  final_amount decimal(10,2) NOT NULL DEFAULT 0,
  payment_method text,
  payment_condition text,
  status text NOT NULL DEFAULT 'completed',
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_sales" ON sales;
CREATE POLICY "anon_select_sales" ON sales FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_sales" ON sales;
CREATE POLICY "anon_insert_sales" ON sales FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_sales" ON sales;
CREATE POLICY "anon_update_sales" ON sales FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_sales" ON sales;
CREATE POLICY "anon_delete_sales" ON sales FOR DELETE TO anon, authenticated USING (true);

-- Ad metrics table (daily advertising performance)
CREATE TABLE IF NOT EXISTS ad_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date NOT NULL,
  platform text NOT NULL,
  ad_name text,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  cost decimal(10,2) NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  revenue decimal(10,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ad_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_ad_metrics" ON ad_metrics;
CREATE POLICY "anon_select_ad_metrics" ON ad_metrics FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_ad_metrics" ON ad_metrics;
CREATE POLICY "anon_insert_ad_metrics" ON ad_metrics FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_ad_metrics" ON ad_metrics;
CREATE POLICY "anon_update_ad_metrics" ON ad_metrics FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_ad_metrics" ON ad_metrics;
CREATE POLICY "anon_delete_ad_metrics" ON ad_metrics FOR DELETE TO anon, authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_customer ON tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_technician ON tickets(technician_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_scheduled_date ON tickets(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_customer_plans_customer ON customer_plans(customer_id);
CREATE INDEX IF NOT EXISTS idx_ad_metrics_date ON ad_metrics(metric_date);
