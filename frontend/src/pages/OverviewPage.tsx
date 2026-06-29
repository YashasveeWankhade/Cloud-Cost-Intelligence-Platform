import {
  Box, Grid, Typography, Card, CardContent, Button, Alert, Chip, Divider,
} from '@mui/material'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import TodayIcon from '@mui/icons-material/Today'
import InsightsIcon from '@mui/icons-material/Insights'
import SavingsIcon from '@mui/icons-material/Savings'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell,
} from 'recharts'
import { costsApi } from '../api/costs'
import { analyticsApi } from '../api/analytics'
import { recommendationsApi } from '../api/recommendations'
import MetricCard from '../components/ui/MetricCard'
import SeverityChip from '../components/ui/SeverityChip'
import { useUIStore } from '../store'
import { SERVICE_COLORS } from '../utils/theme'
import { stackByDate, totalsByService, sparkline } from '../utils/costAnalytics'
import { SERVICES } from '../api/mockData'
import dayjs from 'dayjs'

export default function OverviewPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const setRightPanel = useUIStore((s) => s.setRightPanelContent)

  const { data: accounts = [] } = useQuery({ queryKey: ['accounts'], queryFn: costsApi.getAccounts })
  const account = accounts[0]

  const { data: summary } = useQuery({
    queryKey: ['summary', account?.accountId],
    queryFn: () => costsApi.getSummary(account!.accountId),
    enabled: !!account,
  })

  const { data: daily = [] } = useQuery({
    queryKey: ['dailyCosts', account?.accountId, 'overview'],
    queryFn: () => costsApi.getDailyCosts(account!.accountId, dayjs().subtract(30, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')),
    enabled: !!account,
  })

  const { data: anomalies = [] } = useQuery({ queryKey: ['allAnomalies'], queryFn: analyticsApi.getAllAnomalies })
  const { data: recos = [] } = useQuery({ queryKey: ['recommendations'], queryFn: recommendationsApi.getAll })
  const { data: savings } = useQuery({ queryKey: ['savings'], queryFn: recommendationsApi.getSavings })

  const demoMutation = useMutation({
    mutationFn: costsApi.initDemo,
    onSuccess: () => qc.invalidateQueries(),
  })

  if (!account) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} mb={2}>Overview</Typography>
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={700} mb={1}>Initialize Demo</Typography>
          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
            No AWS accounts connected. Initialize the demo environment to explore anomalies, root causes and recommendations with synthetic data.
          </Alert>
          <Button variant="contained" size="large" onClick={() => demoMutation.mutate()} disabled={demoMutation.isPending}>
            {demoMutation.isPending ? 'Initializing…' : 'Initialize Demo Environment'}
          </Button>
        </Card>
      </Box>
    )
  }

  const stacked = stackByDate(daily)
  const present = SERVICES.filter((s) => daily.some((c) => c.serviceName === s))
  const drivers = totalsByService(daily)
  const openAnoms = anomalies.filter((a) => a.status !== 'RESOLVED')
  const resolvedThisMonth = anomalies.filter((a) => a.status === 'RESOLVED').length + 11
  const sev = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 } as Record<string, number>
  openAnoms.forEach((a) => { sev[a.severity] += 1 })
  const topRecos = [...recos].sort((a, b) => b.estimatedMonthlySavings - a.estimatedMonthlySavings).slice(0, 3)

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700}>Good morning, Demo User.</Typography>
        <Typography color="text.secondary">
          Here's your cloud cost summary — {dayjs().format('dddd, MMMM D, YYYY')}
        </Typography>
      </Box>

      {/* KPI row */}
      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <MetricCard title="MTD Spend" value={summary?.monthToDateCost ?? 18743} prefix="$" trend={12} trendLabel="vs last month" icon={<AttachMoneyIcon />} sparklineData={sparkline(daily).slice(-14)} />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <MetricCard title="Yesterday" value={summary?.yesterdayCost ?? 2840} prefix="$" trend={-3} trendPositiveIsGood icon={<TodayIcon />} color="#22d3ee" sparklineData={sparkline(daily, 'EC2').slice(-14)} />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <MetricCard title="Projected Month End" value={21200} prefix="$" trendLabel="forecast" icon={<InsightsIcon />} color="#818cf8" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <MetricCard title="Potential Savings" value={savings?.potentialMonthlySavings ?? 10820} prefix="$" suffix="/mo" icon={<SavingsIcon />} color="#10b981" trend={8} trendPositiveIsGood />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <MetricCard title="Open Anomalies" value={openAnoms.length} subtitle={`${sev.CRITICAL}C · ${sev.HIGH}H · ${sev.MEDIUM}M`} icon={<WarningAmberIcon />} color="#ef4444" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <MetricCard title="Resolved This Month" value={resolvedThisMonth} icon={<CheckCircleIcon />} color="#10b981" />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" mb={2}>Cost Trend (30 days)</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stacked}>
                  <defs>
                    {present.map((s) => (
                      <linearGradient key={s} id={`ov-${s}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={SERVICE_COLORS[s]} stopOpacity={0.5} />
                        <stop offset="95%" stopColor={SERVICE_COLORS[s]} stopOpacity={0.05} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(d) => dayjs(d).format('M/D')} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={{ background: '#141c35', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} formatter={(v: number) => `$${v.toFixed(2)}`} />
                  {present.map((s) => (
                    <Area key={s} type="monotone" dataKey={s} stackId="1" stroke={SERVICE_COLORS[s]} fill={`url(#ov-${s})`} strokeWidth={2} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" mb={2}>Top Cost Drivers</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={drivers} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ background: '#141c35', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} formatter={(v: number) => `$${v.toFixed(2)}`} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                    {drivers.map((d) => <Cell key={d.name} fill={SERVICE_COLORS[d.name] ?? '#6366f1'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tables */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">Recent Anomalies</Typography>
                <Button size="small" onClick={() => navigate('/app/anomalies')}>View all</Button>
              </Box>
              {openAnoms.slice(0, 5).map((a) => (
                <Box
                  key={a.id}
                  onClick={() => setRightPanel({ type: 'anomaly', data: a })}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}
                >
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600}>{a.serviceName} · {a.rootCause}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      +{a.increasePercentage.toFixed(0)}% · {formatDistanceToNow(new Date(a.lastDetected), { addSuffix: true })}
                    </Typography>
                  </Box>
                  <SeverityChip severity={a.severity} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">Active Recommendations</Typography>
                <Button size="small" onClick={() => navigate('/app/recommendations')}>View all</Button>
              </Box>
              {topRecos.map((r) => (
                <Box
                  key={r.id}
                  onClick={() => setRightPanel({ type: 'recommendation', data: r })}
                  sx={{ py: 1.25, borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" fontWeight={600}>{r.serviceName}</Typography>
                    <Typography variant="body2" fontWeight={700} color="success.main">~${r.estimatedMonthlySavings.toLocaleString()}/mo</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <SeverityChip severity={r.priority} />
                    <Typography variant="caption" color="text.secondary" noWrap>{r.rootCause}</Typography>
                  </Box>
                </Box>
              ))}
              <Divider sx={{ my: 1.5, borderColor: 'transparent' }} />
              <Chip label={`Total potential: $${(savings?.potentialMonthlySavings ?? 0).toLocaleString()}/mo`} color="success" variant="outlined" sx={{ width: '100%' }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
