import json
import logging
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from jose import jwt, JWTError
from app.config import settings
from app.services.websocket_manager import manager

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Realtime WebSockets"])

def authenticate_websocket_token(token: Optional[str]) -> Optional[dict]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

@router.websocket("/ws/events")
async def websocket_events_endpoint(websocket: WebSocket, token: Optional[str] = None):
    # Optional token verification for authorized event streaming
    claims = authenticate_websocket_token(token)
    username = claims.get("sub") if claims else "anonymous"

    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive & listen for client ping / inter-team messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"event_type": "PONG", "status": "alive"})
            else:
                try:
                    msg = json.loads(data)
                    if isinstance(msg, dict) and msg.get("event_type") == "INTER_TEAM_MESSAGE":
                        # Attach authenticated sender identity and broadcast
                        msg["sender"] = username
                        await manager.broadcast(msg)
                except Exception as e:
                    logger.warning(f"Malformed WebSocket message received: {e}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

