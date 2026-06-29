import type { ReactNode } from 'react'
import { Card, CardContent, Typography, Box, Skeleton } from '@mui/material'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import { ResponsiveContainer, AreaChart, Area } from 'recharts'
import { motion } from 'framer-motion'
import AnimatedCounter from './AnimatedCounter'

export interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  /** % change. trendPositive controls whether up=good. */
  trend?: number
  trendLabel?: string
  /** when true, a positive trend is rendered green; when false, positive is red */
  trendPositiveIsGood?: boolean
  sparklineData?: number[]
  icon?: ReactNode
  color?: string
  prefix?: string
  suffix?: string
  decimals?: number
  loading?: boolean
}

export default function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  trendPositiveIsGood = false,
  sparklineData,
  icon,
  color = '#6366f1',
  prefix,
  suffix,
  decimals = 0,
  loading,
}: MetricCardProps) {
  const numeric = typeof value === 'number' ? value : null
  const trendUp = (trend ?? 0) >= 0
  const trendGood = trendUp === trendPositiveIsGood
  const trendColor = trend === undefined ? '#94a3b8' : trendGood ? '#10b981' : '#ef4444'

  const spark = (sparklineData ?? []).map((v, i) => ({ i, v }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -3 }}
      style={{ height: '100%' }}
    >
      <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
        <CardContent sx={{ pb: spark.length ? 0 : 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}
            >
              {title}
            </Typography>
            {icon && (
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  display: 'flex',
                  bgcolor: `${color}22`,
                  color,
                }}
              >
                {icon}
              </Box>
            )}
          </Box>

          {loading ? (
            <Skeleton width="60%" height={48} sx={{ mt: 1 }} />
          ) : (
            <Typography
              variant="h4"
              sx={{ mt: 0.5, fontWeight: 700, color: 'text.primary', fontFamily: '"JetBrains Mono", monospace' }}
            >
              {numeric !== null ? (
                <AnimatedCounter value={numeric} prefix={prefix} suffix={suffix} decimals={decimals} />
              ) : (
                <>
                  {prefix}
                  {value}
                  {suffix}
                </>
              )}
            </Typography>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, minHeight: 20 }}>
            {trend !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', color: trendColor }}>
                {trendUp ? (
                  <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                ) : (
                  <ArrowDownwardIcon sx={{ fontSize: 14 }} />
                )}
                <Typography variant="caption" sx={{ fontWeight: 700, ml: 0.25 }}>
                  {Math.abs(trend).toFixed(1)}%
                </Typography>
              </Box>
            )}
            {(trendLabel || subtitle) && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {trendLabel ?? subtitle}
              </Typography>
            )}
          </Box>
        </CardContent>

        {spark.length > 0 && !loading && (
          <Box sx={{ height: 46, mt: -0.5 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spark} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`spark-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#spark-${title.replace(/\s/g, '')})`}
                  isAnimationActive
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Card>
    </motion.div>
  )
}
