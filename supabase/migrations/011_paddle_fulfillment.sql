-- Migration 011: Paddle fulfillment layer

-- Customers table: links Paddle customer_id ↔ our user_id
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  paddle_customer_id text UNIQUE NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages customers" ON customers
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can view own customer" ON customers
  FOR SELECT USING (auth.uid() = user_id);

-- Extend subscriptions status to include Paddle lifecycle states
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'trialing', 'paused', 'past_due', 'expired', 'cancelled'));

-- Add Paddle-specific columns to subscriptions
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS price_id text,
  ADD COLUMN IF NOT EXISTS product_id text,
  ADD COLUMN IF NOT EXISTS scheduled_change_action text,
  ADD COLUMN IF NOT EXISTS scheduled_change_at timestamptz;
