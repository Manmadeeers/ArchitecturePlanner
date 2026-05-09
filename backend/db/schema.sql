create table if not exists users (
  id bigserial primary key,
  auth0_sub text not null unique,
  email text,
  display_name text,
  role text not null default 'user',
  created_at timestamptz not null default now()
);

create table if not exists generated_plans (
  id bigserial primary key,
  user_id bigint references users(id) on delete cascade,
  plan_id text not null unique,
  project_name text not null,
  input_payload jsonb not null,
  summary text not null,
  recommendation_payload jsonb not null,
  region_profile_payload jsonb,
  roadmap_payload jsonb not null,
  development_plan_payload jsonb,
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

create table if not exists engine_settings (
  key text primary key,
  value_json jsonb not null,
  updated_by bigint references users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists admin_audit_log (
  id bigserial primary key,
  actor_user_id bigint references users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  details_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_generated_plans_created_at on generated_plans (created_at desc);
create index if not exists idx_generated_plans_user_created_at on generated_plans (user_id, created_at desc);
create index if not exists idx_region_data_cache_region_code on region_data_cache (region_code);
create index if not exists idx_admin_audit_log_created_at on admin_audit_log (created_at desc);
