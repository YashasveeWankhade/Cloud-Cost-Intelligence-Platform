import { useMemo, useState } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, ToggleButtonGroup, ToggleButton,
  Select, MenuItem, FormControl, InputLabel, Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  BarChart, Bar, Cell,
} from 'recharts'
import { ResponsivePie } from '@nivo/pie'
import dayjs from 'dayjs'
import { costsApi } from '../api/costs'
import { useCostFilterStore } from '../store'
import { SERVICE_COLORS } from '../utils/theme'
import { SERVICES } from '../api/mockData'
import {
  stackByDate, totalsByService, dailyTotals, dayOfWeekAverages,
} from '../utils/costAnalytics'
import MetricCard from '../components/ui/MetricCard'

const RANGE_DAYS: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, custom: 30 }

export default function CostAnalyticsPage() {
  const { dateRange, setDateRange, selectedServices, setSelectedServices } = useCostFilterStore()
  const [account, setAccount] = useState('')

  const { data: accounts = [] } = useQuery({ queryKey: ['accounts'], queryFn: costsApi.getAccounts })
  const accountId = account || accounts[0]?.accountId || ''
  const days = RANGE_DAYS[dateRange]
  const start = dayjs().subtract(days, 'day').format('YYYY-MM-DD')
  const end = dayjs().format('YYYY-MM-DD')

  const { data: daily = [] } = useQuery({
    queryKey: ['dailyCosts', accountId, start, end],
    queryFn: () => costsApi.getDailyCosts(accountId, start, end),
    enabled: !!accountId,
  })

  const activeServices = selectedServices.length ? selectedServices : SERVICES.filter((s) => daily.some((c) => c.serviceName === s))
  const filtered = useMemo(
    () => daily.filter((c) => activeServices.includes(c.serviceName)),
    [daily, activeServices],
  )

  const stacked = stackByDate(filtered)
  const totals = totalsByService(filtered)
  const dailySum = dailyTotals(filtered)
  const dow = dayOfWeekAverages(filtered)

  // Insight metrics
  const peak = dailySum.reduce((m, d) => (d.total > m.total ? d : m), dailySum[0] ?? { date: '', total: 0 })
  const low = dailySum.reduce((m, d) => (d.total < m.total ? d : m), dailySum[0] ?? { date: '', total: 0 })
  const half = Math.floor(dailySum.length / 2)
  const firstHalf = dailySum.slice(0, half).reduce((a, d) => a + d.total, 0)
  const secondHalf = dailySum.slice(half).reduce((a, d) => a + d.total, 0)
  const momChange = firstHalf ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0
  const last7 = dailySum.slice(-7).reduce((a, d) => a + d.total, 0)
  const prev7 = dailySum.slice(-14, -7).reduce((a, d) => a + d.total, 0)
  const wowChange = prev7 ? ((last7 - prev7) / prev7) * 100 : 0

  const pieData = totals.map((t) => ({ id: t.name, label: t.name, value: t.total, color: SERVICE_COLORS[t.name] }))

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>Cost Analytics</Typography>

      {/* Filter bar */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Account</InputLabel>
            <Select label="Account" value={accountId} onChange={(e) => setAccount(e.target.value)}>
              {accounts.map((a) => <MenuItem key={a.accountId} value={a.accountId}>{a.accountName}</MenuItem>)}
            </Select>
          </FormControl>
          <ToggleButtonGroup size="small" exclusive value={dateRange} onChange={(_, v) => v && setDateRange(v)}>
            <ToggleButton value="7d">7d</ToggleButton>
            <ToggleButton value="30d">30d</ToggleButton>
            <ToggleButton value="90d">90d</ToggleButton>
          </ToggleButtonGroup>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Services</InputLabel>
            <Select
              multiple
              label="Services"
              value={activeServices}
              onChange={(e) => setSelectedServices(typeof e.target.value === 'string' ? [e.target.value] : e.target.value)}
              renderValue={(v) => (v as string[]).join(', ')}
            >
              {SERVICES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Main area chart */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>Daily Cost by Service</Typography>
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={stacked}>
              <defs>
                {activeServices.map((s) => (
                  <linearGradient key={s} id={`ca-${s}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SERVICE_COLORS[s]} stopOpacity={0.5} />
                    <stop offset="95%" stopColor={SERVICE_COLORS[s]} stopOpacity={0.05} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(d) => dayjs(d).format('M/D')} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ background: '#141c35', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} formatter={(v: number) => `$${v.toFixed(2)}`} />
              <Legend />
              {activeServices.map((s) => (
                <Area key={s} type="monotone" dataKey={s} stackId="1" stroke={SERVICE_COLORS[s]} fill={`url(#ca-${s})`} strokeWidth={2} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Donut + day-of-week */}
      <Grid container spacing={2.5} mb={2.5}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" mb={1}>Service Breakdown</Typography>
              <Box sx={{ height: 320 }}>
                <ResponsivePie
                  data={pieData}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  innerRadius={0.6}
                  padAngle={1}
                  cornerRadius={3}
                  colors={{ datum: 'data.color' }}
                  borderWidth={1}
                  borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
                  enableArcLinkLabels={false}
                  arcLabelsTextColor="#0a0f1e"
                  theme={{ text: { fill: '#94a3b8' }, tooltip: { container: { background: '#141c35', color: '#f1f5f9' } } }}
                  valueFormat={(v) => `$${Number(v).toFixed(0)}`}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" mb={2}>Day-of-Week Pattern</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={{ background: '#141c35', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} formatter={(v: number) => `$${v.toFixed(2)}`} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                    {dow.map((d, i) => <Cell key={d.day} fill={i >= 5 ? '#475569' : '#6366f1'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Insight cards */}
      <Grid container spacing={2.5} mb={2.5}>
        <Grid item xs={6} md={3}><MetricCard title="Peak Day" value={`$${peak.total.toFixed(0)}`} subtitle={peak.date ? dayjs(peak.date).format('MMM D') : '—'} color="#ef4444" /></Grid>
        <Grid item xs={6} md={3}><MetricCard title="Lowest Day" value={`$${low.total.toFixed(0)}`} subtitle={low.date ? dayjs(low.date).format('MMM D') : '—'} color="#10b981" /></Grid>
        <Grid item xs={6} md={3}><MetricCard title="WoW Change" value={`${wowChange >= 0 ? '+' : ''}${wowChange.toFixed(1)}%`} trend={wowChange} trendPositiveIsGood={false} color="#f59e0b" /></Grid>
        <Grid item xs={6} md={3}><MetricCard title="MoM Change" value={`${momChange >= 0 ? '+' : ''}${momChange.toFixed(1)}%`} trend={momChange} trendPositiveIsGood={false} color="#22d3ee" /></Grid>
      </Grid>

      {/* Data table */}
      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>Daily Costs by Service</Typography>
          <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: '#0f1629', fontWeight: 700, color: 'text.secondary' } }}>
                  <TableCell>Date</TableCell>
                  {activeServices.map((s) => <TableCell key={s} align="right">{s}</TableCell>)}
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stacked.slice().reverse().map((row) => (
                  <TableRow key={row.date} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                    <TableCell>{dayjs(row.date as string).format('MMM D, YYYY')}</TableCell>
                    {activeServices.map((s) => (
                      <TableCell key={s} align="right" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>
                        ${((row[s] as number) ?? 0).toFixed(2)}
                      </TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700 }}>
                      ${(row.total as number).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
