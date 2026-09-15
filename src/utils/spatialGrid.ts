/**
 * Minimal uniform grid spatial hash. Used to find nearby neurons quickly
 * when wiring connections, so generation stays roughly O(n) instead of
 * O(n^2) as the neuron count grows into the thousands.
 */
export class SpatialGrid {
  private cellSize: number
  private buckets: Map<string, number[]> = new Map()

  constructor(cellSize: number) {
    this.cellSize = cellSize
  }

  private key(x: number, y: number, z: number): string {
    const cx = Math.floor(x / this.cellSize)
    const cy = Math.floor(y / this.cellSize)
    const cz = Math.floor(z / this.cellSize)
    return `${cx}|${cy}|${cz}`
  }

  insert(index: number, x: number, y: number, z: number): void {
    const k = this.key(x, y, z)
    const bucket = this.buckets.get(k)
    if (bucket) bucket.push(index)
    else this.buckets.set(k, [index])
  }

  /** Returns candidate indices from the query cell and its 26 neighbors. */
  queryNeighborCells(x: number, y: number, z: number): number[] {
    const cx = Math.floor(x / this.cellSize)
    const cy = Math.floor(y / this.cellSize)
    const cz = Math.floor(z / this.cellSize)
    const out: number[] = []
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const bucket = this.buckets.get(`${cx + dx}|${cy + dy}|${cz + dz}`)
          if (bucket) out.push(...bucket)
        }
      }
    }
    return out
  }
}

/**
 * Finds up to k nearest neighbor indices to `origin` among candidate point
 * indices, excluding `selfIndex`. `getPoint` maps an index to its [x,y,z].
 */
export function kNearest(
  selfIndex: number,
  origin: [number, number, number],
  candidates: number[],
  k: number,
  getPoint: (i: number) => [number, number, number]
): number[] {
  const scored: Array<[number, number]> = []
  for (const c of candidates) {
    if (c === selfIndex) continue
    const p = getPoint(c)
    const dx = p[0] - origin[0]
    const dy = p[1] - origin[1]
    const dz = p[2] - origin[2]
    scored.push([c, dx * dx + dy * dy + dz * dz])
  }
  scored.sort((a, b) => a[1] - b[1])
  return scored.slice(0, k).map((s) => s[0])
}
