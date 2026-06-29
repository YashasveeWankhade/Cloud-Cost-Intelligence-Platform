import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import ASMRBackground from '../components/ui/asmr-background'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Eye, EyeOff, CloudCog } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('demo@cloudcost.io')
  const [password, setPassword] = useState('demo123456')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/app/overview')
    } catch {
      setError('Invalid credentials. Use demo@cloudcost.io / demo123456')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full h-screen bg-[#0a0a0c] overflow-hidden">
      {/* ASMR particle canvas */}
      <ASMRBackground />

      {/* Centered login card */}
      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <div className="w-full max-w-sm">

          {/* Logo + title */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #6366f1, #22d3ee)' }}>
              <CloudCog className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
            <p className="text-sm text-white/50 mt-1">Enter your credentials to access your account.</p>
          </div>

          {/* Card */}
          <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-5">

              {error && (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-white/70">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="demo@cloudcost.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/25 focus-visible:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-white/70">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/25 focus-visible:ring-indigo-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium h-10"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            {/* Demo hint */}
            <div className="mt-5 rounded-md border border-indigo-500/20 bg-indigo-500/[0.06] px-3 py-2.5">
              <p className="text-xs text-white/40 leading-relaxed">
                <span className="text-white/60 font-medium">Demo mode —</span> no real AWS account needed.<br />
                Email: <span className="text-white/55">demo@cloudcost.io</span> · Password: <span className="text-white/55">demo123456</span>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-white/25 mt-6">
            CloudCost Intelligence · v1.0.0
          </p>
        </div>
      </div>
    </div>
  )
}
