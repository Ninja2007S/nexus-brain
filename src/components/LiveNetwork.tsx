import {
  useEffect,
  useMemo,
  useRef,
} from 'react'

import { useFrame } from '@react-three/fiber'

import {
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  SphereGeometry,
} from 'three'

import type {
  InferenceFrame,
} from '../types'

const MAX_NEURONS = 64

const LAYER_X = [
  -3.2,
  -1.1,
  1.1,
  3.2,
]

const LAYER_SIZES = [
  4,
  8,
  6,
  3,
]

function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.max(
    min,
    Math.min(max, value),
  )
}

function normalizeActivation(
  value: number,
) {
  return clamp(
    Math.abs(value) /
      (1 + Math.abs(value)),
    0,
    1,
  )
}

function getY(
  index: number,
  size: number,
) {
  const spacing = 0.58

  const total =
    (size - 1) *
    spacing

  return (
    index * spacing -
    total / 2
  )
}

function createPositions() {
  const positions =
    new Float32Array(
      MAX_NEURONS * 3,
    )

  let id = 0

  for (
    let layer = 0;
    layer <
    LAYER_SIZES.length;
    layer++
  ) {
    const size =
      LAYER_SIZES[layer]

    for (
      let index = 0;
      index < size;
      index++
    ) {
      const offset =
        id * 3

      positions[offset] =
        LAYER_X[layer]

      positions[offset + 1] =
        getY(
          index,
          size,
        )

      positions[offset + 2] =
        0.30

      id++
    }
  }

  return positions
}

interface LiveNetworkProps {
  frame: InferenceFrame | null
}

export default function LiveNetwork({
  frame,
}: LiveNetworkProps) {
  const meshRef =
    useRef<InstancedMesh>(
      null,
    )

  const dummy =
    useMemo(
      () => new Object3D(),
      [],
    )

  const positions =
    useMemo(
      createPositions,
      [],
    )

  const geometry =
    useMemo(
      () =>
        new SphereGeometry(
          1,
          14,
          14,
        ),
      [],
    )

  const material =
    useMemo(
      () =>
        new MeshBasicMaterial({
          color: '#72d4ff',
          transparent: true,
          opacity: 0.92,
          toneMapped: false,
        }),
      [],
    )

  /*
   * Smoothed activation.
   */
  const smoothActivation =
    useRef(
      new Float32Array(
        MAX_NEURONS,
      ),
    )

  /*
   * Initialize/hide all instances.
   */
  useEffect(() => {
    const mesh =
      meshRef.current

    if (!mesh) {
      return
    }

    for (
      let i = 0;
      i < MAX_NEURONS;
      i++
    ) {
      dummy.position.set(
        0,
        0,
        -100,
      )

      dummy.scale.setScalar(
        0,
      )

      dummy.updateMatrix()

      mesh.setMatrixAt(
        i,
        dummy.matrix,
      )
    }

    mesh.instanceMatrix.needsUpdate =
      true
  }, [
    dummy,
  ])

  useFrame(
    (_, delta) => {
      const mesh =
        meshRef.current

      if (!mesh) {
        return
      }

      if (!frame) {
        return
      }

      /*
       * Smooth actual PyTorch activations.
       */
      for (
        let i = 0;
        i <
        Math.min(
          frame.neurons.length,
          MAX_NEURONS,
        );
        i++
      ) {
        const target =
          normalizeActivation(
            frame.neurons[i]
              .activation,
          )

        const current =
          smoothActivation
            .current[i]

        smoothActivation.current[
          i
        ] =
          current +
          (
            target -
            current
          ) *
            Math.min(
              1,
              delta * 8,
            )
      }

      /*
       * Render real neurons.
       */
      for (
        let i = 0;
        i <
        Math.min(
          frame.neurons.length,
          MAX_NEURONS,
        );
        i++
      ) {
        const offset =
          i * 3

        const activation =
          smoothActivation
            .current[i]

        /*
         * Biological-looking cell-body scale.
         */
        const scale =
          0.075 +
          activation *
            0.25

        dummy.position.set(
          positions[offset],
          positions[
            offset + 1
          ],
          positions[
            offset + 2
          ],
        )

        dummy.scale.set(
          scale * 1.15,
          scale,
          scale * 0.85,
        )

        dummy.updateMatrix()

        mesh.setMatrixAt(
          i,
          dummy.matrix,
        )
      }

      /*
       * Hide unused instances.
       */
      for (
        let i =
          frame.neurons.length;
        i < MAX_NEURONS;
        i++
      ) {
        dummy.position.set(
          0,
          0,
          -100,
        )

        dummy.scale.setScalar(
          0,
        )

        dummy.updateMatrix()

        mesh.setMatrixAt(
          i,
          dummy.matrix,
        )
      }

      mesh.instanceMatrix.needsUpdate =
        true
    },
  )

  return (
    <instancedMesh
      ref={meshRef}
      args={[
        geometry,
        material,
        MAX_NEURONS,
      ]}
      frustumCulled={false}
    />
  )
}