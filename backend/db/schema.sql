create table if not exists generated_plans (
  id bigserial primary key,
  plan_id text not null unique,
  project_name text not null,
  input_payload jsonb not null,
  summary text not null,
  recommendation_payload jsonb not null,
  roadmap_payload jsonb not null,
  cost_payload jsonb not null,
  diagram_payload jsonb not null,
  drawio_xml text not null,
  created_at timestamptz not null default now()
);

create table if not exists region_data_cache (
  id bigserial primary key,
  region_code text not null,
  source_name text not null,
  payload jsonb not null,
  refreshed_at timestamptz not null default now()
);

create table if not exists users (
  id bigserial primary key,
  auth0_sub text not null unique,
  email text,
  display_name text,
  role text not null default 'user',
  created_at timestamptz not null default now()
);

create index if not exists idx_generated_plans_created_at on generated_plans (created_at desc);
create index if not exists idx_region_data_cache_region_code on region_data_cache (region_code);
