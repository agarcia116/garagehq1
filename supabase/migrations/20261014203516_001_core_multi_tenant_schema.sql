/*
# Garage HQ — Core Multi-Tenant Schema

## Purpose
Establish the foundational multi-tenant architecture for Garage HQ, a SaaS platform
for independent automotive repair shops. Each repair shop is a tenant; all business
data is isolated by shop_id.

## New Tables
1. shops — repair shop tenants (subscription, branding, business info)
2. shop_members — users belonging to a shop (role-based access)
3. customers — vehicle owners associated with each shop
4. vehicles — customer vehicles, linked to customers
5. appointments — service scheduling with bay/technician assignment
6. repair_orders — digital repair orders with status workflow
7. repair_order_items — labor/parts line items on a repair order
8. estimates — cost estimates sent to customers for approval
9. estimate_items — line items on an estimate
10. invoices — billing documents with payment tracking
11. invoice_items — line items on an invoice
12. expenses — categorized business expenses
13. inventory_parts — parts inventory with stock tracking
14. notifications — customer and shop notifications

## Security
- RLS enabled on ALL tables
- All policies scoped to authenticated users who are members of the owning shop
- Multi-tenant isolation via shop_id on every business table
- Helper function is_shop_member() checks membership
*/

-- ============================================================
-- SHOPS (TENANTS)
-- ============================================================
CREATE TABLE IF NOT EXISTS shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_email text NOT NULL,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  logo_url text,
  subscription_status text NOT NULL DEFAULT 'trial',
  subscription_price numeric(10,2) NOT NULL DEFAULT 159.99,
  business_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SHOP MEMBERS (users -> shops with roles)
-- ============================================================
CREATE TABLE IF NOT EXISTS shop_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'mechanic',
  full_name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(shop_id, user_id)
);

ALTER TABLE shop_members ENABLE ROW LEVEL SECURITY;

-- Helper function to check shop membership
CREATE OR REPLACE FUNCTION is_shop_member(check_shop_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM shop_members
    WHERE shop_members.shop_id = check_shop_id
    AND shop_members.user_id = auth.uid()
  );
$$;

-- Shop policies
DROP POLICY IF EXISTS "members_read_own_shop" ON shops;
CREATE POLICY "members_read_own_shop" ON shops FOR SELECT
  TO authenticated USING (is_shop_member(id));

DROP POLICY IF EXISTS "members_update_own_shop" ON shops;
CREATE POLICY "members_update_own_shop" ON shops FOR UPDATE
  TO authenticated USING (is_shop_member(id)) WITH CHECK (is_shop_member(id));

-- Shop members policies
DROP POLICY IF EXISTS "members_select_own_shop" ON shop_members;
CREATE POLICY "members_select_own_shop" ON shop_members FOR SELECT
  TO authenticated USING (shop_id IN (SELECT shop_id FROM shop_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "members_insert_own_shop" ON shop_members;
CREATE POLICY "members_insert_own_shop" ON shop_members FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM shop_members sm
      WHERE sm.user_id = auth.uid()
      AND sm.shop_id = shop_members.shop_id
      AND sm.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "members_update_own_shop" ON shop_members;
CREATE POLICY "members_update_own_shop" ON shop_members FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM shop_members sm
      WHERE sm.user_id = auth.uid()
      AND sm.shop_id = shop_members.shop_id
      AND sm.role IN ('owner','admin')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM shop_members sm
      WHERE sm.user_id = auth.uid()
      AND sm.shop_id = shop_members.shop_id
      AND sm.role IN ('owner','admin')
    )
  );

DROP POLICY IF EXISTS "members_delete_own_shop" ON shop_members;
CREATE POLICY "members_delete_own_shop" ON shop_members FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM shop_members sm
      WHERE sm.user_id = auth.uid()
      AND sm.shop_id = shop_members.shop_id
      AND sm.role IN ('owner','admin')
    )
  );

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  preferred_contact text DEFAULT 'phone',
  address text,
  city text,
  state text,
  zip_code text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_members_read_customers" ON customers;
