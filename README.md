# NEXUS — AI Neural Spatial Interface

**An interactive neural intelligence system connecting real-time human movement, neural computation, and a procedural 3D brain.**

NEXUS began as a procedural 3D synthetic brain and has evolved into an interactive neural spatial interface. The system combines a browser-based 3D neural environment with webcam sensing, MediaPipe hand tracking, a Python/PyTorch neural network backend, real-time WebSocket communication, gesture interaction, and live neural activity visualization.

The architecture is designed to make neural computation visible and physically interactive rather than presenting the network as a conventional rectangular graph.

## Current System

NEXUS currently combines:

* ~3,800 procedurally generated neurons
* Seven brain-like neural regions
* Thousands of local synaptic connections
* Long-range "white matter" connections between regions
* Traveling neural signal particles
* Real-time webcam input
* MediaPipe hand landmark tracking
* Gesture-based interaction
* Python + PyTorch neural network backend
* WebSocket communication between frontend and backend
* Real neural network inference
* Live neuron activation visualization
* Neural connection and signal visualization
* Neuron and layer inspection
* Interactive 3D neural environment
* Glass-panel neural HUD

The system connects the pipeline:

```text
Webcam
   ↓
MediaPipe Hand Landmarks
   ↓
Gesture / Spatial Interaction
   ↓
React + Three.js
   ↓
WebSocket
   ↓
Python + PyTorch
   ↓
Neural Network Inference
   ↓
Neuron Activations
   ↓
WebSocket
   ↓
3D NEXUS Neural Brain
```

## Run it

### Frontend

```bash
npm install
npm run dev
```

Then open the printed local URL, typically:

```text
http://localhost:5173
```

Production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

### Python / PyTorch backend

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the backend:

```bash
uvicorn main:app --reload --port 8000
```

The frontend communicates with the neural backend through WebSocket.

## Controls

### 3D Brain

* **Drag** to orbit the brain.
* **Scroll / pinch** to zoom.
* The view can gently auto-rotate while idle.
* Interactive neural elements can be inspected through the interface.

### Hand Interaction

The hand-tracking system uses continuous spatial information rather than treating the hand as a simple mouse.

Tracked information includes:

* Hand position
* Finger positions
* Movement
* Depth
* Pinch distance
* Gesture state
* Wrist orientation

These signals are used to control the neural environment.

## Project Structure

```text
src/
  components/
    Scene.tsx
    Brain.tsx
    Neurons.tsx
    Connections.tsx
    ParticleFlow.tsx
    Environment.tsx
    LiveNetwork.tsx
    FineDendrites.tsx
    NeuronGlow.tsx

  ui/
    HUD.tsx
    HUD.css

  utils/
    brainGenerator.ts
    regions.ts
    spatialGrid.ts
    particleTexture.ts

  types.ts
  App.tsx

backend/
  main.py
  requirements.txt
```

### Core frontend components

`Scene.tsx`

Controls the Three.js scene, camera, controls, lighting, and post-processing.

`Brain.tsx`

Composes the neural brain environment and connects the procedural brain visualization with live neural data.

`Neurons.tsx`

Renders the large procedural neuron population using instancing and visual activation effects.

`Connections.tsx`

Renders synaptic connections between neurons.

`ParticleFlow.tsx`

Visualizes traveling signals through neural connections.

`LiveNetwork.tsx`

Connects live neural-network data to the 3D visualization.

`FineDendrites.tsx`

Adds additional fine neural structures for a more organic appearance.

`NeuronGlow.tsx`

Provides enhanced visual emphasis around active neural elements.

### Neural generation

`brainGenerator.ts`

Generates the procedural neural volume, neuron positions, and neural wiring.

It remains decoupled from React and Three.js scene objects so the generated neural environment can be reused by later systems.

`regions.ts`

Defines the brain-like regions and their relationships.

`spatialGrid.ts`

Provides spatial hashing for efficient local-neighbor and connection generation.

`particleTexture.ts`

Provides the soft particle texture used by signal visualization.

### Backend

`backend/main.py`

Contains the Python neural core.

The backend provides:

* Configurable PyTorch model
* Neural layers
* Neurons
* Weights
* Biases
* Activations
* Inference
* Neural state snapshots
* WebSocket communication
* Model metadata

The backend exposes the neural computation to the React frontend so the 3D brain can visualize actual model activity.

## Neural Architecture

The current neural system exposes the internal structure of the model rather than treating it as a black box.

```text
Input Layer
     ↓
Hidden Layer
     ↓
Hidden Layer
     ↓
Output Layer
```

