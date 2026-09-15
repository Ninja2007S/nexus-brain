import {
  useMemo,
} from 'react'

import {
  BufferAttribute,
  BufferGeometry,
  LineBasicMaterial,
  AdditiveBlending,
} from 'three'

interface NeuronDendritesProps {
  position: [
    number,
    number,
    number,
  ]

  activation: number

  seed: number

  branches?: number
}

export default function NeuronDendrites({
  position,
  activation,
  seed,
  branches = 8,
}: NeuronDendritesProps) {
  const {
    geometry,
    material,
  } = useMemo(() => {
    const positions =
      new Float32Array(
        branches * 3 * 6,
      )

    const colors =
      new Float32Array(
        branches * 3 * 6,
      )

    let vertex =
      0

    /*
     * deterministic pseudo-random
     */

    const random = (
      value: number,
    ) => {
      const x =
        Math.sin(
          value * 12.9898,
        ) *
        43758.5453

      return (
        x -
        Math.floor(x)
      )
    }

    for (
      let branch = 0;
      branch < branches;
      branch++
    ) {
      const angle =
        (branch /
          branches) *
          Math.PI *
          2 +
        random(
          seed +
            branch,
        ) *
          0.7

      const elevation =
        (
          random(
            seed +
              branch *
                2,
          ) -
          0.5
        ) *
        1.3

      const length =
        0.25 +
        random(
          seed +
            branch *
              3,
        ) *
          0.25 +
        Math.abs(
          activation,
        ) *
          0.15

      const x =
        Math.cos(
          angle,
        ) *
        length

      const y =
        Math.sin(
          angle,
        ) *
        length

      const z =
        elevation *
        length

      /*
       * First branch.
       */

      positions[
        vertex++
      ] = position[0]

      positions[
        vertex++
      ] = position[1]

      positions[
        vertex++
      ] = position[2]

      positions[
        vertex++
      ] =
        position[0] + x

      positions[
        vertex++
      ] =
        position[1] + y

      positions[
        vertex++
      ] =
        position[2] + z

      /*
       * Second branch.
       */

      const branchEndX =
        position[0] + x

      const branchEndY =
        position[1] + y

      const branchEndZ =
        position[2] + z

      const splitAngle =
        angle +
        (
          random(
            seed +
              branch *
                4,
          ) -
          0.5
        )

      const splitLength =
        length * 0.55

      positions[
        vertex++
      ] = branchEndX

      positions[
        vertex++
      ] = branchEndY

      positions[
        vertex++
      ] = branchEndZ

      positions[
        vertex++
      ] =
        branchEndX +
        Math.cos(
          splitAngle,
        ) *
          splitLength

      positions[
        vertex++
      ] =
        branchEndY +
        Math.sin(
          splitAngle,
        ) *
          splitLength

      positions[
        vertex++
      ] =
        branchEndZ +
        z * 0.25

      /*
       * Third tiny branch.
       */

      positions[
        vertex++
      ] = branchEndX

      positions[
        vertex++
      ] = branchEndY

      positions[
        vertex++
      ] = branchEndZ

      positions[
        vertex++
      ] =
        branchEndX +
        Math.cos(
          splitAngle +
            0.8,
        ) *
          splitLength *
          0.6

      positions[
        vertex++
      ] =
        branchEndY +
        Math.sin(
          splitAngle +
            0.8,
        ) *
          splitLength *
          0.6

      positions[
        vertex++
      ] =
        branchEndZ +
        z * 0.15
    }

    /*
     * Colors.
     */

    for (
      let i = 0;
      i <
        colors.length;
      i += 3
    ) {
      colors[i] =
        0.05

      colors[i + 1] =
        0.35

      colors[i + 2] =
        0.8
    }

    const geo =
      new BufferGeometry()

    geo.setAttribute(
      'position',
      new BufferAttribute(
        positions,
        3,
      ),
    )

    geo.setAttribute(
      'color',
      new BufferAttribute(
        colors,
        3,
      ),
    )

    const mat =
      new LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity:
          0.18 +
          Math.min(
            0.4,
            Math.abs(
              activation,
            ) *
              0.25,
          ),
        blending:
          AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })

    return {
      geometry: geo,
      material: mat,
    }
  }, [
    position,
    activation,
    seed,
    branches,
  ])

  return (
    <lineSegments
      geometry={geometry}
      material={material}
      frustumCulled={false}
    />
  )
}