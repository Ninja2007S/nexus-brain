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

interface ConnectionsProps {
  field: BrainConnection[];
  neurons: BrainNeuron[];
}

const MAX_CONNECTIONS = 30000;

export default function Connections({
  field,
  neurons,
}: ConnectionsProps) {
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
          opacity: 0.13,
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
        MAX_CONNECTIONS,
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

    /*
     * Remove old attributes first.
     */

    geometry.deleteAttribute(
      "position",
    );

    /*
     * IMPORTANT:
     * This is always a valid Float32Array.
     */

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

      const pulse =
        0.12 +
        Math.sin(
          time * 1.5,
        ) *
          0.025;

      material.opacity =
        Math.max(
          0.05,
          pulse,
        );
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