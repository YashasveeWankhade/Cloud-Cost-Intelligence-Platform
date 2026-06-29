# ☁ Cloud Cost Intelligence Platform

> A production-grade, microservices-based SaaS platform for real-time cloud cost monitoring, anomaly detection, root cause analysis, and AI-assisted optimization. Interview-ready for Backend Engineer, Platform Engineer, DevOps, and Cloud Engineer roles.

---

## Architecture Overview

```
<img width="1024" height="559" alt="image" src="https://github.com/user-attachments/assets/a710fd02-a57e-463f-b06b-e284d3f89ec6" />

```

## Microservices

| Service | Port | Database | Responsibilities |
|---------|------|----------|-----------------|
| API Gateway | 8080 | — | Routing, JWT auth, rate limiting |
| Auth Service | 8081 | auth_db | Registration, login, JWT, refresh tokens |
| Cost Service | 8082 | cost_db | AWS integration, data collection, simulation |
| Analytics Service | 8083 | analytics_db | Anomaly detection, root cause engine |
| Recommendation Service | 8084 | recommendation_db | Gemini AI recommendations |
| Notification Service | 8085 | notification_db | Kafka consumer → SSE broadcast → browser |
| Frontend | 3000 | — | React dashboard |

## Technology Stack

**Backend:** Java 21 · Spring Boot 3.2 · Spring Security · Spring Data JPA · Spring Cloud Gateway  
**Databases:** PostgreSQL (one per service — no shared databases)  
**Messaging:** Apache Kafka (3 partitions per topic, event-driven)  
**Real-time:** Server-Sent Events (SSE) via `SseEmitter` — Kafka events streamed to browser  
**Frontend:** React 18 · TypeScript · Vite 5 · Material UI 5 · Tailwind CSS v4 · Zustand · React Query · Recharts  
**UI Components:** shadcn/ui pattern (`src/components/ui/`) · Radix UI primitives · lucide-react  
**Observability:** Prometheus · Grafana · Spring Boot Actuator  
**AI:** Gemini API (explain findings, generate recommendations, summarize causes — never detects anomalies)  
**Infrastructure:** Docker · Docker Compose  

---

## Quick Start

### Prerequisites
- Docker Desktop 24+
- 8 GB RAM (16 GB recommended)

### 1. Configure Environment
```bash
git clone <repo>
cd cloud-cost-intelligence

# Create your local secrets file (git-ignored)
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET to a random 64-char string
# GEMINI_API_KEY and MAIL_* are optional
```

### 2. Start the Platform
```bash
docker compose up --build
# docker compose auto-loads .env from the project root
```

### 3. Access the Dashboard
- **Dashboard:** http://localhost:3000
- **API Gateway:** http://localhost:8080
- **Grafana:** http://localhost:3001 (admin/admin)
- **Prometheus:** http://localhost:9090

### 4. Log In (Demo Mode)
```
Email:    demo@cloudcost.io
Password: demo123456
```
No AWS account required. All data is synthetic.

### 5. Initialize Demo Data
In the Dashboard → click **"Initialize Demo Environment"** on the Overview page.

This generates:
- 6 months of historical cost data for 6 AWS services
- Injected anomalies (one per service) in the last 15-25 days
- CloudWatch metrics correlated with cost changes
- CloudTrail events aligned with anomalies
- Root cause analysis results
- AI-generated optimization recommendations

---

## Frontend

### Pages

| Route | Page | Description |
|-------|------|-------------|
| `/app/overview` | Overview | MTD spend, anomaly count, savings, cost trend chart |
| `/app/analytics` | Cost Analytics | Interactive time-series, service breakdown, day-of-week heatmap |
| `/app/anomalies` | Anomalies | Table/card view with severity filters and status tracking |
| `/app/root-cause` | Root Cause Analysis | Evidence scoring, confidence bar, actual vs expected charts |
| `/app/recommendations` | Recommendations | AI-ranked cost actions with accept/dismiss tracking |
| `/app/universe` | Cost Universe | Sortable service table with spend share and 7-day sparklines |
| `/app/accounts` | AWS Accounts | Connect/disconnect accounts, sync status |
| `/app/notifications` | Notifications | Real-time SSE alert stream, severity filter tabs |
| `/app/profile` | Profile | Avatar, display name, email, timezone, account details |
| `/app/settings` | Settings | Notification preferences and password change |
| `/login` | Login | ASMR canvas background, glassmorphism card |

### Key Frontend Components

