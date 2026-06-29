import { useState } from 'react'
import {
  Box, Typography, Card, CardContent, Tabs, Tab, Switch,
  FormControlLabel, Button, Divider, MenuItem, Stack, TextField,
} from '@mui/material'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import LockIcon from '@mui/icons-material/Lock'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [tab, setTab] = useState(0)

  // Notifications
  const [anomalyAlerts, setAnomalyAlerts] = useState(true)
  const [recoAlerts, setRecoAlerts] = useState(true)
  const [systemAlerts, setSystemAlerts] = useState(false)
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [minSeverity, setMinSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH')

  // Security
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  const save = () => toast.success('Settings saved')

  const changePassword = () => {
    if (!currentPw || !newPw || !confirmPw) {
      toast.error('All password fields are required')
      return
    }
    if (newPw !== confirmPw) {
      toast.error('New passwords do not match')
      return
    }
    if (newPw.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    toast.success('Password updated')
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
  }

  return (
    <Box>
      <Box mb={2.5}>
        <Typography variant="h5" fontWeight={700}>Settings</Typography>
        <Typography variant="body2" color="text.secondary">Configure notifications and account security</Typography>
      </Box>

      <Card>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ px: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          {[
            { label: 'Notifications', icon: <NotificationsActiveIcon fontSize="small" /> },
            { label: 'Security', icon: <LockIcon fontSize="small" /> },
          ].map(({ label, icon }) => (
            <Tab
              key={label}
              label={label}
              icon={icon}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48 }}
            />
          ))}
        </Tabs>

        <CardContent sx={{ maxWidth: 520 }}>

          {/* ── Notifications ─────────────────────────────────────── */}
          {tab === 0 && (
            <Stack spacing={2}>
              <Typography variant="subtitle2" fontWeight={700}>Alert types</Typography>
              <FormControlLabel
                control={<Switch checked={anomalyAlerts} onChange={(e) => setAnomalyAlerts(e.target.checked)} />}
                label="Cost anomaly alerts"
              />
              <FormControlLabel
                control={<Switch checked={recoAlerts} onChange={(e) => setRecoAlerts(e.target.checked)} />}
                label="New AI recommendations"
              />
              <FormControlLabel
                control={<Switch checked={systemAlerts} onChange={(e) => setSystemAlerts(e.target.checked)} />}
                label="System / service health alerts"
              />

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

              <Typography variant="subtitle2" fontWeight={700}>Delivery</Typography>
              <FormControlLabel
                control={<Switch checked={emailNotifs} onChange={(e) => setEmailNotifs(e.target.checked)} />}
                label="Send email for alerts"
              />
              <TextField
                label="Minimum severity to notify"
                size="small"
                select
                value={minSeverity}
                onChange={(e) => setMinSeverity(e.target.value as typeof minSeverity)}
                helperText="Only alerts at or above this severity will be delivered"
              >
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </TextField>

              <Button variant="contained" onClick={save} sx={{ alignSelf: 'flex-start' }}>
                Save changes
              </Button>
            </Stack>
          )}

          {/* ── Security ──────────────────────────────────────────── */}
          {tab === 1 && (
            <Stack spacing={2.5}>
              <Typography variant="subtitle2" fontWeight={700}>Change password</Typography>
              <TextField
                label="Current password"
                size="small"
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
              />
              <TextField
                label="New password"
                size="small"
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                helperText="Minimum 8 characters"
              />
              <TextField
                label="Confirm new password"
                size="small"
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
              />
              <Button variant="contained" onClick={changePassword} sx={{ alignSelf: 'flex-start' }}>
                Update password
              </Button>
            </Stack>
          )}

        </CardContent>
      </Card>
    </Box>
  )
}
