import {
  useEffect,
  useMemo,
} from "react";

import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Points,
  PointsMaterial,
} from "three";

import type {
  BrainNeuron,
} from "../utils/brainGenerator";

interface NeuronGlowProps {
  field: BrainNeuron[];
}

export default function NeuronGlow({
  field,
}: NeuronGlowProps) {
  const geometry =
    useMemo(() => {
      const geo =
        new BufferGeometry();

      // Always create valid attributes.
      // This prevents Three.js from receiving
      // an undefined underlying array.

      geo.setAttribute(
        "position",
        new BufferAttribute(
          new Float32Array(0),
          3,
        ),
      );

      geo.setAttribute(
        "color",
        new BufferAttribute(
          new Float32Array(0),
          3,
        ),
      );

      return geo;
    }, []);

  const material =
    useMemo(
      () =>
        new PointsMaterial({
          size: 0.055,
          transparent: true,
          opacity: 0.32,
          depthWrite: false,
          blending:
            AdditiveBlending,
          vertexColors: true,
          sizeAttenuation: true,
        }),
      [],
    );

  useEffect(() => {
    /*
     * ==========================================================
     * SAFE DATA EXTRACTION
     * ==========================================================
     */

    const safeField =
      Array.isArray(field)
        ? field
        : [];

    /*
     * ==========================================================
     * POSITION DATA
     * ==========================================================
     */

    const positions =
      new Float32Array(
        safeField.length * 3,
      );

    /*
     * ==========================================================
     * COLOR DATA
     * ==========================================================
     */

    const colors =
      new Float32Array(
        safeField.length * 3,
      );

    /*
     * ==========================================================
     * BUILD ATTRIBUTES
     * ==========================================================
     */

    let validCount = 0;

    for (
      const neuron of safeField
    ) {
      if (
        !neuron ||
        !Array.isArray(
          neuron.position,
        ) ||
        neuron.position.length <
          3
      ) {
        continue;
      }

      const x =
        Number(
          neuron.position[0],
        );

      const y =
        Number(
          neuron.position[1],
        );

      const z =
        Number(
          neuron.position[2],
        );

      if (
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        !Number.isFinite(z)
      ) {
        continue;
      }

      const offset =
        validCount * 3;

      positions[offset] =
        x;

      positions[offset + 1] =
        y;

      positions[offset + 2] =
        z;

      /*
       * Soft cyan/blue glow.
       *
       * Keep values inside the normal
       * 0 → 1 color range.
       */

      colors[offset] =
        0.15;

      colors[offset + 1] =
        0.55;

      colors[offset + 2] =
        1.0;

      validCount++;
    }

    /*
     * ==========================================================
     * CREATE EXACT-SIZE ARRAYS
     * ==========================================================
     */

    const finalPositions =
      validCount ===
      safeField.length
        ? positions
        : positions.slice(
            0,
            validCount * 3,
          );

    const finalColors =
      validCount ===
      safeField.length
        ? colors
        : colors.slice(
            0,
            validCount * 3,
          );

    /*
     * ==========================================================
     * POSITION ATTRIBUTE
     * ==========================================================
     */

    const oldPosition =
      geometry.getAttribute(
        "position",
      );

    if (oldPosition) {
      geometry.deleteAttribute(
        "position",
      );
    }

    geometry.setAttribute(
      "position",
      new BufferAttribute(
        finalPositions,
        3,
      ),
    );

    /*
     * ==========================================================
     * COLOR ATTRIBUTE
     * ==========================================================
     */

    const oldColor =
      geometry.getAttribute(
        "color",
      );

    if (oldColor) {
      geometry.deleteAttribute(
        "color",
      );
    }

    geometry.setAttribute(
      "color",
      new BufferAttribute(
        finalColors,
        3,
      ),
    );

    /*
     * ==========================================================
     * DRAW RANGE
     * ==========================================================
     */

    geometry.setDrawRange(
      0,
      validCount,
    );

    /*
     * ==========================================================
     * BOUNDING SPHERE
     * ==========================================================
     */

    if (validCount > 0) {
      geometry.computeBoundingSphere();
    }
  }, [
    field,
    geometry,
  ]);

  /*
   * ============================================================
   * CLEANUP
   * ============================================================
   */

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [
    geometry,
    material,
  ]);

  return (
    <points
      geometry={geometry}
      material={material}
      frustumCulled={false}
    />
  );
}