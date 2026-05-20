create table if not exists users (
  id bigserial primary key,
  auth0_sub text not null unique,
  email text,
  display_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

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

drop table if exists generated_plans cascade;

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

create index if not exists idx_projects_user_created_at on projects (user_id, created_at desc);

create index if not exists idx_plan_runs_created_at on plan_runs (created_at desc);
create index if not exists idx_plan_runs_user_created_at on plan_runs (user_id, created_at desc);
create index if not exists idx_plan_runs_project_created_at on plan_runs (project_id, created_at desc);
create index if not exists idx_plan_runs_architecture_style on plan_runs (architecture_style);
create index if not exists idx_plan_runs_deployment_model on plan_runs (deployment_model);
create index if not exists idx_plan_runs_target_region on plan_runs (target_region);

create index if not exists idx_plan_components_plan_run_id on plan_components (plan_run_id);
create index if not exists idx_plan_components_component_code on plan_components (component_code);

create index if not exists idx_scenario_sets_user_created_at on scenario_sets (user_id, created_at desc);
create index if not exists idx_scenario_runs_scenario_set_id on scenario_runs (scenario_set_id);

create index if not exists idx_technology_categories_sort_active on technology_categories (sort_order, is_active);

do $$
begin
  if exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'idx_technologies_category_active'
      and indexdef not ilike '%(category_id, is_active)%'
  ) then
    drop index if exists idx_technologies_category_active;
  end if;
end $$;

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

alter table if exists technologies
  add column if not exists category_id bigint;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'technologies'
      and column_name = 'category'
  ) then
    update technologies technology
    set category_id = category.id
    from technology_categories category
    where technology.category_id is null
      and lower(trim(technology.category)) = category.code;
  end if;
end $$;

update technologies
set category_id = (
  select id
  from technology_categories
  where code = 'other'
)
where category_id is null;

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

alter table technologies
  alter column category_id set not null;

create index if not exists idx_technologies_category_active on technologies (category_id, is_active);

