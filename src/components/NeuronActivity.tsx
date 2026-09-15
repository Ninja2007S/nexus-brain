import {
  useFrame,
} from '@react-three/fiber'

import {
  useRef,
} from 'react'

import {
  AdditiveBlending,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
} from 'three'

interface NeuronActivityProps {
  position: [
    number,
    number,
    number,
  ]

  activation: number
}

export default function NeuronActivity({
  position,
  activation,
}: NeuronActivityProps) {
  const meshRef =
    useRef<Mesh>(null)

  const materialRef =
    useRef<MeshBasicMaterial>(
      null,
    )

  useFrame(
    (state) => {
      const mesh =
        meshRef.current

      const material =
        materialRef.current

      if (
        !mesh ||
        !material
      ) {
        return
      }

      const time =
        state.clock
          .elapsedTime

      const strength =
        Math.min(
          1,
          Math.abs(
            activation,
          ),
        )

      const pulse =
        (
          Math.sin(
            time * 4 +
              position[0] *
                3,
          ) +
          1
        ) /
        2

      const scale =
        0.65 +
        strength *
          1.5 +
        pulse *
          0.15

      mesh.scale.set(
        scale,
        scale,
        scale,
      )

      mesh.rotation.z =
        time * 0.4

      material.opacity =
        strength *
        (
          0.15 +
          pulse *
            0.35
        )
    },
  )

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={[
        Math.PI / 2,
        0,
        0,
      ]}
    >
      <ringGeometry
        args={[
          0.13,
          0.16,
          24,
        ]}
      />

      <meshBasicMaterial
        ref={materialRef}
        color="#38bdf8"
        transparent
        blending={
          AdditiveBlending
        }
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}