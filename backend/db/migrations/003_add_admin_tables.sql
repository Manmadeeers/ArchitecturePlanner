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

create index if not exists idx_admin_audit_log_created_at on admin_audit_log (created_at desc);
