create table if not exists users (
  id bigserial primary key,
  auth0_sub text not null unique,
  email text,
  display_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- Legacy table kept for compatibility with older backups and migrations.
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

create table if not exists projects (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  project_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_projects_user_name unique (user_id, project_name)
);

create table if not exists plan_runs (
  id bigserial primary key,
  project_id bigint not null references projects(id) on delete cascade,
  user_id bigint not null references users(id) on delete cascade,
  plan_id text not null unique,
  project_name_snapshot text not null,
  input_payload jsonb not null,
  summary text not null,
  recommendation_payload jsonb not null,
  region_profile_payload jsonb,
  roadmap_payload jsonb not null,
  development_plan_payload jsonb,
  cost_payload jsonb not null,
  diagram_payload jsonb not null,
  drawio_xml text not null,
  architecture_style text,
  deployment_model text,
  target_region text,
  monthly_estimate integer,
  created_at timestamptz not null default now()
);

create table if not exists plan_components (
  id bigserial primary key,
  plan_run_id bigint not null references plan_runs(id) on delete cascade,
  component_code text not null,
  created_at timestamptz not null default now(),
  constraint uq_plan_components_run_component unique (plan_run_id, component_code)
);

create table if not exists technology_categories (
  id bigserial primary key,
  code text not null unique,
  name text not null unique,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists technologies (
  id bigserial primary key,
  name text not null,
  category_id bigint not null references technology_categories(id) on delete restrict,
  description text,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_technologies_name unique (name)
);

create table if not exists plan_run_technologies (
  id bigserial primary key,
  plan_run_id bigint not null references plan_runs(id) on delete cascade,
  technology_id bigint not null references technologies(id) on delete restrict,
  justification text,
  created_at timestamptz not null default now(),
  constraint uq_plan_run_technology unique (plan_run_id, technology_id)
);

create table if not exists region_data_cache (
  id bigserial primary key,
  region_code text not null,
  source_name text not null,
  payload jsonb not null,
  refreshed_at timestamptz not null default now(),
  expires_at timestamptz
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

create index if not exists idx_projects_user_created_at on projects (user_id, created_at desc);

create index if not exists idx_plan_runs_created_at on plan_runs (created_at desc);
create index if not exists idx_plan_runs_user_created_at on plan_runs (user_id, created_at desc);
create index if not exists idx_plan_runs_project_created_at on plan_runs (project_id, created_at desc);
create index if not exists idx_plan_runs_architecture_style on plan_runs (architecture_style);
create index if not exists idx_plan_runs_deployment_model on plan_runs (deployment_model);
create index if not exists idx_plan_runs_target_region on plan_runs (target_region);

create index if not exists idx_plan_components_plan_run_id on plan_components (plan_run_id);
create index if not exists idx_plan_components_component_code on plan_components (component_code);

create index if not exists idx_technology_categories_sort_active on technology_categories (sort_order, is_active);
create index if not exists idx_technologies_category_active on technologies (category_id, is_active);
create index if not exists idx_plan_run_technologies_plan_run_id on plan_run_technologies (plan_run_id);
create index if not exists idx_plan_run_technologies_technology_id on plan_run_technologies (technology_id);

insert into technology_categories (code, name, sort_order, is_active)
values
  ('frontend', 'Frontend', 10, true),
  ('backend', 'Backend', 20, true),
  ('framework', 'Framework', 30, true),
  ('language', 'Language', 40, true),
  ('database', 'Database', 50, true),
  ('infrastructure', 'Infrastructure', 60, true),
  ('cloud', 'Cloud', 70, true),
  ('messaging', 'Messaging', 80, true),
  ('mobile', 'Mobile', 90, true),
  ('integration', 'Integration', 100, true),
  ('devops', 'DevOps', 110, true),
  ('other', 'Other', 999, true)
on conflict (code) do nothing;

create unique index if not exists uq_region_data_cache_region_source on region_data_cache (region_code, source_name);
create index if not exists idx_region_data_cache_region_code on region_data_cache (region_code);
create index if not exists idx_region_data_cache_expires_at on region_data_cache (expires_at);

create index if not exists idx_admin_audit_log_created_at on admin_audit_log (created_at desc);
