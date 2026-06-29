import type {
  AwsAccount,
  Anomaly,
  Recommendation,
  DailyCost,
  LiveNotification,
  ServiceHealth,
  RootCause,
} from '../types'

const today = new Date()
const iso = (daysAgo: number) => {
  const d = new Date(today)
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}
const isoTime = (minsAgo: number) => {
  const d = new Date(today)
  d.setMinutes(d.getMinutes() - minsAgo)
  return d.toISOString()
}

export const SERVICES = ['EC2', 'RDS', 'S3', 'Lambda', 'CloudFront', 'DynamoDB'] as const

export const DEMO_ACCOUNT_ID = '482910374651'

export const mockAccounts: AwsAccount[] = [
  {
    id: 1,
    accountName: 'Production (Demo)',
    accountId: DEMO_ACCOUNT_ID,
    region: 'us-east-1',
    status: 'ACTIVE',
    description: 'Synthetic demo account — no real AWS credentials required.',
    lastSyncAt: isoTime(4),
    createdAt: iso(180),
  },
]

// ---- Anomalies: one per AWS service ---------------------------------------
export const mockAnomalies: Anomaly[] = [
  {
    id: 101,
    accountId: DEMO_ACCOUNT_ID,
    serviceName: 'EC2',
    costDate: iso(1),
    expectedCost: 412.5,
    actualCost: 1043.2,
    increasePercentage: 152.9,
    zScore: 4.8,
    severity: 'CRITICAL',
    status: 'OPEN',
    rootCause: 'Autoscaling Event',
    rootCauseConfidence: 100,
    evidence: JSON.stringify({ rootCause: 'Autoscaling Event', confidence: 100 }),
    firstDetected: isoTime(180),
    lastDetected: isoTime(20),
    resolvedTime: null,
  },
  {
    id: 102,
    accountId: DEMO_ACCOUNT_ID,
    serviceName: 'RDS',
    costDate: iso(2),
    expectedCost: 268.0,
    actualCost: 512.4,
    increasePercentage: 91.2,
    zScore: 3.6,
    severity: 'HIGH',
    status: 'OPEN',
    rootCause: 'Instance Class Upgrade',
    rootCauseConfidence: 88,
    evidence: JSON.stringify({ rootCause: 'Instance Class Upgrade', confidence: 88 }),
    firstDetected: isoTime(2880),
    lastDetected: isoTime(120),
    resolvedTime: null,
  },
  {
    id: 103,
    accountId: DEMO_ACCOUNT_ID,
    serviceName: 'S3',
    costDate: iso(3),
    expectedCost: 94.3,
    actualCost: 188.7,
    increasePercentage: 100.1,
    zScore: 3.9,
    severity: 'HIGH',
    status: 'INVESTIGATING',
    rootCause: 'Cross-Region Replication',
    rootCauseConfidence: 82,
    evidence: JSON.stringify({ rootCause: 'Cross-Region Replication', confidence: 82 }),
    firstDetected: isoTime(4320),
    lastDetected: isoTime(300),
    resolvedTime: null,
  },
  {
    id: 104,
    accountId: DEMO_ACCOUNT_ID,
    serviceName: 'Lambda',
    costDate: iso(4),
    expectedCost: 38.2,
    actualCost: 71.9,
    increasePercentage: 88.2,
    zScore: 2.7,
    severity: 'MEDIUM',
    status: 'OPEN',
    rootCause: 'Runaway Invocation Loop',
    rootCauseConfidence: 76,
    evidence: JSON.stringify({ rootCause: 'Runaway Invocation Loop', confidence: 76 }),
    firstDetected: isoTime(5760),
    lastDetected: isoTime(600),
    resolvedTime: null,
  },
  {
    id: 105,
    accountId: DEMO_ACCOUNT_ID,
    serviceName: 'CloudFront',
    costDate: iso(6),
    expectedCost: 56.0,
    actualCost: 142.3,
    increasePercentage: 154.1,
    zScore: 4.1,
    severity: 'HIGH',
    status: 'RESOLVED',
    rootCause: 'Traffic Spike (Campaign)',
    rootCauseConfidence: 91,
    evidence: JSON.stringify({ rootCause: 'Traffic Spike (Campaign)', confidence: 91 }),
    firstDetected: isoTime(8640),
    lastDetected: isoTime(7200),
    resolvedTime: isoTime(2000),
  },
  {
    id: 106,
    accountId: DEMO_ACCOUNT_ID,
    serviceName: 'DynamoDB',
    costDate: iso(5),
    expectedCost: 47.8,
    actualCost: 63.1,
    increasePercentage: 32.0,
    zScore: 2.1,
    severity: 'LOW',
    status: 'OPEN',
    rootCause: 'On-Demand Capacity Burst',
    rootCauseConfidence: 64,
    evidence: JSON.stringify({ rootCause: 'On-Demand Capacity Burst', confidence: 64 }),
    firstDetected: isoTime(7200),
    lastDetected: isoTime(900),
    resolvedTime: null,
  },
]

