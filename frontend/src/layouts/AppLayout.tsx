import { useEffect } from 'react'
import { Box, Drawer, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import TopBar from '../components/layout/TopBar'
import StatusBar from '../components/layout/StatusBar'
import RightPanel from '../components/layout/RightPanel'
import CommandPalette from '../components/CommandPalette'
import ASMRBackground from '../components/ui/asmr-background'
import { useUIStore } from '../store'
import { useAuth } from '../context/AuthContext'
import { useRealtimeEvents } from '../hooks/useRealtimeEvents'

export default function AppLayout() {
  const { isAuthenticated } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen)
  const mobileSidebarOpen = useUIStore((s) => s.mobileSidebarOpen)
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen)

  useRealtimeEvents()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setCommandPaletteOpen])

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: '#0a0a0c', position: 'relative' }}>
      {/* ASMR particle canvas — fixed behind everything */}
      <ASMRBackground />

      {/* Sidebar: permanent on desktop, drawer on mobile */}
      {isMobile ? (
        <Drawer
          open={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          PaperProps={{ sx: { bgcolor: 'transparent', border: 'none' } }}
        >
          <Box sx={{ height: '100%', position: 'relative', zIndex: 1 }} onClick={() => setMobileSidebarOpen(false)}>
            <Sidebar />
          </Box>
        </Drawer>
      ) : (
        <Box sx={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
          <Sidebar />
        </Box>
      )}

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', zIndex: 1 }}>
        <TopBar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            p: { xs: 2, md: 3 },
            bgcolor: 'transparent',
          }}
        >
          <Box sx={{ maxWidth: 1480, mx: 'auto' }}>
            <Outlet />
          </Box>
        </Box>
        <StatusBar />
      </Box>

      <RightPanel />
      <CommandPalette />
    </Box>
  )
}
