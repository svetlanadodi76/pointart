CREATE TABLE IF NOT EXISTS page_views (
  id bigint generated always as identity primary key,
  path text not null,
  created_at timestamptz default now()
);
