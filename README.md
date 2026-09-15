# NEXUS — AI Neural Spatial Interface

**Phase 1: the procedural 3D synthetic brain.**

This phase is a standalone React + TypeScript + React Three Fiber
application. It renders a procedurally generated, organic neural volume
(not a rectangular network diagram): ~3,800 neurons across seven
brain-like regions, thousands of local synaptic connections, long-range
"white matter" bridges between regions, traveling signal particles, and
a minimal glass-panel HUD.

No webcam, hand tracking, or backend is involved yet — those arrive in
later phases. Everything here runs entirely in the browser.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

```bash
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

## Controls

- **Drag** to orbit the brain.
- **Scroll / pinch** to zoom.
- The view gently auto-rotates when idle, and pauses while you interact.

## Project structure

```
src/
  components/
    Scene.tsx        camera rig, OrbitControls, bloom post-processing
    Brain.tsx         composes neurons + connections + signal flow
    Neurons.tsx       instanced neuron nodes, per-neuron pulse animation
    Connections.tsx   static line-segment mesh of synaptic connections
    ParticleFlow.tsx  traveling particles along a subset of connections
    Environment.tsx   ambient dust field + depth fog
  utils/
    brainGenerator.ts generates the organic volume + wiring (pure, no React)
    regions.ts        the seven region definitions + adjacency map
    spatialGrid.ts     uniform grid hash for fast nearest-neighbor wiring
    particleTexture.ts soft circular sprite used by all particle systems
  ui/
    HUD.tsx / HUD.css  brand mark, status, live neuron/connection counts
  types.ts             shared data shapes for the brain model
```

`brainGenerator.ts` is intentionally decoupled from React and Three.js
scene objects — it just returns typed arrays — so later phases (neuron
selection, layer inspection, backend-driven activation data) can reuse or
replace it without touching the rendering components.

## Performance notes

- Neurons are drawn with a single `InstancedMesh`; only per-instance
  *color* is updated per frame (for the pulsing glow), not per-instance
  transforms, to keep the per-frame cost low at thousands of instances.
- All connections are one `LineSegments` draw call.
- Connection wiring uses a uniform spatial grid instead of brute-force
  nearest-neighbor search, so generation stays fast as neuron count grows.
- Bloom is applied once via a single `EffectComposer` pass.

## Next phases (not yet built)

Webcam sensor input, MediaPipe hand landmark tracking, a Python/PyTorch
backend, a WebSocket bridge, gesture-based interaction with the brain,
real neural activation visualization, and neuron/layer inspection.
