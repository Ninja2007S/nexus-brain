import {
  Canvas,
} from '@react-three/fiber'

import {
  Suspense,
  useCallback,
  useState,
} from 'react'

import type {
  LiveNeuron,
} from './types'

import Scene from './components/Scene'

import HUD from './ui/HUD'

import NeuronInspector from './ui/NeuronInspector'

import HandController from './components/HandController'

import DigitalHand from './components/DigitalHand'


export default function App() {
  /*
   * ============================================================
   * HUD STATE
   * ============================================================
   */

  const [
    neuronCount,
    setNeuronCount,
  ] = useState(0)


  const [
    connectionCount,
    setConnectionCount,
  ] = useState(0)


  /*
   * ============================================================
   * SELECTED NEURON
   * ============================================================
   */

  const [
    selectedNeuron,
    setSelectedNeuron,
  ] =
    useState<LiveNeuron | null>(
      null,
    )


  /*
   * ============================================================
   * NEURAL NETWORK STATS
   * ============================================================
   */

  const handleStats =
    useCallback(
      (
        neurons: number,
        connections: number,
      ) => {
        setNeuronCount(
          neurons,
        )

        setConnectionCount(
          connections,
        )
      },
      [],
    )


  /*
   * ============================================================
   * NEURON SELECTION
   * ============================================================
   */

  const handleNeuronSelect =
    useCallback(
      (
        neuron:
          | LiveNeuron
          | null,
      ) => {
        setSelectedNeuron(
          neuron,
        )
      },
      [],
    )


  /*
   * ============================================================
   * APPLICATION
   * ============================================================
   */

  return (
    <div
      style={{
        width:
          '100%',
        height:
          '100%',
        position:
          'relative',
        overflow:
          'hidden',
      }}
    >

      {/* ====================================================== */}
      {/* THREE.JS CANVAS                                        */}
      {/* ====================================================== */}

      <Canvas
        camera={{
          position: [
            0,
            0.4,
            9,
          ],

          fov: 45,

          near: 0.1,

          far: 60,
        }}

        dpr={1}

        gl={{
          antialias:
            false,

          alpha:
            false,

          depth:
            true,

          stencil:
            false,

          powerPreference:
            'default',

          preserveDrawingBuffer:
            false,

          failIfMajorPerformanceCaveat:
            false,
        }}

        frameloop="always"
      >

        <Suspense
          fallback={null}
        >

          {/* ================================================= */}
          {/* MAIN 3D SCENE                                     */}
          {/* ================================================= */}

          <Scene
            onStats={
              handleStats
            }

            onNeuronSelect={
              handleNeuronSelect
            }

            selectedNeuronId={
              selectedNeuron?.id ??
              null
            }
          />


          {/* ================================================= */}
          {/* DIGITAL HAND                                      */}
          {/* ================================================= */}

          <DigitalHand />

        </Suspense>

      </Canvas>


      {/* ====================================================== */}
      {/* MEDIAPIPE HAND SENSOR                                  */}
      {/* ====================================================== */}
      {/*
       * The webcam itself is NEVER displayed.
       *
       * HandController receives
       * landmark data from FastAPI.
       */}

      <HandController />


      {/* ====================================================== */}
      {/* HUD                                                    */}
      {/* ====================================================== */}

      <HUD
        neuronCount={
          neuronCount
        }

        connectionCount={
          connectionCount
        }
      />


      {/* ====================================================== */}
      {/* NEURON INSPECTOR                                       */}
      {/* ====================================================== */}

      <NeuronInspector
        neuron={
          selectedNeuron
        }
      />

    </div>
  )
}