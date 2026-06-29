import { useMemo, useState } from 'react'
import {
  Box, Typography, Card, CardContent, Table, TableHead, TableBody, TableRow, TableCell,
  Button, Chip, ToggleButtonGroup, ToggleButton, Grid, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material'
import ViewListIcon from '@mui/icons-material/ViewList'
import GridViewIcon from '@mui/icons-material/GridView'
import SearchIcon from '@mui/icons-material/Search'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { analyticsApi } from '../api/analytics'
import SeverityChip from '../components/ui/SeverityChip'
import { useUIStore } from '../store'
import type { Anomaly } from '../types'

const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const
const SEV_COLOR: Record<string, string> = { CRITICAL: '#ef4444', HIGH: '#f59e0b', MEDIUM: '#eab308', LOW: '#3b82f6' }

export default function AnomaliesPage() {
  const setRightPanel = useUIStore((s) => s.setRightPanelContent)
  const [view, setView] = useState<'table' | 'card'>('table')
  const [severity, setSeverity] = useState('ALL')
  const [status, setStatus] = useState('ALL')

  const { data: anomalies = [] } = useQuery({
    queryKey: ['allAnomalies'],
    queryFn: analyticsApi.getAllAnomalies,
  })

  const counts = useMemo(() => {
    const c = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 } as Record<string, number>
    anomalies.filter((a) => a.status !== 'RESOLVED').forEach((a) => { c[a.severity] += 1 })
    return c
  }, [anomalies])

  const filtered = anomalies.filter(
    (a) => (severity === 'ALL' || a.severity === severity) && (status === 'ALL' || a.status === status),
  )

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>Anomalies</Typography>
        <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)}>
          <ToggleButton value="table"><ViewListIcon fontSize="small" /></ToggleButton>
          <ToggleButton value="card"><GridViewIcon fontSize="small" /></ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Summary chips */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
        {SEVERITIES.map((s) => (
          <Chip
            key={s}
            label={`${s}: ${counts[s]}`}
            onClick={() => setSeverity(severity === s ? 'ALL' : s)}
            sx={{
              fontWeight: 700,
              cursor: 'pointer',
              color: SEV_COLOR[s],
              bgcolor: severity === s ? `${SEV_COLOR[s]}33` : `${SEV_COLOR[s]}14`,
              border: `1px solid ${SEV_COLOR[s]}66`,
            }}
          />
        ))}
      </Box>

      {/* Filter bar */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Severity</InputLabel>
            <Select label="Severity" value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <MenuItem value="ALL">All severities</MenuItem>
              {SEVERITIES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <MenuItem value="ALL">All statuses</MenuItem>
              <MenuItem value="OPEN">Open</MenuItem>
              <MenuItem value="INVESTIGATING">Investigating</MenuItem>
              <MenuItem value="RESOLVED">Resolved</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {view === 'table' ? (
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, color: 'text.secondary', fontSize: 12 } }}>
                  <TableCell>Service</TableCell>
                  <TableCell align="right">Expected</TableCell>
                  <TableCell align="right">Actual</TableCell>
                  <TableCell align="right">Delta %</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell align="right">Z-Score</TableCell>
                  <TableCell>Detected</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                    <TableCell><Typography variant="body2" fontWeight={600}>{a.serviceName}</Typography></TableCell>
                    <TableCell align="right" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>${a.expectedCost.toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: '"JetBrains Mono", monospace', color: 'error.main', fontWeight: 600 }}>${a.actualCost.toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>+{a.increasePercentage.toFixed(1)}%</TableCell>
                    <TableCell><SeverityChip severity={a.severity} /></TableCell>
                    <TableCell align="right" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>{a.zScore.toFixed(2)}</TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{formatDistanceToNow(new Date(a.lastDetected), { addSuffix: true })}</Typography></TableCell>
                    <TableCell>
                      <Chip size="small" label={a.status} variant="outlined" color={a.status === 'OPEN' ? 'error' : a.status === 'RESOLVED' ? 'success' : 'warning'} />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" startIcon={<SearchIcon />} onClick={() => setRightPanel({ type: 'anomaly', data: a })}>Investigate</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>No anomalies match the filters.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {filtered.map((a: Anomaly) => (
            <Grid item xs={12} sm={6} md={4} key={a.id}>
              <Card sx={{ height: '100%', borderLeft: `3px solid ${SEV_COLOR[a.severity]}` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" fontWeight={700}>{a.serviceName}</Typography>
                    <SeverityChip severity={a.severity} />
                  </Box>
                  <Typography variant="h5" fontWeight={800} color="error.main" fontFamily='"JetBrains Mono", monospace'>+{a.increasePercentage.toFixed(0)}%</Typography>
                  <Typography variant="caption" color="text.secondary">${a.expectedCost.toFixed(0)} → ${a.actualCost.toFixed(0)} · z={a.zScore.toFixed(1)}</Typography>
                  <Box sx={{ mt: 1, mb: 1.5 }}>
                    <Typography variant="body2" fontWeight={600}>{a.rootCause}</Typography>
                    <Typography variant="caption" color="text.secondary">{formatDistanceToNow(new Date(a.lastDetected), { addSuffix: true })}</Typography>
                  </Box>
                  <Button fullWidth size="small" variant="outlined" startIcon={<SearchIcon />} onClick={() => setRightPanel({ type: 'anomaly', data: a })}>Investigate</Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}
