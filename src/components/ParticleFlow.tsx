import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, PointsMaterial } from 'three'
import type { FlowEdge } from '../types'
import { getParticleTexture } from '../utils/particleTexture'

interface ParticleFlowProps {
  edges: FlowEdge[]
}

export default function ParticleFlow({ edges }: ParticleFlowProps) {
  const pointsRef = useRef<Points>(null)

  const { geometry, material, progress, speeds } = useMemo(() => {
    const count = edges.length
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const progress = new Float32Array(count)
    const speeds = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const e = edges[i]
      positions[i * 3] = e.start[0]
      positions[i * 3 + 1] = e.start[1]
      positions[i * 3 + 2] = e.start[2]
      colors[i * 3] = e.color[0]
      colors[i * 3 + 1] = e.color[1]
      colors[i * 3 + 2] = e.color[2]
      progress[i] = Math.random()
      speeds[i] = 0.12 + Math.random() * 0.18
    }

    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(positions, 3))
    geo.setAttribute('color', new BufferAttribute(colors, 3))

    const mat = new PointsMaterial({
      size: 0.05,
      map: getParticleTexture(),
      transparent: true,
      opacity: 0.9,
      vertexColors: true,
      blending: AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      toneMapped: false
    })

    return { geometry: geo, material: mat, progress, speeds }
  }, [edges])

  useFrame((_, delta) => {
    const points = pointsRef.current
    if (!points) return
    const posAttr = points.geometry.attributes.position as BufferAttribute
    const arr = posAttr.array as Float32Array

    for (let i = 0; i < edges.length; i++) {
      let t = progress[i] + delta * speeds[i]
      if (t > 1) t -= 1
      progress[i] = t

      const e = edges[i]
      const o = i * 3
      arr[o] = e.start[0] + (e.end[0] - e.start[0]) * t
      arr[o + 1] = e.start[1] + (e.end[1] - e.start[1]) * t
      arr[o + 2] = e.start[2] + (e.end[2] - e.start[2]) * t
    }
    posAttr.needsUpdate = true
  })

  if (edges.length === 0) return null

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
}
