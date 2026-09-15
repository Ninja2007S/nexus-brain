import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, BufferAttribute, BufferGeometry, FogExp2, Points, PointsMaterial } from 'three'
import { getParticleTexture } from '../utils/particleTexture'

const DUST_COUNT = 900
const DUST_RADIUS = 14

export default function Environment() {
  const { scene } = useThree()
  const pointsRef = useRef<Points>(null)

  useEffect(() => {
    scene.fog = new FogExp2('#05070c', 0.045)
    return () => {
      scene.fog = null
    }
  }, [scene])

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(DUST_COUNT * 3)
    for (let i = 0; i < DUST_COUNT; i++) {
      // Distribute in a large sphere shell around the brain so dust reads
      // as distant depth cues rather than clutter near the structure.
      const r = DUST_RADIUS * (0.4 + Math.random() * 0.6)
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(positions, 3))

    const mat = new PointsMaterial({
      size: 0.045,
      map: getParticleTexture(),
      color: '#4a6a8f',
      transparent: true,
      opacity: 0.35,
      blending: AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      toneMapped: false
    })

    return { geometry: geo, material: mat }
  }, [])

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.008
    }
  })

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
}
