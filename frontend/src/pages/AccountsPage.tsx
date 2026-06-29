import { useState } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, Chip, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, Divider,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import DeleteIcon from '@mui/icons-material/Delete'
import CloudIcon from '@mui/icons-material/Cloud'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { costsApi } from '../api/costs'
import type { AwsAccount } from '../types'

const STATUS_COLORS: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
  ACTIVE: 'success', ERROR: 'error', INACTIVE: 'default', PENDING: 'warning',
}

export default function AccountsPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    accountName: '', accountId: '', region: 'us-east-1',
    accessKeyId: '', secretAccessKey: '', description: '',
  })

  const { data: accounts = [] } = useQuery({ queryKey: ['accounts'], queryFn: costsApi.getAccounts })

  const connectMutation = useMutation({
    mutationFn: costsApi.connectAccount,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); setOpen(false); toast.success('Account connected') },
  })
  const disconnectMutation = useMutation({
    mutationFn: costsApi.disconnectAccount,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); toast('Account disconnected') },
  })
  const refreshMutation = useMutation({
    mutationFn: costsApi.refreshAccount,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); toast.success('Sync started') },
  })

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h5" fontWeight={700}>AWS Accounts</Typography>
          <Chip label="Demo Mode" size="small" sx={{ bgcolor: 'rgba(16,185,129,0.14)', color: '#10b981', border: '1px solid rgba(16,185,129,0.4)', fontWeight: 700 }} />
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Connect Account</Button>
      </Box>

      <Grid container spacing={2.5}>
        {accounts.map((a: AwsAccount) => (
          <Grid item xs={12} md={6} key={a.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: 'rgba(99,102,241,0.15)', color: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CloudIcon /></Box>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>{a.accountName}</Typography>
                      <Typography variant="caption" color="text.secondary" fontFamily='"JetBrains Mono", monospace'>{a.accountId}</Typography>
                    </Box>
                  </Box>
                  <Chip label={a.status} color={STATUS_COLORS[a.status] ?? 'default'} size="small" />
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip label={a.region} size="small" variant="outlined" />
                  {a.description && <Chip label={a.description} size="small" variant="outlined" />}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'success.main' }}>
                  <CheckCircleIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption" color="text.secondary">
                    Last sync: {a.lastSyncAt ? formatDistanceToNow(new Date(a.lastSyncAt), { addSuffix: true }) : 'Never'}
                  </Typography>
                </Box>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 1.5 }} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" startIcon={<RefreshIcon />} onClick={() => refreshMutation.mutate(a.id)} disabled={refreshMutation.isPending}>Sync now</Button>
                  <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => disconnectMutation.mutate(a.id)}>Disconnect</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {accounts.length === 0 && (
          <Grid item xs={12}><Alert severity="info">No accounts connected. Click "Connect Account" to add one.</Alert></Grid>
        )}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Connect AWS Account</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            In demo mode you can use any values — the platform generates synthetic data automatically.
          </Alert>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {Object.entries({
              accountName: 'Account Name',
              accountId: 'AWS Account ID',
              region: 'Region',
              accessKeyId: 'Access Key ID (optional)',
              secretAccessKey: 'Secret Access Key (optional)',
              description: 'Description (optional)',
            }).map(([field, label]) => (
              <TextField
                key={field}
                label={label}
                size="small"
                fullWidth
                value={form[field as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                type={field === 'secretAccessKey' ? 'password' : 'text'}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => connectMutation.mutate(form)} disabled={connectMutation.isPending || !form.accountName}>
            {connectMutation.isPending ? 'Connecting…' : 'Connect'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