```
frontend/src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx          Collapsible nav with badges
│   │   ├── TopBar.tsx           Breadcrumb, search, avatar menu
│   │   ├── StatusBar.tsx        Kafka/SSE connection status
│   │   └── RightPanel.tsx       Slide-in detail drawer
│   └── ui/
│       ├── asmr-background.tsx  Canvas particle animation (fixed, z=0)
│       ├── bento-grid.tsx       Shadcn-style bento card grid
│       ├── button.tsx           shadcn Button (cva variants)
│       ├── input.tsx            shadcn Input
│       ├── label.tsx            shadcn Label (Radix)
│       ├── select.tsx           shadcn Select (Radix)
│       ├── MetricCard.tsx       Animated KPI card with sparkline
│       └── SeverityChip.tsx     Color-coded severity badge
├── hooks/
│   └── useRealtimeEvents.ts     EventSource SSE hook with reconnect backoff
├── pages/                       One file per route
├── store/                       Zustand (UI, notifications, system, cost filters)
├── api/                         React Query wrappers + mock data
└── lib/
    └── utils.ts                 cn() — clsx + tailwind-merge
```

### Real-Time Pipeline

```
Kafka topic (anomaly-events / recommendation-events)
    └── EventConsumer.java (Notification Service)
        └── SseService.broadcast(type, payload)
            └── SseEmitter per connected client
                └── EventSource in browser (useRealtimeEvents.ts)
                    ├── toast for HIGH/CRITICAL anomalies
                    ├── Zustand notification store update
                    └── kafkaConnected status in StatusBar
```

- **Heartbeat:** `@Scheduled(fixedDelay = 30_000)` ping to keep SSE alive through proxies
- **Demo mode:** `isDemoMode()` bypasses SSE and uses `setInterval` simulation
- **Reconnect:** exponential backoff up to 30 s on connection drop

### Tailwind + MUI Coexistence

The project runs **Tailwind CSS v4** alongside **Material UI 5**:

- MUI handles all component styles (theme, dark mode, Card, Button, etc.)
- Tailwind handles utility classes in shadcn-pattern components and the login page
- `postcss.config.js` uses `@tailwindcss/postcss` (v4 moved the plugin to a separate package)
- `index.css` uses `@import "tailwindcss"` + `@theme {}` (v4 syntax — no `@tailwind` directives)
- `html` tag has `class="dark"` so Tailwind dark-mode variants work
- `@` alias maps to `src/` in both `vite.config.ts` and `tsconfig.json`

---

## Kafka Event Flow

```
Cost Service                Analytics Service         Recommendation Service
     │                            │                           │
     │──── CostDataCollected ────►│                           │
     │          cost-data         │                           │
     │                            │──── ANOMALY_DETECTED ────►│
     │                            │      anomaly-events       │
     │                            │                           │──── RECOMMENDATION_CREATED
     │                            │                           │      recommendation-events
     │                            │                           │
     │                       Notification Service             │
     │                            │◄──── HIGH/CRITICAL ───────┘
     │                            │      anomaly-events
     │                            │
     │                            │──── SSE broadcast ───────► Browser
```

### Kafka Topics
| Topic | Producer | Consumer | Event Types |
|-------|----------|----------|-------------|
| `cost-data` | Cost Service | Analytics | CostDataCollected |
| `anomaly-events` | Analytics | Recommendation, Notification | ANOMALY_DETECTED |
| `recommendation-events` | Recommendation | Notification | RECOMMENDATION_CREATED |

---

## Anomaly Detection Algorithm

**Deterministic only — no AI, fully reproducible and auditable.**

```
Step 1: Build historical baselines
   └── 7-day moving average per service per account
   └── 30-day moving average per service per account
   └── Use more conservative (lower) baseline

Step 2: Calculate percentage increase
   formula: (current - baseline) / baseline

Step 3: Calculate Z-score
   formula: (current - mean) / std_deviation
   require: z_score >= 2.0 for statistical significance

Step 4: Apply severity thresholds
   LOW      ≥ 1.5x   (50% above baseline)
   MEDIUM   ≥ 2.0x   (100% above baseline)
   HIGH     ≥ 3.0x   (200% above baseline)
   CRITICAL ≥ 5.0x   (400% above baseline)

Step 5: Generate anomaly record + publish Kafka event
```

---

## Root Cause Analysis

**Full time-series analysis — deterministic math, no AI, no hardcoded service rules.**

### Confidence Model (4 components, weighted)

