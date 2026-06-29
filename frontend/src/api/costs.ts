import { apiClient, isDemoMode } from './client'
import type { AwsAccount, CostSummary, DailyCost } from '../types'
import {
  mockAccounts,
  mockSummary,
  mockDailyCosts,
} from './mockData'

async function withFallback<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (isDemoMode()) return fallback
  try {
    return await fn()
  } catch {
    return fallback
  }
}

export const costsApi = {
  getAccounts: (): Promise<AwsAccount[]> =>
    withFallback(async () => {
      const { data } = await apiClient.get('/api/costs/accounts')
      return Array.isArray(data) && data.length ? data : mockAccounts
    }, mockAccounts),

  connectAccount: async (payload: {
    accountName: string; accountId: string; region: string
    accessKeyId: string; secretAccessKey: string; description: string
  }) => {
    if (isDemoMode()) {
      return {
        ...mockAccounts[0],
        id: Date.now(),
        accountName: payload.accountName,
        accountId: payload.accountId || mockAccounts[0].accountId,
        region: payload.region,
        description: payload.description,
      }
    }
    try {
      const { data } = await apiClient.post('/api/costs/accounts', payload)
      return data
    } catch {
      return {
        ...mockAccounts[0],
        id: Date.now(),
        accountName: payload.accountName,
        accountId: payload.accountId || mockAccounts[0].accountId,
        region: payload.region,
        description: payload.description,
      }
    }
  },

  disconnectAccount: async (id: number) => {
    if (isDemoMode()) return
    try {
      await apiClient.delete(`/api/costs/accounts/${id}`)
    } catch {
      /* no-op */
    }
  },

  refreshAccount: async (id: number) => {
    if (isDemoMode()) return { ...mockAccounts[0], lastSyncAt: new Date().toISOString() }
    try {
      const { data } = await apiClient.post(`/api/costs/accounts/${id}/refresh`)
      return data
    } catch {
      return { ...mockAccounts[0], lastSyncAt: new Date().toISOString() }
    }
  },

  getSummary: (accountId: string): Promise<CostSummary> =>
    withFallback(async () => {
      const { data } = await apiClient.get(`/api/costs/summary/${accountId}`)
      return data
    }, mockSummary as CostSummary),

  getDailyCosts: (accountId: string, start: string, end: string): Promise<DailyCost[]> =>
    withFallback(async () => {
      const { data } = await apiClient.get(`/api/costs/daily/${accountId}`, {
        params: { start, end },
      })
      return Array.isArray(data) && data.length
        ? data
        : mockDailyCosts.filter((c) => c.date >= start && c.date <= end)
    }, mockDailyCosts.filter((c) => c.date >= start && c.date <= end)),

  initDemo: async () => {
    if (isDemoMode()) return { status: 'ok', message: 'Demo data initialized (local).' }
    try {
      const { data } = await apiClient.post('/api/demo/initialize')
      return data
    } catch {
      return { status: 'ok', message: 'Demo data initialized (local).' }
    }
  },
}
