import {
  useMemo,
  useRef,
} from 'react'

import {
  useFrame,
} from '@react-three/fiber'

import * as THREE from 'three'

import {
  getHandState,
} from '../utils/handControl'

import type {
  HandLandmark,
} from '../types/hand'


/*
 * ============================================================
 * MEDIAPIPE HAND TOPOLOGY
 * ============================================================
 */

const BONE_CONNECTIONS: [
  number,
  number,
][] = [
  // Thumb
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],

  // Index
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],

  // Middle
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],

  // Ring
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],

  // Pinky
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],

  // Palm
  [5, 9],
  [9, 13],
  [13, 17],
]


/*
 * ============================================================
 * LANDMARK NAMES
 * ============================================================
 */

const LANDMARK_NAMES = [
  'Wrist',

  'Thumb CMC',
  'Thumb MCP',
  'Thumb IP',
  'Thumb Tip',

  'Index MCP',
  'Index PIP',
  'Index DIP',
  'Index Tip',

  'Middle MCP',
  'Middle PIP',
  'Middle DIP',
  'Middle Tip',

  'Ring MCP',
  'Ring PIP',
  'Ring DIP',
  'Ring Tip',

  'Pinky MCP',
  'Pinky PIP',
  'Pinky DIP',
  'Pinky Tip',
]


/*
 * ============================================================
 * MEDIAPIPE → THREE.JS
 * ============================================================
 *
 * Important:
 *
 * MediaPipe z is NOT directly used as unrestricted
 * Three.js world depth.
 *
 * We clamp it to a small safe range.
 */

function landmarkToVector(
  landmark: HandLandmark,
): THREE.Vector3 {
  const x =
    THREE.MathUtils.clamp(
      (landmark.x - 0.5) * 4.0,
      -2.0,
      2.0,
    )

  const y =
    THREE.MathUtils.clamp(
      -(landmark.y - 0.5) * 3.0,
      -1.5,
      1.5,
    )

  /*
   * MediaPipe z is usually
   * a relatively small negative
   * value for points closer to
   * the camera.
   *
   * Keep the visual depth subtle.
   */

  const z =
    THREE.MathUtils.clamp(
      -landmark.z * 1.25,
      -0.65,
      0.65,
    )

  return new THREE.Vector3(
    x,
    y,
    z,
  )
}


/*
 * ============================================================
 * COMPONENT
 * ============================================================
 */

