create table if not exists technologies (
  id bigserial primary key,
  name text not null,
  category text not null,
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

create index if not exists idx_technologies_category_active on technologies (category, is_active);
create index if not exists idx_plan_run_technologies_plan_run_id on plan_run_technologies (plan_run_id);
create index if not exists idx_plan_run_technologies_technology_id on plan_run_technologies (technology_id);

insert into technologies (name, category, description, is_active)
values
  ('React', 'frontend', 'Component-based frontend library for SPA interfaces.', true),
  ('Node.js', 'backend', 'JavaScript runtime for backend application services.', true),
  ('Express', 'framework', 'Minimal web framework used for REST APIs.', true),
  ('PostgreSQL', 'database', 'Primary relational database for transactional data.', true),
  ('Nginx', 'infrastructure', 'Reverse proxy and static asset delivery layer.', true),
  ('Redis', 'infrastructure', 'Cache and pub/sub layer for background and realtime workflows.', true)
on conflict (name) do nothing;
