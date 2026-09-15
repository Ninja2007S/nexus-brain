import {
  useFrame,
} from '@react-three/fiber'

import {
  useMemo,
  useRef,
} from 'react'

import {
  AdditiveBlending,
  Color,
  IcosahedronGeometry,
  MeshBasicMaterial,
  Mesh,
} from 'three'

interface NeuronBodyProps {
  position: [
    number,
    number,
    number,
  ]

  activation: number

  scale?: number

  color?: string

  selected?: boolean
}

export default function NeuronBody({
  position,
  activation,
  scale = 1,
  color = '#39bfff',
  selected = false,
}: NeuronBodyProps) {
  const meshRef =
    useRef<Mesh>(null)

  const geometry =
    useMemo(
      () =>
        new IcosahedronGeometry(
          0.12,
          2,
        ),
      [],
    )

  const material =
    useMemo(
      () =>
        new MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.9,
          blending:
            AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        }),
      [color],
    )

  useFrame(
    (state) => {
      const mesh =
        meshRef.current

      if (!mesh) {
        return
      }

      const time =
        state.clock
          .elapsedTime

      const absoluteActivation =
        Math.min(
          1,
          Math.abs(
            activation,
          ),
        )

      const breathing =
        1 +
        Math.sin(
          time * 2.5 +
            position[1],
        ) *
          0.08

      const activationScale =
        1 +
        absoluteActivation *
          1.8

      const selectedScale =
        selected
          ? 1.25
          : 1

      const finalScale =
        scale *
        breathing *
        activationScale *
        selectedScale

      mesh.scale.setScalar(
        finalScale,
      )

      /*
       * Rotation gives each
       * neuron a living,
       * biological appearance.
       */

      mesh.rotation.x +=
        0.002

      mesh.rotation.y +=
        0.003

      /*
       * Activation controls
       * material intensity.
       */

      const material =
        mesh.material as MeshBasicMaterial

      const pulse =
        0.65 +
        0.35 *
          Math.sin(
            time * 6 +
              position[0] *
                2,
          )

      const intensity =
        0.65 +
        absoluteActivation *
          1.4

      const c =
        new Color(color)

      material.color.copy(
        c,
      )

      material.opacity =
        Math.min(
          1,
          0.45 +
            intensity *
              0.3 +
            pulse *
              0.12,
        )
    },
  )

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={position}
    />
  )
}