import { apiClient } from './client'
import type { AuthResponse } from '../types'

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/login', { email, password })
    return data
  },
  register: async (email: string, password: string, firstName: string, lastName: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/register', { email, password, firstName, lastName })
    return data
  },
  me: async () => {
    const { data } = await apiClient.get('/auth/me')
    return data
  },
}
