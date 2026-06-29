import { create } from 'zustand'
import type { LiveNotification } from '../types'
import { mockNotifications } from '../api/mockData'

export type RightPanelContent =
  | { type: 'anomaly'; data: import('../types').Anomaly }
  | { type: 'recommendation'; data: import('../types').Recommendation }
  | null

interface UIState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  mobileSidebarOpen: boolean
  setMobileSidebarOpen: (v: boolean) => void
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  rightPanelContent: RightPanelContent
  setRightPanelContent: (content: RightPanelContent) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  mobileSidebarOpen: false,
  setMobileSidebarOpen: (v) => set({ mobileSidebarOpen: v }),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  rightPanelContent: null,
  setRightPanelContent: (content) => set({ rightPanelContent: content }),
}))

interface NotificationState {
  notifications: LiveNotification[]
  unreadCount: number
  addNotification: (n: LiveNotification) => void
  markAllRead: () => void
}

const initialUnread = mockNotifications.filter((n) => !n.read).length

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: mockNotifications,
  unreadCount: initialUnread,
  addNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications],
      unreadCount: s.unreadCount + (n.read ? 0 : 1),
    })),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
}))

interface SystemState {
  servicesHealthy: number
  totalServices: number
  kafkaConnected: boolean
  lastSyncTime: Date
  demoMode: boolean
  setServicesHealthy: (n: number) => void
  setLastSyncTime: (d: Date) => void
  setKafkaConnected: (connected: boolean) => void
}

export const useSystemStore = create<SystemState>((set) => ({
  servicesHealthy: 6,
  totalServices: 6,
  kafkaConnected: true,
  lastSyncTime: new Date(),
  demoMode: true,
  setServicesHealthy: (n) => set({ servicesHealthy: n }),
  setLastSyncTime: (d) => set({ lastSyncTime: d }),
  setKafkaConnected: (connected) => set({ kafkaConnected: connected }),
}))

interface CostFilterState {
  selectedAccountId: string | null
  dateRange: '7d' | '30d' | '90d' | 'custom'
  selectedServices: string[]
  setSelectedAccountId: (id: string | null) => void
  setDateRange: (range: '7d' | '30d' | '90d' | 'custom') => void
  setSelectedServices: (services: string[]) => void
}

export const useCostFilterStore = create<CostFilterState>((set) => ({
  selectedAccountId: null,
  dateRange: '30d',
  selectedServices: [],
  setSelectedAccountId: (id) => set({ selectedAccountId: id }),
  setDateRange: (range) => set({ dateRange: range }),
  setSelectedServices: (services) => set({ selectedServices: services }),
}))