with technology_seed(name, category_code, description) as (
  values
    ('React', 'frontend', 'Component-based frontend library for interactive web apps.'),
    ('Next.js', 'frontend', 'React framework with SSR, routing, and full-stack features.'),
    ('Vue.js', 'frontend', 'Progressive frontend framework focused on simplicity.'),
    ('Nuxt', 'frontend', 'Vue-based framework for SSR and hybrid rendering.'),
    ('Angular', 'frontend', 'Enterprise-ready TypeScript frontend framework.'),
    ('SvelteKit', 'frontend', 'Compiler-driven framework for fast web interfaces.'),
    ('Astro', 'frontend', 'Content-focused frontend framework with island architecture.'),
    ('Tailwind CSS', 'frontend', 'Utility-first CSS framework for rapid UI delivery.'),

    ('Node.js', 'backend', 'JavaScript runtime for event-driven backend services.'),
    ('Bun', 'backend', 'Fast JavaScript runtime and toolkit for backend workloads.'),
    ('Deno', 'backend', 'Secure JavaScript runtime with modern standard library.'),
    ('Python', 'backend', 'General-purpose backend language with strong ecosystem.'),
    ('Java', 'backend', 'Mature enterprise backend platform.'),
    ('Go', 'backend', 'Compiled language for high-concurrency backend services.'),
    ('Rust', 'backend', 'Systems language for performance-critical and safe services.'),
    ('C#', 'backend', 'Managed language for Microsoft-centric backend services.'),
    ('PHP', 'backend', 'Backend language widely used for web products.'),
    ('Ruby', 'backend', 'Productivity-focused backend language for MVPs.'),
    ('Elixir', 'backend', 'BEAM-based language for resilient realtime systems.'),

    ('Express', 'framework', 'Minimal web framework for Node.js APIs.'),
    ('NestJS', 'framework', 'Structured Node.js framework for scalable backend APIs.'),
    ('Fastify', 'framework', 'High-performance Node.js web framework.'),
    ('Django', 'framework', 'Batteries-included Python web framework.'),
    ('FastAPI', 'framework', 'Modern async Python framework for typed APIs.'),
    ('Spring Boot', 'framework', 'Convention-driven Java framework for microservices and APIs.'),
    ('ASP.NET Core', 'framework', 'Cross-platform .NET framework for backend APIs.'),
    ('Laravel', 'framework', 'Full-stack PHP framework for rapid delivery.'),
    ('Ruby on Rails', 'framework', 'Convention-over-configuration Ruby framework.'),
    ('Phoenix', 'framework', 'Elixir framework for scalable and realtime applications.'),

    ('TypeScript', 'language', 'Typed superset of JavaScript for frontend and backend.'),
    ('JavaScript', 'language', 'Primary scripting language for web applications.'),
    ('SQL', 'language', 'Standard query language for relational databases.'),
    ('GraphQL', 'language', 'Query language for strongly-typed APIs.'),

    ('PostgreSQL', 'database', 'Relational database for transactional workloads.'),
    ('MySQL', 'database', 'Popular relational database for web applications.'),
    ('MariaDB', 'database', 'Open-source relational database compatible with MySQL.'),
    ('MongoDB', 'database', 'Document database for flexible schemas.'),
    ('Redis', 'database', 'In-memory store for cache, sessions, and queues.'),
    ('OpenSearch', 'database', 'Search and analytics engine for indexing/querying.'),
    ('Elasticsearch', 'database', 'Distributed search engine for full-text workloads.'),
    ('ClickHouse', 'database', 'Columnar database for analytical queries at scale.'),
    ('Cassandra', 'database', 'Distributed wide-column database for high write throughput.'),
    ('CockroachDB', 'database', 'Distributed SQL database with strong consistency.'),
    ('SQLite', 'database', 'Embedded database for lightweight workloads.'),
    ('MSSQL', 'database', 'Microsoft SQL Server relational database.'),
    ('SQL Server', 'database', 'Enterprise relational database from Microsoft.'),

    ('Nginx', 'infrastructure', 'Reverse proxy and static asset gateway.'),
    ('HAProxy', 'infrastructure', 'High-performance load balancer and proxy.'),
    ('Envoy', 'infrastructure', 'Cloud-native proxy for service networking.'),
    ('Traefik', 'infrastructure', 'Dynamic reverse proxy for container platforms.'),

    ('AWS', 'cloud', 'Public cloud platform with broad managed services.'),
    ('Azure', 'cloud', 'Microsoft cloud platform for enterprise deployments.'),
    ('Google Cloud', 'cloud', 'Cloud platform with strong data and ML tooling.'),
    ('Cloudflare', 'cloud', 'Edge network, CDN, and security platform.'),
    ('Vercel', 'cloud', 'Managed frontend hosting and edge platform.'),
    ('Netlify', 'cloud', 'Frontend deployment platform with serverless features.'),
    ('DigitalOcean', 'cloud', 'Developer-friendly cloud infrastructure provider.'),
    ('Heroku', 'cloud', 'Platform-as-a-service for rapid application delivery.'),

    ('RabbitMQ', 'messaging', 'Broker for reliable message queue patterns.'),
    ('Apache Kafka', 'messaging', 'Distributed event streaming platform.'),
    ('NATS', 'messaging', 'Lightweight high-performance messaging system.'),
    ('Redis Streams', 'messaging', 'Stream-based messaging built on Redis.'),
    ('AWS SQS', 'messaging', 'Managed queue service from AWS.'),
    ('Google Pub/Sub', 'messaging', 'Managed event ingestion and messaging service.'),

    ('React Native', 'mobile', 'Cross-platform mobile framework based on React.'),
    ('Flutter', 'mobile', 'Cross-platform mobile UI toolkit from Google.'),
    ('Swift', 'mobile', 'Native language for iOS and Apple platforms.'),
    ('Kotlin', 'mobile', 'Primary language for modern Android development.'),
    ('Kotlin Multiplatform', 'mobile', 'Shared business logic across mobile platforms.'),
    ('Android Jetpack', 'mobile', 'Android libraries for modern app architecture.'),
    ('iOS UIKit', 'mobile', 'Core UI framework for iOS native apps.'),

    ('Kong', 'integration', 'API gateway for routing, auth, and observability.'),
    ('Apigee', 'integration', 'Enterprise API management platform.'),
    ('MuleSoft', 'integration', 'Enterprise integration and API orchestration platform.'),
    ('Temporal', 'integration', 'Durable workflow orchestration for distributed systems.'),
    ('n8n', 'integration', 'Workflow automation and integration platform.'),
    ('Zapier', 'integration', 'No-code automation platform for SaaS integration.'),
    ('gRPC', 'integration', 'High-performance RPC protocol and ecosystem.'),

    ('Docker', 'devops', 'Containerization platform for reproducible deployments.'),
    ('Kubernetes', 'devops', 'Container orchestration platform for scalable workloads.'),
    ('Terraform', 'devops', 'Infrastructure-as-code tool for cloud resources.'),
    ('Ansible', 'devops', 'Configuration management and automation tool.'),
    ('GitHub Actions', 'devops', 'CI/CD automation built into GitHub.'),
    ('GitLab CI', 'devops', 'Integrated CI/CD pipelines from GitLab.'),
    ('Argo CD', 'devops', 'GitOps continuous delivery for Kubernetes.'),
    ('Prometheus', 'devops', 'Metrics collection and monitoring system.'),
    ('Grafana', 'devops', 'Dashboards and observability visualization platform.'),
    ('OpenTelemetry', 'devops', 'Open standard for traces, metrics, and logs.'),
    ('Sentry', 'devops', 'Error tracking and release health monitoring.'),

    ('Stripe', 'other', 'Payments and subscription infrastructure platform.'),
    ('Auth0', 'other', 'Hosted identity and authentication service.'),
    ('Keycloak', 'other', 'Open-source identity and access management solution.')
)
insert into technologies (name, category_id, description, is_active)
select
  seed.name,
  category.id,
  seed.description,
  true
from technology_seed seed
join technology_categories category on category.code = seed.category_code
on conflict (name) do update
set
  category_id = excluded.category_id,
  description = excluded.description,
  is_active = true,
  updated_at = now();

update technologies
set is_active = false,
    updated_at = now()
where lower(name) = 'dynamodb';

alter table if exists region_data_cache
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
create index if not exists idx_region_data_cache_region_code on region_data_cache (region_code);
create index if not exists idx_region_data_cache_expires_at on region_data_cache (expires_at);

create index if not exists idx_admin_audit_log_created_at on admin_audit_log (created_at desc);
