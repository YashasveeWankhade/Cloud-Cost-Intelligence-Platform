import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { useNotificationStore, useSystemStore } from '../store'
import { isDemoMode } from '../api/client'
import type { LiveNotification } from '../types'

const TOAST_STYLE = {
  background: '#141c35',
  color: '#f1f5f9',
  border: '1px solid rgba(255,255,255,0.08)',
  fontSize: 13,
  maxWidth: 380,
}

const DEMO_TEMPLATES: Omit<LiveNotification, 'id' | 'createdAt' | 'read'>[] = [
  { type: 'ANOMALY_ALERT', severity: 'MEDIUM', title: 'Anomaly detected on Lambda', description: 'Invocation rate climbing above baseline (+41%).', status: 'SENT' },
  { type: 'ANOMALY_ALERT', severity: 'HIGH', title: 'Anomaly detected on RDS', description: 'Read IOPS surge driving spend +66% over expected.', status: 'SENT' },
  { type: 'RECOMMENDATION', severity: 'INFO', title: 'New recommendation generated', description: 'S3 lifecycle policy could save ~$310/mo.', status: 'SENT' },
  { type: 'SYSTEM', severity: 'INFO', title: 'Cost sync complete', description: 'Refreshed Cost Explorer data for 6 services.', status: 'SENT' },
]

function showToast(notif: LiveNotification) {
  const fn =
    notif.severity === 'CRITICAL' || notif.severity === 'HIGH'
      ? toast.error
      : notif.type === 'RECOMMENDATION'
        ? toast.success
        : toast
  fn(`${notif.title} — ${notif.description}`, { duration: 5000, position: 'bottom-right', style: TOAST_STYLE })
}

function makeNotification(partial: Omit<LiveNotification, 'id' | 'createdAt' | 'read'>): LiveNotification {
  return { ...partial, id: `live-${Date.now()}`, createdAt: new Date().toISOString(), read: false }
}

/**
 * Real mode: connects to /api/notifications/stream (SSE from the notification-service via API Gateway).
 * Receives "anomaly" and "recommendation" events from Kafka in real time.
 *
 * Demo mode: falls back to timed fake events so the UI stays lively without a backend.
 */
export function useRealtimeEvents() {
  const addNotification = useNotificationStore((s) => s.addNotification)
  const setKafkaConnected = useSystemStore((s) => s.setKafkaConnected)
  const setServicesHealthy = useSystemStore((s) => s.setServicesHealthy)
  const setLastSyncTime = useSystemStore((s) => s.setLastSyncTime)
  const counter = useRef(0)
  const backoffRef = useRef(1000)

  useEffect(() => {
    if (isDemoMode()) {
      // ── Demo simulation ──────────────────────────────────────────────────
      const notifTimer = setInterval(() => {
        const tmpl = DEMO_TEMPLATES[counter.current % DEMO_TEMPLATES.length]
        counter.current += 1
        const notif = makeNotification(tmpl)
        addNotification(notif)
        showToast(notif)
      }, 45_000)

      const healthTimer = setInterval(() => {
        setServicesHealthy(Math.random() < 0.12 ? 5 : 6)
      }, 30_000)

      const syncTimer = setInterval(() => setLastSyncTime(new Date()), 60_000)

      return () => {
        clearInterval(notifTimer)
        clearInterval(healthTimer)
        clearInterval(syncTimer)
      }
    }

    // ── Real SSE connection ──────────────────────────────────────────────
    let es: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let alive = true

    function connect() {
      if (!alive) return

      const token = localStorage.getItem('accessToken') ?? ''
      // EventSource doesn't support custom headers, so we pass the token as a query param.
      // The API Gateway / notification-service can read it from ?token= if auth is needed.
      es = new EventSource(`/api/notifications/stream?token=${encodeURIComponent(token)}`)

      es.addEventListener('connected', () => {
        setKafkaConnected(true)
        backoffRef.current = 1000 // reset on success
      })

      es.addEventListener('anomaly', (evt) => {
        try {
          const data = JSON.parse(evt.data)
          const severity: LiveNotification['severity'] =
            data.severity === 'CRITICAL' ? 'CRITICAL'
            : data.severity === 'HIGH'   ? 'HIGH'
            : data.severity === 'LOW'    ? 'LOW'
            : 'MEDIUM'
          const notif = makeNotification({
            type: 'ANOMALY_ALERT',
            severity,
            title: `Anomaly: ${data.serviceName ?? 'Unknown service'}`,
            description: data.description ?? `Spend +${data.increasePercentage?.toFixed(1) ?? '?'}% over expected`,
            status: 'SENT',
          })
          addNotification(notif)
          if (severity === 'CRITICAL' || severity === 'HIGH') showToast(notif)
          setLastSyncTime(new Date())
        } catch { /* malformed event — ignore */ }
      })

      es.addEventListener('recommendation', (evt) => {
        try {
          const data = JSON.parse(evt.data)
          const notif = makeNotification({
            type: 'RECOMMENDATION',
            severity: 'INFO',
            title: `Recommendation: ${data.title ?? data.type ?? 'New recommendation'}`,
            description: data.description ?? `Est. savings: $${data.estimatedSavings ?? '?'}/mo`,
            status: 'SENT',
          })
          addNotification(notif)
          showToast(notif)
        } catch { /* malformed event — ignore */ }
      })

      // ping keeps the connection alive — just update last-sync time
      es.addEventListener('ping', () => setLastSyncTime(new Date()))

      es.onerror = () => {
        setKafkaConnected(false)
        es?.close()
        es = null
        if (!alive) return
        // Exponential backoff: 1s → 2s → 4s … capped at 30s
        reconnectTimer = setTimeout(() => {
          backoffRef.current = Math.min(backoffRef.current * 2, 30_000)
          connect()
        }, backoffRef.current)
      }
    }

    connect()

    return () => {
      alive = false
      if (reconnectTimer) clearTimeout(reconnectTimer)
      es?.close()
      setKafkaConnected(false)
    }
  }, [addNotification, setKafkaConnected, setServicesHealthy, setLastSyncTime])
}
