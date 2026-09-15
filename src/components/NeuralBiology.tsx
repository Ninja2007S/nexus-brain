import {
  useEffect,
  useMemo,
  useRef,
} from 'react'

import {
  useFrame,
} from '@react-three/fiber'

import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  LineBasicMaterial,
  PointsMaterial,
} from 'three'

import type {
  InferenceFrame,
  LiveConnection,
  LiveNeuron,
} from '../types'

interface NeuralBiologyProps {
  frame: InferenceFrame | null
}

/*
 * ================================================================
 * CONFIGURATION
 * ================================================================
 *
 * These are visual capacities, NOT neural-network sizes.
 *
 * Your current PyTorch network:
 *
 * 4 → 8 → 6 → 3
 *
 * produces:
 *
 * 32 + 48 + 18 = 98 connections.
 *
 * The buffers below intentionally have room for larger models.
 */

const MAX_CONNECTIONS = 256
const MAX_DENDRITES = 512
const MAX_SYNAPSES = 256
const MAX_IMPULSES = 96
const MAX_WAVES = 48

/*
 * ================================================================
 * NETWORK LAYOUT
 * ================================================================
 */

const LAYER_X = [
  -3.6,
  -1.2,
  1.2,
  3.6,
]

/*
 * ================================================================
 * POSITION HELPERS
 * ================================================================
 */

function getNeuronPosition(
  neuron: LiveNeuron,
  frame: InferenceFrame,
): [number, number, number] {
  const layer =
    frame.model.layers[
      neuron.layer
    ]

  const size =
    layer?.size ?? 1

  const x =
    LAYER_X[
      neuron.layer
    ] ?? 0

  const spacing =
    0.82

  const totalHeight =
    (size - 1) *
    spacing

  const normalizedY =
    size <= 1
      ? 0
      : neuron.index *
          spacing -
        totalHeight / 2

  /*
   * Organic biological displacement.
   *
   * This prevents the network from looking
   * like a completely rigid computer diagram.
   */

  const organicY =
    Math.sin(
      neuron.index *
        1.73 +
        neuron.layer *
          0.91,
    ) * 0.12

  const organicZ =
    Math.cos(
      neuron.index *
        1.41 +
        neuron.layer *
          1.37,
    ) * 0.42

  return [
    x,
    normalizedY +
      organicY,
    organicZ,
  ]
}

/*
 * ================================================================
 * CONNECTION LOOKUP
 * ================================================================
 */

function findNeuron(
  frame: InferenceFrame,
  id: number,
): LiveNeuron | undefined {
  return frame.neurons.find(
    (neuron) =>
      neuron.id === id,
  )
}

/*
 * ================================================================
 * COLOR CALCULATION
 * ================================================================
 */

function writeConnectionColor(
  colors: Float32Array,
  offset: number,
  connection: LiveConnection,
) {
  const magnitude =
    Math.min(
      1,
      Math.abs(
        connection.weight,
      ) * 1.4,
    )

  /*
   * Positive weights:
   *
   * cyan / blue
   *
   * Negative weights:
   *
   * violet / magenta
   */

  if (
    connection.weight >=
    0
  ) {
    colors[offset] =
      0.08 +
      magnitude * 0.12

    colors[offset + 1] =
      0.45 +
      magnitude * 0.45

    colors[offset + 2] =
      0.9 +
      magnitude * 0.1
  } else {
    colors[offset] =
      0.55 +
      magnitude * 0.4

    colors[offset + 1] =
      0.12 +
      magnitude * 0.15

    colors[offset + 2] =
      0.7 +
      magnitude * 0.3
  }
}

/*
 * ================================================================
 * COMPONENT
 * ================================================================
 */