| Component | Weight | How it's computed |
|-----------|--------|-------------------|
| Metric Correlation | 30% | Pearson r between each metric time-series and a synthetic cost proxy signal (baseline→actual ramp) |
| Change-Point Strength | 25% | Identifies the single index that maximises `\|mean(right) − mean(left)\| / mean(left)` across all candidate splits; log-scaled to 0–100 |
| CloudTrail Evidence | 25% | 0 if no matching events; +40 base, +type bonus (ScaleOut=35, RunInstances=30, etc.), +10 for multiple corroborating events |
| Temporal Alignment | 20% | 0–100 score based on how tightly the CloudTrail event precedes the cost spike (100 = within 5 min, 20 = event after anomaly) |

```
confidence = (pearsonScore × 0.30)
           + (changePointStrength × 0.25)
           + (cloudTrailScore × 0.25)
           + (temporalScore × 0.20)
```

### Per-Metric Analysis Pipeline

```
For each CloudWatch metric time-series:
  1. Rolling window  — split into two halves, compare avg before vs avg after
  2. Change-point    — find index of most abrupt regime shift
  3. Pearson r       — correlate metric against cost proxy (expectedCost → actualCost ramp)

A metric is anomalous if ANY of:
  • Rolling window change  > 30%
  • Pearson r              > 0.6
  • Change-point strength  > 40 / 100
```

### Output
```json
{
  "rootCause": "ScaleOut",
  "confidence": 91.0,
  "confidenceBreakdown": {
    "metricCorrelation":   85.0,
    "changePointStrength": 94.0,
    "cloudTrailEvidence":  90.0,
    "temporalAlignment":   100.0
  },
  "evidence": [
    { "type": "COST_INCREASE",       "description": "Cost increased 4.0x above baseline ($312 → $1248)" },
    { "type": "METRIC_ANOMALY",      "description": "InstanceCount: 175% increase, Pearson r=0.97, change-point strength=94/100",
                                     "correlationScore": 0.97, "changePointMagnitude": 94.0 },
    { "type": "INFRASTRUCTURE_EVENT","description": "ScaleOut on EC2 (2 events corroborated)" },
    { "type": "TIMING_ALIGNMENT",    "description": "Infrastructure event precedes cost spike — temporal alignment score: 100/100" }
  ],
  "timeline": [
    { "time": "2024-01-15T02:08:00", "event": "CloudTrail event: ScaleOut (source: autoscaling.amazonaws.com)" },
    { "time": "2024-01-15T02:10:00", "event": "InstanceCount change point: 2.8x shift detected (Pearson r=0.97 with cost)" },
    { "time": "2024-01-15",          "event": "Cost spike detected: $1248.00 vs expected $312.00 (4.0x above baseline)" }
  ]
}

---

## Cloud Provider Abstraction

```java
interface CloudProvider {
    String getName();
    boolean validateCredentials(accountId, accessKey, secretKey);
    List<CostDataResult> fetchCostData(accountId, start, end);
    List<MetricDataResult> fetchMetrics(accountId, serviceName, start, end);
    List<TrailEventResult> fetchTrailEvents(accountId, start, end);
}

// Implementations:
MockCloudProvider  // default — generates synthetic data, no AWS account needed
AwsCloudProvider   // activate via cloud.provider=aws
```

Switch with `cloud.provider=mock` (default) or `cloud.provider=aws`.

---

## Simulation Mode

### Service Cost Profiles
| Service | Normal Range | Anomaly Cause | Anomaly Multiplier |
|---------|-------------|---------------|-------------------|
| EC2 | $250-350/day | Autoscaling Event | 4x |
| RDS | $80-120/day | Read Replica Creation | 7x |
| S3 | $40-70/day | Massive Backup Upload | 10x |
| Lambda | $10-50/day | Invocation Growth | 12.5x |
| CloudFront | $20-80/day | Traffic Spike | 10x |
| DynamoDB | $15-60/day | Capacity Burst | 6x |

### Anomaly Injection
Each service gets one injected anomaly in the last 15-25 days, staggered by 3 days. Each injected anomaly has:
- A hidden `injectedCause` field (ground truth for validation)
- Correlated CloudWatch metric spikes
- A matching CloudTrail event with temporal alignment

---

## Database Schemas

### auth_db
```sql
users           (id, email, password, firstName, lastName, role, enabled, createdAt)
refresh_tokens  (id, token, user_id, expiresAt, revoked, createdAt)
```

### cost_db
```sql
aws_accounts       (id, accountName, accountId, region, status, accessKeyId, ownerId, lastSyncAt)
daily_costs        (id, accountId, serviceName, costDate, amount, currency, region)
cloudwatch_metrics (id, accountId, serviceName, metricName, metricValue, unit, timestamp)
cloudtrail_events  (id, accountId, eventType, serviceName, resourceId, metadata, injectedCause, timestamp)
```

### analytics_db
```sql
cost_anomalies (id, accountId, serviceName, costDate, expectedCost, actualCost,
                increasePercentage, zScore, severity, status, rootCause,
                rootCauseConfidence, evidence, firstDetected, resolvedTime)
