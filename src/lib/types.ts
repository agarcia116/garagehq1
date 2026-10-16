export type UserRole = 'owner' | 'admin' | 'mechanic' | 'customer';

export interface Shop {
  id: string;
  name: string;
  owner_email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  logo_url: string | null;
  subscription_status: string;
  subscription_price: number;
  business_hours: Record<string, { open: string; close: string } | null> | null;
  created_at: string;
}

export interface ShopMember {
  id: string;
  shop_id: string;
  user_id: string;
  role: UserRole;
  full_name: string;
  email: string;
  created_at: string;
}

export interface Customer {
  id: string;
  shop_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  preferred_contact: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  notes: string | null;
  created_at: string;
}

export interface Vehicle {
  id: string;
  shop_id: string;
  customer_id: string;
  year: number | null;
  make: string;
  model: string;
  vin: string | null;
  license_plate: string | null;
  mileage: number;
  color: string | null;
  notes: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  shop_id: string;
  customer_id: string | null;
  vehicle_id: string | null;
  service_description: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  assigned_bay: string | null;
  assigned_technician_id: string | null;
  customer_requested: boolean;
  notes: string | null;
  created_at: string;
}

export interface RepairOrder {
  id: string;
  shop_id: string;
  customer_id: string;
  vehicle_id: string;
  appointment_id: string | null;
  technician_id: string | null;
  status: string;
  customer_concerns: string | null;
  diagnostic_notes: string | null;
  labor_hours: number;
  photos: string[];
  created_at: string;
  updated_at: string;
}

export interface RepairOrderItem {
  id: string;
  repair_order_id: string;
  type: string;
  description: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface Estimate {
  id: string;
  shop_id: string;
  customer_id: string;
  vehicle_id: string;
  repair_order_id: string | null;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  shop_fee: number;
  discount: number;
  total: number;
  approved_at: string | null;
  approved_by_customer: boolean;
  notes: string | null;
  created_at: string;
}

export interface EstimateItem {
  id: string;
  estimate_id: string;
  type: string;
  description: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  shop_id: string;
  customer_id: string;
  vehicle_id: string | null;
  repair_order_id: string | null;
  estimate_id: string | null;
  invoice_number: string;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  shop_fee: number;
  discount: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  payment_method: string | null;
  paid_at: string | null;
  due_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  type: string;
  description: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface Expense {
  id: string;
  shop_id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  vendor: string | null;
  created_at: string;
}

export interface InventoryPart {
  id: string;
  shop_id: string;
  part_number: string | null;
  name: string;
  description: string | null;
  quantity_on_hand: number;
  min_stock_level: number;
  purchase_cost: number;
  selling_price: number;
  supplier: string | null;
  location: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  shop_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  related_id: string | null;
  created_at: string;
}