CREATE POLICY "shop_members_read_customers" ON customers FOR SELECT
  TO authenticated USING (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_insert_customers" ON customers;
CREATE POLICY "shop_members_insert_customers" ON customers FOR INSERT
  TO authenticated WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_update_customers" ON customers;
CREATE POLICY "shop_members_update_customers" ON customers FOR UPDATE
  TO authenticated USING (is_shop_member(shop_id)) WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_delete_customers" ON customers;
CREATE POLICY "shop_members_delete_customers" ON customers FOR DELETE
  TO authenticated USING (is_shop_member(shop_id));

-- ============================================================
-- VEHICLES
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  year integer,
  make text NOT NULL,
  model text NOT NULL,
  vin text,
  license_plate text,
  mileage integer DEFAULT 0,
  color text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_members_read_vehicles" ON vehicles;
CREATE POLICY "shop_members_read_vehicles" ON vehicles FOR SELECT
  TO authenticated USING (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_insert_vehicles" ON vehicles;
CREATE POLICY "shop_members_insert_vehicles" ON vehicles FOR INSERT
  TO authenticated WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_update_vehicles" ON vehicles;
CREATE POLICY "shop_members_update_vehicles" ON vehicles FOR UPDATE
  TO authenticated USING (is_shop_member(shop_id)) WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_delete_vehicles" ON vehicles;
CREATE POLICY "shop_members_delete_vehicles" ON vehicles FOR DELETE
  TO authenticated USING (is_shop_member(shop_id));

-- ============================================================
-- APPOINTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  service_description text NOT NULL,
  appointment_date date NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  status text NOT NULL DEFAULT 'requested',
  assigned_bay text,
  assigned_technician_id uuid REFERENCES shop_members(id) ON DELETE SET NULL,
  customer_requested boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_members_read_appointments" ON appointments;
CREATE POLICY "shop_members_read_appointments" ON appointments FOR SELECT
  TO authenticated USING (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_insert_appointments" ON appointments;
CREATE POLICY "shop_members_insert_appointments" ON appointments FOR INSERT
  TO authenticated WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_update_appointments" ON appointments;
CREATE POLICY "shop_members_update_appointments" ON appointments FOR UPDATE
  TO authenticated USING (is_shop_member(shop_id)) WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_delete_appointments" ON appointments;
CREATE POLICY "shop_members_delete_appointments" ON appointments FOR DELETE
  TO authenticated USING (is_shop_member(shop_id));

-- ============================================================
-- REPAIR ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS repair_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  technician_id uuid REFERENCES shop_members(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  customer_concerns text,
  diagnostic_notes text,
  labor_hours numeric(5,2) DEFAULT 0,
  photos jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE repair_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_members_read_repair_orders" ON repair_orders;
CREATE POLICY "shop_members_read_repair_orders" ON repair_orders FOR SELECT
  TO authenticated USING (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_insert_repair_orders" ON repair_orders;
CREATE POLICY "shop_members_insert_repair_orders" ON repair_orders FOR INSERT
  TO authenticated WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_update_repair_orders" ON repair_orders;
CREATE POLICY "shop_members_update_repair_orders" ON repair_orders FOR UPDATE
  TO authenticated USING (is_shop_member(shop_id)) WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_delete_repair_orders" ON repair_orders;
CREATE POLICY "shop_members_delete_repair_orders" ON repair_orders FOR DELETE
  TO authenticated USING (is_shop_member(shop_id));

-- ============================================================
-- REPAIR ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS repair_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_order_id uuid NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'labor',
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE repair_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_members_read_ro_items" ON repair_order_items;
CREATE POLICY "shop_members_read_ro_items" ON repair_order_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM repair_orders ro WHERE ro.id = repair_order_id AND is_shop_member(ro.shop_id))
  );

DROP POLICY IF EXISTS "shop_members_insert_ro_items" ON repair_order_items;
CREATE POLICY "shop_members_insert_ro_items" ON repair_order_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM repair_orders ro WHERE ro.id = repair_order_id AND is_shop_member(ro.shop_id))
  );

DROP POLICY IF EXISTS "shop_members_update_ro_items" ON repair_order_items;
CREATE POLICY "shop_members_update_ro_items" ON repair_order_items FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM repair_orders ro WHERE ro.id = repair_order_id AND is_shop_member(ro.shop_id))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM repair_orders ro WHERE ro.id = repair_order_id AND is_shop_member(ro.shop_id))
  );