Each inference can expose:

```text
Neuron
├── Layer
├── Index
└── Activation

Connection
├── Source neuron
├── Target neuron
├── Weight
├── Bias
└── Signal
```

This allows NEXUS to visualize what the neural network is doing internally.

## Performance

The original procedural brain was designed for thousands of neural elements.

* Neurons use `InstancedMesh`.
* Neural connections use batched line rendering.
* Spatial hashing reduces expensive nearest-neighbor searches.
* Bloom post-processing is applied through the rendering pipeline.
* Neural data is transferred through WebSocket rather than rebuilding the entire scene.
* Hand interaction uses continuous tracking data with smoothing to reduce jitter.

## Completed Phases

### Phase 1 — Procedural 3D Synthetic Brain

Completed:

* Organic procedural neural volume
* ~3,800 neurons
* Seven brain-like regions
* Local synaptic connections
* Long-range neural bridges
* Traveling signal particles
* 3D neural environment
* Glass-panel HUD
* Performance-oriented rendering architecture

### Phase 2 — Neural Computation

Completed:

* Python backend
* PyTorch neural network
* Configurable layers
* Neurons
* Weights
* Biases
* Activations
* Real inference
* Neural state extraction

### Phase 3 — Neural Visualization

Completed:

* Live neural activation visualization
* Neural connection signals
* Layer visualization
* Neuron inspection
* Frontend/backend WebSocket bridge
* Real neural data connected to the 3D environment

### Phase 4 — Natural Input Foundation

Completed:

* Webcam sensor input
* MediaPipe hand landmark tracking
* Gesture recognition
* Hand-driven interaction
* Spatial hand data
* Integration between hand tracking and the neural environment

## Next Phases

### Phase 5 — Natural Spatial Hand Control

The next stage expands the existing hand-tracking foundation into continuous physical interaction with the neural structure.

Planned capabilities:

* Continuous hand position control
* Movement and velocity tracking
* Depth-based interaction
* Wrist orientation tracking
* Wrist rotation → brain roll
* Hand movement → brain rotation
* Hand depth → zoom
* Pinch → select / grab
* Pinch movement → manipulate neural objects
* Pinch release → release objects
* Two-hand distance → brain scaling
* Two-hand rotation → neural structure rotation
* Circular hand movement → continuous brain rotation
* Smoothing and interpolation
* Jitter reduction
* Spatial interaction states

Interaction states:

```text
IDLE
TRACKING
GRABBING
MANIPULATING
TWO-HAND MODE
```

### Phase 6 — Advanced Neural Interaction

Planned:

* Direct neuron interaction
* Neural connection inspection
* Activation propagation visualization
* Weight and bias inspection
* Layer-level exploration
* Neural activity history
* Neural signal playback
* Advanced neural visualization

### Phase 7 — NEXUS Intelligence Core

Planned:

* Multiple PyTorch architectures
* Configurable neural models
* Real-time model switching
* Advanced neural inference controls
* Multimodal input
* More advanced AI-driven interaction
* Expanded NEXUS intelligence capabilities

## Architecture

```text
                 ┌─────────────────────┐
                 │      Webcam         │
                 └──────────┬──────────┘
                            ↓
                 ┌─────────────────────┐
                 │ MediaPipe Tracking  │
                 └──────────┬──────────┘
                            ↓
                 ┌─────────────────────┐
                 │ Spatial Interaction │
                 └──────────┬──────────┘
                            ↓
┌────────────────────────────────────────────────┐
│              React + Three.js                  │
│                                                │
│       Interactive 3D NEXUS Neural Brain       │
└──────────────────────┬─────────────────────────┘
                       │
                    WebSocket
                       │
                       ↓
┌────────────────────────────────────────────────┐
│              Python Neural Core                │
│                                                │
│                  PyTorch                      │
│                                                │
│  Layers → Neurons → Weights → Activations     │
└──────────────────────┬─────────────────────────┘
                       │
                  Live Inference
                       │
                       ↓
              Neural Visualization
```

## Vision

NEXUS is intended to move beyond a conventional AI chatbot interface.

The goal is to create an interactive spatial intelligence environment where:

```text
Human Movement
       ↓
Physical Interaction
       ↓
Spatial Intelligence
       ↓
Neural Computation
       ↓
Live Neural Visualization
       ↓
Human Understanding
```

Rather than hiding the neural process behind a conventional interface, NEXUS aims to make computation **visible, inspectable, and physically interactive**.
