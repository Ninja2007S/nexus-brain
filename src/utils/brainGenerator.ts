import * as THREE from "three";

export interface BrainNeuron {
  id: number;
  position: [number, number, number];
  region:
    | "Frontal"
    | "Parietal"
    | "Temporal"
    | "Occipital"
    | "Cortex"
    | "Deep";
  hemisphere: "left" | "right";
  layer: number;
  size: number;
}

export interface BrainConnection {
  from: number;
  to: number;
  strength: number;
}

export interface BrainData {
  neurons: BrainNeuron[];
  connections: BrainConnection[];
  fineConnections: BrainConnection[];
}

const NEURON_COUNT = 8000;

// Keep these moderate for Iris Xe.
const LOCAL_CONNECTIONS_PER_NEURON = 3;
const FINE_CONNECTIONS_PER_NEURON = 2;

const SEED = 72931;

function seededRandom(): () => number {
  let seed = SEED;

  return () => {
    seed =
      (seed * 1664525 + 1013904223) %
      4294967296;

    return seed / 4294967296;
  };
}

const random = seededRandom();

function randomRange(
  min: number,
  max: number,
): number {
  return (
    min +
    random() * (max - min)
  );
}

function gaussian(): number {
  const u =
    Math.max(
      random(),
      0.000001,
    );

  const v =
    Math.max(
      random(),
      0.000001,
    );

  return (
    Math.sqrt(
      -2 *
        Math.log(u),
    ) *
    Math.cos(
      2 *
        Math.PI *
        v,
    )
  );
}