DROP POLICY IF EXISTS "shop_members_delete_ro_items" ON repair_order_items;
CREATE POLICY "shop_members_delete_ro_items" ON repair_order_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM repair_orders ro WHERE ro.id = repair_order_id AND is_shop_member(ro.shop_id))
  );

-- ============================================================
-- ESTIMATES
-- ============================================================
CREATE TABLE IF NOT EXISTS estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  repair_order_id uuid REFERENCES repair_orders(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft',
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) NOT NULL DEFAULT 0,
  tax_amount numeric(10,2) NOT NULL DEFAULT 0,
  shop_fee numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  approved_at timestamptz,
  approved_by_customer boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_members_read_estimates" ON estimates;
CREATE POLICY "shop_members_read_estimates" ON estimates FOR SELECT
  TO authenticated USING (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_insert_estimates" ON estimates;
CREATE POLICY "shop_members_insert_estimates" ON estimates FOR INSERT
  TO authenticated WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_update_estimates" ON estimates;
CREATE POLICY "shop_members_update_estimates" ON estimates FOR UPDATE
  TO authenticated USING (is_shop_member(shop_id)) WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_delete_estimates" ON estimates;
CREATE POLICY "shop_members_delete_estimates" ON estimates FOR DELETE
  TO authenticated USING (is_shop_member(shop_id));

-- ============================================================
-- ESTIMATE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS estimate_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'labor',
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE estimate_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_members_read_estimate_items" ON estimate_items;
CREATE POLICY "shop_members_read_estimate_items" ON estimate_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM estimates e WHERE e.id = estimate_id AND is_shop_member(e.shop_id))
  );

DROP POLICY IF EXISTS "shop_members_insert_estimate_items" ON estimate_items;
CREATE POLICY "shop_members_insert_estimate_items" ON estimate_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM estimates e WHERE e.id = estimate_id AND is_shop_member(e.shop_id))
  );

DROP POLICY IF EXISTS "shop_members_update_estimate_items" ON estimate_items;
CREATE POLICY "shop_members_update_estimate_items" ON estimate_items FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM estimates e WHERE e.id = estimate_id AND is_shop_member(e.shop_id))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM estimates e WHERE e.id = estimate_id AND is_shop_member(e.shop_id))
  );

DROP POLICY IF EXISTS "shop_members_delete_estimate_items" ON estimate_items;
CREATE POLICY "shop_members_delete_estimate_items" ON estimate_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM estimates e WHERE e.id = estimate_id AND is_shop_member(e.shop_id))
  );

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  repair_order_id uuid REFERENCES repair_orders(id) ON DELETE SET NULL,
  estimate_id uuid REFERENCES estimates(id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  status text NOT NULL DEFAULT 'unpaid',
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) NOT NULL DEFAULT 0,
  tax_amount numeric(10,2) NOT NULL DEFAULT 0,
  shop_fee numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  amount_paid numeric(10,2) NOT NULL DEFAULT 0,
  balance_due numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text,
  paid_at timestamptz,
  due_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_members_read_invoices" ON invoices;
CREATE POLICY "shop_members_read_invoices" ON invoices FOR SELECT
  TO authenticated USING (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_insert_invoices" ON invoices;
CREATE POLICY "shop_members_insert_invoices" ON invoices FOR INSERT
  TO authenticated WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_update_invoices" ON invoices;
CREATE POLICY "shop_members_update_invoices" ON invoices FOR UPDATE
  TO authenticated USING (is_shop_member(shop_id)) WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_delete_invoices" ON invoices;
CREATE POLICY "shop_members_delete_invoices" ON invoices FOR DELETE
  TO authenticated USING (is_shop_member(shop_id));

-- ============================================================
-- INVOICE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'labor',
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_members_read_invoice_items" ON invoice_items;
CREATE POLICY "shop_members_read_invoice_items" ON invoice_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_id AND is_shop_member(i.shop_id))
  );

