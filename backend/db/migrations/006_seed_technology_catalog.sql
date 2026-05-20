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
