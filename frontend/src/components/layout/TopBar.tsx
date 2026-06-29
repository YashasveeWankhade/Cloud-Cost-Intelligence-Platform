import { useState } from 'react'
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Chip,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import SearchIcon from '@mui/icons-material/Search'
import NotificationsIcon from '@mui/icons-material/Notifications'
import LogoutIcon from '@mui/icons-material/Logout'
import PersonIcon from '@mui/icons-material/Person'
import SettingsIcon from '@mui/icons-material/Settings'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUIStore, useNotificationStore, useSystemStore } from '../../store'
import { useAuth } from '../../context/AuthContext'

const TITLES: Record<string, string> = {
  overview: 'Overview',
  analytics: 'Cost Analytics',
  anomalies: 'Anomalies',
  'root-cause': 'Root Cause Analysis',
  recommendations: 'Recommendations',
  universe: 'Cost Universe',
  infrastructure: 'Infrastructure',
  accounts: 'AWS Accounts',
  notifications: 'Notifications',
  settings: 'Settings',
  profile: 'Profile',
}

export default function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen)
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const servicesHealthy = useSystemStore((s) => s.servicesHealthy)
  const totalServices = useSystemStore((s) => s.totalServices)

  const [anchor, setAnchor] = useState<null | HTMLElement>(null)

  const segment = location.pathname.split('/').filter(Boolean).pop() ?? 'overview'
  const pageTitle = TITLES[segment] ?? 'Overview'
  const allHealthy = servicesHealthy === totalServices

  return (
    <Box
      sx={{
        height: 52,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        bgcolor: 'rgba(10,15,30,0.85)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <IconButton
        size="small"
        onClick={() => {
          toggleSidebar()
          setMobileSidebarOpen(true)
        }}
      >
        <MenuIcon fontSize="small" />
      </IconButton>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          App
        </Typography>
        <Typography variant="body2" color="text.secondary">
          /
        </Typography>
        <Typography variant="body2" fontWeight={700}>
          {pageTitle}
        </Typography>
      </Box>

      {/* Search / command palette trigger */}
      <Box
        onClick={() => setCommandPaletteOpen(true)}
        sx={{
          ml: 'auto',
          display: { xs: 'none', sm: 'flex' },
          alignItems: 'center',
          gap: 1,
          width: 280,
          px: 1.5,
          py: 0.75,
          borderRadius: 2,
          cursor: 'pointer',
          color: 'text.secondary',
          border: '1px solid rgba(255,255,255,0.08)',
          bgcolor: 'rgba(255,255,255,0.02)',
          '&:hover': { borderColor: 'rgba(99,102,241,0.5)' },
        }}
      >
        <SearchIcon fontSize="small" />
        <Typography variant="body2" sx={{ flexGrow: 1 }}>
          Search or jump to…
        </Typography>
        <Chip label="⌘K" size="small" sx={{ height: 20, fontSize: 10, bgcolor: 'rgba(255,255,255,0.06)' }} />
      </Box>

      <Box sx={{ ml: { xs: 'auto', sm: 0 }, display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* System status pill */}
        <Chip
          icon={
            <FiberManualRecordIcon sx={{ fontSize: '12px !important', color: allHealthy ? '#10b981' : '#f59e0b' }} />
          }
          label={`${servicesHealthy}/${totalServices} healthy`}
          size="small"
          sx={{
            bgcolor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontWeight: 600,
            display: { xs: 'none', md: 'flex' },
          }}
        />

        <IconButton size="small" onClick={() => navigate('/app/notifications')}>
          <Badge color="error" badgeContent={unreadCount} max={99}>
            <NotificationsIcon fontSize="small" />
          </Badge>
        </IconButton>

        <Chip
          label="Demo Org"
          size="small"
          variant="outlined"
          sx={{ display: { xs: 'none', md: 'flex' }, fontWeight: 600 }}
        />

        <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)}>
          <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontSize: 13 }}>
            {user?.firstName?.[0] ?? 'D'}
          </Avatar>
        </IconButton>

        <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="body2" fontWeight={700}>
              {user ? `${user.firstName} ${user.lastName}` : 'Demo User'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email ?? 'demo@cloudcost.io'}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { setAnchor(null); navigate('/app/profile') }}>
            <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
            Profile
          </MenuItem>
          <MenuItem onClick={() => { setAnchor(null); navigate('/app/settings') }}>
            <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
            Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { setAnchor(null); logout() }}>
            <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
            Log out
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  )
}
