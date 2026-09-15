import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { BrainNeuron } from "../utils/brainGenerator";

interface NeuronsProps {
  field: BrainNeuron[];
}

const REGION_SCALE: Record<BrainNeuron["region"], number> = {
  Frontal: 1.15,
  Parietal: 1.0,
  Temporal: 0.95,
  Occipital: 0.9,
  Cortex: 1.0,
  Deep: 0.72,
};

export default function Neurons({
  field,
}: NeuronsProps) {
  const meshRef = useRef<THREE.InstancedMesh | null>(null);

  const dummy = useMemo(
    () => new THREE.Object3D(),
    [],
  );

  const geometry = useMemo(
    () =>
      new THREE.SphereGeometry(
        1,
        6,
        6,
      ),
    [],
  );

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );

  const colors = useMemo(
    () =>
      new Float32Array(
        field.length * 3,
      ),
    [field.length],
  );

  const color = useMemo(
    () => new THREE.Color(),
    [],
  );

  useEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    mesh.count = field.length;

    for (
      let i = 0;
      i < field.length;
      i++
    ) {
      const neuron = field[i];

      if (!neuron) {
        continue;
      }

      switch (neuron.region) {
        case "Frontal":
          color.setRGB(
            0.25,
            0.65,
            1.0,
          );
          break;

        case "Parietal":
          color.setRGB(
            0.35,
            0.85,
            1.0,
          );
          break;

        case "Temporal":
          color.setRGB(
            0.55,
            0.45,
            1.0,
          );
          break;

        case "Occipital":
          color.setRGB(
            0.25,
            0.95,
            0.75,
          );
          break;

        case "Deep":
          color.setRGB(
            1.0,
            0.45,
            0.25,
          );
          break;

        default:
          color.setRGB(
            0.35,
            0.70,
            1.0,
          );
          break;
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      const [
        x,
        y,
        z,
      ] = neuron.position;

      const scale = Math.max(
        neuron.size *
          (
            REGION_SCALE[
              neuron.region
            ] ?? 1
          ),
        0.008,
      );

      dummy.position.set(
        x,
        y,
        z,
      );

      dummy.scale.setScalar(
        scale,
      );

      dummy.rotation.set(
        0,
        0,
        0,
      );

      dummy.updateMatrix();

      mesh.setMatrixAt(
        i,
        dummy.matrix,
      );
    }

    const instanceColor =
      new THREE.InstancedBufferAttribute(
        colors,
        3,
      );

    geometry.setAttribute(
      "instanceColor",
      instanceColor,
    );

    mesh.instanceMatrix.needsUpdate = true;
    instanceColor.needsUpdate = true;
  }, [
    field,
    colors,
    geometry,
    dummy,
    color,
  ]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    const time =
      clock.getElapsedTime();

    for (
      let i = 0;
      i < field.length;
      i++
    ) {
      const neuron = field[i];

      if (!neuron) {
        continue;
      }

      const [
        x,
        y,
        z,
      ] = neuron.position;

      const pulse =
        1 +
        Math.sin(
          time * 1.7 +
            i * 0.021,
        ) *
          0.035;

      const scale = Math.max(
        neuron.size *
          (
            REGION_SCALE[
              neuron.region
            ] ?? 1
          ) *
          pulse,
        0.008,
      );

      dummy.position.set(
        x,
        y,
        z,
      );

      dummy.scale.setScalar(
        scale,
      );

      dummy.rotation.set(
        0,
        0,
        0,
      );

      dummy.updateMatrix();

      mesh.setMatrixAt(
        i,
        dummy.matrix,
      );
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[
        geometry,
        material,
        field.length,
      ]}
      frustumCulled={false}
    />
  );
}