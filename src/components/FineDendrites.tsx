import {
  useEffect,
  useMemo,
  useRef,
} from "react";

import {
  useFrame,
} from "@react-three/fiber";

import * as THREE from "three";

import type {
  BrainConnection,
  BrainNeuron,
} from "../utils/brainGenerator";

interface FineDendritesProps {
  field: BrainConnection[];
  neurons: BrainNeuron[];
}

const MAX_FINE_CONNECTIONS = 18000;

export default function FineDendrites({
  field,
  neurons,
}: FineDendritesProps) {
  const linesRef =
    useRef<THREE.LineSegments | null>(
      null,
    );

  const geometry =
    useMemo(
      () =>
        new THREE.BufferGeometry(),
      [],
    );

  const material =
    useMemo(
      () =>
        new THREE.LineBasicMaterial({
          transparent: true,
          opacity: 0.055,
          depthWrite: false,
          blending:
            THREE.AdditiveBlending,
          toneMapped: false,
        }),
      [],
    );

  const neuronMap =
    useMemo(() => {
      const map =
        new Map<
          number,
          [number, number, number]
        >();

      for (
        const neuron of neurons
      ) {
        if (!neuron) {
          continue;
        }

        map.set(
          neuron.id,
          neuron.position,
        );
      }

      return map;
    }, [neurons]);

  useEffect(() => {
    const safeConnections =
      field.slice(
        0,
        MAX_FINE_CONNECTIONS,
      );

    const positions =
      new Float32Array(
        safeConnections.length * 6,
      );

    let validCount = 0;

    for (
      const connection of safeConnections
    ) {
      if (!connection) {
        continue;
      }

      const from =
        neuronMap.get(
          connection.from,
        );

      const to =
        neuronMap.get(
          connection.to,
        );

      if (!from || !to) {
        continue;
      }

      const offset =
        validCount * 6;

      positions[offset] =
        from[0];

      positions[offset + 1] =
        from[1];

      positions[offset + 2] =
        from[2];

      positions[offset + 3] =
        to[0];

      positions[offset + 4] =
        to[1];

      positions[offset + 5] =
        to[2];

      validCount++;
    }

    geometry.deleteAttribute(
      "position",
    );

    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(
        positions,
        3,
      ),
    );

    geometry.setDrawRange(
      0,
      validCount * 2,
    );

    geometry.computeBoundingSphere();

    const attribute =
      geometry.getAttribute(
        "position",
      );

    if (attribute) {
      attribute.needsUpdate =
        true;
    }
  }, [
    field,
    neuronMap,
    geometry,
  ]);

  useFrame(
    ({
      clock,
    }) => {
      const time =
        clock.getElapsedTime();

      material.opacity =
        0.045 +
        Math.sin(
          time * 2.0,
        ) *
          0.012;
    },
  );

  return (
    <lineSegments
      ref={linesRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
    />
  );
}