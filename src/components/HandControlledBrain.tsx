import {
  useFrame,
} from "@react-three/fiber";

import {
  useRef,
} from "react";

import * as THREE from "three";

import Brain from "./Brain";

import {
  getHandState,
  isPinching,
  calculateHandOpenness,
} from "../utils/handControl";

export default function HandControlledBrain() {
  const groupRef =
    useRef<THREE.Group>(null);

  const currentRotation =
    useRef(
      new THREE.Vector3(
        0,
        0,
        0,
      ),
    );

  const targetRotation =
    useRef(
      new THREE.Vector3(
        0,
        0,
        0,
      ),
    );

  const currentPosition =
    useRef(
      new THREE.Vector3(
        0,
        0,
        0,
      ),
    );

  const targetPosition =
    useRef(
      new THREE.Vector3(
        0,
        0,
        0,
      ),
    );

  const currentScale =
    useRef(1);

  const targetScale =
    useRef(1);

  useFrame((_, delta) => {
    if (!groupRef.current) {
      return;
    }

    const hand =
      getHandState();

    if (!hand.detected) {
      /*
       * Slowly return brain
       * to neutral when hand
       * disappears.
       */

      targetRotation.current.set(
        0,
        0,
        0,
      );

      targetPosition.current.set(
        0,
        0,
        0,
      );

      targetScale.current = 1;
    } else {
      /*
       * --------------------------------
       * HAND X → BRAIN Y ROTATION
       * --------------------------------
       */

      const x =
        hand.position.x;

      targetRotation.current.y =
        THREE.MathUtils.lerp(
          -1.35,
          1.35,
          x,
        );

      /*
       * --------------------------------
       * HAND Y → BRAIN X ROTATION
       * --------------------------------
       */

      const y =
        hand.position.y;

      targetRotation.current.x =
        THREE.MathUtils.lerp(
          0.75,
          -0.75,
          y,
        );

      /*
       * --------------------------------
       * HAND ROLL → BRAIN Z ROTATION
       * --------------------------------
       */

      targetRotation.current.z =
        THREE.MathUtils.clamp(
          hand.orientation.roll,
          -1.2,
          1.2,
        );

      /*
       * --------------------------------
       * HAND POSITION
       * --------------------------------
       */

      targetPosition.current.x =
        THREE.MathUtils.lerp(
          -2.0,
          2.0,
          hand.position.x,
        );

      targetPosition.current.y =
        THREE.MathUtils.lerp(
          1.5,
          -1.5,
          hand.position.y,
        );

      /*
       * --------------------------------
       * DEPTH → SCALE
       * --------------------------------
       *
       * Closer hand:
       * larger brain.
       *
       * Further hand:
       * smaller brain.
       */

      const depth =
        THREE.MathUtils.clamp(
          hand.depth,
          0,
          1,
        );

      targetScale.current =
        THREE.MathUtils.lerp(
          0.78,
          1.35,
          depth,
        );

      /*
       * --------------------------------
       * PINCH → EXTRA SCALE
       * --------------------------------
       */

      if (isPinching(hand)) {
        targetScale.current *= 1.15;
      }

      /*
       * --------------------------------
       * OPEN HAND → ENERGY
       * --------------------------------
       */

      const openness =
        calculateHandOpenness(
          hand,
        );

      /*
       * Slight floating effect
       * when hand is open.
       */

      targetPosition.current.y +=
        Math.sin(
          performance.now() *
            0.002,
        ) *
        openness *
        0.12;
    }

    /*
     * --------------------------------
     * SMOOTHING
     * --------------------------------
     */

    const smoothing =
      1 -
      Math.pow(
        0.0005,
        delta,
      );

    currentRotation.current.lerp(
      targetRotation.current,
      smoothing,
    );

    currentPosition.current.lerp(
      targetPosition.current,
      smoothing,
    );

    currentScale.current =
      THREE.MathUtils.lerp(
        currentScale.current,
        targetScale.current,
        smoothing,
      );

    /*
     * Apply transforms.
     */

    groupRef.current.rotation.x =
      currentRotation.current.x;

    groupRef.current.rotation.y =
      currentRotation.current.y;

    groupRef.current.rotation.z =
      currentRotation.current.z;

    groupRef.current.position.copy(
      currentPosition.current,
    );

    groupRef.current.scale.setScalar(
      currentScale.current,
    );
  });

  return (
    <group ref={groupRef}>
      <Brain />
    </group>
  );
}