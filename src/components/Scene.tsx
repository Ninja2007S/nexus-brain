import {
  OrbitControls,
} from "@react-three/drei";

import {
  useRef,
  useState,
} from "react";

import {
  useFrame,
} from "@react-three/fiber";

import * as THREE from "three";

import Brain from "./Brain";
import DigitalHand from "./DigitalHand";
import Environment from "./Environment";

import type {
  LiveNeuron,
} from "../types";

import {
  getHandState,
  getHandX,
  getHandY,
  getHandZ,
  getHandYaw,
  getHandPitch,
  getHandRoll,
  getPinchStrength,
  calculateHandOpenness,
  isFist,
  isOpenHand,
  isPointing,
  isPeace,
  isThumbsUp,
} from "../utils/handControl";


interface SceneProps {

  onStats?: (
    neuronCount: number,
    connectionCount: number,
  ) => void;

  onNeuronSelect?: (
    neuron: LiveNeuron | null,
  ) => void;

  selectedNeuronId?: number | null;
}


export default function Scene({
  onStats,
  onNeuronSelect,
  selectedNeuronId,
}: SceneProps) {

  const [
    autoRotate,
    setAutoRotate,
  ] = useState(true);


  const resumeTimer =
    useRef<
      ReturnType<typeof setTimeout> | null
    >(null);


  const brainGroupRef =
    useRef<THREE.Group>(null);


  // ==========================================================
  // SMOOTH POSITION
  // ==========================================================

  const position =
    useRef(
      new THREE.Vector3(),
    );


  const targetPosition =
    useRef(
      new THREE.Vector3(),
    );


  // ==========================================================
  // SMOOTH ROTATION
  // ==========================================================

  const rotation =
    useRef(
      new THREE.Euler(
        0,
        0,
        0,
      ),
    );


  // ==========================================================
  // SMOOTH SCALE
  // ==========================================================

  const scale =
    useRef(1);


  // ==========================================================
  // SMOOTH HAND VALUES
  // ==========================================================

  const handX =
    useRef(0.5);

  const handY =
    useRef(0.5);

  const handZ =
    useRef(0);

  const handYaw =
    useRef(0);

  const handPitch =
    useRef(0);

  const handRoll =
    useRef(0);


  // ==========================================================
  // INTERACTION
  // ==========================================================

  const handleInteractionStart =
    () => {

      if (
        resumeTimer.current
      ) {

        clearTimeout(
          resumeTimer.current,
        );
      }

      setAutoRotate(false);
    };


  const handleInteractionEnd =
    () => {

      if (
        resumeTimer.current
      ) {

        clearTimeout(
          resumeTimer.current,
        );
      }

      resumeTimer.current =
        setTimeout(
          () => {
            setAutoRotate(true);
          },
          5000,
        );
    };


  // ==========================================================
  // MAIN HAND CONTROL LOOP
  // ==========================================================

  useFrame(
    (_state, delta) => {

      const brain =
        brainGroupRef.current;

      if (!brain) {
        return;
      }


      const hand =
        getHandState();


      // ======================================================
      // NO HAND
      // ======================================================

      if (
        !hand.detected ||
        hand.landmarks.length < 21
      ) {

        position.current.x =
          THREE.MathUtils.damp(
            position.current.x,
            0,
            3.5,
            delta,
          );

        position.current.y =
          THREE.MathUtils.damp(
            position.current.y,
            0,
            3.5,
            delta,
          );

        position.current.z =
          THREE.MathUtils.damp(
            position.current.z,
            0,
            3.5,
            delta,
          );


        rotation.current.x =
          THREE.MathUtils.damp(
            rotation.current.x,
            0,
            3,
            delta,
          );

        rotation.current.y =
          THREE.MathUtils.damp(
            rotation.current.y,
            0,
            3,
            delta,
          );

        rotation.current.z =
          THREE.MathUtils.damp(
            rotation.current.z,
            0,
            3,
            delta,
          );


        scale.current =
          THREE.MathUtils.damp(
            scale.current,
            1,
            3,
            delta,
          );


        brain.position.copy(
          position.current,
        );

        brain.rotation.copy(
          rotation.current,
        );

        brain.scale.setScalar(
          scale.current,
        );

        return;
      }


      // ======================================================
      // READ HAND
      // ======================================================

      const rawX =
        getHandX(hand);

      const rawY =
        getHandY(hand);

      const rawZ =
        getHandZ(hand);


      const rawYaw =
        getHandYaw(hand);

      const rawPitch =
        getHandPitch(hand);

      const rawRoll =
        getHandRoll(hand);


      // ======================================================
      // SMOOTH HAND
      // ======================================================

      handX.current =
        THREE.MathUtils.damp(
          handX.current,
          rawX,
          14,
          delta,
        );


      handY.current =
        THREE.MathUtils.damp(
          handY.current,
          rawY,
          14,
          delta,
        );


      handZ.current =
        THREE.MathUtils.damp(
          handZ.current,
          rawZ,
          10,
          delta,
        );


      handYaw.current =
        THREE.MathUtils.damp(
          handYaw.current,
          rawYaw,
          9,
          delta,
        );


      handPitch.current =
        THREE.MathUtils.damp(
          handPitch.current,
          rawPitch,
          9,
          delta,
        );


      handRoll.current =
        THREE.MathUtils.damp(
          handRoll.current,
          rawRoll,
          9,
          delta,
        );


      // ======================================================
      // HAND POSITION
      // ======================================================

      const normalizedX =
        (
          handX.current -
          0.5
        ) * 2;


      const normalizedY =
        (
          0.5 -
          handY.current
        ) * 2;


      // ======================================================
      // DEAD ZONE
      // ======================================================

      const deadZone = 0.025;


      const filteredX =
        Math.abs(
          normalizedX,
        ) < deadZone
          ? 0
          : normalizedX;


      const filteredY =
        Math.abs(
          normalizedY,
        ) < deadZone
          ? 0
          : normalizedY;


      // ======================================================
      // POINTING MODE
      // ======================================================

      const pointing =
        isPointing(hand);


      // ======================================================
      // PEACE MODE
      // ======================================================

      const peace =
        isPeace(hand);


      // ======================================================
      // TARGET POSITION
      // ======================================================

      let movementMultiplier =
        1.0;


      if (pointing) {
        movementMultiplier = 1.45;
      }


      targetPosition.current.set(

        THREE.MathUtils.clamp(
          filteredX *
            1.15 *
            movementMultiplier,

          -1.4,
          1.4,
        ),

        THREE.MathUtils.clamp(
          filteredY *
            0.9 *
            movementMultiplier,

          -1.1,
          1.1,
        ),

        THREE.MathUtils.clamp(
          -handZ.current *
            0.55,

          -0.55,
          0.55,
        ),
      );


      // ======================================================
      // SMOOTH POSITION
      // ======================================================

      position.current.lerp(
        targetPosition.current,
        1 -
          Math.exp(
            -8 * delta,
          ),
      );


      // ======================================================
      // ROTATION
      // ======================================================

      let rotationMultiplier =
        peace
          ? 1.15
          : 1.0;


      const targetPitch =
        THREE.MathUtils.clamp(
          handPitch.current *
            0.72 *
            rotationMultiplier,

          -1.15,
          1.15,
        );


      const targetYaw =
        THREE.MathUtils.clamp(
          handYaw.current *
            0.85 *
            rotationMultiplier,

          -1.3,
          1.3,
        );


      const targetRoll =
        THREE.MathUtils.clamp(
          handRoll.current *
            0.65 *
            rotationMultiplier,

          -0.85,
          0.85,
        );


      rotation.current.x =
        THREE.MathUtils.damp(
          rotation.current.x,
          targetPitch,
          6.5,
          delta,
        );


      rotation.current.y =
        THREE.MathUtils.damp(
          rotation.current.y,
          targetYaw,
          6.5,
          delta,
        );


      rotation.current.z =
        THREE.MathUtils.damp(
          rotation.current.z,
          targetRoll,
          6.5,
          delta,
        );


      // ======================================================
      // GESTURES
      // ======================================================

      const pinchStrength =
        getPinchStrength(hand);


      const openness =
        calculateHandOpenness(
          hand,
        );


      const fist =
        isFist(hand);


      const openHand =
        isOpenHand(hand);


      const thumbsUp =
        isThumbsUp(hand);


      // ======================================================
      // SCALE
      // ======================================================

      let targetScale =
        1.0;


      // Pinch = zoom into brain

      if (pinchStrength > 0.1) {

        targetScale =
          THREE.MathUtils.lerp(
            1.0,
            1.45,
            pinchStrength,
          );
      }


      // Open hand = expand

      if (openHand) {

        targetScale =
          Math.max(
            targetScale,
            1.15 +
              openness *
              0.25,
          );
      }


      // Fist = compress

      if (fist) {

        targetScale =
          0.78;
      }


      // Thumbs up = slightly expand

      if (thumbsUp) {

        targetScale =
          Math.max(
            targetScale,
            1.12,
          );
      }


      scale.current =
        THREE.MathUtils.damp(
          scale.current,
          targetScale,
          8,
          delta,
        );


      // ======================================================
      // APPLY TRANSFORM
      // ======================================================

      brain.position.copy(
        position.current,
      );


      brain.rotation.copy(
        rotation.current,
      );


      brain.scale.setScalar(
        scale.current,
      );
    },
  );


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>

      <color
        attach="background"
        args={[
          "#05070c",
        ]}
      />


      <Environment />


      <group
        ref={
          brainGroupRef
        }
      >

        <Brain
          onStats={
            onStats
          }

          onNeuronSelect={
            onNeuronSelect
          }

          selectedNeuronId={
            selectedNeuronId
          }
        />

      </group>


      <DigitalHand />


      <OrbitControls

        makeDefault

        enableDamping

        dampingFactor={
          0.08
        }

        minDistance={
          2.4
        }

        maxDistance={
          15
        }

        autoRotate={
          autoRotate
        }

        autoRotateSpeed={
          0.45
        }

        onStart={
          handleInteractionStart
        }

        onEnd={
          handleInteractionEnd
        }
      />

    </>
  );
}