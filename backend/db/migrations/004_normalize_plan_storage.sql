-- Normalize plan storage into projects + plan_runs + plan_components
-- and backfill existing generated_plans rows.

alter table generated_plans
  add column if not exists region_profile_payload jsonb,
  add column if not exists development_plan_payload jsonb;

update users
set role = 'user'
where role is null or role not in ('user', 'admin');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_role_check'
      and conrelid = 'users'::regclass
  ) then
    alter table users
      add constraint users_role_check check (role in ('user', 'admin'));
  end if;
end $$;

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

create index if not exists idx_projects_user_created_at on projects (user_id, created_at desc);

create index if not exists idx_plan_runs_created_at on plan_runs (created_at desc);
create index if not exists idx_plan_runs_user_created_at on plan_runs (user_id, created_at desc);
create index if not exists idx_plan_runs_project_created_at on plan_runs (project_id, created_at desc);
create index if not exists idx_plan_runs_architecture_style on plan_runs (architecture_style);
create index if not exists idx_plan_runs_deployment_model on plan_runs (deployment_model);
create index if not exists idx_plan_runs_target_region on plan_runs (target_region);

create index if not exists idx_plan_components_plan_run_id on plan_components (plan_run_id);
create index if not exists idx_plan_components_component_code on plan_components (component_code);

alter table region_data_cache
  add column if not exists expires_at timestamptz;

delete from region_data_cache older
using region_data_cache newer
where older.region_code = newer.region_code
  and older.source_name = newer.source_name
  and (
    older.refreshed_at < newer.refreshed_at
    or (older.refreshed_at = newer.refreshed_at and older.id < newer.id)
  );

create unique index if not exists uq_region_data_cache_region_source on region_data_cache (region_code, source_name);
create index if not exists idx_region_data_cache_expires_at on region_data_cache (expires_at);

insert into projects (user_id, project_name, created_at, updated_at)
select
  gp.user_id,
  gp.project_name,
  min(gp.created_at) as created_at,
  max(gp.created_at) as updated_at
from generated_plans gp
where gp.user_id is not null
group by gp.user_id, gp.project_name
on conflict (user_id, project_name)
do update set
  updated_at = greatest(projects.updated_at, excluded.updated_at);

insert into plan_runs (
  project_id,
  user_id,
  plan_id,
  project_name_snapshot,
  input_payload,
  summary,
  recommendation_payload,
  region_profile_payload,
  roadmap_payload,
  development_plan_payload,
  cost_payload,
  diagram_payload,
  drawio_xml,
  architecture_style,
  deployment_model,
  target_region,
  monthly_estimate,
  created_at
)
select
  p.id as project_id,
  gp.user_id,
  gp.plan_id,
  gp.project_name,
  gp.input_payload,
  gp.summary,
  gp.recommendation_payload,
  gp.region_profile_payload,
  gp.roadmap_payload,
  gp.development_plan_payload,
  gp.cost_payload,
  gp.diagram_payload,
  gp.drawio_xml,
  gp.recommendation_payload ->> 'architectureStyle' as architecture_style,
  gp.recommendation_payload ->> 'deploymentModel' as deployment_model,
  gp.input_payload ->> 'targetRegion' as target_region,
  case
    when (gp.cost_payload ->> 'monthlyEstimate') ~ '^-?\\d+$'
      then (gp.cost_payload ->> 'monthlyEstimate')::integer
    else null
  end as monthly_estimate,
  gp.created_at
from generated_plans gp
join projects p
  on p.user_id = gp.user_id
 and p.project_name = gp.project_name
where gp.user_id is not null
on conflict (plan_id) do nothing;

insert into plan_components (plan_run_id, component_code)
select
  pr.id,
  component.value
from plan_runs pr
join generated_plans gp
  on gp.plan_id = pr.plan_id
cross join lateral jsonb_array_elements_text(
  case
    when jsonb_typeof(gp.recommendation_payload -> 'components') = 'array'
      then gp.recommendation_payload -> 'components'
    else '[]'::jsonb
  end
) as component(value)
on conflict (plan_run_id, component_code) do nothing;
