import { useEffect, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { formatDistanceToNow } from 'date-fns'
import { useSystemStore } from '../../store'

const MONO = '"JetBrains Mono", monospace'

function Dot({ color }: { color: string }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        bgcolor: color,
        mr: 0.75,
        boxShadow: `0 0 6px ${color}`,
      }}
    />
  )
}

const Sep = () => (
  <Typography component="span" sx={{ color: 'rgba(255,255,255,0.15)', mx: 1.5, fontFamily: MONO, fontSize: 11 }}>
    |
  </Typography>
)

export default function StatusBar() {
  const { demoMode, kafkaConnected, servicesHealthy, totalServices, lastSyncTime } = useSystemStore()
  const [, setTick] = useState(0)

  // Re-render every 15s so "last sync" relative time stays fresh.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 15000)
    return () => clearInterval(t)
  }, [])

  const allHealthy = servicesHealthy === totalServices

  return (
    <Box
      sx={{
        height: 28,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        px: 2,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        bgcolor: '#0b1120',
        fontFamily: MONO,
        fontSize: 11,
        overflowX: 'auto',
        whiteSpace: 'nowrap',
      }}
    >
      <Typography component="span" sx={{ fontFamily: MONO, fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center' }}>
        <Dot color="#10b981" />
        {demoMode ? 'Demo Mode' : 'Live'}
      </Typography>
      <Sep />
      <Typography component="span" sx={{ fontFamily: MONO, fontSize: 11, color: 'text.secondary' }}>
        Kafka: <Box component="span" sx={{ color: kafkaConnected ? '#10b981' : '#ef4444' }}>{kafkaConnected ? 'Connected' : 'Disconnected'}</Box>
      </Typography>
      <Sep />
      <Typography component="span" sx={{ fontFamily: MONO, fontSize: 11, color: 'text.secondary' }}>
        Services: <Box component="span" sx={{ color: allHealthy ? '#10b981' : '#f59e0b' }}>{servicesHealthy}/{totalServices} healthy</Box>
      </Typography>
      <Sep />
      <Typography component="span" sx={{ fontFamily: MONO, fontSize: 11, color: 'text.secondary' }}>
        Last sync: {formatDistanceToNow(lastSyncTime, { addSuffix: true })}
      </Typography>
      <Box sx={{ flexGrow: 1 }} />
      <Typography component="span" sx={{ fontFamily: MONO, fontSize: 11, color: 'text.secondary' }}>
        v1.0.0
      </Typography>
    </Box>
  )
}
