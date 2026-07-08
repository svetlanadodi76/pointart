-- Migration 006: Payment confirmation flow
-- Add transaction details and status to payments table

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS transaction_number text,
  ADD COLUMN IF NOT EXISTS transaction_date date,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'confirmed'
    CHECK (status IN ('pending', 'confirmed'));

-- Existing records are all confirmed
UPDATE payments SET status = 'confirmed' WHERE status IS NULL;

-- Allow unauthenticated insert for payment confirmation form
-- (API route uses service role anyway, but this ensures future flexibility)
