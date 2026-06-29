import { apiClient, isDemoMode } from './client'
import type { Recommendation } from '../types'
import { mockRecommendations, mockSavings } from './mockData'

async function withFallback<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (isDemoMode()) return fallback
  try {
    return await fn()
  } catch {
    return fallback
  }
}

export const recommendationsApi = {
  getAll: (): Promise<Recommendation[]> =>
    withFallback(async () => {
      const { data } = await apiClient.get('/api/recommendations')
      return Array.isArray(data) && data.length ? data : mockRecommendations
    }, mockRecommendations),

  getSavings: () =>
    withFallback(async () => {
      const { data } = await apiClient.get('/api/recommendations/savings')
      return data
    }, mockSavings),

  updateStatus: async (id: number, status: string) => {
    if (isDemoMode()) return { id, status }
    try {
      const { data } = await apiClient.put(`/api/recommendations/${id}/status`, null, {
        params: { status },
      })
      return data
    } catch {
      return { id, status }
    }
  },
}
