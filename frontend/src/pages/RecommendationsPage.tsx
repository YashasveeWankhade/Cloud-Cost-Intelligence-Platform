import { useState } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, Chip, Button, Accordion, AccordionSummary,
  AccordionDetails, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import SavingsIcon from '@mui/icons-material/Savings'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { recommendationsApi } from '../api/recommendations'
import SeverityChip from '../components/ui/SeverityChip'
import MetricCard from '../components/ui/MetricCard'
import type { Recommendation } from '../types'

const DIFFICULTY: Record<string, { label: string; color: string }> = {
  CRITICAL: { label: 'Hard', color: '#ef4444' },
  HIGH: { label: 'Medium', color: '#f59e0b' },
  MEDIUM: { label: 'Medium', color: '#eab308' },
  LOW: { label: 'Easy', color: '#10b981' },
}

export default function RecommendationsPage() {
  const [priority, setPriority] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [local, setLocal] = useState<Record<number, string>>({})

  const { data: recos = [] } = useQuery({ queryKey: ['recommendations'], queryFn: recommendationsApi.getAll })
  const { data: savings } = useQuery({ queryKey: ['savings'], queryFn: recommendationsApi.getSavings })

  const withStatus = recos.map((r) => ({ ...r, status: (local[r.id] as Recommendation['status']) ?? r.status }))
  const filtered = withStatus.filter(
    (r) => (priority === 'ALL' || r.priority === priority) && (statusFilter === 'ALL' || r.status === statusFilter),
  )

  const totalSavings = savings?.potentialMonthlySavings ?? withStatus.filter((r) => r.status === 'PENDING' || r.status === 'ACCEPTED').reduce((a, r) => a + r.estimatedMonthlySavings, 0)
  const highPriority = withStatus.filter((r) => (r.priority === 'HIGH' || r.priority === 'CRITICAL') && r.status === 'PENDING').length
  const pending = withStatus.filter((r) => r.status === 'PENDING').length

  const setStatus = (id: number, status: string, msg: string) => {
    setLocal((p) => ({ ...p, [id]: status }))
    toast.success(msg)
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2.5}>Recommendations</Typography>

      <Grid container spacing={2.5} mb={2.5}>
        <Grid item xs={12} md={4}><MetricCard title="Total Savings" value={totalSavings} prefix="$" suffix="/mo" icon={<SavingsIcon />} color="#10b981" /></Grid>
        <Grid item xs={6} md={4}><MetricCard title="High Priority" value={highPriority} color="#ef4444" /></Grid>
        <Grid item xs={6} md={4}><MetricCard title="Pending" value={pending} color="#f59e0b" /></Grid>
      </Grid>

      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Priority</InputLabel>
            <Select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <MenuItem value="ALL">All priorities</MenuItem>
              {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="ALL">All statuses</MenuItem>
              {['PENDING', 'ACCEPTED', 'DISMISSED', 'IMPLEMENTED'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      <Grid container spacing={2.5}>
        {filtered.map((r) => {
          const diff = DIFFICULTY[r.priority]
          const steps = r.recommendation.split('\n').filter(Boolean)
          return (
            <Grid item xs={12} md={6} key={r.id}>
              <Card sx={{ height: '100%', position: 'relative' }}>
                <CardContent>
                  <Box sx={{ position: 'absolute', top: 16, right: 16 }}><SeverityChip severity={r.priority} /></Box>

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1, flexWrap: 'wrap', pr: 8 }}>
                    <Chip label={r.serviceName} size="small" color="primary" variant="outlined" />
                    <Chip label={r.status} size="small" variant="outlined" />
                    {r.aiGenerated && <Chip icon={<AutoAwesomeIcon sx={{ fontSize: '14px !important' }} />} label="AI" size="small" sx={{ bgcolor: 'rgba(99,102,241,0.2)', color: 'primary.light' }} />}
                  </Box>

                  <Typography variant="subtitle1" fontWeight={700}>{r.rootCause} optimization</Typography>
                  <Typography variant="h5" fontWeight={800} color="success.main" fontFamily='"JetBrains Mono", monospace' mt={0.5}>
                    ~${r.estimatedMonthlySavings.toLocaleString()}/mo
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
                    <Typography variant="caption" color="text.secondary">Difficulty:</Typography>
                    <Chip label={diff.label} size="small" sx={{ color: diff.color, bgcolor: `${diff.color}1a`, border: `1px solid ${diff.color}55`, fontWeight: 700 }} />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {r.explanation}
                  </Typography>

                  <Accordion sx={{ bgcolor: 'rgba(255,255,255,0.03)', boxShadow: 'none', mt: 1.5, '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="body2" fontWeight={600}>Evidence & implementation steps</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                        Root cause confidence: {r.rootCauseConfidence}% · Cost increase: +{r.costIncreasePercentage.toFixed(0)}%
                      </Typography>
                      {steps.map((s, i) => <Typography key={i} variant="body2" color="text.secondary" sx={{ py: 0.3 }}>{s}</Typography>)}
                    </AccordionDetails>
                  </Accordion>

                  {r.status === 'PENDING' && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button size="small" variant="contained" color="success" startIcon={<CheckIcon />} onClick={() => setStatus(r.id, 'IMPLEMENTED', `${r.serviceName} recommendation marked done`)}>Mark Done</Button>
                      <Button size="small" variant="outlined" color="error" startIcon={<CloseIcon />} onClick={() => setStatus(r.id, 'DISMISSED', 'Recommendation dismissed')}>Dismiss</Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )
        })}
        {filtered.length === 0 && (
          <Grid item xs={12}><Card><CardContent sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}>No recommendations match the filters.</CardContent></Card></Grid>
        )}
      </Grid>
    </Box>
  )
}
