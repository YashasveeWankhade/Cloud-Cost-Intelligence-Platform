import { apiClient, isDemoMode } from './client'
import type { Anomaly } from '../types'
import { mockAnomalies } from './mockData'

async function withFallback<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (isDemoMode()) return fallback
  try {
    return await fn()
  } catch {
    return fallback
  }
}

export const analyticsApi = {
  getAllAnomalies: (): Promise<Anomaly[]> =>
    withFallback(async () => {
      const { data } = await apiClient.get('/api/analytics/anomalies')
      return Array.isArray(data) && data.length ? data : mockAnomalies
    }, mockAnomalies),

  getOpenAnomalies: (): Promise<Anomaly[]> =>
    withFallback(async () => {
      const { data } = await apiClient.get('/api/analytics/anomalies/open')
      return Array.isArray(data) && data.length
        ? data
        : mockAnomalies.filter((a) => a.status !== 'RESOLVED')
    }, mockAnomalies.filter((a) => a.status !== 'RESOLVED')),

  getStats: () =>
    withFallback(async () => {
      const { data } = await apiClient.get('/api/analytics/anomalies/stats')
      return data
    }, {
      total: mockAnomalies.length,
      open: mockAnomalies.filter((a) => a.status !== 'RESOLVED').length,
    }),

  resolveAnomaly: async (id: number) => {
    if (isDemoMode()) return { id, status: 'RESOLVED' }
    try {
      const { data } = await apiClient.put(`/api/analytics/anomalies/${id}/resolve`)
      return data
    } catch {
      return { id, status: 'RESOLVED' }
    }
  },
}
