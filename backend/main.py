from __future__ import annotations

import asyncio
import json
import time
from contextlib import asynccontextmanager
from typing import Any

import torch
from torch import nn

from fastapi import (
    FastAPI,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware

from app.hand_tracker_instance import hand_tracker
from app.routers.hand import router as hand_router


# ============================================================
# APPLICATION LIFESPAN
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs when FastAPI starts and stops.

    Startup:
        - Starts the MediaPipe hand tracker.

    Shutdown:
        - Stops the MediaPipe hand tracker.
    """

    print("🚀 Starting Nexus Brain Neural Core...")

    try:
        hand_tracker.start()
        print("🖐️ Hand tracking system ready")

        yield

    finally:
        print("🛑 Shutting down Nexus Brain Neural Core...")

        hand_tracker.stop()

        print("✅ Hand tracker stopped")
        print("👋 Nexus Brain Neural Core stopped")


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="Nexus Brain Neural Core",
    version="2.0.0",
    lifespan=lifespan,
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================

# Registers:
# ws://localhost:8000/ws/hand
app.include_router(hand_router)


# ============================================================
# MODEL CONFIGURATION
# ============================================================

MODEL_CONFIG = {
    "input_size": 4,
    "hidden_sizes": [8, 6],
    "output_size": 3,
}


# ============================================================
# PYTORCH MODEL
# ============================================================

class DemoNet(nn.Module):
    """
    Small configurable neural network.

    Architecture:

        Input:   4 neurons
        Hidden:  8 neurons
        Hidden:  6 neurons
        Output:  3 neurons

    Total neurons:

        4 + 8 + 6 + 3 = 21

    Total fully-connected weights:

        4*8 + 8*6 + 6*3 = 98
    """

    def __init__(
        self,
        input_size: int = 4,
        hidden_sizes: list[int] | None = None,
        output_size: int = 3,
    ):
        super().__init__()

        if hidden_sizes is None:
            hidden_sizes = [8, 6]

        self.input_size = input_size
        self.hidden_sizes = hidden_sizes
        self.output_size = output_size

        sizes = [
            input_size,
            *hidden_sizes,
            output_size,
        ]

        self.layers = nn.ModuleList(
            [
                nn.Linear(
                    sizes[index],
                    sizes[index + 1],
                )
                for index in range(len(sizes) - 1)
            ]
        )

        # One activation function for each hidden layer.
        self.activation_functions = [
            nn.ReLU(),
            nn.Tanh(),
        ]

    def forward(
        self,
        x: torch.Tensor,
    ) -> tuple[torch.Tensor, list[torch.Tensor]]:
        """
        Returns:

            output:
                Final model output.

            activations:
                Input and every layer activation.
        """

        # Capture the original input layer.
        activations = [
            x.detach().cpu()
        ]

        for index, layer in enumerate(self.layers):

            # Actual PyTorch linear computation:
            #
            # x = x @ weight.T + bias
            #
            x = layer(x)

            # Apply activation only to hidden layers.
            if index < len(self.layers) - 1:
                x = self.activation_functions[index](x)

            # Capture the actual resulting values.
            activations.append(
                x.detach().cpu()
            )

        return x, activations


# ============================================================
# INITIALIZE MODEL
# ============================================================

MODEL = DemoNet(
    input_size=MODEL_CONFIG["input_size"],
    hidden_sizes=MODEL_CONFIG["hidden_sizes"],
    output_size=MODEL_CONFIG["output_size"],
)

MODEL.eval()


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def safe_float(
    value: torch.Tensor | float | int,
) -> float:
    """
    Safely convert a PyTorch scalar or number to float.
    """

    if isinstance(value, torch.Tensor):
        return float(value.item())

    return float(value)


# ============================================================
# CREATE MODEL METADATA
# ============================================================

def create_model_metadata(
    activations: list[torch.Tensor],
) -> tuple[
    list[dict[str, Any]],
    list[dict[str, Any]],
]:
    """
    Converts the actual model activations into frontend data.

    Every neuron receives a global ID.

    Example:

        Layer 0:
            neurons 0-3

        Layer 1:
            neurons 4-11

        Layer 2:
            neurons 12-17

        Layer 3:
            neurons 18-20
    """

    layers: list[dict[str, Any]] = []
    neurons: list[dict[str, Any]] = []

    neuron_id_offset = 0

    for layer_index, activation_tensor in enumerate(
        activations
    ):
        values = activation_tensor.flatten()

        neuron_ids: list[int] = []

        for neuron_index, value in enumerate(values):

            neuron_id = (
                neuron_id_offset + neuron_index
            )

            neuron_ids.append(neuron_id)

            neurons.append(
                {
                    "id": neuron_id,
                    "layer": layer_index,
                    "index": neuron_index,
                    "activation": safe_float(value),
                    "label": (
                        f"L{layer_index} · "
                        f"N{neuron_index}"
                    ),
                }
            )

        layers.append(
            {
                "index": layer_index,
                "size": len(values),
                "neuronIds": neuron_ids,
            }
        )

        neuron_id_offset += len(values)

    return layers, neurons


# ============================================================
# CREATE CONNECTION DATA
# ============================================================

def create_connections(
    layers: list[dict[str, Any]],
    activations: list[torch.Tensor],
) -> list[dict[str, Any]]:
    """
    Extracts real weights, biases and signal contributions
    from every PyTorch Linear layer.

    Each connection contains:

        source
        target
        weight
        bias
        signal
    """

    connections: list[dict[str, Any]] = []

    for layer_index, linear_layer in enumerate(
        MODEL.layers
    ):
        weights = (
            linear_layer.weight
            .detach()
            .cpu()
        )

        biases = (
            linear_layer.bias
            .detach()
            .cpu()
        )

        source_neurons = (
            layers[layer_index]["neuronIds"]
        )

        target_neurons = (
            layers[layer_index + 1]["neuronIds"]
        )

        source_activations = (
            activations[layer_index]
            .flatten()
        )

        for target_index, target_id in enumerate(
            target_neurons
        ):
            for source_index, source_id in enumerate(
                source_neurons
            ):

                weight = weights[
                    target_index,
                    source_index,
                ]

                bias = biases[target_index]

                source_activation = (
                    source_activations[source_index]
                )

                # Real contribution from this source neuron.
                signal = (
                    source_activation * weight
                )

                connections.append(
                    {
                        "id": (
                            f"{layer_index}-"
                            f"{source_index}-"
                            f"{target_index}"
                        ),
                        "source": source_id,
                        "target": target_id,
                        "weight": safe_float(weight),
                        "bias": safe_float(bias),
                        "signal": safe_float(signal),
                    }
                )

    return connections


# ============================================================
# CREATE COMPLETE INFERENCE SNAPSHOT
# ============================================================

def create_inference_snapshot(
    input_values: list[float],
) -> dict[str, Any]:
    """
    Runs real PyTorch inference and returns all data
    required by the React/Three.js visualization.
    """

    input_tensor = torch.tensor(
        [input_values],
        dtype=torch.float32,
    )

    with torch.no_grad():
        output, activations = MODEL(
            input_tensor
        )

    layers, neurons = create_model_metadata(
        activations
    )

    connections = create_connections(
        layers,
        activations,
    )

    return {
        "type": "inference",
        "timestamp": time.time(),

        "model": {
            "name": "DemoNet",
            "inputSize": MODEL.input_size,
            "hiddenSizes": MODEL.hidden_sizes,
            "outputSize": MODEL.output_size,
            "layers": layers,
        },

        "input": input_values,

        "neurons": neurons,

        "connections": connections,

        "output": (
            output
            .flatten()
            .tolist()
        ),
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
async def root() -> dict[str, Any]:
    return {
        "name": "Nexus Brain Neural Core",
        "status": "online",
        "version": "2.0.0",
        "services": {
            "neural_inference": "/ws/inference",
            "hand_tracking": "/ws/hand",
            "model_api": "/api/model",
        },
    }


# ============================================================
# MODEL API
# ============================================================

@app.get("/api/model")
async def get_model() -> dict[str, Any]:
    """
    Returns one real inference snapshot.
    """

    return create_inference_snapshot(
        [
            0.2,
            -0.4,
            0.8,
            0.1,
        ]
    )


# ============================================================
# NEURAL INFERENCE WEBSOCKET
# ============================================================

@app.websocket("/ws/inference")
async def inference_websocket(
    websocket: WebSocket,
) -> None:
    """
    WebSocket endpoint:

        ws://localhost:8000/ws/inference

    React can send:

        {
            "input": [0.2, -0.4, 0.8, 0.1]
        }

    The backend returns live PyTorch activations,
    weights, biases, signals and outputs.
    """

    await websocket.accept()

    print(
        "🧠 Frontend connected to neural network"
    )

    current_input = [
        0.2,
        -0.4,
        0.8,
        0.1,
    ]

    try:
        while True:

            # ------------------------------------------------
            # Check whether React sent new input.
            # ------------------------------------------------

            try:
                message = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=0.05,
                )

                payload = json.loads(message)

                received_input = payload.get(
                    "input",
                    current_input,
                )

                if (
                    isinstance(received_input, list)
                    and len(received_input)
                    == MODEL.input_size
                ):
                    current_input = [
                        float(value)
                        for value in received_input
                    ]

            except asyncio.TimeoutError:
                pass

            except json.JSONDecodeError:
                print(
                    "⚠️ Received invalid JSON input"
                )

            except Exception as error:
                print(
                    f"⚠️ Input processing error: {error}"
                )

            # ------------------------------------------------
            # Run real PyTorch inference.
            # ------------------------------------------------

            snapshot = create_inference_snapshot(
                current_input
            )

            # ------------------------------------------------
            # Send the actual model state to React.
            # ------------------------------------------------

            await websocket.send_text(
                json.dumps(
                    snapshot,
                    separators=(",", ":"),
                )
            )

            await asyncio.sleep(0.18)

    except WebSocketDisconnect:
        print(
            "🧠 Frontend disconnected from neural network"
        )

    except Exception as error:
        print(
            f"⚠️ Neural WebSocket error: {error}"
        )