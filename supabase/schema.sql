-- Catalog culori DMC
create table if not exists dmc_colors (
  id serial primary key,
  code text not null unique,
  name text not null,
  hex text not null,
  r integer not null,
  g integer not null,
  b integer not null
);

-- Profile utilizatori (extinde auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz default now()
);

-- Abonamente
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('free_trial', 'starter', 'pro')),
  status text not null check (status in ('active', 'expired', 'cancelled')),
  schemas_remaining integer,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  stripe_subscription_id text,
  stripe_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Scheme generate
create table if not exists schemas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Schema nouă',
  craft_type text not null check (craft_type in ('cross_stitch', 'goblene', 'diamond')),
  canvas_type text check (canvas_type in ('11CT', '14CT', '16CT', '18CT')),
  width_stitches integer not null,
  height_stitches integer not null,
  width_cm numeric not null,
  height_cm numeric not null,
  max_colors integer not null,
  colors_used integer not null,
  original_image_url text,
  schema_data jsonb,
  created_at timestamptz default now()
);

-- RLS (Row Level Security)
alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table schemas enable row level security;

-- Politici profiles
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Politici subscriptions
create policy "Users can view own subscription" on subscriptions
  for select using (auth.uid() = user_id);
create policy "Users can update own subscription" on subscriptions
  for update using (auth.uid() = user_id);

-- Politici schemas
create policy "Users can view own schemas" on schemas
  for select using (auth.uid() = user_id);
create policy "Users can insert own schemas" on schemas
  for insert with check (auth.uid() = user_id);
create policy "Users can update own schemas" on schemas
  for update using (auth.uid() = user_id);
create policy "Users can delete own schemas" on schemas
  for delete using (auth.uid() = user_id);

-- Catalog DMC public (read-only)
alter table dmc_colors enable row level security;
create policy "DMC colors are public" on dmc_colors
  for select using (true);

-- Trigger: creare profil + abonament trial la înregistrare
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email);

  insert into subscriptions (user_id, plan, status, schemas_remaining, trial_ends_at)
  values (
    new.id,
    'free_trial',
    'active',
    1,
    now() + interval '5 days'
  );

  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
