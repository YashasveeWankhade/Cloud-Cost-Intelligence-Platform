import { useState } from 'react'
import {
  Box, Typography, Card, CardContent, Chip, Table, TableHead, TableBody,
  TableRow, TableCell, TableSortLabel, LinearProgress, Divider, Stack,
} from '@mui/material'
import { mockAnomalies, mockDailyCosts } from '../api/mockData'
import { totalsByService } from '../utils/costAnalytics'
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts'

const SERVICE_COLOR: Record<string, string> = {
  EC2: '#6366f1',
  RDS: '#22d3ee',
  S3: '#f59e0b',
  Lambda: '#10b981',
  CloudFront: '#ec4899',
  DynamoDB: '#f97316',
}

const anomalousSet = new Set(
  mockAnomalies.filter((a) => a.status !== 'RESOLVED').map((a) => a.serviceName)
)

type SortKey = 'name' | 'total' | 'pct'
type SortDir = 'asc' | 'desc'

export default function CostUniversePage() {
  const [sortKey, setSortKey] = useState<SortKey>('total')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const totals = totalsByService(mockDailyCosts)
  const grandTotal = totals.reduce((s, t) => s + t.total, 0)

  const rows = totals.map((t) => ({
    name: t.name,
    total: t.total,
    pct: (t.total / grandTotal) * 100,
    anomaly: anomalousSet.has(t.name),
    color: SERVICE_COLOR[t.name] ?? '#6366f1',
    // last 7 days sparkline
    spark: mockDailyCosts
      .slice(-7)
      .map((d) => ({ v: (d as unknown as Record<string, number>)[t.name] ?? 0 })),
  }))

  const sorted = [...rows].sort((a, b) => {
    const diff = sortKey === 'name'
      ? a.name.localeCompare(b.name)
      : a[sortKey] - b[sortKey]
    return sortDir === 'asc' ? diff : -diff
  })

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const anomalyCount = rows.filter((r) => r.anomaly).length

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Cost Universe</Typography>
        <Typography variant="body2" color="text.secondary">
          30-day spend breakdown across all monitored AWS services
        </Typography>
      </Box>

      {/* Summary cards */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>Total 30-day spend</Typography>
            <Typography variant="h4" fontWeight={800} sx={{ fontFamily: '"JetBrains Mono", monospace', mt: 0.5 }}>
              ${grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>Services monitored</Typography>
            <Typography variant="h4" fontWeight={800} sx={{ fontFamily: '"JetBrains Mono", monospace', mt: 0.5 }}>
              {rows.length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>Services with anomalies</Typography>
            <Typography variant="h4" fontWeight={800} color="error.main" sx={{ fontFamily: '"JetBrains Mono", monospace', mt: 0.5 }}>
              {anomalyCount}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>Top spender</Typography>
            <Typography variant="h4" fontWeight={800} sx={{ fontFamily: '"JetBrains Mono", monospace', mt: 0.5, color: SERVICE_COLOR[sorted[0]?.name] ?? 'text.primary' }}>
              {sorted[0]?.name ?? '—'}
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Main table */}
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel active={sortKey === 'name'} direction={sortKey === 'name' ? sortDir : 'asc'} onClick={() => toggleSort('name')}>
                  Service
                </TableSortLabel>
              </TableCell>
              <TableCell>Status</TableCell>
              <TableCell sx={{ minWidth: 180 }}>Share of spend</TableCell>
              <TableCell align="right">
                <TableSortLabel active={sortKey === 'total'} direction={sortKey === 'total' ? sortDir : 'desc'} onClick={() => toggleSort('total')}>
                  30-day spend
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel active={sortKey === 'pct'} direction={sortKey === 'pct' ? sortDir : 'desc'} onClick={() => toggleSort('pct')}>
                  % of total
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: 120 }}>Last 7 days</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((row) => (
              <TableRow key={row.name} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.025)' } }}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: row.color, flexShrink: 0 }} />
                    <Typography fontWeight={600}>{row.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {row.anomaly
                    ? <Chip label="Anomaly" size="small" color="error" sx={{ fontSize: 11 }} />
                    : <Chip label="Normal" size="small" sx={{ fontSize: 11, bgcolor: 'rgba(16,185,129,0.12)', color: '#10b981' }} />}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={row.pct}
                      sx={{
                        flex: 1, height: 6, borderRadius: 3,
                        bgcolor: 'rgba(255,255,255,0.06)',
                        '& .MuiLinearProgress-bar': { bgcolor: row.color, borderRadius: 3 },
                      }}
                    />
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700} fontFamily='"JetBrains Mono", monospace' color={row.color}>
                    ${row.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="text.secondary">
                    {row.pct.toFixed(1)}%
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ width: 120, height: 36 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={row.spark} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
                        <defs>
                          <linearGradient id={`spark-${row.name}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={row.color} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={row.color} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <Tooltip
                          contentStyle={{ background: '#141c35', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, fontSize: 11 }}
                          formatter={(v: number) => [`$${v.toFixed(0)}`, 'Cost']}
                        />
                        <Area type="monotone" dataKey="v" stroke={row.color} strokeWidth={1.5} fill={`url(#spark-${row.name})`} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2.5, py: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            Total: <strong>${grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> across {rows.length} services
          </Typography>
        </Box>
      </Card>
    </Box>
  )
}
