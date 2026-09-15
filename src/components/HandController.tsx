import { useEffect, useRef } from "react";

import {
  resetHandState,
  setHandState,
} from "../utils/handControl";

import type { HandState } from "../types/hand";

const HAND_WS_URL = "ws://localhost:8000/ws/hand";

const RECONNECT_DELAY = 1500;

export default function HandController() {
  const socketRef = useRef<WebSocket | null>(null);

  const reconnectTimerRef =
    useRef<number | null>(null);

  const stoppedRef = useRef(false);

  useEffect(() => {
    stoppedRef.current = false;

    const connect = () => {
      if (stoppedRef.current) {
        return;
      }

      try {
        console.log(
          "🖐️ Connecting to MediaPipe hand tracker...",
        );

        const socket = new WebSocket(
          HAND_WS_URL,
        );

        socketRef.current = socket;

        socket.onopen = () => {
          console.log(
            "🖐️ Connected to hand tracking WebSocket",
          );
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(
              event.data,
            ) as HandState;

            if (
              !data ||
              typeof data !== "object"
            ) {
              return;
            }

            setHandState(data);
          } catch (error) {
            console.error(
              "❌ Invalid hand tracking data:",
              error,
            );
          }
        };

        socket.onerror = (error) => {
          console.warn(
            "⚠️ Hand WebSocket error",
            error,
          );
        };

        socket.onclose = () => {
          console.log(
            "🖐️ Hand WebSocket disconnected",
          );

          socketRef.current = null;

          if (stoppedRef.current) {
            return;
          }

          reconnectTimerRef.current =
            window.setTimeout(
              connect,
              RECONNECT_DELAY,
            );
        };
      } catch (error) {
        console.error(
          "❌ Could not connect to hand tracker:",
          error,
        );

        if (!stoppedRef.current) {
          reconnectTimerRef.current =
            window.setTimeout(
              connect,
              RECONNECT_DELAY,
            );
        }
      }
    };

    connect();

    return () => {
      stoppedRef.current = true;

      if (
        reconnectTimerRef.current !== null
      ) {
        window.clearTimeout(
          reconnectTimerRef.current,
        );

        reconnectTimerRef.current = null;
      }

      const socket = socketRef.current;

      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;

        if (
          socket.readyState === WebSocket.OPEN ||
          socket.readyState ===
            WebSocket.CONNECTING
        ) {
          socket.close();
        }

        socketRef.current = null;
      }

      resetHandState();
    };
  }, []);

  return null;
}