export default function NeuralBiology({
  frame,
}: NeuralBiologyProps) {
  /*
   * --------------------------------------------------------------
   * IMPULSE STATE
   * --------------------------------------------------------------
   */

  const impulseProgress =
    useRef(
      new Float32Array(
        MAX_IMPULSES,
      ),
    )

  const impulseConnection =
    useRef(
      new Int32Array(
        MAX_IMPULSES,
      ),
    )

  const impulseSpeed =
    useRef(
      new Float32Array(
        MAX_IMPULSES,
      ),
    )

  const impulseCount =
    useRef(0)

  /*
   * --------------------------------------------------------------
   * ACTIVATION WAVE STATE
   * --------------------------------------------------------------
   */

  const waveProgress =
    useRef(
      new Float32Array(
        MAX_WAVES,
      ),
    )

  const waveNeuron =
    useRef(
      new Int32Array(
        MAX_WAVES,
      ),
    )

  const waveActive =
    useRef(
      new Uint8Array(
        MAX_WAVES,
      ),
    )

  /*
   * ================================================================
   * AXON GEOMETRY
   * ================================================================
   *
   * Each connection uses TWO line segments:
   *
   * source → midpoint
   * midpoint → target
   *
   * This gives us a subtle organic bend.
   */

  const {
    axonGeometry,
    axonMaterial,
  } = useMemo(() => {
    const positions =
      new Float32Array(
        MAX_CONNECTIONS *
          2 *
          6,
      )

    const colors =
      new Float32Array(
        MAX_CONNECTIONS *
          2 *
          6,
      )

    const geometry =
      new BufferGeometry()

    geometry.setAttribute(
      'position',
      new BufferAttribute(
        positions,
        3,
      ),
    )

    geometry.setAttribute(
      'color',
      new BufferAttribute(
        colors,
        3,
      ),
    )

    geometry.setDrawRange(
      0,
      0,
    )

    const material =
      new LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.32,
        blending:
          AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })

    return {
      axonGeometry:
        geometry,
      axonMaterial:
        material,
    }
  }, [])

  /*
   * ================================================================
   * DENDRITE GEOMETRY
   * ================================================================
   */

  const {
    dendriteGeometry,
    dendriteMaterial,
  } = useMemo(() => {
    const positions =
      new Float32Array(
        MAX_DENDRITES * 6,
      )

    const colors =
      new Float32Array(
        MAX_DENDRITES * 6,
      )

    const geometry =
      new BufferGeometry()

    geometry.setAttribute(
      'position',
      new BufferAttribute(
        positions,
        3,
      ),
    )

    geometry.setAttribute(
      'color',
      new BufferAttribute(
        colors,
        3,
      ),
    )

    geometry.setDrawRange(
      0,
      0,
    )

    const material =
      new LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.22,
        blending:
          AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })

    return {
      dendriteGeometry:
        geometry,
      dendriteMaterial:
        material,
    }
  }, [])

  /*
   * ================================================================
   * SYNAPSE POINTS
   * ================================================================
   */

  const {
    synapseGeometry,
    synapseMaterial,
  } = useMemo(() => {
    const positions =
      new Float32Array(
        MAX_SYNAPSES * 3,
      )

    const colors =
      new Float32Array(
        MAX_SYNAPSES * 3,
      )

    const geometry =
      new BufferGeometry()

    geometry.setAttribute(
      'position',
      new BufferAttribute(
        positions,
        3,
      ),
    )

    geometry.setAttribute(
      'color',
      new BufferAttribute(
        colors,
        3,
      ),
    )

    geometry.setDrawRange(
      0,
      0,
    )

    const material =
      new PointsMaterial({
        size: 0.045,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending:
          AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
        toneMapped: false,
      })

    return {
      synapseGeometry:
        geometry,
      synapseMaterial:
        material,
    }
  }, [])

  /*
   * ================================================================
   * ELECTRICAL IMPULSE PARTICLES
   * ================================================================
   */

  const {
    impulseGeometry,
    impulseMaterial,
  } = useMemo(() => {
    const positions =
      new Float32Array(
        MAX_IMPULSES * 3,
      )

    const colors =
      new Float32Array(
        MAX_IMPULSES * 3,
      )

    const geometry =
      new BufferGeometry()

    geometry.setAttribute(
      'position',
      new BufferAttribute(
        positions,
        3,
      ),
    )

    geometry.setAttribute(
      'color',
      new BufferAttribute(
        colors,
        3,
      ),
    )

    geometry.setDrawRange(
      0,
      0,
    )

    const material =
      new PointsMaterial({
        size: 0.085,
        vertexColors: true,
        transparent: true,
        opacity: 1,
        blending:
          AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
        toneMapped: false,
      })

    return {
      impulseGeometry:
        geometry,
      impulseMaterial:
        material,
    }
  }, [])

  /*
   * ================================================================
   * ACTIVATION WAVES
   * ================================================================
   */

  const {
    waveGeometry,
    waveMaterial,
  } = useMemo(() => {
    const positions =
      new Float32Array(
        MAX_WAVES * 3,
      )

    const colors =
      new Float32Array(
        MAX_WAVES * 3,
      )

    const geometry =
      new BufferGeometry()

    geometry.setAttribute(
      'position',
      new BufferAttribute(
        positions,
        3,
      ),
    )

    geometry.setAttribute(
      'color',
      new BufferAttribute(
        colors,
        3,
      ),
    )

    geometry.setDrawRange(
      0,
      0,
    )

    const material =
      new PointsMaterial({
        size: 0.12,
        vertexColors: true,
        transparent: true,
        opacity: 0.65,
        blending:
          AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
        toneMapped: false,
      })

    return {
      waveGeometry:
        geometry,
      waveMaterial:
        material,
    }
  }, [])

  /*
   * ================================================================
   * UPDATE AXONS + DENDRITES + SYNAPSES
   * ================================================================
   */

  useEffect(() => {
    if (!frame) {
      return
    }

    /*
     * --------------------------------------------------------------
     * AXONS
     * --------------------------------------------------------------
     */

    const axonPosition =
      axonGeometry
        .attributes
        .position as BufferAttribute

    const axonColor =
      axonGeometry
        .attributes
        .color as BufferAttribute

    const axonPositions =
      axonPosition.array as Float32Array

    const axonColors =
      axonColor.array as Float32Array

    let connectionCount = 0

    for (
      let i = 0;
      i <
        frame.connections
          .length;
      i++
    ) {
      if (
        connectionCount >=
        MAX_CONNECTIONS
      ) {
        break
      }

      const connection =
        frame.connections[i]

      const source =
        findNeuron(
          frame,
          connection.source,
        )

      const target =
        findNeuron(
          frame,
          connection.target,
        )

      if (
        !source ||
        !target
      ) {
        continue
      }

      const start =
        getNeuronPosition(
          source,
          frame,
        )

      const end =
        getNeuronPosition(
          target,
          frame,
        )

      /*
       * Organic midpoint.
       */

      const midpoint: [
        number,
        number,
        number,
      ] = [
        (start[0] +
          end[0]) /
          2,

        (start[1] +
          end[1]) /
          2,

        (start[2] +
          end[2]) /
            2 +
          Math.sin(
            i * 1.7,
          ) *
            0.18,
      ]

      /*
       * Two segments.
       */

      const offset =
        connectionCount *
        12

      axonPositions[
        offset
      ] = start[0]

      axonPositions[
        offset + 1
      ] = start[1]

      axonPositions[
        offset + 2
      ] = start[2]

      axonPositions[
        offset + 3
      ] = midpoint[0]

      axonPositions[
        offset + 4
      ] = midpoint[1]

      axonPositions[
        offset + 5
      ] = midpoint[2]

      axonPositions[
        offset + 6
      ] = midpoint[0]

      axonPositions[
        offset + 7
      ] = midpoint[1]

      axonPositions[
        offset + 8
      ] = midpoint[2]

      axonPositions[
        offset + 9
      ] = end[0]

      axonPositions[
        offset + 10
      ] = end[1]

      axonPositions[
        offset + 11
      ] = end[2]

      /*
       * Same color for both segments.
       */

      writeConnectionColor(
        axonColors,
        offset,
        connection,
      )

      writeConnectionColor(
        axonColors,
        offset + 3,
        connection,
      )

      /*
       * second segment
       */

      writeConnectionColor(
        axonColors,
        offset + 6,
        connection,
      )

      writeConnectionColor(
        axonColors,
        offset + 9,
        connection,
      )

      connectionCount++
    }

    axonPosition.needsUpdate =
      true

    axonColor.needsUpdate =
      true

    axonGeometry.setDrawRange(
      0,
      connectionCount * 4,
    )

    /*
     * --------------------------------------------------------------
     * DENDRITES
     * --------------------------------------------------------------
     *
     * Each neuron gets several small branches.
     */

    const dendritePosition =
      dendriteGeometry
        .attributes
        .position as BufferAttribute

    const dendriteColor =
      dendriteGeometry
        .attributes
        .color as BufferAttribute

    const dendritePositions =
      dendritePosition.array as Float32Array

    const dendriteColors =
      dendriteColor.array as Float32Array

    let dendriteCount = 0

    for (
      let n = 0;
      n <
        frame.neurons
          .length;
      n++
    ) {
      if (
        dendriteCount >=
        MAX_DENDRITES
      ) {
        break
      }

      const neuron =
        frame.neurons[n]

      const center =
        getNeuronPosition(
          neuron,
          frame,
        )

      /*
       * Three dendritic branches
       * per neuron.
       */

      for (
        let branch = 0;
        branch < 3;
        branch++
      ) {
        if (
          dendriteCount >=
          MAX_DENDRITES
        ) {
          break
        }

        const angle =
          branch *
            2.094 +
          neuron.index *
            0.47

        const length =
          0.28 +
          Math.abs(
            neuron.activation,
          ) *
            0.18

        const end: [
          number,
          number,
          number,
        ] = [
          center[0] +
            Math.cos(
              angle,
            ) *
              length,

          center[1] +
            Math.sin(
              angle,
            ) *
              length,

          center[2] +
            Math.sin(
              angle *
                1.7,
            ) *
              0.14,
        ]

        const offset =
          dendriteCount *
          6

        dendritePositions[
          offset
        ] = center[0]

        dendritePositions[
          offset + 1
        ] = center[1]

        dendritePositions[
          offset + 2
        ] = center[2]

        dendritePositions[
          offset + 3
        ] = end[0]

        dendritePositions[
          offset + 4
        ] = end[1]

        dendritePositions[
          offset + 5
        ] = end[2]

        /*
         * Dendrites are soft cyan.
         */

        dendriteColors[
          offset
        ] = 0.12

        dendriteColors[
          offset + 1
        ] = 0.45

        dendriteColors[
          offset + 2
        ] = 0.8

        dendriteColors[
          offset + 3
        ] = 0.08

        dendriteColors[
          offset + 4
        ] = 0.32

        dendriteColors[
          offset + 5
        ] = 0.62

        dendriteCount++
      }
    }

    dendritePosition.needsUpdate =
      true

    dendriteColor.needsUpdate =
      true

    dendriteGeometry.setDrawRange(
      0,
      dendriteCount * 2,
    )

    /*
     * --------------------------------------------------------------
     * SYNAPSES
     * --------------------------------------------------------------
     *
     * Place a point near every connection midpoint.
     */

    const synapsePosition =
      synapseGeometry
        .attributes
        .position as BufferAttribute

    const synapseColor =
      synapseGeometry
        .attributes
        .color as BufferAttribute

    const synapsePositions =
      synapsePosition.array as Float32Array

    const synapseColors =
      synapseColor.array as Float32Array

    let synapseCount = 0

    for (
      let i = 0;
      i <
        frame.connections
          .length;
      i++
    ) {
      if (
        synapseCount >=
        MAX_SYNAPSES
      ) {
        break
      }

      const connection =
        frame.connections[i]

      const source =
        findNeuron(
          frame,
          connection.source,
        )

      const target =
        findNeuron(
          frame,
          connection.target,
        )

      if (
        !source ||
        !target
      ) {
        continue
      }

      const start =
        getNeuronPosition(
          source,
          frame,
        )

      const end =
        getNeuronPosition(
          target,
          frame,
        )

      const offset =
        synapseCount * 3

      synapsePositions[
        offset
      ] =
        (start[0] +
          end[0]) /
          2

      synapsePositions[
        offset + 1
      ] =
        (start[1] +
          end[1]) /
          2

      synapsePositions[
        offset + 2
      ] =
        (start[2] +
          end[2]) /
            2

      const strength =
        Math.min(
          1,
          Math.abs(
            connection.weight,
          ) * 1.5,
        )

      synapseColors[
        offset
      ] =
        connection.weight >=
        0
          ? 0.2
          : 0.9

      synapseColors[
        offset + 1
      ] =
        connection.weight >=
        0
          ? 0.8
          : 0.2

      synapseColors[
        offset + 2
      ] =
        0.9

      /*
       * Strength is intentionally
       * calculated so the visual
       * system can later scale
       * synapse size.
       */

      void strength

      synapseCount++
    }

    synapsePosition.needsUpdate =
      true

    synapseColor.needsUpdate =
      true

    synapseGeometry.setDrawRange(
      0,
      synapseCount,
    )
  }, [
    frame,
    axonGeometry,
    dendriteGeometry,
    synapseGeometry,
  ])

  /*
   * ================================================================
   * INITIALIZE ELECTRICAL IMPULSES
   * ================================================================
   */

  useEffect(() => {
    if (!frame) {
      return
    }

    const count =
      Math.min(
        MAX_IMPULSES,
        frame.connections
          .length,
      )

    impulseCount.current =
      count

    for (
      let i = 0;
      i < count;
      i++
    ) {
      impulseProgress.current[
        i
      ] = Math.random()

      impulseConnection.current[
        i
      ] =
        i %
        frame.connections
          .length

      impulseSpeed.current[
        i
      ] =
        0.35 +
        Math.random() *
          0.35
    }
  }, [frame])

  /*
   * ================================================================
   * ANIMATION
   * ================================================================
   */

  useFrame(
    (
      state,
      delta,
    ) => {
      if (!frame) {
        return
      }

      /*
       * ------------------------------------------------------------
       * ELECTRICAL IMPULSES
       * ------------------------------------------------------------
       */

      const impulsePosition =
        impulseGeometry
          .attributes
          .position as BufferAttribute

      const impulseColor =
        impulseGeometry
          .attributes
          .color as BufferAttribute

      const impulsePositions =
        impulsePosition.array as Float32Array

      const impulseColors =
        impulseColor.array as Float32Array

      const count =
        Math.min(
          impulseCount.current,
          frame.connections
            .length,
        )

      for (
        let i = 0;
        i < count;
        i++
      ) {
        const connection =
          frame.connections[
            impulseConnection
              .current[i]
          ]

        if (!connection) {
          continue
        }

        let progress =
          impulseProgress
            .current[i]

        /*
         * Stronger signals
         * travel faster.
         */

        const signalStrength =
          Math.min(
            1,
            Math.abs(
              connection.signal,
            ),
          )

        progress +=
          delta *
          (
            impulseSpeed
              .current[i] +
            signalStrength *
              0.65
          )

        if (
          progress >= 1
        ) {
          progress -= 1
        }

        impulseProgress.current[
          i
        ] = progress

        const source =
          findNeuron(
            frame,
            connection.source,
          )

        const target =
          findNeuron(
            frame,
            connection.target,
          )

        if (
          !source ||
          !target
        ) {
          continue
        }

        const start =
          getNeuronPosition(
            source,
            frame,
          )

        const end =
          getNeuronPosition(
            target,
            frame,
          )

        /*
         * Slight curved trajectory.
         */

        const curve =
          Math.sin(
            progress *
              Math.PI,
          )

        const x =
          start[0] +
          (end[0] -
            start[0]) *
            progress

        const y =
          start[1] +
          (end[1] -
            start[1]) *
            progress

        const z =
          start[2] +
          (end[2] -
            start[2]) *
            progress +
          curve *
            0.08

        const offset =
          i * 3

        impulsePositions[
          offset
        ] = x

        impulsePositions[
          offset + 1
        ] = y

        impulsePositions[
          offset + 2
        ] = z

        /*
         * Pulsing electrical
         * intensity.
         */

        const pulse =
          0.65 +
          0.35 *
            Math.sin(
              state.clock
                .elapsedTime *
                12 +
                i,
            )

        impulseColors[
          offset
        ] =
          0.15 *
          pulse

        impulseColors[
          offset + 1
        ] =
          0.75 *
          pulse

        impulseColors[
          offset + 2
        ] =
          1 *
          pulse
      }

      impulsePosition.needsUpdate =
        true

      impulseColor.needsUpdate =
        true

      impulseGeometry.setDrawRange(
        0,
        count,
      )

      /*
       * ------------------------------------------------------------
       * ACTIVATION WAVES
       * ------------------------------------------------------------
       */

      const wavePosition =
        waveGeometry
          .attributes
          .position as BufferAttribute

      const waveColor =
        waveGeometry
          .attributes
          .color as BufferAttribute

      const wavePositions =
        wavePosition.array as Float32Array

      const waveColors =
        waveColor.array as Float32Array

      let activeWaves = 0

      for (
        let i = 0;
        i <
          MAX_WAVES;
        i++
      ) {
        /*
         * Create waves from
         * highly active neurons.
         */

        const neuron =
          frame.neurons[
            i %
              frame.neurons
                .length
          ]

        if (!neuron) {
          continue
        }

        const activation =
          Math.abs(
            neuron.activation,
          )

        if (
          activation <
          0.25
        ) {
          continue
        }

        if (
          waveActive.current[
            i
          ] === 0
        ) {
          waveActive.current[
            i
          ] = 1

          waveProgress.current[
            i
          ] = Math.random()

          waveNeuron.current[
            i
          ] = neuron.id
        }

        waveProgress.current[
          i
        ] +=
          delta *
          (
            0.18 +
            activation *
              0.25
          )

        if (
          waveProgress.current[
            i
          ] >= 1
        ) {
          waveProgress.current[
            i
          ] = 0
        }

        const waveNeuronObject =
          findNeuron(
            frame,
            waveNeuron.current[
              i
            ],
          )

        if (
          !waveNeuronObject
        ) {
          continue
        }

        const position =
          getNeuronPosition(
            waveNeuronObject,
            frame,
          )

        const progress =
          waveProgress.current[
            i
          ]

        const offset =
          activeWaves * 3

        wavePositions[
          offset
        ] =
          position[0]

        wavePositions[
          offset + 1
        ] =
          position[1] +
          Math.sin(
            progress *
              Math.PI,
          ) *
            0.18

        wavePositions[
          offset + 2
        ] =
          position[2]

        const brightness =
          activation *
          (
            0.6 +
            0.4 *
              Math.sin(
                state.clock
                  .elapsedTime *
                  6 +
                  i,
              )
          )

        waveColors[
          offset
        ] =
          0.1 +
          brightness *
            0.2

        waveColors[
          offset + 1
        ] =
          0.5 +
          brightness *
            0.4

        waveColors[
          offset + 2
        ] =
          0.9 +
          brightness *
            0.1

        activeWaves++
      }

      wavePosition.needsUpdate =
        true

      waveColor.needsUpdate =
        true

      waveGeometry.setDrawRange(
        0,
        activeWaves,
      )
    },
  )

  /*
   * ================================================================
   * RENDER
   * ================================================================
   */

  return (
    <>
      {/* Axon pathways */}

      <lineSegments
        geometry={
          axonGeometry
        }
        material={
          axonMaterial
        }
        frustumCulled={
          false
        }
      />

      {/* Dendritic branches */}

      <lineSegments
        geometry={
          dendriteGeometry
        }
        material={
          dendriteMaterial
        }
        frustumCulled={
          false
        }
      />

      {/* Synapse points */}

      <points
        geometry={
          synapseGeometry
        }
        material={
          synapseMaterial
        }
        frustumCulled={
          false
        }
      />

      {/* Electrical impulses */}

      <points
        geometry={
          impulseGeometry
        }
        material={
          impulseMaterial
        }
        frustumCulled={
          false
        }
      />

      {/* Activation waves */}

      <points
        geometry={
          waveGeometry
        }
        material={
          waveMaterial
        }
        frustumCulled={
          false
        }
      />
    </>
  )
}