import { Chip } from '@mui/material'
import type { ChipProps } from '@mui/material'

type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string

const STYLES: Record<string, { color: string; bg: string; border: string }> = {
  CRITICAL: { color: '#fecaca', bg: 'rgba(239,68,68,0.16)', border: 'rgba(239,68,68,0.5)' },
  HIGH: { color: '#fed7aa', bg: 'rgba(245,158,11,0.16)', border: 'rgba(245,158,11,0.5)' },
  MEDIUM: { color: '#fde68a', bg: 'rgba(234,179,8,0.16)', border: 'rgba(234,179,8,0.45)' },
  LOW: { color: '#bfdbfe', bg: 'rgba(59,130,246,0.16)', border: 'rgba(59,130,246,0.45)' },
}

interface SeverityChipProps {
  severity: SeverityLevel
  size?: ChipProps['size']
}

export default function SeverityChip({ severity, size = 'small' }: SeverityChipProps) {
  const key = String(severity).toUpperCase()
  const s = STYLES[key] ?? STYLES.LOW
  return (
    <Chip
      size={size}
      label={key}
      sx={{
        color: s.color,
        backgroundColor: s.bg,
        border: `1px solid ${s.border}`,
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: 0.4,
        height: size === 'small' ? 22 : undefined,
      }}
    />
  )
}