function clamp(
  value: number,
  min: number,
  max: number,
): number {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

/*
|--------------------------------------------------------------------------
| Anatomically-inspired brain shape
|--------------------------------------------------------------------------
*/

function brainRadius(
  y: number,
): {
  x: number;
  z: number;
} {
  const normalizedY =
    y / 1.65;

  const absY =
    Math.abs(normalizedY);

  /*
   * Brain becomes slightly narrower
   * toward the top and bottom.
   */
  const verticalShape =
    Math.sqrt(
      Math.max(
        0.05,
        1 -
          normalizedY *
            normalizedY,
      ),
    );

  const frontalExpansion =
    y > 0.15
      ? 1.10
      : 1.0;

  const occipitalShape =
    y < -0.45
      ? 0.92
      : 1.0;

  const x =
    1.85 *
    verticalShape *
    frontalExpansion *
    occipitalShape;

  const z =
    1.45 *
    verticalShape;

  return {
    x,
    z,
  };
}

/*
|--------------------------------------------------------------------------
| Cortical folds
|--------------------------------------------------------------------------
*/

function corticalFold(
  theta: number,
  y: number,
): number {
  const foldA =
    Math.sin(
      theta * 7.0 +
        y * 3.5,
    );

  const foldB =
    Math.sin(
      theta * 13.0 -
        y * 4.2,
    );

  const foldC =
    Math.cos(
      theta * 19.0 +
        y * 2.1,
    );

  return (
    foldA * 0.045 +
    foldB * 0.025 +
    foldC * 0.015
  );
}

/*
|--------------------------------------------------------------------------
| Region detection
|--------------------------------------------------------------------------
*/

function determineRegion(
  y: number,
  z: number,
): BrainNeuron["region"] {
  if (y > 0.65) {
    return "Frontal";
  }

  if (y < -0.75) {
    return "Occipital";
  }

  if (
    z > 0.45 &&
    y > -0.55
  ) {
    return "Parietal";
  }

  if (
    z < -0.35 &&
    y < 0.35
  ) {
    return "Temporal";
  }

  if (
    Math.abs(z) < 0.45 &&
    Math.abs(y) < 0.8
  ) {
    return "Deep";
  }

  return "Cortex";
}

/*
|--------------------------------------------------------------------------
| Generate one neuron
|--------------------------------------------------------------------------
*/

function createNeuron(
  id: number,
): BrainNeuron {
  const hemisphere =
    random() < 0.5
      ? "left"
      : "right";

  /*
   * More neurons are placed
   * toward the outer cortex.
   */
  const corticalBias =
    Math.pow(
      random(),
      0.55,
    );

  let y =
    randomRange(
      -1.6,
      1.6,
    );

  const radius =
    brainRadius(y);

  /*
   * Random point on elliptical
   * cross-section.
   */
  const angle =
    randomRange(
      0,
      Math.PI * 2,
    );

  const radial =
    0.15 +
    corticalBias *
      0.85;

  let x =
    Math.cos(angle) *
    radius.x *
    radial;

  let z =
    Math.sin(angle) *
    radius.z *
    radial;

  /*
   * Hemisphere separation.
   */
  const hemisphereGap =
    0.10;

  if (
    hemisphere ===
    "left"
  ) {
    x =
      -Math.abs(x) -
      hemisphereGap;
  } else {
    x =
      Math.abs(x) +
      hemisphereGap;
  }

  /*
   * Cortical folds.
   */
  const fold =
    corticalFold(
      angle,
      y,
    );

  const foldDirection =
    x >= 0 ? 1 : -1;

  x +=
    fold *
    foldDirection;

  z +=
    fold *
    0.7;

  /*
   * Deep neurons.
   */
  const isDeep =
    corticalBias <
    0.24;

  if (isDeep) {
    x *= 0.55;
    z *= 0.60;
  }

  /*
   * Organic vertical distortion.
   */
  y +=
    Math.sin(
      x * 2.3 +
        z * 1.7,
    ) *
    0.06;

  y +=
    gaussian() *
    0.025;

  /*
   * Clamp to brain volume.
   */
  x = clamp(
    x,
    -1.95,
    1.95,
  );

  y = clamp(
    y,
    -1.7,
    1.7,
  );

  z = clamp(
    z,
    -1.5,
    1.5,
  );

  const region =
    isDeep
      ? "Deep"
      : determineRegion(
          y,
          z,
        );

  const layer =
    isDeep
      ? Math.floor(
          random() * 3,
        )
      : Math.floor(
          random() * 6,
        );

  const size =
    isDeep
      ? randomRange(
          0.012,
          0.025,
        )
      : randomRange(
          0.008,
          0.020,
        );

  return {
    id,
    position: [
      x,
      y,
      z,
    ],
    region,
    hemisphere,
    layer,
    size,
  };
}

/*
|--------------------------------------------------------------------------
| Distance helper
|--------------------------------------------------------------------------
*/

function distanceSquared(
  a: BrainNeuron,
  b: BrainNeuron,
): number {
  const dx =
    a.position[0] -
    b.position[0];

  const dy =
    a.position[1] -
    b.position[1];

  const dz =
    a.position[2] -
    b.position[2];

  return (
    dx * dx +
    dy * dy +
    dz * dz
  );
}

/*
|--------------------------------------------------------------------------
| Build neural connections
|--------------------------------------------------------------------------
*/

function generateConnections(
  neurons: BrainNeuron[],
): BrainConnection[] {
  const connections: BrainConnection[] =
    [];

  /*
   * Spatial grid dramatically reduces
   * the amount of distance checking.
   */
  const grid =
    new Map<
      string,
      number[]
    >();

  const cellSize =
    0.32;

  const cellKey = (
    x: number,
    y: number,
    z: number,
  ) =>
    `${Math.floor(
      x / cellSize,
    )},${Math.floor(
      y / cellSize,
    )},${Math.floor(
      z / cellSize,
    )}`;

  for (
    let i = 0;
    i < neurons.length;
    i++
  ) {
    const neuron =
      neurons[i];

    const key =
      cellKey(
        neuron.position[0],
        neuron.position[1],
        neuron.position[2],
      );

    const bucket =
      grid.get(key);

    if (bucket) {
      bucket.push(i);
    } else {
      grid.set(
        key,
        [i],
      );
    }
  }

  const connected =
    new Set<string>();

  for (
    let i = 0;
    i < neurons.length;
    i++
  ) {
    const source =
      neurons[i];

    const nearby: {
      index: number;
      distance: number;
    }[] = [];

    const cx =
      Math.floor(
        source.position[0] /
          cellSize,
      );

    const cy =
      Math.floor(
        source.position[1] /
          cellSize,
      );

    const cz =
      Math.floor(
        source.position[2] /
          cellSize,
      );

    /*
     * Search neighboring grid cells.
     */
    for (
      let gx = -1;
      gx <= 1;
      gx++
    ) {
      for (
        let gy = -1;
        gy <= 1;
        gy++
      ) {
        for (
          let gz = -1;
          gz <= 1;
          gz++
        ) {
          const bucket =
            grid.get(
              `${cx + gx},${
                cy + gy
              },${
                cz + gz
              }`,
            );

          if (!bucket) {
            continue;
          }

          for (
            const index of
              bucket
          ) {
            if (
              index === i
            ) {
              continue;
            }

            const target =
              neurons[
                index
              ];

            /*
             * Prefer same hemisphere.
             */
            if (
              target.hemisphere !==
              source.hemisphere
            ) {
              continue;
            }

            const dist =
              distanceSquared(
                source,
                target,
              );

            if (
              dist <
              0.12
            ) {
              nearby.push({
                index,
                distance:
                  dist,
              });
            }
          }
        }
      }
    }

    nearby.sort(
      (
        a,
        b,
      ) =>
        a.distance -
        b.distance,
    );

    const count =
      Math.min(
        LOCAL_CONNECTIONS_PER_NEURON,
        nearby.length,
      );

    for (
      let n = 0;
      n < count;
      n++
    ) {
      const target =
        nearby[n];

      const a =
        Math.min(
          i,
          target.index,
        );

      const b =
        Math.max(
          i,
          target.index,
        );

      const key =
        `${a}-${b}`;

      if (
        connected.has(
          key,
        )
      ) {
        continue;
      }

      connected.add(key);

      connections.push({
        from: i,
        to: target.index,
        strength:
          randomRange(
            0.15,
            1.0,
          ),
      });
    }
  }

  /*
   * Corpus callosum.
   */
  const left =
    neurons.filter(
      (n) =>
        n.hemisphere ===
        "left" &&
        Math.abs(
          n.position[0],
        ) < 0.75,
    );

  const right =
    neurons.filter(
      (n) =>
        n.hemisphere ===
        "right" &&
        Math.abs(
          n.position[0],
        ) < 0.75,
    );

  for (
    let i = 0;
    i < left.length;
    i += 7
  ) {
    const a =
      left[i];

    let closest:
      BrainNeuron | null =
      null;

    let closestDistance =
      Infinity;

    for (
      let j = 0;
      j < right.length;
      j += 3
    ) {
      const b =
        right[j];

      const d =
        distanceSquared(
          a,
          b,
        );

      if (
        d <
        closestDistance
      ) {
        closestDistance =
          d;

        closest =
          b;
      }
    }

    if (!closest) {
      continue;
    }

    connections.push({
      from: a.id,
      to: closest.id,
      strength:
        randomRange(
          0.35,
          1.0,
        ),
    });
  }

  /*
   * Long-range connections.
   */
  for (
    let i = 0;
    i < 850;
    i++
  ) {
    const a =
      neurons[
        Math.floor(
          random() *
            neurons.length,
        )
      ];

    const b =
      neurons[
        Math.floor(
          random() *
            neurons.length,
        )
      ];

    if (
      a.id ===
      b.id
    ) {
      continue;
    }

    if (
      a.hemisphere ===
      b.hemisphere
    ) {
      continue;
    }

    connections.push({
      from: a.id,
      to: b.id,
      strength:
        randomRange(
          0.2,
          0.8,
        ),
    });
  }

  return connections;
}

/*
|--------------------------------------------------------------------------
| Fine dendritic network
|--------------------------------------------------------------------------
*/

function generateFineConnections(
  neurons: BrainNeuron[],
): BrainConnection[] {
  const connections: BrainConnection[] =
    [];

  const count =
    Math.min(
      6000,
      Math.floor(
        neurons.length *
          FINE_CONNECTIONS_PER_NEURON /
          2,
      ),
    );

  for (
    let i = 0;
    i < count;
    i++
  ) {
    const from =
      Math.floor(
        random() *
          neurons.length,
      );

    const source =
      neurons[from];

    let best =
      -1;

    let bestDistance =
      Infinity;

    /*
     * Sample instead of checking
     * every neuron.
     */
    for (
      let j = 0;
      j < 12;
      j++
    ) {
      const candidate =
        Math.floor(
          random() *
            neurons.length,
        );

      if (
        candidate ===
        from
      ) {
        continue;
      }

      const target =
        neurons[
          candidate
        ];

      if (
        target.hemisphere !==
        source.hemisphere
      ) {
        continue;
      }

      const d =
        distanceSquared(
          source,
          target,
        );

      if (
        d <
        bestDistance
      ) {
        bestDistance =
          d;

        best =
          candidate;
      }
    }

    if (best < 0) {
      continue;
    }

    connections.push({
      from,
      to: best,
      strength:
        randomRange(
          0.04,
          0.25,
        ),
    });
  }

  return connections;
}

/*
|--------------------------------------------------------------------------
| Public generator
|--------------------------------------------------------------------------
*/

export function generateBrain(): BrainData {
  const neurons: BrainNeuron[] =
    [];

  for (
    let i = 0;
    i < NEURON_COUNT;
    i++
  ) {
    neurons.push(
      createNeuron(i),
    );
  }

  const connections =
    generateConnections(
      neurons,
    );

  const fineConnections =
    generateFineConnections(
      neurons,
    );

  console.log(
    `🧠 Brain generated: ${neurons.length} neurons`,
  );

  console.log(
    `🔗 Main connections: ${connections.length}`,
  );

  console.log(
    `〰️ Fine connections: ${fineConnections.length}`,
  );

  return {
    neurons,
    connections,
    fineConnections,
  };
}