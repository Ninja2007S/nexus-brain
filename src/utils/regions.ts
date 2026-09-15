import type { RegionDefinition } from '../types'

/**
 * Seven loosely anatomical "lobes" arranged so the neuron cloud reads as an
 * organic brain-like volume rather than a rectangular MLP diagram. Centers
 * and radii are hand-tuned world units (brain spans roughly -4.5..4.5).
 */
export const REGIONS: RegionDefinition[] = [
  {
    id: 'frontal',
    label: 'Frontal Array',
    center: [0, 1.3, 2.6],
    radii: [1.9, 1.6, 1.7],
    share: 0.18,
    color: '#6fd6ff',
    noiseSeed: 0
  },
  {
    id: 'parietal',
    label: 'Parietal Array',
    center: [0, 1.9, -0.6],
    radii: [2.0, 1.5, 1.9],
    share: 0.16,
    color: '#8b7bf0',
    noiseSeed: 12.4
  },
  {
    id: 'temporal-left',
    label: 'Temporal Cluster L',
    center: [-2.3, -0.4, 0.6],
    radii: [1.3, 1.1, 1.7],
    share: 0.13,
    color: '#5be3c9',
    noiseSeed: 24.8
  },
  {
    id: 'temporal-right',
    label: 'Temporal Cluster R',
    center: [2.3, -0.4, 0.6],
    radii: [1.3, 1.1, 1.7],
    share: 0.13,
    color: '#5be3c9',
    noiseSeed: 37.2
  },
  {
    id: 'occipital',
    label: 'Occipital Array',
    center: [0, 0.6, -3.0],
    radii: [1.6, 1.4, 1.3],
    share: 0.14,
    color: '#b083f2',
    noiseSeed: 49.6
  },
  {
    id: 'core',
    label: 'Association Core',
    center: [0, -0.3, 0.2],
    radii: [1.1, 1.0, 1.2],
    share: 0.12,
    color: '#ffb46b',
    noiseSeed: 62.0
  },
  {
    id: 'stem',
    label: 'Deep Relay',
    center: [0, -1.7, -2.0],
    radii: [1.2, 0.9, 1.0],
    share: 0.14,
    color: '#7ea8ff',
    noiseSeed: 74.4
  }
]

/**
 * Adjacency pairs used to grow long-range "white matter" bridge connections
 * between regions, keeping bundles anatomically plausible instead of fully
 * random chaotic links.
 */
export const REGION_ADJACENCY: Array<[string, string]> = [
  ['frontal', 'parietal'],
  ['frontal', 'temporal-left'],
  ['frontal', 'temporal-right'],
  ['frontal', 'core'],
  ['parietal', 'occipital'],
  ['parietal', 'temporal-left'],
  ['parietal', 'temporal-right'],
  ['temporal-left', 'core'],
  ['temporal-right', 'core'],
  ['occipital', 'stem'],
  ['core', 'stem'],
  ['temporal-left', 'occipital'],
  ['temporal-right', 'occipital']
]
