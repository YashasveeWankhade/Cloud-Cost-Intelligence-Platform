import { useEffect, useState } from 'react'
import { Box, Typography, Card, CardContent, Grid, Chip } from '@mui/material'
import StorageIcon from '@mui/icons-material/Storage'
import HubIcon from '@mui/icons-material/Hub'
import ApiIcon from '@mui/icons-material/Api'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet'
import { ResponsiveContainer, LineChart, Line } from 'recharts'
import { mockServiceHealth } from '../api/mockData'
import type { ServiceHealth } from '../types'

const CATEGORY_ICON: Record<string, JSX.Element> = {
  service: <ApiIcon fontSize="small" />,
  gateway: <SettingsEthernetIcon fontSize="small" />,
  kafka: <HubIcon fontSize="small" />,
  database: <StorageIcon fontSize="small" />,
  observability: <MonitorHeartIcon fontSize="small" />,
}

function jitter(v: number) {
  return Math.max(2, Math.round(v + (Math.random() - 0.5) * v * 0.25))
}

export default function InfrastructurePage() {
  const [services, setServices] = useState<ServiceHealth[]>(mockServiceHealth)

  // "Live" updates every 30s, mirroring the realtime hook cadence.
  useEffect(() => {
    const t = setInterval(() => {
      setServices((prev) =>
        prev.map((s) => {
          const next = jitter(s.latencyMs)
          return { ...s, latencyMs: next, latencyHistory: [...s.latencyHistory.slice(1), next] }
        }),
      )
    }, 30000)
    return () => clearInterval(t)
  }, [])

  const healthy = services.filter((s) => s.status === 'UP').length
  const score = Math.round((healthy / services.length) * 100)
  const scoreColor = score >= 95 ? '#10b981' : score >= 80 ? '#f59e0b' : '#ef4444'

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2.5}>Infrastructure</Typography>

      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="overline" color="text.secondary">Overall Health Score</Typography>
            <Typography variant="h2" fontWeight={800} sx={{ color: scoreColor, fontFamily: '"JetBrains Mono", monospace', lineHeight: 1 }}>{score}%</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Chip label={`${healthy}/${services.length} services UP`} color="success" variant="outlined" />
            <Chip label="Kafka: Connected" color="success" variant="outlined" />
            <Chip label="No active incidents" variant="outlined" />
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2} mb={2.5}>
        {services.map((s) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={s.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box sx={{ color: 'primary.light', display: 'flex' }}>{CATEGORY_ICON[s.category]}</Box>
                  <Typography variant="body2" fontWeight={700} sx={{ flexGrow: 1 }} noWrap>{s.name}</Typography>
                  <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: s.status === 'UP' ? '#10b981' : '#ef4444', boxShadow: `0 0 6px ${s.status === 'UP' ? '#10b981' : '#ef4444'}` }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Latency</Typography>
                    <Typography variant="body2" fontWeight={700} fontFamily='"JetBrains Mono", monospace'>{s.latencyMs}ms</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary">Uptime</Typography>
                    <Typography variant="body2" fontWeight={700} fontFamily='"JetBrains Mono", monospace'>{s.uptimePct}%</Typography>
                  </Box>
                </Box>
                <Box sx={{ height: 36 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={s.latencyHistory.map((v, i) => ({ i, v }))}>
                      <Line type="monotone" dataKey="v" stroke="#6366f1" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <HubIcon color="primary" />
            <Typography variant="h6">Kafka Cluster</Typography>
          </Box>
          <Grid container spacing={2}>
            {[
              { label: 'Topics', value: '4' },
              { label: 'Partitions', value: '12' },
              { label: 'Consumer Groups', value: '5' },
              { label: 'Throughput', value: '~150/min' },
              { label: 'Consumer Lag', value: '0 msgs' },
            ].map((k) => (
              <Grid item xs={6} md={2.4} key={k.label}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={800} fontFamily='"JetBrains Mono", monospace'>{k.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{k.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}
