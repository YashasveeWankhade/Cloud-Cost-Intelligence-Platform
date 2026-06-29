import { Box, Typography, IconButton, Button, Divider, LinearProgress } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import BlockIcon from '@mui/icons-material/Block'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useUIStore } from '../../store'
import SeverityChip from '../ui/SeverityChip'
import { mockRootCauses } from '../../api/mockData'
import type { Anomaly, Recommendation } from '../../types'

const PANEL_WIDTH = 340

export default function RightPanel() {
  const content = useUIStore((s) => s.rightPanelContent)
  const setContent = useUIStore((s) => s.setRightPanelContent)
  const navigate = useNavigate()

  const close = () => setContent(null)

  return (
    <AnimatePresence>
      {content && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1200 }}
          />
          <motion.div
            initial={{ x: PANEL_WIDTH }}
            animate={{ x: 0 }}
            exit={{ x: PANEL_WIDTH }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: PANEL_WIDTH,
              zIndex: 1300,
              background: '#0f1629',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                {content.type === 'anomaly' ? 'Anomaly Detail' : 'Recommendation'}
              </Typography>
              <IconButton size="small" onClick={close}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

            <Box sx={{ p: 2, flexGrow: 1 }}>
              {content.type === 'anomaly' ? (
                <AnomalyPanel
                  anomaly={content.data}
                  onInvestigate={() => {
                    close()
                    navigate('/app/root-cause')
                  }}
                  onResolve={() => {
                    toast.success(`Marked ${content.data.serviceName} anomaly resolved`)
                    close()
                  }}
                />
              ) : (
                <RecommendationPanel
                  reco={content.data}
                  onDone={() => {
                    toast.success('Recommendation marked done')
                    close()
                  }}
                  onDismiss={() => {
                    toast('Recommendation dismissed')
                    close()
                  }}
                />
              )}
            </Box>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={600} sx={{ color: valueColor }}>{value}</Typography>
    </Box>
  )
}

function AnomalyPanel({
  anomaly,
  onInvestigate,
  onResolve,
}: {
  anomaly: Anomaly
  onInvestigate: () => void
  onResolve: () => void
}) {
  const rc = mockRootCauses[anomaly.id]
  const impact = anomaly.actualCost - anomaly.expectedCost
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Typography variant="h6" fontWeight={700}>{anomaly.serviceName}</Typography>
        <SeverityChip severity={anomaly.severity} />
      </Box>

      <Box sx={{ bgcolor: 'rgba(239,68,68,0.08)', borderRadius: 2, p: 1.5, mb: 2 }}>
        <Typography variant="caption" color="text.secondary">Cost impact</Typography>
        <Typography variant="h5" fontWeight={800} color="error.main" fontFamily='"JetBrains Mono", monospace'>
          +${impact.toFixed(2)}
        </Typography>
      </Box>

      <Row label="Expected" value={`$${anomaly.expectedCost.toFixed(2)}`} />
      <Row label="Actual" value={`$${anomaly.actualCost.toFixed(2)}`} valueColor="#ef4444" />
      <Row label="Increase" value={`+${anomaly.increasePercentage.toFixed(1)}%`} valueColor="#ef4444" />
      <Row label="Z-Score" value={anomaly.zScore.toFixed(2)} />
      <Row label="Status" value={anomaly.status} />

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 2 }} />

      <Typography variant="subtitle2" fontWeight={700} gutterBottom>Root Cause</Typography>
      <Box sx={{ bgcolor: 'rgba(99,102,241,0.08)', borderLeft: '3px solid #6366f1', borderRadius: 1, p: 1.5, mb: 2 }}>
        <Typography variant="body2" fontWeight={700} color="primary.light">{anomaly.rootCause}</Typography>
        <Typography variant="caption" color="text.secondary">{anomaly.rootCauseConfidence}% confidence</Typography>
      </Box>

      {rc && (
        <>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>Evidence</Typography>
          {rc.evidence.map((e) => (
            <Box key={e.id} sx={{ display: 'flex', gap: 1, py: 0.5 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.8, flexShrink: 0 }} />
              <Box>
                <Typography variant="body2" fontWeight={600}>{e.label}</Typography>
                <Typography variant="caption" color="text.secondary">{e.detail}</Typography>
              </Box>
            </Box>
          ))}
        </>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
        <Button variant="contained" startIcon={<AccountTreeIcon />} onClick={onInvestigate}>
          View Root Cause Graph
        </Button>
        <Button variant="outlined" color="success" startIcon={<CheckCircleIcon />} onClick={onResolve}>
          Mark Resolved
        </Button>
      </Box>
    </Box>
  )
}

function RecommendationPanel({
  reco,
  onDone,
  onDismiss,
}: {
  reco: Recommendation
  onDone: () => void
  onDismiss: () => void
}) {
  const steps = reco.recommendation.split('\n').filter(Boolean)
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Typography variant="h6" fontWeight={700}>{reco.serviceName}</Typography>
        <SeverityChip severity={reco.priority} />
      </Box>

      <Box sx={{ bgcolor: 'rgba(16,185,129,0.08)', borderRadius: 2, p: 1.5, mb: 2 }}>
        <Typography variant="caption" color="text.secondary">Estimated monthly savings</Typography>
        <Typography variant="h5" fontWeight={800} color="success.main" fontFamily='"JetBrains Mono", monospace'>
          ~${reco.estimatedMonthlySavings.toLocaleString()}/mo
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" mb={2}>{reco.explanation}</Typography>

      <Typography variant="subtitle2" fontWeight={700} gutterBottom>Root Cause</Typography>
      <Box sx={{ mb: 1 }}>
        <Typography variant="body2" fontWeight={600}>{reco.rootCause}</Typography>
        <LinearProgress
          variant="determinate"
          value={reco.rootCauseConfidence}
          sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
        />
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 2 }} />

      <Typography variant="subtitle2" fontWeight={700} gutterBottom>Implementation Steps</Typography>
      {steps.map((s, i) => (
        <Typography key={i} variant="body2" color="text.secondary" sx={{ py: 0.4 }}>
          {s}
        </Typography>
      ))}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
        <Button variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={onDone}>
          Mark Done
        </Button>
        <Button variant="outlined" color="error" startIcon={<BlockIcon />} onClick={onDismiss}>
          Dismiss
        </Button>
      </Box>
    </Box>
  )
}
