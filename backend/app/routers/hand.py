from __future__ import annotations

import asyncio
import json
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.hand_tracker_instance import hand_tracker


router = APIRouter()


@router.websocket("/ws/hand")
async def hand_websocket(websocket: WebSocket) -> None:
    await websocket.accept()

    print("🖐️ Hand WebSocket client connected")

    try:
        while True:
            state: dict[str, Any] = hand_tracker.get_state()

            await websocket.send_text(
                json.dumps(
                    state,
                    separators=(",", ":"),
                )
            )

            await asyncio.sleep(1 / 30)

    except WebSocketDisconnect:
        print("🖐️ Hand WebSocket client disconnected")

    except Exception as error:
        print(f"⚠️ Hand WebSocket error: {error}")

    finally:
        print("🔌 Hand WebSocket connection closed")