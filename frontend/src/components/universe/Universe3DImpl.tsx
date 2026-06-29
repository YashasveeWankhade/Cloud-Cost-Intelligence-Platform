import { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, Stars } from '@react-three/drei'
import * as THREE from 'three'
import type { NodeDatum } from './types'

export type { NodeDatum }

function ServiceNode({ node, onHover }: { node: NodeDatum; onHover: (n: NodeDatum | null) => void }) {
  const mesh = useRef<THREE.Mesh>(null)
  const ring = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y += 0.004
      const t = state.clock.elapsedTime
      mesh.current.position.y = node.position[1] + Math.sin(t + node.position[0]) * 0.15
    }
    if (ring.current && node.anomaly) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 2.5) * 0.2
      ring.current.scale.set(s, s, s)
      const mat = ring.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 2.5) * 0.25
    }
  })

  return (
    <group position={node.position}>
      <mesh
        ref={mesh}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(node) }}
        onPointerOut={() => { setHovered(false); onHover(null) }}
        scale={hovered ? 1.15 : 1}
      >
        <sphereGeometry args={[node.size, 32, 32]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={node.anomaly ? 0.6 : 0.25}
          roughness={0.35}
          metalness={0.4}
        />
        {hovered && (
          <Html distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div style={{ background: '#141c35', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#f1f5f9', whiteSpace: 'nowrap', transform: 'translateY(-40px)' }}>
              <strong>{node.service}</strong>
              <br />${node.cost.toFixed(0)} / 30d{node.anomaly ? ' · anomaly' : ''}
            </div>
          </Html>
        )}
      </mesh>
      {node.anomaly && (
        <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[node.size + 0.25, node.size + 0.4, 48]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}

function ConnectionLines({ nodes }: { nodes: NodeDatum[] }) {
  const objects = useMemo(() => {
    return nodes.map((n, i) => {
      const next = nodes[(i + 1) % nodes.length]
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...n.position),
        new THREE.Vector3(...next.position),
      ])
      return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#334155', transparent: true, opacity: 0.5 }))
    })
  }, [nodes])

  return (
    <>
      {objects.map((o, i) => (
        <primitive key={i} object={o} />
      ))}
    </>
  )
}

export default function Universe3D({
  nodes,
  resetKey,
  onHover,
}: {
  nodes: NodeDatum[]
  resetKey: number
  onHover: (n: NodeDatum | null) => void
}) {
  return (
    <Canvas key={resetKey} camera={{ position: [0, 4, 16], fov: 55 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
      <pointLight position={[-10, -5, -10]} intensity={0.5} color="#6366f1" />
      <Stars radius={60} depth={50} count={3000} factor={4} fade speed={1} />
      <ConnectionLines nodes={nodes} />
      {nodes.map((n) => (
        <ServiceNode key={n.service} node={n} onHover={onHover} />
      ))}
      <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.6} minDistance={8} maxDistance={28} />
    </Canvas>
  )
}
