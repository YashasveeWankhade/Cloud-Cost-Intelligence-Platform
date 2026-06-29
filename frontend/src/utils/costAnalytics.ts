import type { DailyCost } from '../types'
import { SERVICES } from '../api/mockData'

export interface StackedDay {
  date: string
  total: number
  [service: string]: number | string
}

export function stackByDate(costs: DailyCost[]): StackedDay[] {
  const map: Record<string, StackedDay> = {}
  for (const c of costs) {
    const row = (map[c.date] ??= { date: c.date, total: 0 })
    row[c.serviceName] = ((row[c.serviceName] as number) ?? 0) + c.amount
    row.total += c.amount
  }
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
}

export function totalsByService(costs: DailyCost[]): { name: string; total: number }[] {
  return SERVICES.map((s) => ({
    name: s,
    total: Math.round(costs.filter((c) => c.serviceName === s).reduce((a, c) => a + c.amount, 0) * 100) / 100,
  })).sort((a, b) => b.total - a.total)
}

export function dailyTotals(costs: DailyCost[]): { date: string; total: number }[] {
  return stackByDate(costs).map((d) => ({ date: d.date, total: Math.round(d.total * 100) / 100 }))
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function dayOfWeekAverages(costs: DailyCost[]): { day: string; avg: number }[] {
  const totals = dailyTotals(costs)
  const buckets: Record<number, number[]> = {}
  for (const d of totals) {
    const dow = new Date(d.date).getDay()
    ;(buckets[dow] ??= []).push(d.total)
  }
  // Mon..Sun order
  const order = [1, 2, 3, 4, 5, 6, 0]
  return order.map((dow) => {
    const arr = buckets[dow] ?? []
    const avg = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
    return { day: DOW[dow], avg: Math.round(avg * 100) / 100 }
  })
}

export function sparkline(costs: DailyCost[], service?: string): number[] {
  if (service) {
    return costs
      .filter((c) => c.serviceName === service)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((c) => c.amount)
  }
  return dailyTotals(costs).map((d) => d.total)
}