// ---- Recommendations -------------------------------------------------------
export const mockRecommendations: Recommendation[] = [
  {
    id: 201,
    anomalyId: 101,
    accountId: DEMO_ACCOUNT_ID,
    serviceName: 'EC2',
    rootCause: 'Autoscaling Event',
    rootCauseConfidence: 100,
    explanation:
      'An aggressive scale-out policy added 14 m5.2xlarge instances during a transient load spike and never scaled back in. Most instances sat below 8% CPU for 6+ hours.',
    recommendation:
      '1. Lower the target-tracking CPU threshold from 35% to 55%.\n2. Add a scale-in cooldown of 300s with a step policy.\n3. Convert the baseline fleet (8 instances) to a 1-year Savings Plan.\n4. Enable predictive scaling for the daily traffic pattern.',
    estimatedMonthlySavings: 6240,
    priority: 'CRITICAL',
    status: 'PENDING',
    aiGenerated: true,
    costIncreasePercentage: 152.9,
    createdAt: iso(1),
  },
  {
    id: 202,
    anomalyId: 102,
    accountId: DEMO_ACCOUNT_ID,
    serviceName: 'RDS',
    rootCause: 'Instance Class Upgrade',
    rootCauseConfidence: 88,
    explanation:
      'The primary database was upgraded from db.r6g.large to db.r6g.2xlarge, but average connection count and IOPS did not increase materially. The larger class is over-provisioned.',
    recommendation:
      '1. Right-size back to db.r6g.xlarge based on observed load.\n2. Purchase a 1-year Reserved Instance for the steady-state workload.\n3. Enable Performance Insights to validate before/after.',
    estimatedMonthlySavings: 1980,
    priority: 'HIGH',
    status: 'PENDING',
    aiGenerated: true,
    costIncreasePercentage: 91.2,
    createdAt: iso(2),
  },
  {
    id: 203,
    anomalyId: 103,
    accountId: DEMO_ACCOUNT_ID,
    serviceName: 'S3',
    rootCause: 'Cross-Region Replication',
    rootCauseConfidence: 82,
    explanation:
      'Cross-region replication was enabled on a bucket holding 4.2 TB of infrequently accessed logs, doubling storage and adding inter-region transfer cost.',
    recommendation:
      '1. Move replicated logs to S3 Glacier Instant Retrieval.\n2. Add a lifecycle rule to expire objects after 90 days.\n3. Disable replication for the log prefix; keep it only for compliance buckets.',
    estimatedMonthlySavings: 1120,
    priority: 'HIGH',
    status: 'PENDING',
    aiGenerated: true,
    costIncreasePercentage: 100.1,
    createdAt: iso(3),
  },
  {
    id: 204,
    anomalyId: 104,
    accountId: DEMO_ACCOUNT_ID,
    serviceName: 'Lambda',
    rootCause: 'Runaway Invocation Loop',
    rootCauseConfidence: 76,
    explanation:
      'A function writing to the same DynamoDB stream it consumes created a recursive invocation loop, multiplying invocations 9x over baseline.',
    recommendation:
      '1. Add a recursion guard / event-source filter.\n2. Set a reserved concurrency cap of 50.\n3. Reduce memory from 1024 MB to 512 MB after profiling.',
    estimatedMonthlySavings: 540,
    priority: 'MEDIUM',
    status: 'PENDING',
    aiGenerated: true,
    costIncreasePercentage: 88.2,
    createdAt: iso(4),
  },
  {
    id: 205,
    anomalyId: 106,
    accountId: DEMO_ACCOUNT_ID,
    serviceName: 'DynamoDB',
    rootCause: 'On-Demand Capacity Burst',
    rootCauseConfidence: 64,
    explanation:
      'A predictable nightly batch job runs on an on-demand table. Switching to provisioned capacity with auto-scaling for that window is cheaper.',
    recommendation:
      '1. Switch the table to provisioned capacity.\n2. Configure auto-scaling 40–200 WCU for the batch window.\n3. Use reserved capacity for the steady baseline.',
    estimatedMonthlySavings: 320,
    priority: 'LOW',
    status: 'ACCEPTED',
    aiGenerated: false,
    costIncreasePercentage: 32.0,
    createdAt: iso(5),
  },
  {
    id: 206,
    anomalyId: 105,
    accountId: DEMO_ACCOUNT_ID,
    serviceName: 'CloudFront',
    rootCause: 'Traffic Spike (Campaign)',
    rootCauseConfidence: 91,
    explanation:
      'A marketing campaign drove a legitimate 3x traffic spike. Cache hit ratio sat at 61% — raising it would cut origin transfer cost on the next campaign.',
    recommendation:
      '1. Increase default TTL for static assets to 24h.\n2. Enable Origin Shield in us-east-1.\n3. Pre-warm the cache before scheduled campaigns.',
    estimatedMonthlySavings: 620,
    priority: 'MEDIUM',
    status: 'IMPLEMENTED',
    aiGenerated: true,
    costIncreasePercentage: 154.1,
    createdAt: iso(6),
  },
]

