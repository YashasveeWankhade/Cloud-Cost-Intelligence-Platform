import {
  Box,
  Typography,
  Divider,
  Tooltip,
  Avatar,
  IconButton,
  Badge,
  Chip,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import LightbulbIcon from '@mui/icons-material/Lightbulb'
import PublicIcon from '@mui/icons-material/Public'
import CloudIcon from '@mui/icons-material/Cloud'
import NotificationsIcon from '@mui/icons-material/Notifications'
import SettingsIcon from '@mui/icons-material/Settings'
import PersonIcon from '@mui/icons-material/Person'
import LogoutIcon from '@mui/icons-material/Logout'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import type { ReactNode, CSSProperties } from 'react'
import { styled } from '@mui/material/styles'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useUIStore, useNotificationStore } from '../../store'
import { useAuth } from '../../context/AuthContext'
import { mockAnomalies, mockRecommendations } from '../../api/mockData'

const EXPANDED = 220
const COLLAPSED = 64

interface NavItem {
  label: string
  icon: ReactNode
  path: string
  badge?: number
  chip?: string
}

const NavItemRoot = styled('div', {
  shouldForwardProp: (p) => p !== 'active' && p !== 'collapsed',
})<{ active: boolean; collapsed: boolean }>(({ active, collapsed }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  margin: '0 8px',
  padding: collapsed ? '8px 10px' : '8px 12px',
  borderRadius: 8,
  cursor: 'pointer',
  position: 'relative',
  color: active ? '#818cf8' : '#94a3b8',
  background: active ? 'rgba(99,102,241,0.14)' : 'transparent',
  transition: 'all .15s ease',
  '&:hover': {
    background: active ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
    color: active ? '#818cf8' : '#f1f5f9',
    transform: 'translateX(2px)',
  },
  '&::before': active
    ? {
        content: '""',
        position: 'absolute',
        left: -8,
        top: 6,
        bottom: 6,
        width: 3,
        borderRadius: 4,
        background: '#6366f1',
      }
    : undefined,
}))

function NavRow({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: NavItem
  active: boolean
  collapsed: boolean
  onClick: () => void
}): ReactNode {
  const rowChildren: ReactNode = (
    <>
      <Badge
        color="error"
        badgeContent={collapsed ? item.badge : 0}
        overlap="circular"
        sx={{ '& .MuiBadge-badge': { fontSize: 9, height: 16, minWidth: 16 } }}
      >
        <span style={{ display: 'flex', fontSize: 0 }}>{item.icon}</span>
      </Badge>
      {!collapsed && (
        <>
          <span style={{ fontWeight: active ? 700 : 500, flexGrow: 1, fontSize: 14 }}>
            {item.label}
          </span>
          {item.chip && (
            <Chip
              label={item.chip}
              size="small"
              sx={{ height: 18, fontSize: 9, bgcolor: 'rgba(99,102,241,0.25)', color: 'primary.light' }}
            />
          )}
          {item.badge ? <span style={badgeStyle}>{item.badge}</span> : null}
        </>
      )}
    </>
  )

  const row: ReactNode = (
    <NavItemRoot onClick={onClick} active={active} collapsed={collapsed}>
      {rowChildren}
    </NavItemRoot>
  )

  return collapsed ? (
    <Tooltip title={item.label} placement="right">
      <span>{row}</span>
    </Tooltip>
  ) : (
    row
  )
}

const badgeStyle: CSSProperties = {
  minWidth: 18,
  height: 18,
  padding: '0 5px',
  borderRadius: 9,
  background: '#ef4444',
  color: '#fff',
  fontSize: 10,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const { user, logout } = useAuth()

  const openAnomalies = mockAnomalies.filter((a) => a.status !== 'RESOLVED').length
  const pendingRecos = mockRecommendations.filter((r) => r.status === 'PENDING').length

  const navItems: NavItem[] = [
    { label: 'Overview', icon: <DashboardIcon />, path: '/app/overview' },
    { label: 'Cost Analytics', icon: <TrendingUpIcon />, path: '/app/analytics' },
    { label: 'Anomalies', icon: <WarningAmberIcon />, path: '/app/anomalies', badge: openAnomalies },
    { label: 'Root Cause', icon: <AccountTreeIcon />, path: '/app/root-cause' },
    { label: 'Recommendations', icon: <LightbulbIcon />, path: '/app/recommendations', badge: pendingRecos },
    { label: 'Cost Universe', icon: <PublicIcon />, path: '/app/universe' },
    { label: 'AWS Accounts', icon: <CloudIcon />, path: '/app/accounts' },
    { label: 'Notifications', icon: <NotificationsIcon />, path: '/app/notifications', badge: unreadCount },
  ]

  const width = collapsed ? COLLAPSED : EXPANDED

  const renderItem = (item: NavItem): ReactNode => (
    <NavRow
      key={item.path}
      item={item}
      active={location.pathname === item.path}
      collapsed={collapsed}
      onClick={() => navigate(item.path)}
    />
  )

  const divider = <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

  const brand: ReactNode = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px', minHeight: 64 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800 }}>
        ☁
      </div>
      {!collapsed && (
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.1 }}>CloudCost</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Intelligence</div>
        </div>
      )}
    </div>
  )

  const nav: ReactNode = (
    <div style={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {navItems.map(renderItem)}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 16px' }} />
      {renderItem({ label: 'Profile', icon: <PersonIcon />, path: '/app/profile' })}
      {renderItem({ label: 'Settings', icon: <SettingsIcon />, path: '/app/settings' })}
    </div>
  )

  const footer: ReactNode = (
    <div style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
      <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}>
        {user?.firstName?.[0] ?? 'D'}
      </Avatar>
      {!collapsed && (
        <div style={{ overflow: 'hidden', flexGrow: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user ? `${user.firstName} ${user.lastName}` : 'Demo User'}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{user?.role ?? 'ADMIN'}</div>
        </div>
      )}
      {!collapsed && (
        <Tooltip title="Log out">
          <IconButton size="small" onClick={logout}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </div>
  )

  const toggle: ReactNode = (
    <div style={{ padding: '0 8px 8px' }}>
      <IconButton
        size="small"
        onClick={toggleSidebar}
        sx={{ width: '100%', borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
      </IconButton>
    </div>
  )

  return (
    <motion.aside
      animate={{ width }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      style={{
        width,
        height: '100%',
        flexShrink: 0,
        overflow: 'hidden',
        background: '#0b1120',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {brand}
      {divider}
      {nav}
      {divider}
      {footer}
      {toggle}
    </motion.aside>
  )
}
