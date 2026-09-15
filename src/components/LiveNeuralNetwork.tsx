import {
  useMemo,
} from 'react'

import type {
  InferenceFrame,
  LiveNeuron,
} from '../types'

import NeuronBody from './NeuronBody'
import NeuronDendrites from './NeuronDendrites'
import NeuronActivity from './NeuronActivity'

interface LiveNeuralNetworkProps {
  frame: InferenceFrame | null

  selectedNeuronId?: number | null

  onSelectNeuron?: (
    neuron: LiveNeuron,
  ) => void
}

const LAYER_X = [
  -3.6,
  -1.2,
  1.2,
  3.6,
]

function getPosition(
  neuron: LiveNeuron,
  frame: InferenceFrame,
): [
  number,
  number,
  number,
] {
  const layer =
    frame.model.layers[
      neuron.layer
    ]

  const size =
    layer?.size ?? 1

  const spacing =
    0.82

  const height =
    (size - 1) *
    spacing

  const y =
    size <= 1
      ? 0
      : neuron.index *
          spacing -
        height / 2

  const z =
    Math.sin(
      neuron.index *
        1.7 +
        neuron.layer,
    ) *
    0.4

  return [
    LAYER_X[
      neuron.layer
    ] ?? 0,
    y,
    z,
  ]
}

function getNeuronColor(
  neuron: LiveNeuron,
): string {
  /*
   * Input layer
   */

  if (
    neuron.layer === 0
  ) {
    return '#22d3ee'
  }

  /*
   * Output layer
   */

  if (
    neuron.layer ===
    3
  ) {
    return '#facc15'
  }

  /*
   * Positive activation
   */

  if (
    neuron.activation >=
    0
  ) {
    return '#38bdf8'
  }

  /*
   * Negative activation
   */

  return '#a855f7'
}

export default function LiveNeuralNetwork({
  frame,
  selectedNeuronId,
  onSelectNeuron,
}: LiveNeuralNetworkProps) {
  const neurons =
    useMemo(
      () =>
        frame?.neurons ??
        [],
      [frame],
    )

  if (!frame) {
    return null
  }

  return (
    <group>
      {neurons.map(
        (neuron) => {
          const position =
            getPosition(
              neuron,
              frame,
            )

          const selected =
            neuron.id ===
            selectedNeuronId

          const color =
            getNeuronColor(
              neuron,
            )

          const scale =
            neuron.layer ===
            0
              ? 1.05
              : neuron.layer ===
                  3
                ? 1.15
                : 1

          return (
            <group
              key={
                neuron.id
              }
              onClick={(
                event,
              ) => {
                event.stopPropagation()

                onSelectNeuron?.(
                  neuron,
                )
              }}
            >
              <NeuronBody
                position={
                  position
                }
                activation={
                  neuron.activation
                }
                scale={
                  scale
                }
                color={
                  color
                }
                selected={
                  selected
                }
              />

              <NeuronDendrites
                position={
                  position
                }
                activation={
                  neuron.activation
                }
                seed={
                  neuron.id
                }
              />

              <NeuronActivity
                position={
                  position
                }
                activation={
                  neuron.activation
                }
              />
            </group>
          )
        },
      )}
    </group>
  )
}