// ---- Daily costs: 30 days x 6 services -------------------------------------
const BASELINES: Record<string, number> = {
  EC2: 410,
  RDS: 265,
  S3: 95,
  Lambda: 38,
  CloudFront: 56,
  DynamoDB: 48,
}

// Deterministic pseudo-random so charts are stable across renders.
function seeded(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export const mockDailyCosts: DailyCost[] = (() => {
  const rows: DailyCost[] = []
  for (let d = 29; d >= 0; d--) {
    const date = iso(d)
    const dow = new Date(date).getDay() // weekend dip
    const weekendFactor = dow === 0 || dow === 6 ? 0.78 : 1
    SERVICES.forEach((service, si) => {
      const base = BASELINES[service]
      const wobble = 0.85 + seeded(d * 7 + si * 31) * 0.3
      let amount = base * weekendFactor * wobble
      // Inject the anomaly spikes for the matching dates.
      const anomaly = mockAnomalies.find(
        (a) => a.serviceName === service && a.costDate === date,
      )
      if (anomaly) amount = anomaly.actualCost
      rows.push({
        serviceName: service,
        date,
        amount: Math.round(amount * 100) / 100,
        currency: 'USD',
      })
    })
  }
  return rows
})()

// ---- Live notifications ----------------------------------------------------
export const mockNotifications: LiveNotification[] = [
  {
    id: 'n-1',
    type: 'ANOMALY_ALERT',
    severity: 'CRITICAL',
    title: 'Critical anomaly on EC2',
    description: 'Spend +152.9% above baseline ($1,043 vs $412). Autoscaling event suspected.',
    status: 'SENT',
    createdAt: isoTime(20),
    read: false,
    referenceId: '101',
  },
  {
    id: 'n-2',
    type: 'RECOMMENDATION',
    severity: 'INFO',
    title: 'New recommendation generated',
    description: 'EC2 right-sizing could save ~$6,240/mo.',
    status: 'SENT',
    createdAt: isoTime(35),
    read: false,
    referenceId: '201',
  },
  {
    id: 'n-3',
    type: 'ANOMALY_ALERT',
    severity: 'HIGH',
    title: 'High anomaly on RDS',
    description: 'Spend +91.2% above baseline. Instance class upgrade detected.',
    status: 'SENT',
    createdAt: isoTime(120),
    read: false,
    referenceId: '102',
  },
  {
    id: 'n-4',
    type: 'ROOT_CAUSE',
    severity: 'INFO',
    title: 'Root cause identified',
    description: 'S3 anomaly traced to cross-region replication (82% confidence).',
    status: 'SENT',
    createdAt: isoTime(300),
    read: true,
    referenceId: '103',
  },
  {
    id: 'n-5',
    type: 'ANOMALY_ALERT',
    severity: 'MEDIUM',
    title: 'Medium anomaly on Lambda',
    description: 'Invocation loop multiplied spend 9x over baseline.',
    status: 'SENT',
    createdAt: isoTime(600),
    read: true,
    referenceId: '104',
  },
  {
    id: 'n-6',
    type: 'SYSTEM',
    severity: 'INFO',
    title: 'Cost sync complete',
    description: 'Pulled 30 days of Cost Explorer data across 6 services.',
    status: 'SENT',
    createdAt: isoTime(240),
    read: true,
  },
  {
    id: 'n-7',
    type: 'ANOMALY_ALERT',
    severity: 'LOW',
    title: 'Low anomaly on DynamoDB',
    description: 'On-demand capacity burst, +32% over baseline.',
    status: 'SKIPPED',
    createdAt: isoTime(900),
    read: true,
    referenceId: '106',
  },
  {
    id: 'n-8',
    type: 'RECOMMENDATION',
    severity: 'INFO',
    title: 'CloudFront optimization implemented',
    description: 'Origin Shield enabled. Estimated $620/mo saved on next campaign.',
    status: 'SENT',
    createdAt: isoTime(2000),
    read: true,
    referenceId: '206',
  },
]

// ---- Microservice health ---------------------------------------------------
function latencyHistory(base: number, seed: number): number[] {
  return Array.from({ length: 20 }, (_, i) =>
    Math.round(base + (seeded(seed * 13 + i) - 0.5) * base * 0.4),
  )
}

export const mockServiceHealth: ServiceHealth[] = [
  { id: 'auth', name: 'auth-service', category: 'service', status: 'UP', latencyMs: 42, uptimePct: 99.98, latencyHistory: latencyHistory(42, 1) },
  { id: 'cost', name: 'cost-service', category: 'service', status: 'UP', latencyMs: 58, uptimePct: 99.95, latencyHistory: latencyHistory(58, 2) },
  { id: 'analytics', name: 'analytics-service', category: 'service', status: 'UP', latencyMs: 73, uptimePct: 99.91, latencyHistory: latencyHistory(73, 3) },
  { id: 'reco', name: 'recommendation-service', category: 'service', status: 'UP', latencyMs: 64, uptimePct: 99.93, latencyHistory: latencyHistory(64, 4) },
  { id: 'notif', name: 'notification-service', category: 'service', status: 'UP', latencyMs: 39, uptimePct: 99.97, latencyHistory: latencyHistory(39, 5) },
  { id: 'gateway', name: 'api-gateway', category: 'gateway', status: 'UP', latencyMs: 28, uptimePct: 99.99, latencyHistory: latencyHistory(28, 6) },
  { id: 'kafka', name: 'kafka', category: 'kafka', status: 'UP', latencyMs: 12, uptimePct: 99.99, latencyHistory: latencyHistory(12, 7) },
  { id: 'pg-auth', name: 'postgres (auth)', category: 'database', status: 'UP', latencyMs: 8, uptimePct: 99.99, latencyHistory: latencyHistory(8, 8) },
  { id: 'pg-cost', name: 'postgres (cost)', category: 'database', status: 'UP', latencyMs: 9, uptimePct: 99.99, latencyHistory: latencyHistory(9, 9) },
  { id: 'pg-analytics', name: 'postgres (analytics)', category: 'database', status: 'UP', latencyMs: 11, uptimePct: 99.98, latencyHistory: latencyHistory(11, 10) },
  { id: 'pg-reco', name: 'postgres (reco)', category: 'database', status: 'UP', latencyMs: 10, uptimePct: 99.99, latencyHistory: latencyHistory(10, 11) },
  { id: 'pg-notif', name: 'postgres (notif)', category: 'database', status: 'UP', latencyMs: 9, uptimePct: 99.99, latencyHistory: latencyHistory(9, 12) },
  { id: 'prometheus', name: 'prometheus', category: 'observability', status: 'UP', latencyMs: 18, uptimePct: 99.96, latencyHistory: latencyHistory(18, 13) },
  { id: 'grafana', name: 'grafana', category: 'observability', status: 'UP', latencyMs: 24, uptimePct: 99.95, latencyHistory: latencyHistory(24, 14) },
]

// ---- Root cause graphs (one per anomaly) -----------------------------------
function buildRootCause(a: Anomaly, opts: {
  scoreBreakdown: { category: string; score: number; max: number }[]
  evidence: { id: string; label: string; detail: string; weight: number }[]
  cpu: number
  instances: number
}): RootCause {
  const series = Array.from({ length: 14 }, (_, i) => {
    const day = 13 - i
    const isSpike = day <= 1
    return {
      date: iso(day),
      expected: Math.round(a.expectedCost * (0.92 + seeded(i) * 0.16) * 100) / 100,
      actual: isSpike
        ? Math.round(a.actualCost * 100) / 100
        : Math.round(a.expectedCost * (0.9 + seeded(i + 5) * 0.2) * 100) / 100,
      cpu: isSpike ? opts.cpu : Math.round(20 + seeded(i + 9) * 25),
      instances: isSpike ? opts.instances : Math.round(opts.instances * 0.5),
    }
  })
  return {
    anomalyId: a.id,
    serviceName: a.serviceName,
    rootCause: a.rootCause,
    confidence: a.rootCauseConfidence,
    scoreBreakdown: opts.scoreBreakdown,
    evidence: opts.evidence,
    timeline: [
      { time: isoTime(220), event: 'Cost crossed +2σ threshold' },
      { time: isoTime(200), event: 'Z-score escalated to ' + a.zScore.toFixed(1) },
      { time: isoTime(180), event: 'Anomaly opened, severity ' + a.severity },
      { time: isoTime(160), event: 'Evidence graph scored (' + a.rootCauseConfidence + '/100)' },
      { time: isoTime(150), event: 'Root cause: ' + a.rootCause },
    ],
    metricSeries: series,
  }
}

export const mockRootCauses: Record<number, RootCause> = {
  101: buildRootCause(mockAnomalies[0], {
    scoreBreakdown: [
      { category: 'Metric Correlation (30%)', score: 30, max: 30 },
      { category: 'Change-Point Strength (25%)', score: 25, max: 25 },
      { category: 'CloudTrail Evidence (25%)', score: 25, max: 25 },
      { category: 'Temporal Alignment (20%)', score: 20, max: 20 },
    ],
    evidence: [
      { id: 'e1', label: 'Instance count +14', detail: 'm5.2xlarge fleet grew 8 → 22 at 02:14 UTC (Pearson r=0.97 with cost)', weight: 32 },
      { id: 'e2', label: 'CPU < 8%', detail: 'Change point detected at index 3 — idle instances post scale-out', weight: 28 },
      { id: 'e3', label: 'ScaleOut CloudTrail event', detail: 'Target-tracking @ 35% CPU triggered on a transient spike', weight: 24 },
      { id: 'e4', label: 'Tight temporal alignment', detail: 'ScaleOut event 4 min before cost spike (score 100/100)', weight: 16 },
    ],
    cpu: 7,
    instances: 22,
  }),
  102: buildRootCause(mockAnomalies[1], {
    scoreBreakdown: [
      { category: 'Metric Correlation (30%)', score: 25, max: 30 },
      { category: 'Change-Point Strength (25%)', score: 22, max: 25 },
      { category: 'CloudTrail Evidence (25%)', score: 23, max: 25 },
      { category: 'Temporal Alignment (20%)', score: 18, max: 20 },
    ],
    evidence: [
      { id: 'e1', label: 'Class upgraded', detail: 'db.r6g.large → db.r6g.2xlarge via ModifyDBInstance (Pearson r=0.83)', weight: 30 },
      { id: 'e2', label: 'Step change detected', detail: 'Instance cost change point at upgrade timestamp, strength 88/100', weight: 22 },
      { id: 'e3', label: 'Flat IOPS post-upgrade', detail: 'IOPS unchanged — upgrade not justified by workload', weight: 20 },
    ],
    cpu: 34,
    instances: 1,
  }),
  103: buildRootCause(mockAnomalies[2], {
    scoreBreakdown: [
      { category: 'Metric Correlation (30%)', score: 22, max: 30 },
      { category: 'Change-Point Strength (25%)', score: 21, max: 25 },
      { category: 'CloudTrail Evidence (25%)', score: 22, max: 25 },
      { category: 'Temporal Alignment (20%)', score: 17, max: 20 },
    ],
    evidence: [
      { id: 'e1', label: 'CRR enabled', detail: 'PutBucketReplication on logs bucket (Pearson r=0.73)', weight: 28 },
      { id: 'e2', label: 'Storage change point', detail: '+4.2 TB spike — rolling window prev=1.1TB, curr=5.3TB', weight: 24 },
      { id: 'e3', label: 'Inter-region transfer', detail: 'New cross-region data transfer charges, strength 84/100', weight: 18 },
    ],
    cpu: 0,
    instances: 0,
  }),
  104: buildRootCause(mockAnomalies[3], {
    scoreBreakdown: [
      { category: 'Metric Correlation (30%)', score: 20, max: 30 },
      { category: 'Change-Point Strength (25%)', score: 19, max: 25 },
      { category: 'CloudTrail Evidence (25%)', score: 21, max: 25 },
      { category: 'Temporal Alignment (20%)', score: 16, max: 20 },
    ],
    evidence: [
      { id: 'e1', label: 'Invocations 9x', detail: 'Recursive stream loop — Pearson r=0.68 with cost rise', weight: 26 },
      { id: 'e2', label: 'Change point at deploy', detail: 'Invocation spike at 76/100 strength, index 4 in time series', weight: 20 },
      { id: 'e3', label: 'No concurrency cap', detail: 'Unbounded reserved concurrency — InvokeFunction event confirmed', weight: 18 },
    ],
    cpu: 0,
    instances: 0,
  }),
  105: buildRootCause(mockAnomalies[4], {
    scoreBreakdown: [
      { category: 'Metric Correlation (30%)', score: 27, max: 30 },
      { category: 'Change-Point Strength (25%)', score: 23, max: 25 },
      { category: 'CloudTrail Evidence (25%)', score: 23, max: 25 },
      { category: 'Temporal Alignment (20%)', score: 18, max: 20 },
    ],
    evidence: [
      { id: 'e1', label: 'Requests 3x', detail: 'Campaign launch — Pearson r=0.90 with cost signal', weight: 30 },
      { id: 'e2', label: 'Request change point', detail: 'Rolling window: prev avg 1.2M req/min, curr avg 3.7M req/min', weight: 22 },
      { id: 'e3', label: 'Cache hit 61%', detail: 'Low TTL caused origin pulls — corroborated by CloudFront event', weight: 22 },
    ],
    cpu: 0,
    instances: 0,
  }),
  106: buildRootCause(mockAnomalies[5], {
    scoreBreakdown: [
      { category: 'Metric Correlation (30%)', score: 17, max: 30 },
      { category: 'Change-Point Strength (25%)', score: 15, max: 25 },
      { category: 'CloudTrail Evidence (25%)', score: 18, max: 25 },
      { category: 'Temporal Alignment (20%)', score: 14, max: 20 },
    ],
    evidence: [
      { id: 'e1', label: 'WCU burst', detail: 'Nightly batch consumed on-demand capacity (Pearson r=0.57)', weight: 18 },
      { id: 'e2', label: 'Predictable window', detail: 'Change point recurs 02:00–03:00 UTC, strength 60/100', weight: 16 },
    ],
    cpu: 0,
    instances: 0,
  }),
}

// ---- Aggregate helpers used by pages --------------------------------------
export const mockSummary = {
  accountId: DEMO_ACCOUNT_ID,
  monthToDateCost: 18743,
  yesterdayCost: 2840,
  last7DaysCost: 19880,
  projectedMonthEnd: 21200,
  topServices: SERVICES.map((s) => ({
    serviceName: s,
    totalCost:
      Math.round(
        mockDailyCosts
          .filter((c) => c.serviceName === s)
          .reduce((a, c) => a + c.amount, 0) * 100,
      ) / 100,
  })).sort((a, b) => b.totalCost - a.totalCost),
}

export const mockSavings = {
  potentialMonthlySavings: mockRecommendations
    .filter((r) => r.status === 'PENDING' || r.status === 'ACCEPTED')
    .reduce((a, r) => a + r.estimatedMonthlySavings, 0),
  highPriorityCount: mockRecommendations.filter(
    (r) => (r.priority === 'HIGH' || r.priority === 'CRITICAL') && r.status === 'PENDING',
  ).length,
  pendingCount: mockRecommendations.filter((r) => r.status === 'PENDING').length,
}
