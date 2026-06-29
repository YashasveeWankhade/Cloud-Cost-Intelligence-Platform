import { Box, Typography, Button, Container, Grid, Card, Chip, Stack } from '@mui/material'
import BoltIcon from '@mui/icons-material/Bolt'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const STATS = [
  { value: '6', label: 'Services Monitored' },
  { value: '180', label: 'Days of History' },
  { value: '<1%', label: 'False Positive Rate' },
  { value: 'Real-time', label: 'Detection' },
]

const FEATURES = [
  {
    icon: <BoltIcon />,
    title: 'Anomaly Detection',
    body: 'Statistical detection using Z-score and moving averages flags spend spikes the moment they emerge — no manual thresholds.',
    color: '#6366f1',
  },
  {
    icon: <AccountTreeIcon />,
    title: 'Root Cause Analysis',
    body: 'An evidence graph scores each signal on a 100-point scale, correlating CloudTrail events, utilization and topology to pinpoint why.',
    color: '#22d3ee',
  },
  {
    icon: <AutoAwesomeIcon />,
    title: 'AI Recommendations',
    body: 'Gemini-powered remediation steps with quantified savings, ranked by priority and implementation difficulty.',
    color: '#10b981',
  },
]

const TECH = ['Java 21', 'Spring Boot 3.2', 'Apache Kafka', 'PostgreSQL', 'React 18', 'Docker', 'Prometheus']


