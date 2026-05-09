alter table generated_plans
  add column if not exists region_profile_payload jsonb,
  add column if not exists development_plan_payload jsonb;
