import { useState } from 'react'
import { Box, Typography, Card, CardContent, Tabs, Tab, Chip, Button, Divider } from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import LightbulbIcon from '@mui/icons-material/Lightbulb'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import InfoIcon from '@mui/icons-material/Info'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { useNotificationStore } from '../store'
import type { LiveNotification } from '../types'

const ICONS: Record<string, ReactNode> = {
  ANOMALY_ALERT: <WarningAmberIcon fontSize="small" />,
  RECOMMENDATION: <LightbulbIcon fontSize="small" />,
  ROOT_CAUSE: <AccountTreeIcon fontSize="small" />,
  SYSTEM: <InfoIcon fontSize="small" />,
}

const SEV_COLOR: Record<string, string> = {
  CRITICAL: '#ef4444', HIGH: '#f59e0b', MEDIUM: '#eab308', LOW: '#3b82f6', INFO: '#6366f1',
}

const TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'ANOMALY_ALERT', label: 'Alerts' },
  { key: 'RECOMMENDATION', label: 'Recommendations' },
  { key: 'SYSTEM', label: 'System' },
]

export default function NotificationsPage() {
  const navigate = useNavigate()
  const notifications = useNotificationStore((s) => s.notifications)
  const markAllRead = useNotificationStore((s) => s.markAllRead)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const [tab, setTab] = useState('ALL')

  const filtered = notifications.filter((n) =>
    tab === 'ALL' ? true : tab === 'SYSTEM' ? n.type === 'SYSTEM' || n.type === 'ROOT_CAUSE' : n.type === tab,
  )

  const routeFor = (n: LiveNotification) => {
    if (n.type === 'ANOMALY_ALERT') return '/app/anomalies'
    if (n.type === 'RECOMMENDATION') return '/app/recommendations'
    if (n.type === 'ROOT_CAUSE') return '/app/root-cause'
    return '/app/infrastructure'
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>Notifications</Typography>
        <Button size="small" disabled={!unreadCount} onClick={markAllRead}>Mark all read</Button>
      </Box>

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {TABS.map((t) => <Tab key={t.key} value={t.key} label={t.label} sx={{ textTransform: 'none', fontWeight: 600 }} />)}
        </Tabs>
        <CardContent sx={{ p: 0 }}>
          {filtered.map((n, idx) => {
            const color = SEV_COLOR[n.severity] ?? '#6366f1'
            return (
              <Box key={n.id}>
                <Box sx={{ display: 'flex', gap: 1.5, p: 2, alignItems: 'flex-start', bgcolor: n.read ? 'transparent' : 'rgba(99,102,241,0.05)' }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${color}1f`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {ICONS[n.type]}
                  </Box>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" fontWeight={700}>{n.title}</Typography>
                      {!n.read && <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'primary.main' }} />}
                    </Box>
                    <Typography variant="body2" color="text.secondary">{n.description}</Typography>
                    <Typography variant="caption" color="text.secondary">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                    <Chip label={n.status} size="small" variant="outlined" color={n.status === 'SENT' ? 'success' : 'default'} />
                    <Button size="small" onClick={() => navigate(routeFor(n))}>View</Button>
                  </Box>
                </Box>
                {idx < filtered.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />}
              </Box>
            )
          })}
          {filtered.length === 0 && <Typography sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>No notifications in this category.</Typography>}
        </CardContent>
      </Card>
    </Box>
  )
}