const PRICING = [
  { name: 'Starter', tag: 'up to 3 accounts', highlight: false, perks: ['Anomaly detection', 'Daily sync', 'Email alerts'] },
  { name: 'Growth', tag: 'unlimited accounts', highlight: true, perks: ['Everything in Starter', 'Root cause graphs', 'AI recommendations', 'Real-time Kafka stream'] },
  { name: 'Enterprise', tag: 'custom', highlight: false, perks: ['Everything in Growth', 'SSO / SAML', 'Dedicated support', 'On-prem option'] },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <Box sx={{ bgcolor: '#0a0f1e', color: '#f1f5f9', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Nav */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(12px)', bgcolor: 'rgba(10,15,30,0.7)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 30, height: 30, borderRadius: 2, background: 'linear-gradient(135deg,#6366f1,#22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>☁</Box>
            <Typography fontWeight={800}>CloudCost</Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Button color="inherit" onClick={() => navigate('/login')}>Sign in</Button>
          <Button variant="contained" sx={{ ml: 1 }} onClick={() => navigate('/login')}>Launch Demo</Button>
        </Container>
      </Box>

      {/* Hero */}
      <Box
        sx={{
          position: 'relative',
          textAlign: 'center',
          py: { xs: 10, md: 16 },
          background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.25), transparent 60%)',
        }}
      >
        <Box className="particles" sx={particleSx} />
        <Container maxWidth="md" sx={{ position: 'relative' }}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: '16px !important' }} />}
              label="No AWS account required"
              sx={{ mb: 3, bgcolor: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontWeight: 600 }}
            />
            <Typography variant="h2" fontWeight={800} sx={{ fontSize: { xs: 34, md: 56 }, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
              Cloud Cost Intelligence
              <br />
              <Box component="span" sx={{ background: 'linear-gradient(90deg,#818cf8,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                for Engineering Teams
              </Box>
            </Typography>
            <Typography variant="h6" sx={{ color: '#94a3b8', mt: 3, fontWeight: 400, maxWidth: 620, mx: 'auto' }}>
              Detect anomalies, investigate root causes, and eliminate waste — automatically.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mt: 4 }}>
              <Button variant="contained" size="large" onClick={() => navigate('/login')} sx={{ px: 4, py: 1.25 }}>
                Launch Demo
              </Button>
              <Button variant="outlined" size="large" sx={{ px: 4, py: 1.25 }} onClick={() => navigate('/login')}>
                View Docs
              </Button>
            </Stack>
          </motion.div>
        </Container>
      </Box>

      {/* Stats bar */}
      <Container maxWidth="lg" sx={{ mb: 12 }}>
        <Card sx={{ p: { xs: 2, md: 3 } }}>
          <Grid container>
            {STATS.map((s, i) => (
              <Grid item xs={6} md={3} key={s.label} sx={{ textAlign: 'center', py: 2, borderRight: { md: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' } }}>
                <Typography variant="h4" fontWeight={800} sx={{ fontFamily: '"JetBrains Mono", monospace', color: '#818cf8' }}>{s.value}</Typography>
                <Typography variant="body2" color="text.secondary">{s.label}</Typography>
              </Grid>
            ))}
          </Grid>
        </Card>
      </Container>

      {/* Features */}
      <Container maxWidth="lg" sx={{ mb: 12 }}>
        <Typography variant="h4" fontWeight={800} textAlign="center" mb={1}>How it works</Typography>
        <Typography color="text.secondary" textAlign="center" mb={6}>Three stages, fully automated.</Typography>
        <Grid container spacing={3}>
          {FEATURES.map((f) => (
            <Grid item xs={12} md={4} key={f.title}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: `${f.color}22`, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>{f.icon}</Box>
                <Typography variant="h6" fontWeight={700} mb={1}>{f.title}</Typography>
                <Typography variant="body2" color="text.secondary">{f.body}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Tech stack */}
      <Container maxWidth="lg" sx={{ mb: 12, textAlign: 'center' }}>
        <Typography variant="overline" color="text.secondary">Built on a modern stack</Typography>
        <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
          {TECH.map((t) => (
            <Chip key={t} label={t} sx={{ bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: '"JetBrains Mono", monospace', fontSize: 13 }} />
          ))}
        </Stack>
      </Container>

      {/* Pricing */}
      <Container maxWidth="lg" sx={{ mb: 12 }}>
        <Typography variant="h4" fontWeight={800} textAlign="center" mb={6}>Pricing</Typography>
        <Grid container spacing={3} alignItems="stretch">
          {PRICING.map((p) => (
            <Grid item xs={12} md={4} key={p.name}>
              <Card sx={{ p: 3, height: '100%', position: 'relative', border: p.highlight ? '1px solid rgba(99,102,241,0.6)' : undefined, boxShadow: p.highlight ? '0 0 40px rgba(99,102,241,0.2)' : undefined }}>
                {p.highlight && <Chip label="Most popular" size="small" color="primary" sx={{ position: 'absolute', top: 16, right: 16 }} />}
                <Typography variant="h6" fontWeight={800}>{p.name}</Typography>
                <Typography color="text.secondary" mb={2}>{p.tag}</Typography>
                <Stack spacing={1} mb={3}>
                  {p.perks.map((perk) => (
                    <Box key={perk} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981' }} />
                      <Typography variant="body2">{perk}</Typography>
                    </Box>
                  ))}
                </Stack>
                <Button fullWidth variant={p.highlight ? 'contained' : 'outlined'} onClick={() => navigate('/login')}>Contact Sales</Button>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Footer */}
      <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.06)', py: 5 }}>
        <Container maxWidth="lg" sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 26, height: 26, borderRadius: 1.5, background: 'linear-gradient(135deg,#6366f1,#22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>☁</Box>
            <Typography fontWeight={700}>CloudCost</Typography>
          </Box>
          <Stack direction="row" spacing={3} sx={{ flexGrow: 1, justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer' }}>Docs</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer' }}>Pricing</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer' }}>GitHub</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer' }}>Security</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">Built with ♥ for engineering teams</Typography>
        </Container>
      </Box>
    </Box>
  )
}

const particleSx = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  backgroundImage:
    'radial-gradient(2px 2px at 20% 30%, rgba(129,140,248,0.6), transparent), radial-gradient(2px 2px at 70% 60%, rgba(34,211,238,0.5), transparent), radial-gradient(1.5px 1.5px at 40% 80%, rgba(255,255,255,0.4), transparent), radial-gradient(1.5px 1.5px at 85% 25%, rgba(129,140,248,0.5), transparent)',
  backgroundSize: '200px 200px, 240px 240px, 180px 180px, 260px 260px',
  animation: 'drift 24s linear infinite',
  '@keyframes drift': {
    '0%': { backgroundPosition: '0 0, 0 0, 0 0, 0 0' },
    '100%': { backgroundPosition: '200px 200px, -240px 240px, 180px -180px, -260px 260px' },
  },
} as const
