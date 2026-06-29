import React, { useEffect, useRef } from 'react'

/**
 * Fixed fullscreen canvas background — glass-shard + charcoal-dust particles
 * with a magnetic vortex on mouse hover. Sits behind all content via z-index.
 */
const ASMRBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let animationFrameId = 0
    const mouse = { x: -1000, y: -1000 }

    const PARTICLE_COUNT = 900
    const MAGNETIC_RADIUS = 260
    const VORTEX_STRENGTH = 0.07
    const PULL_STRENGTH = 0.12

    interface Particle {
      x: number; y: number
      vx: number; vy: number
      size: number; alpha: number
      color: string; rotation: number
      rotationSpeed: number; frictionGlow: number
    }

    let particles: Particle[] = []

    function makeParticle(): Particle {
      const isGlass = Math.random() > 0.7
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.4 + 0.4,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        color: isGlass ? '200, 220, 255' : '70, 70, 80',
        alpha: Math.random() * 0.35 + 0.08,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        frictionGlow: 0,
      }
    }

    const init = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
      particles = Array.from({ length: PARTICLE_COUNT }, makeParticle)
    }

    const render = () => {
      ctx.fillStyle = 'rgba(10, 10, 18, 0.16)'
      ctx.fillRect(0, 0, width, height)

      for (const p of particles) {
        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < MAGNETIC_RADIUS && dist > 0) {
          const force = (MAGNETIC_RADIUS - dist) / MAGNETIC_RADIUS
          p.vx += (dx / dist) * force * PULL_STRENGTH
          p.vy += (dy / dist) * force * PULL_STRENGTH
          p.vx += (dy / dist) * force * VORTEX_STRENGTH * 10
          p.vy -= (dx / dist) * force * VORTEX_STRENGTH * 10
          p.frictionGlow = force * 0.65
        } else {
          p.frictionGlow *= 0.92
        }

        p.vx *= 0.95; p.vy *= 0.95
        p.vx += (Math.random() - 0.5) * 0.04
        p.vy += (Math.random() - 0.5) * 0.04
        p.x += p.vx; p.y += p.vy
        p.rotation += p.rotationSpeed + (Math.abs(p.vx) + Math.abs(p.vy)) * 0.05

        if (p.x < -20) p.x = width + 20
        if (p.x > width + 20) p.x = -20
        if (p.y < -20) p.y = height + 20
        if (p.y > height + 20) p.y = -20

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)

        const finalAlpha = Math.min(p.alpha + p.frictionGlow, 0.88)
        ctx.fillStyle = `rgba(${p.color}, ${finalAlpha})`

        if (p.frictionGlow > 0.25) {
          ctx.shadowBlur = 7 * p.frictionGlow
          ctx.shadowColor = `rgba(160, 200, 255, ${p.frictionGlow})`
        }

        ctx.beginPath()
        ctx.moveTo(0, -p.size * 2.5)
        ctx.lineTo(p.size, 0)
        ctx.lineTo(0, p.size * 2.5)
        ctx.lineTo(-p.size, 0)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    const onMouseMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY }
    }
    const onMouseLeave = () => { mouse.x = -1000; mouse.y = -1000 }

    window.addEventListener('resize', init)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseleave', onMouseLeave)
    window.addEventListener('touchmove', onTouchMove)

    init()
    render()

    return () => {
      window.removeEventListener('resize', init)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('touchmove', onTouchMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}

export default ASMRBackground
