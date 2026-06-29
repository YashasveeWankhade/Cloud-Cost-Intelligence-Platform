import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Typography, InputBase } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import DashboardIcon from '@mui/icons-material/Dashboard'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import LightbulbIcon from '@mui/icons-material/Lightbulb'
import PublicIcon from '@mui/icons-material/Public'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import CloudIcon from '@mui/icons-material/Cloud'
import NotificationsIcon from '@mui/icons-material/Notifications'
import SettingsIcon from '@mui/icons-material/Settings'
import RefreshIcon from '@mui/icons-material/Refresh'
import BoltIcon from '@mui/icons-material/Bolt'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useUIStore, useSystemStore } from '../store'

interface Command {
  id: string
  label: string
  group: string
  icon: ReactNode
  shortcut?: string
  action: () => void
}

export default function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen)
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen)
  const setLastSyncTime = useSystemStore((s) => s.setLastSyncTime)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands: Command[] = useMemo(() => {
    const go = (path: string) => () => {
      navigate(path)
      setOpen(false)
    }
    return [
      { id: 'nav-overview', label: 'Overview', group: 'Navigation', icon: <DashboardIcon fontSize="small" />, shortcut: 'G O', action: go('/app/overview') },
      { id: 'nav-analytics', label: 'Cost Analytics', group: 'Navigation', icon: <TrendingUpIcon fontSize="small" />, shortcut: 'G A', action: go('/app/analytics') },
      { id: 'nav-anomalies', label: 'Anomalies', group: 'Navigation', icon: <WarningAmberIcon fontSize="small" />, shortcut: 'G N', action: go('/app/anomalies') },
      { id: 'nav-rootcause', label: 'Root Cause', group: 'Navigation', icon: <AccountTreeIcon fontSize="small" />, action: go('/app/root-cause') },
      { id: 'nav-reco', label: 'Recommendations', group: 'Navigation', icon: <LightbulbIcon fontSize="small" />, shortcut: 'G R', action: go('/app/recommendations') },
      { id: 'nav-universe', label: 'Cost Universe (3D)', group: 'Navigation', icon: <PublicIcon fontSize="small" />, action: go('/app/universe') },
      { id: 'nav-infra', label: 'Infrastructure', group: 'Navigation', icon: <MonitorHeartIcon fontSize="small" />, action: go('/app/infrastructure') },
      { id: 'nav-accounts', label: 'AWS Accounts', group: 'Navigation', icon: <CloudIcon fontSize="small" />, action: go('/app/accounts') },
      { id: 'nav-notif', label: 'Notifications', group: 'Navigation', icon: <NotificationsIcon fontSize="small" />, action: go('/app/notifications') },
      { id: 'nav-settings', label: 'Settings', group: 'Navigation', icon: <SettingsIcon fontSize="small" />, action: go('/app/settings') },
      {
        id: 'act-sync',
        label: 'Sync cost data now',
        group: 'Quick Actions',
        icon: <RefreshIcon fontSize="small" />,
        action: () => {
          setLastSyncTime(new Date())
          toast.success('Cost data synced')
          setOpen(false)
        },
      },
      {
        id: 'act-scan',
        label: 'Run anomaly scan',
        group: 'Quick Actions',
        icon: <BoltIcon fontSize="small" />,
        action: () => {
          toast.success('Anomaly scan started')
          setOpen(false)
        },
      },
    ]
  }, [navigate, setOpen, setLastSyncTime])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q))
  }, [query, commands])

  const groups = useMemo(() => {
    const map: Record<string, Command[]> = {}
    filtered.forEach((c) => {
      ;(map[c.group] ??= []).push(c)
    })
    return map
  }, [filtered])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (active >= filtered.length) setActive(Math.max(0, filtered.length - 1))
  }, [filtered.length, active])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      filtered[active]?.action()
    }
  }

  let runningIndex = -1

  return (
    <AnimatePresence>
      {open && (
        <Box
          onClick={() => setOpen(false)}
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 1500,
            bgcolor: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            pt: '12vh',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(620px, 92vw)' }}
          >
            <Box
              onKeyDown={handleKey}
              sx={{
                bgcolor: '#0f1629',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <SearchIcon sx={{ color: 'text.secondary' }} />
                <InputBase
                  inputRef={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search commands, pages, actions…"
                  sx={{ flexGrow: 1, fontSize: 15 }}
                />
                <Typography variant="caption" sx={{ color: 'text.secondary', border: '1px solid rgba(255,255,255,0.1)', px: 0.75, borderRadius: 1 }}>
                  ESC
                </Typography>
              </Box>

              <Box sx={{ maxHeight: 380, overflowY: 'auto', py: 1 }}>
                {filtered.length === 0 && (
                  <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                    No results for “{query}”
                  </Typography>
                )}
                {Object.entries(groups).map(([group, cmds]) => (
                  <Box key={group} sx={{ mb: 0.5 }}>
                    <Typography variant="caption" sx={{ px: 2, py: 0.5, display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700 }}>
                      {group}
                    </Typography>
                    {cmds.map((c) => {
                      runningIndex += 1
                      const isActive = runningIndex === active
                      return (
                        <Box
                          key={c.id}
                          onMouseEnter={() => setActive(filtered.indexOf(c))}
                          onClick={c.action}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            mx: 1,
                            px: 1.5,
                            py: 1,
                            borderRadius: 2,
                            cursor: 'pointer',
                            color: isActive ? 'primary.light' : 'text.primary',
                            bgcolor: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                          }}
                        >
                          <Box sx={{ display: 'flex', color: isActive ? 'primary.light' : 'text.secondary' }}>{c.icon}</Box>
                          <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 500 }}>{c.label}</Typography>
                          {c.shortcut && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: '"JetBrains Mono", monospace' }}>
                              {c.shortcut}
                            </Typography>
                          )}
                        </Box>
                      )
                    })}
                  </Box>
                ))}
              </Box>
            </Box>
          </motion.div>
        </Box>
      )}
    </AnimatePresence>
  )
}
