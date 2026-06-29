// Ambient declaration for the bare-specifier alias defined in vite.config.ts.
// The real implementation lives in Universe3DImpl.tsx, which is excluded from
// the main tsc program so that @react-three/fiber's global JSX augmentation
// does not inflate type-checking across the rest of the app. Vite resolves the
// alias to the real file at build time.
declare module 'universe3d-impl' {
  import type { ComponentType } from 'react'
  import type { NodeDatum } from './types'
  const Universe3D: ComponentType<{
    nodes: NodeDatum[]
    resetKey: number
    onHover: (n: NodeDatum | null) => void
  }>
  export default Universe3D
}