```

### recommendation_db
```sql
recommendations (id, anomalyId, accountId, serviceName, rootCause, explanation,
                 recommendation, estimatedMonthlySavings, priority, status, aiGenerated)
```

### notification_db
```sql
notifications (id, accountId, subject, body, recipientEmail, type, status, triggerEvent, sentAt)
```

---

## REST API Reference

### Auth Service (via Gateway)
```
POST /auth/register      Register new user
POST /auth/login         Login, receive JWT + refresh token
POST /auth/refresh       Refresh access token
GET  /auth/me            Get current user profile
```

### Cost Service
```
POST /api/costs/accounts              Connect AWS account
GET  /api/costs/accounts              List connected accounts
DELETE /api/costs/accounts/{id}       Disconnect account
POST /api/costs/accounts/{id}/refresh Trigger data refresh
GET  /api/costs/summary/{accountId}   Cost summary (MTD, yesterday, 7-day)
GET  /api/costs/daily/{accountId}     Daily costs by service (date range)
GET  /api/costs/metrics/{accountId}   CloudWatch metrics
GET  /api/costs/trail/{accountId}     CloudTrail events
POST /api/demo/initialize             Initialize demo environment
```

### Analytics Service
```
GET /api/analytics/anomalies          All anomalies
GET /api/analytics/anomalies/open     Open anomalies
GET /api/analytics/anomalies/stats    Counts
PUT /api/analytics/anomalies/{id}/resolve  Resolve anomaly
```

### Recommendation Service
```
GET /api/recommendations              All recommendations
GET /api/recommendations/savings      Total potential savings
PUT /api/recommendations/{id}/status  Update status
```

### Notification Service
```
GET /api/notifications                        All notifications
GET /api/notifications/account/{id}           By account
GET /api/notifications/stream?token={jwt}     SSE stream (EventSource)
```

The SSE stream emits:
- `event: connected` — on first connect
- `event: anomaly` — when anomaly-events consumed from Kafka
- `event: recommendation` — when recommendation-events consumed from Kafka
- `event: ping` — heartbeat every 30 s to keep connection alive

---

## Observability

Every service exposes:
- `GET /actuator/health` — liveness and readiness
- `GET /actuator/prometheus` — Prometheus metrics

### Key Metrics
- `http_server_requests_seconds` — request latency per endpoint
- `spring_kafka_listener_seconds` — Kafka consumer lag
- `hikaricp_connections` — DB connection pool
- `jvm_memory_used_bytes` — JVM heap usage
- Custom: `anomaly.count`, `recommendation.count`

### Grafana
Pre-configured at http://localhost:3001 with dashboards for all services.

---

## AI Integration (Gemini)

**AI is ONLY used for:**
- Plain English explanation of what happened
- Specific optimization recommendations
- Estimated savings range

**AI never:**
- Detects anomalies (deterministic engine handles this)
- Generates confidence scores
- Makes financial decisions

**Fallback:** If `GEMINI_API_KEY` is not set or set to `demo-key`, the platform uses rule-based recommendation templates that are still high quality and service-specific.

---

## Testing

```bash
# Run all tests for analytics service
cd analytics-service
mvn test

# Run all tests for auth service
cd auth-service
mvn test

# Run all tests for cost service
cd cost-service
mvn test
```

### Test Coverage
- `AnomalyDetectionEngineTest` — all severity levels, false positive prevention, Z-score validation
- `SyntheticDataGeneratorTest` — data volume, anomaly injection, positive amounts
- `AuthServiceTest` — registration, duplicate email, login flow

---

## Frontend Development (without Docker)

```bash
cd frontend
npm install
npm run dev       # http://localhost:3000
```

The frontend runs fully in **demo mode** when no backend is present:
- `localStorage.getItem('accessToken') === 'demo-token'` triggers mock data paths
- All API calls return synthetic data from `src/api/mockData.ts`
- SSE is simulated with `setInterval` (anomaly every 45 s, health every 30 s)
- Login with `demo@cloudcost.io` / `demo123456`

### Frontend Dependencies
```
Core:           react, react-dom, react-router-dom, typescript, vite
UI:             @mui/material, @mui/icons-material, @emotion/react
Tailwind:       tailwindcss, @tailwindcss/postcss, postcss
shadcn/Radix:   @radix-ui/react-slot, @radix-ui/react-label,
                @radix-ui/react-select, @radix-ui/react-checkbox,
                @radix-ui/react-separator, class-variance-authority,
                clsx, tailwind-merge, lucide-react
