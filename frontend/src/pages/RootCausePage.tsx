import { useState } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, Select, MenuItem, FormControl, InputLabel,
  LinearProgress, Divider, Chip, Stack,
} from '@mui/material'
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts'
import dayjs from 'dayjs'
import { formatDistanceToNow } from 'date-fns'
import { mockAnomalies, mockRootCauses } from '../api/mockData'

function evidenceColor(weight: number): string {
  if (weight >= 28) return '#ef4444'   // high-weight: red
  if (weight >= 20) return '#f59e0b'   // medium-weight: amber
  return '#6366f1'                      // low-weight: indigo
}

function evidenceLabel(weight: number): string {
  if (weight >= 28) return 'strong'
  if (weight >= 20) return 'moderate'
  return 'weak'
}

export default function RootCausePage() {
  const open = mockAnomalies
  const [anomalyId, setAnomalyId] = useState<number>(open[0]?.id ?? 101)
  const rc = mockRootCauses[anomalyId]

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Root Cause Analysis</Typography>
          <Typography variant="body2" color="text.secondary">
            Evidence-based scoring to pinpoint why a cost anomaly occurred
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 280 }}>
          <InputLabel>Anomaly</InputLabel>
          <Select label="Anomaly" value={anomalyId} onChange={(e) => setAnomalyId(Number(e.target.value))}>
            {open.map((a) => (
              <MenuItem key={a.id} value={a.id}>
                {a.serviceName} · +{a.increasePercentage.toFixed(0)}% · {a.severity}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {!rc ? (
        <Card><CardContent>Select an anomaly to view its root cause analysis.</CardContent></Card>
      ) : (
        <>
          {/* Top row: verdict + score breakdown */}
          <Grid container spacing={2.5} mb={2.5}>
            <Grid item xs={12} md={5}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">Root Cause Identified</Typography>
                  <Typography variant="h5" fontWeight={800} mt={0.5} mb={1.5}>{rc.rootCause}</Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                    <LinearProgress
                      variant="determinate"
                      value={rc.confidence}
                      color="success"
                      sx={{ flexGrow: 1, height: 10, borderRadius: 5 }}
                    />
                    <Typography fontWeight={800} color="success.main">{rc.confidence}%</Typography>
                  </Box>

                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>Score Breakdown</Typography>
                  <Stack spacing={1.5}>
                    {rc.scoreBreakdown.map((s) => (
                      <Box key={s.category}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                          <Typography variant="caption" color="text.secondary">{s.category}</Typography>
                          <Typography variant="caption" fontWeight={700} fontFamily='"JetBrains Mono", monospace'>
                            {s.score}/{s.max}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(s.score / s.max) * 100}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Evidence list */}
            <Grid item xs={12} md={7}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Evidence ({rc.evidence.length} signals)
                  </Typography>
                  <Stack spacing={1.5} mt={1}>
                    {rc.evidence.map((e) => {
                      const color = evidenceColor(e.weight)
                      return (
                        <Box
                          key={e.id}
                          sx={{
                            display: 'flex', gap: 2, alignItems: 'flex-start',
                            p: 1.5, borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          <Box
                            sx={{
                              width: 36, height: 36, borderRadius: 2, flexShrink: 0,
                              bgcolor: `${color}22`, display: 'flex', alignItems: 'center',
                              justifyContent: 'center',
                              border: `1px solid ${color}44`,
                            }}
                          >
                            <Typography sx={{ fontSize: 11, fontWeight: 800, color }}>{e.weight}</Typography>
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600}>{e.label}</Typography>
                            <Typography variant="caption" color="text.secondary">{e.detail}</Typography>
                          </Box>
                          <Chip
                            label={evidenceLabel(e.weight)}
                            size="small"
                            sx={{ fontSize: 10, height: 20, bgcolor: `${color}22`, color, border: `1px solid ${color}44` }}
                          />
                        </Box>
                      )
                    })}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Timeline */}
          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Event Timeline</Typography>
              <Stack spacing={0} mt={1}>
                {rc.timeline.map((t, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', position: 'relative', pb: i < rc.timeline.length - 1 ? 2 : 0 }}>
                    {i < rc.timeline.length - 1 && (
                      <Box sx={{ position: 'absolute', left: 7, top: 16, bottom: 0, width: 2, bgcolor: 'rgba(255,255,255,0.06)' }} />
                    )}
                    <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0, mt: 0.25, zIndex: 1 }} />
                    <Box>
                      <Typography variant="body2">{t.event}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(t.time), { addSuffix: true })}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>

          {/* Cost + metric charts */}
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" mb={2}>Actual vs Expected Cost</Typography>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={rc.metricSeries}>
                      <defs>
                        <linearGradient id="rc-actual" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(d) => dayjs(d).format('M/D')} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `$${v}`} />
                      <Tooltip contentStyle={{ background: '#141c35', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} formatter={(v: number) => `$${v.toFixed(2)}`} />
                      <Legend />
                      <Area type="monotone" dataKey="expected" stroke="#64748b" strokeDasharray="4 4" fill="transparent" name="Expected" />
                      <Area type="monotone" dataKey="actual" stroke="#ef4444" fill="url(#rc-actual)" strokeWidth={2} name="Actual" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle2" mb={1}>CPU Utilization</Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={rc.metricSeries}>
                      <XAxis dataKey="date" hide />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ background: '#141c35', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} />
                      <Line type="monotone" dataKey="cpu" stroke="#22d3ee" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle2" mb={1}>Instance Count</Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={rc.metricSeries}>
                      <XAxis dataKey="date" hide />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: '#141c35', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} />
                      <Line type="stepAfter" dataKey="instances" stroke="#f59e0b" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  )
}
