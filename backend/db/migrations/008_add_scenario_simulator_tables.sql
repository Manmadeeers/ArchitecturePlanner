create table if not exists scenario_sets (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  project_name_snapshot text not null,
  base_input_payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists scenario_runs (
  id bigserial primary key,
  scenario_set_id bigint not null references scenario_sets(id) on delete cascade,
  plan_run_id bigint not null references plan_runs(id) on delete cascade,
  scenario_key text not null,
  scenario_label text not null,
  input_override_payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint uq_scenario_runs_plan_run_id unique (plan_run_id),
  constraint uq_scenario_runs_set_key unique (scenario_set_id, scenario_key)
);

create index if not exists idx_scenario_sets_user_created_at on scenario_sets (user_id, created_at desc);
create index if not exists idx_scenario_runs_scenario_set_id on scenario_runs (scenario_set_id);