Charts:         recharts, @nivo/pie
State:          zustand, @tanstack/react-query
Animation:      framer-motion
Utils:          date-fns, dayjs, react-hot-toast
```

---

## Project Structure

```
cloud-cost-intelligence/
├── api-gateway/                 Spring Cloud Gateway
├── auth-service/                JWT auth, users, refresh tokens
├── cost-service/                AWS integration, simulation engine
│   └── provider/                CloudProvider abstraction
│   └── simulator/               SyntheticDataGenerator + AnomalyInjection
├── analytics-service/           Anomaly detection + root cause engine
│   └── engine/                  AnomalyDetectionEngine + RootCauseEngine
├── recommendation-service/      Gemini AI recommendations
├── notification-service/        Kafka consumer → SSE broadcast
│   └── SseService.java          SseEmitter registry + heartbeat
│   └── EventConsumer.java       @KafkaListener → sseService.broadcast()
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/          Sidebar, TopBar, StatusBar, RightPanel
│   │   │   └── ui/              shadcn components + ASMR canvas background
│   │   ├── pages/               One file per route (11 pages)
│   │   ├── hooks/
│   │   │   └── useRealtimeEvents.ts  SSE EventSource + demo fallback
│   │   ├── store/               Zustand stores (UI, notifications, system)
│   │   ├── api/                 React Query wrappers + mockData
│   │   ├── lib/utils.ts         cn() helper
│   │   └── utils/theme.ts       MUI dark theme (10% transparent cards)
│   ├── index.html               class="dark" for Tailwind dark mode
│   ├── tailwind.config.js       content paths
│   ├── postcss.config.js        @tailwindcss/postcss (v4)
│   └── vite.config.ts           @ alias → src/
├── infrastructure/
│   ├── prometheus/              prometheus.yml
│   └── grafana/                 Dashboards + provisioning
├── docs/                        Architecture diagrams
└── docker-compose.yml           Full platform in one command
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CLOUD_PROVIDER` | `mock` | `mock` or `aws` |
| `GEMINI_API_KEY` | `demo-key` | Google Gemini API key |
| `GEMINI_ENABLED` | `false` | Enable real Gemini calls |
| `MAIL_ENABLED` | `false` | Enable email notifications |
| `MAIL_HOST` | `smtp.gmail.com` | SMTP host |
| `MAIL_USERNAME` | — | SMTP username |
| `MAIL_PASSWORD` | — | SMTP password |
| `JWT_SECRET` | (set in compose) | JWT signing key |

---

## Future Evolution

### Phase 1 — Current (Implemented)
- Microservices with Docker Compose
- Simulation mode with synthetic data
- Deterministic anomaly detection (dual 7/30-day MA + Z-score gate + 4-tier severity)
- Root cause engine: Pearson correlation, change-point detection, rolling window analysis, temporal alignment scoring — 4-component weighted confidence model
- AI-assisted recommendations (Gemini)
- Real-time SSE pipeline (Kafka → browser)
- React dashboard with 11 pages, ASMR background, glassmorphism UI

### Phase 2 — Kubernetes
- Helm charts for each service
- Kubernetes Deployments, Services, ConfigMaps, Secrets
- Horizontal Pod Autoscaler (HPA)
- Ingress with cert-manager (TLS)
- Persistent Volumes for databases

### Phase 3 — Scale
- HPA based on Kafka consumer lag
- KEDA for event-driven scaling
- Kafka cluster with 3 brokers (replication factor 3)
- PostgreSQL with read replicas
- Redis for caching and rate limiting

### Phase 4 — Multi-Cloud
- `AzureCloudProvider` — Cost Management API, Azure Monitor
- `GcpCloudProvider` — Cloud Billing API, Cloud Monitoring
- Unified cost normalization layer
- Multi-cloud cost comparison dashboard

### Phase 5 — Advanced ML
- Time series anomaly detection (Prophet / Isolation Forest)
- Predictive cost forecasting
- Automated rightsizing recommendations
- Budget optimization engine

---

Built with Java 21, Spring Boot 3.2, Apache Kafka, PostgreSQL, React 18, Material UI 5, Tailwind CSS v4, Prometheus, Grafana, and Docker.
