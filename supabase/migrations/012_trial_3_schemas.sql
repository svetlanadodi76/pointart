-- Migration 012: Trial plan — 3 schemas instead of 1

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (new.id, new.email);

  INSERT INTO subscriptions (user_id, plan, status, schemas_remaining, trial_ends_at)
  VALUES (
    new.id,
    'free_trial',
    'active',
    3,
    now() + INTERVAL '5 days'
  );

  RETURN new;
END;
$$;
