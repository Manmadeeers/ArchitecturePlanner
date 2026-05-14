create table if not exists technology_categories (
  id bigserial primary key,
  code text not null unique,
  name text not null unique,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

alter table technologies
  add column if not exists category_id bigint;

update technologies technology
set category_id = category.id
from technology_categories category
where technology.category_id is null
  and lower(trim(technology.category)) = category.code;

update technologies
set category_id = (
  select id
  from technology_categories
  where code = 'other'
)
where category_id is null;

alter table technologies
  alter column category drop not null;

alter table technologies
  alter column category_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'technologies_category_id_fkey'
      and conrelid = 'technologies'::regclass
  ) then
    alter table technologies
      add constraint technologies_category_id_fkey
      foreign key (category_id)
      references technology_categories(id)
      on delete restrict;
  end if;
end $$;

drop index if exists idx_technologies_category_active;
create index if not exists idx_technology_categories_sort_active on technology_categories (sort_order, is_active);
create index if not exists idx_technologies_category_active on technologies (category_id, is_active);
