create table if not exists users (
  id bigserial primary key,
  auth0_sub text not null unique,
  email text,
  display_name text,
  role text not null default 'user',
  created_at timestamptz not null default now()
);

alter table generated_plans
  add column if not exists user_id bigint references users(id) on delete cascade;

create index if not exists idx_generated_plans_user_created_at on generated_plans (user_id, created_at desc);