export default function DigitalHand() {
  /*
   * Main hand group.
   */

  const groupRef =
    useRef<THREE.Group>(null)


  /*
   * Joint references.
   */

  const jointRefs =
    useRef<
      Array<THREE.Mesh | null>
    >(
      [],
    )


  /*
   * Bone references.
   */

  const boneRefs =
    useRef<
      Array<THREE.Line | null>
    >(
      [],
    )


  /*
   * ==========================================================
   * STABLE POSITION ARRAYS
   * ==========================================================
   */

  const targetPositions =
    useMemo(
      () =>
        Array.from(
          {
            length: 21,
          },
          () =>
            new THREE.Vector3(),
        ),
      [],
    )


  const smoothedPositions =
    useMemo(
      () =>
        Array.from(
          {
            length: 21,
          },
          () =>
            new THREE.Vector3(),
        ),
      [],
    )


  /*
   * First valid tracking frame.
   */

  const initializedRef =
    useRef(false)


  /*
   * ==========================================================
   * UPDATE
   * ==========================================================
   */

  useFrame(
    (
      _state,
      delta,
    ) => {
      const group =
        groupRef.current

      if (!group) {
        return
      }


      const hand =
        getHandState()


      /*
       * --------------------------------------------------------
       * HAND LOST
       * --------------------------------------------------------
       */

      if (
        !hand.detected ||
        hand.landmarks.length < 21
      ) {
        group.visible = false

        /*
         * Reset initialization so the
         * next detected hand doesn't
         * animate from an old position.
         */

        initializedRef.current =
          false

        return
      }


      /*
       * --------------------------------------------------------
       * HAND FOUND
       * --------------------------------------------------------
       */

      group.visible = true


      /*
       * ========================================================
       * CONVERT 21 LANDMARKS
       * ========================================================
       */

      for (
        let i = 0;
        i < 21;
        i++
      ) {
        const landmark =
          hand.landmarks[i]

        if (!landmark) {
          continue
        }


        targetPositions[i].copy(
          landmarkToVector(
            landmark,
          ),
        )


        /*
         * First frame:
         * snap into position.
         */

        if (
          !initializedRef.current
        ) {
          smoothedPositions[i].copy(
            targetPositions[i],
          )
        }


        /*
         * Subsequent frames:
         * smooth movement.
         */

        else {
          const smoothing =
            1 -
            Math.exp(
              -14 * delta,
            )

          smoothedPositions[i].lerp(
            targetPositions[i],
            smoothing,
          )
        }
      }


      initializedRef.current =
        true


      /*
       * ========================================================
       * JOINTS
       * ========================================================
       */

      for (
        let i = 0;
        i < 21;
        i++
      ) {
        const joint =
          jointRefs.current[i]

        if (!joint) {
          continue
        }


        joint.position.copy(
          smoothedPositions[i],
        )


        /*
         * Fingertips are slightly
         * larger.
         */

        const isTip =
          i === 4 ||
          i === 8 ||
          i === 12 ||
          i === 16 ||
          i === 20


        const size =
          isTip
            ? 0.075
            : 0.055


        joint.scale.setScalar(
          size / 0.055,
        )
      }


      /*
       * ========================================================
       * BONES
       * ========================================================
       */

      for (
        let i = 0;
        i <
        BONE_CONNECTIONS.length;
        i++
      ) {
        const line =
          boneRefs.current[i]

        if (!line) {
          continue
        }


        const [
          startIndex,
          endIndex,
        ] =
          BONE_CONNECTIONS[i]


        const start =
          smoothedPositions[
            startIndex
          ]

        const end =
          smoothedPositions[
            endIndex
          ]


        const positionAttribute =
          line.geometry
            .getAttribute(
              'position',
            ) as THREE.BufferAttribute


        positionAttribute.setXYZ(
          0,
          start.x,
          start.y,
          start.z,
        )


        positionAttribute.setXYZ(
          1,
          end.x,
          end.y,
          end.z,
        )


        positionAttribute.needsUpdate =
          true
      }
    },
  )


  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <group
      ref={
        groupRef
      }
      visible={false}
      renderOrder={100}
    >

      {/* ====================================================== */}
      {/* 21 DIGITAL JOINTS                                     */}
      {/* ====================================================== */}

      {LANDMARK_NAMES.map(
        (
          _name,
          index,
        ) => (
          <mesh
            key={
              `joint-${index}`
            }

            ref={(mesh) => {
              jointRefs.current[
                index
              ] = mesh
            }}

            renderOrder={101}
          >
            <sphereGeometry
              args={[
                0.055,
                10,
                10,
              ]}
            />

            <meshBasicMaterial
              transparent
              opacity={0.92}
              depthTest={false}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ),
      )}


      {/* ====================================================== */}
      {/* DIGITAL BONES                                          */}
      {/* ====================================================== */}

      {BONE_CONNECTIONS.map(
        (
          _connection,
          index,
        ) => (
          <line
            key={
              `bone-${index}`
            }

            ref={(line) => {
              boneRefs.current[
                index
              ] = line
            }}

            renderOrder={100}
          >
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={
                  new Float32Array(
                    6,
                  )
                }
                itemSize={3}
              />
            </bufferGeometry>

            <lineBasicMaterial
              transparent
              opacity={0.78}
              depthTest={false}
              depthWrite={false}
              toneMapped={false}
            />
          </line>
        ),
      )}


      {/* ====================================================== */}
      {/* PALM CORE                                              */}
      {/* ====================================================== */}

      <mesh
        position={[
          0,
          0,
          -0.02,
        ]}
        renderOrder={99}
      >
        <sphereGeometry
          args={[
            0.11,
            12,
            12,
          ]}
        />

        <meshBasicMaterial
          transparent
          opacity={0.12}
          wireframe
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

    </group>
  )
}