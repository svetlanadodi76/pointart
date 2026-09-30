-- Migration 010: Add Paddle payment fields to subscriptions
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS paddle_subscription_id text,
  ADD COLUMN IF NOT EXISTS paddle_customer_id text,
  ADD COLUMN IF NOT EXISTS paddle_transaction_id text;

-- Allow service role to insert/update subscriptions (for webhook handler)
CREATE POLICY IF NOT EXISTS "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (true)
  WITH CHECK (true);