DROP POLICY IF EXISTS "shop_members_insert_invoice_items" ON invoice_items;
CREATE POLICY "shop_members_insert_invoice_items" ON invoice_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_id AND is_shop_member(i.shop_id))
  );

DROP POLICY IF EXISTS "shop_members_update_invoice_items" ON invoice_items;
CREATE POLICY "shop_members_update_invoice_items" ON invoice_items FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_id AND is_shop_member(i.shop_id))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_id AND is_shop_member(i.shop_id))
  );

DROP POLICY IF EXISTS "shop_members_delete_invoice_items" ON invoice_items;
CREATE POLICY "shop_members_delete_invoice_items" ON invoice_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_id AND is_shop_member(i.shop_id))
  );

-- ============================================================
-- EXPENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'other',
  description text NOT NULL,
  amount numeric(10,2) NOT NULL,
  expense_date date NOT NULL,
  vendor text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_members_read_expenses" ON expenses;
CREATE POLICY "shop_members_read_expenses" ON expenses FOR SELECT
  TO authenticated USING (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_insert_expenses" ON expenses;
CREATE POLICY "shop_members_insert_expenses" ON expenses FOR INSERT
  TO authenticated WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_update_expenses" ON expenses;
CREATE POLICY "shop_members_update_expenses" ON expenses FOR UPDATE
  TO authenticated USING (is_shop_member(shop_id)) WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_delete_expenses" ON expenses;
CREATE POLICY "shop_members_delete_expenses" ON expenses FOR DELETE
  TO authenticated USING (is_shop_member(shop_id));

-- ============================================================
-- INVENTORY PARTS
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  part_number text,
  name text NOT NULL,
  description text,
  quantity_on_hand integer NOT NULL DEFAULT 0,
  min_stock_level integer NOT NULL DEFAULT 5,
  purchase_cost numeric(10,2) NOT NULL DEFAULT 0,
  selling_price numeric(10,2) NOT NULL DEFAULT 0,
  supplier text,
  location text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_parts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_members_read_inventory" ON inventory_parts;
CREATE POLICY "shop_members_read_inventory" ON inventory_parts FOR SELECT
  TO authenticated USING (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_insert_inventory" ON inventory_parts;
CREATE POLICY "shop_members_insert_inventory" ON inventory_parts FOR INSERT
  TO authenticated WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_update_inventory" ON inventory_parts;
CREATE POLICY "shop_members_update_inventory" ON inventory_parts FOR UPDATE
  TO authenticated USING (is_shop_member(shop_id)) WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_delete_inventory" ON inventory_parts;
CREATE POLICY "shop_members_delete_inventory" ON inventory_parts FOR DELETE
  TO authenticated USING (is_shop_member(shop_id));

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  related_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_members_read_notifications" ON notifications;
CREATE POLICY "shop_members_read_notifications" ON notifications FOR SELECT
  TO authenticated USING (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_insert_notifications" ON notifications;
CREATE POLICY "shop_members_insert_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_update_notifications" ON notifications;
CREATE POLICY "shop_members_update_notifications" ON notifications FOR UPDATE
  TO authenticated USING (is_shop_member(shop_id)) WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "shop_members_delete_notifications" ON notifications;
CREATE POLICY "shop_members_delete_notifications" ON notifications FOR DELETE
  TO authenticated USING (is_shop_member(shop_id));

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_shop_members_user ON shop_members(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_members_shop ON shop_members(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_shop ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_shop ON vehicles(shop_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_shop ON appointments(shop_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_repair_orders_shop ON repair_orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_estimates_shop ON estimates(shop_id);
CREATE INDEX IF NOT EXISTS idx_invoices_shop ON invoices(shop_id);
CREATE INDEX IF NOT EXISTS idx_expenses_shop ON expenses(shop_id);
CREATE INDEX IF NOT EXISTS idx_inventory_shop ON inventory_parts(shop_id);
CREATE INDEX IF NOT EXISTS idx_notifications_shop ON notifications(shop_id);
