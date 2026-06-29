export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'USER'
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: User
}

export interface AwsAccount {
  id: number
  accountName: string
  accountId: string
  region: string
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'PENDING'
  description: string
  lastSyncAt: string
  createdAt: string
}

export interface DailyCost {
  serviceName: string
  date: string
  amount: number
  currency: string
}

export interface CostSummary {
  accountId: string
  monthToDateCost: number
  yesterdayCost: number
  last7DaysCost: number
  topServices: { serviceName: string; totalCost: number }[]
}

export interface Anomaly {
  id: number
  accountId: string
  serviceName: string
  costDate: string
  expectedCost: number
  actualCost: number
  increasePercentage: number
  zScore: number
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED'
  rootCause: string
  rootCauseConfidence: number
  evidence: string
  firstDetected: string
  lastDetected: string
  resolvedTime: string | null
}

export interface Recommendation {
  id: number
  anomalyId: number
  accountId: string
  serviceName: string
  rootCause: string
  rootCauseConfidence: number
  explanation: string
  recommendation: string
  estimatedMonthlySavings: number
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'PENDING' | 'ACCEPTED' | 'DISMISSED' | 'IMPLEMENTED'
  aiGenerated: boolean
  costIncreasePercentage: number
  createdAt: string
}

export interface Notification {
  id: number
  accountId: string
  subject: string
  body: string
  recipientEmail: string
  type: 'ANOMALY_ALERT' | 'RECOMMENDATION' | 'ROOT_CAUSE' | 'SYSTEM'
  status: 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED'
  triggerEvent: string
  referenceId: number
  sentAt: string | null
  createdAt: string
}

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

/** In-app realtime notification used by the notification store / toasts. */
export interface LiveNotification {
  id: string
  type: 'ANOMALY_ALERT' | 'RECOMMENDATION' | 'ROOT_CAUSE' | 'SYSTEM'
  severity: Severity | 'INFO'
  title: string
  description: string
  status: 'SENT' | 'SKIPPED'
  createdAt: string
  read: boolean
  referenceId?: string
}

export interface ServiceHealth {
  id: string
  name: string
  category: 'service' | 'gateway' | 'kafka' | 'database' | 'observability'
  status: 'UP' | 'DOWN' | 'DEGRADED'
  latencyMs: number
  uptimePct: number
  latencyHistory: number[]
}

export interface ScoreBreakdown {
  category: string
  score: number
  max: number
}

export interface RootCauseEvidence {
  id: string
  label: string
  detail: string
  weight: number
}

export interface RootCause {
  anomalyId: number
  serviceName: string
  rootCause: string
  confidence: number
  scoreBreakdown: ScoreBreakdown[]
  evidence: RootCauseEvidence[]
  timeline: { time: string; event: string }[]
  /** Per-component 0-100 scores. Keys: metricCorrelation, changePointStrength, cloudTrailEvidence, temporalAlignment. */
  confidenceBreakdown?: Record<string, number>
  metricSeries: {
    date: string
    actual: number
    expected: number
    cpu: number
    instances: number
  }[]
}
