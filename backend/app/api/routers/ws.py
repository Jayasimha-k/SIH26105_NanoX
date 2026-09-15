from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.websocket_manager import manager

router = APIRouter(tags=["Realtime WebSockets"])

@router.websocket("/ws/events")
async def websocket_events_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive & listen for client ping
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"event_type": "PONG", "status": "alive"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
