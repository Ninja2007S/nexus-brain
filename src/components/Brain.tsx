import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  InferenceFrame,
  LiveNeuron,
} from "../types";

import {
  generateBrain,
} from "../utils/brainGenerator";

import Connections from "./Connections";
import FineDendrites from "./FineDendrites";
import NeuronGlow from "./NeuronGlow";
import Neurons from "./Neurons";
import NeuralBiology from "./NeuralBiology";
import LiveNeuralNetwork from "./LiveNeuralNetwork";

interface BrainProps {
  onStats?: (
    neuronCount: number,
    connectionCount: number,
  ) => void;

  onNeuronSelect?: (
    neuron: LiveNeuron | null,
  ) => void;

  selectedNeuronId?: number | null;
}

export default function Brain({
  onStats,
  onNeuronSelect,
  selectedNeuronId,
}: BrainProps) {
  /*
   * ============================================================
   * GENERATED BIOLOGICAL BRAIN
   * ============================================================
   */

  const brainData = useMemo(
    () => generateBrain(),
    [],
  );

  /*
   * ============================================================
   * PYTORCH LIVE FRAME
   * ============================================================
   */

  const [
    frame,
    setFrame,
  ] = useState<InferenceFrame | null>(
    null,
  );

  /*
   * ============================================================
   * WEBSOCKET
   * ============================================================
   */

  const wsRef =
    useRef<WebSocket | null>(
      null,
    );

  const reconnectTimer =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  /*
   * ============================================================
   * SEND INPUT
   * ============================================================
   */

  const sendInput =
    useCallback(
      (
        input: number[],
      ) => {
        const ws =
          wsRef.current;

        if (
          !ws ||
          ws.readyState !==
            WebSocket.OPEN
        ) {
          return;
        }

        ws.send(
          JSON.stringify({
            input,
          }),
        );
      },
      [],
    );

  /*
   * ============================================================
   * WEBSOCKET CONNECTION
   * ============================================================
   */

  useEffect(() => {
    let mounted = true;

    const connect = () => {
      if (!mounted) {
        return;
      }

      if (
        wsRef.current &&
        (
          wsRef.current.readyState ===
            WebSocket.OPEN ||
          wsRef.current.readyState ===
            WebSocket.CONNECTING
        )
      ) {
        return;
      }

      const ws =
        new WebSocket(
          "ws://localhost:8000/ws/inference",
        );

      wsRef.current =
        ws;

      ws.onopen = () => {
        if (!mounted) {
          return;
        }

        console.log(
          "🧠 Connected to PyTorch neural network",
        );

        sendInput([
          0.2,
          -0.4,
          0.8,
          0.1,
        ]);
      };

      ws.onmessage = (
        event,
      ) => {
        if (!mounted) {
          return;
        }

        try {
          const data =
            JSON.parse(
              event.data,
            ) as InferenceFrame;

          if (
            data.type !==
            "inference"
          ) {
            return;
          }

          if (
            !Array.isArray(
              data.neurons,
            )
          ) {
            return;
          }

          if (
            !Array.isArray(
              data.connections,
            )
          ) {
            return;
          }

          setFrame(data);

          onStats?.(
            data.neurons.length,
            data.connections.length,
          );
        } catch (
          error
        ) {
          console.error(
            "🧠 Failed to parse neural frame:",
            error,
          );
        }
      };

      ws.onerror = (
        error,
      ) => {
        console.error(
          "🧠 Neural WebSocket error:",
          error,
        );
      };

      ws.onclose = () => {
        if (
          wsRef.current ===
          ws
        ) {
          wsRef.current =
            null;
        }

        if (!mounted) {
          return;
        }

        console.log(
          "🧠 Neural WebSocket disconnected",
        );

        if (
          reconnectTimer.current
        ) {
          clearTimeout(
            reconnectTimer.current,
          );
        }

        reconnectTimer.current =
          setTimeout(
            connect,
            1500,
          );
      };
    };

    connect();

    return () => {
      mounted = false;

      if (
        reconnectTimer.current
      ) {
        clearTimeout(
          reconnectTimer.current,
        );

        reconnectTimer.current =
          null;
      }

      const ws =
        wsRef.current;

      wsRef.current =
        null;

      if (ws) {
        ws.close();
      }
    };
  }, [
    onStats,
    sendInput,
  ]);

  /*
   * ============================================================
   * CONTINUOUS REAL INPUT
   * ============================================================
   */

  useEffect(() => {
    const interval =
      setInterval(() => {
        const time =
          performance.now() /
          1000;

        const input = [
          Math.sin(
            time * 0.35,
          ),

          Math.cos(
            time * 0.28,
          ),

          Math.sin(
            time * 0.52,
          ),

          Math.cos(
            time * 0.18,
          ),
        ];

        sendInput(input);
      }, 250);

    return () => {
      clearInterval(
        interval,
      );
    };
  }, [sendInput]);

  /*
   * ============================================================
   * NEURON SELECT
   * ============================================================
   */

  const handleNeuronSelect =
    useCallback(
      (
        neuron: LiveNeuron,
      ) => {
        onNeuronSelect?.(
          neuron,
        );
      },
      [onNeuronSelect],
    );

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <group>
      {/*
       * ========================================================
       * PROCEDURAL BIOLOGICAL BRAIN
       * ========================================================
       */}

      <Connections
        field={
          brainData.connections
        }
        neurons={
          brainData.neurons
        }
      />

      <FineDendrites
        field={
          brainData.fineConnections
        }
        neurons={
          brainData.neurons
        }
      />

      <NeuronGlow
        field={
          brainData.neurons
        }
      />

      <Neurons
        field={
          brainData.neurons
        }
      />

      {/*
       * ========================================================
       * REAL PYTORCH NETWORK
       * ========================================================
       *
       * 4 → 8 → 6 → 3
       */}

      <LiveNeuralNetwork
        frame={frame}
        selectedNeuronId={
          selectedNeuronId
        }
        onSelectNeuron={
          handleNeuronSelect
        }
      />

      {/*
       * ========================================================
       * BIOLOGICAL ACTIVITY
       * ========================================================
       *
       * Disabled while debugging the Three.js byteLength error.
       */}

      {false && (
        <NeuralBiology
          frame={frame}
        />
      )}
    </group>
  );
}