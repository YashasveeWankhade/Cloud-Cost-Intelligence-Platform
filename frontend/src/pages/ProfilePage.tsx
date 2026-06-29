import { useState } from 'react'
import {
  Box, Typography, Card, CardContent, TextField, Button, Avatar,
  Divider, Stack, MenuItem, Chip,
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import EditIcon from '@mui/icons-material/Edit'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const TIMEZONES = ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Kolkata', 'Asia/Singapore']

export default function ProfilePage() {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState(
    user ? `${user.firstName} ${user.lastName}` : 'Demo User'
  )
  const [email] = useState(user?.email ?? 'demo@cloudcost.io')
  const [timezone, setTimezone] = useState('UTC')
  const [editMode, setEditMode] = useState(false)

  const save = () => {
    toast.success('Profile updated')
    setEditMode(false)
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Profile</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your personal account information
          </Typography>
        </Box>
        <Button
          variant={editMode ? 'outlined' : 'contained'}
          startIcon={<EditIcon />}
          onClick={() => setEditMode(!editMode)}
          size="small"
        >
          {editMode ? 'Cancel' : 'Edit Profile'}
        </Button>
      </Box>

      {/* Avatar + name card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            <Avatar
              sx={{
                width: 72,
                height: 72,
                bgcolor: 'primary.main',
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              {(user?.firstName?.[0] ?? 'D')}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" fontWeight={700}>
                {displayName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {email}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip
                  label={user?.role ?? 'ADMIN'}
                  size="small"
                  sx={{ bgcolor: 'rgba(99,102,241,0.15)', color: 'primary.light', fontWeight: 700 }}
                />
                <Chip
                  label="Demo Mode"
                  size="small"
                  sx={{ bgcolor: 'rgba(16,185,129,0.12)', color: '#10b981', fontWeight: 600 }}
                />
              </Stack>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Profile fields */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} mb={2.5}>
            Personal Information
          </Typography>
          <Stack spacing={2.5}>
            <TextField
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={!editMode}
              fullWidth
              size="small"
            />
            <TextField
              label="Email Address"
              value={email}
              disabled
              fullWidth
              size="small"
              helperText="Contact your administrator to change your email"
            />
            <TextField
              label="Timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={!editMode}
              select
              fullWidth
              size="small"
            >
              {TIMEZONES.map((tz) => (
                <MenuItem key={tz} value={tz}>{tz}</MenuItem>
              ))}
            </TextField>
          </Stack>

          {editMode && (
            <>
              <Divider sx={{ my: 2.5 }} />
              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => setEditMode(false)}>Cancel</Button>
                <Button variant="contained" onClick={save}>Save Changes</Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Account metadata */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>
            Account Details
          </Typography>
          <Stack spacing={1.5}>
            {[
              { label: 'Account ID', value: 'demo-001' },
              { label: 'Member Since', value: 'June 2024' },
              { label: 'Last Login', value: 'Just now' },
              { label: 'Primary Region', value: 'us-east-1' },
            ].map(({ label, value }) => (
              <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="body2" fontWeight={600}>{value}</Typography>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
