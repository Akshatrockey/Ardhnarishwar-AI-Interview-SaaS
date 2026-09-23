"""
Ardhnarishwar Enterprise SaaS - Real-Time Multi-Party WebSocket & Event Bus
Supports:
1. Candidate telemetry streaming (WPM, audio visualizer, face tracking, live transcript).
2. Live Recruiter Intercom (real-time hints and dynamic question prompt injection).
3. Proctoring Anti-Cheat alert broadcasting (tab switches, camera anomalies).
4. Super Admin global broadcasts and live platform-wide telemetry monitoring.
5. Multi-Party Video Meeting presence and signaling.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends
from typing import Dict, List, Set, Any, Optional
import json
import time
import asyncio
from datetime import datetime

router = APIRouter(tags=["Real-Time Event Bus & WebSockets"])

class RealtimeConnectionManager:
    def __init__(self):
        # Map client_id -> WebSocket
        self.active_connections: Dict[str, WebSocket] = {}
        # Map client_id -> metadata
        self.client_metadata: Dict[str, Dict[str, Any]] = {}
        # Map room_id -> Set of client_ids
        self.rooms: Dict[str, Set[str]] = {
            "global_broadcast": set()
        }
        # Map role -> Set of client_ids
        self.role_groups: Dict[str, Set[str]] = {
            "SUPER_ADMIN": set(),
            "COMPANY_ADMIN": set(),
            "RECRUITER": set(),
            "EMPLOYEE": set(),
            "CANDIDATE": set()
        }
        self.total_messages_routed: int = 0
        self.start_time: float = time.time()

    async def connect(
        self,
        websocket: WebSocket,
        client_id: str,
        client_type: str,
        company_id: Optional[str] = None,
        session_id: Optional[str] = None
    ):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        
        normalized_role = client_type.upper()
        if normalized_role not in self.role_groups:
            self.role_groups[normalized_role] = set()
        self.role_groups[normalized_role].add(client_id)
        
        # Store metadata
        self.client_metadata[client_id] = {
            "client_id": client_id,
            "role": normalized_role,
            "company_id": company_id or "global",
            "session_id": session_id,
            "connected_at": time.time()
        }

        # Join global room
        self.rooms["global_broadcast"].add(client_id)

        # Join company tenant room
        if company_id:
            tenant_room = f"tenant_{company_id}"
            if tenant_room not in self.rooms:
                self.rooms[tenant_room] = set()
            self.rooms[tenant_room].add(client_id)

        # Join interview session room
        if session_id:
            session_room = f"interview_{session_id}"
            if session_room not in self.rooms:
                self.rooms[session_room] = set()
            self.rooms[session_room].add(client_id)

        # Broadcast updated presence
        await self.broadcast_presence()

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        
        meta = self.client_metadata.pop(client_id, None)
        if meta:
            role = meta.get("role", "")
            if role in self.role_groups and client_id in self.role_groups[role]:
                self.role_groups[role].remove(client_id)
            
            # Remove from rooms
            for room in list(self.rooms.keys()):
                if client_id in self.rooms[room]:
                    self.rooms[room].remove(client_id)
                    if not self.rooms[room] and room != "global_broadcast":
                        del self.rooms[room]

    async def broadcast_to_room(self, room_id: str, message: dict, exclude_client_id: Optional[str] = None):
        self.total_messages_routed += 1
        if room_id in self.rooms:
            target_ids = list(self.rooms[room_id])
            for cid in target_ids:
                if exclude_client_id and cid == exclude_client_id:
                    continue
                ws = self.active_connections.get(cid)
                if ws:
                    try:
                        await ws.send_text(json.dumps(message))
                    except Exception:
                        pass

    async def broadcast_to_role(self, role: str, message: dict):
        self.total_messages_routed += 1
        target_ids = list(self.role_groups.get(role.upper(), set()))
        for cid in target_ids:
            ws = self.active_connections.get(cid)
            if ws:
                try:
                    await ws.send_text(json.dumps(message))
                except Exception:
                    pass

    async def send_to_client(self, client_id: str, message: dict):
        self.total_messages_routed += 1
        ws = self.active_connections.get(client_id)
        if ws:
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                pass

    async def broadcast_all(self, message: dict):
        self.total_messages_routed += 1
        payload = json.dumps(message)
        for cid, ws in list(self.active_connections.items()):
            try:
                await ws.send_text(payload)
            except Exception:
                pass

    async def broadcast_presence(self):
        presence_data = {
            "type": "PRESENCE_SYNC",
            "timestamp": time.time(),
            "payload": {
                "total_connected": len(self.active_connections),
                "super_admins": len(self.role_groups.get("SUPER_ADMIN", set())),
                "company_admins": len(self.role_groups.get("COMPANY_ADMIN", set())),
                "recruiters": len(self.role_groups.get("RECRUITER", set())),
                "employees": len(self.role_groups.get("EMPLOYEE", set())),
                "candidates": len(self.role_groups.get("CANDIDATE", set())),
                "active_rooms": len(self.rooms)
            }
        }
        await self.broadcast_all(presence_data)

    def get_stats(self) -> dict:
        return {
            "status": "ONLINE",
            "total_connected_clients": len(self.active_connections),
            "role_breakdown": {r: len(c) for r, c in self.role_groups.items()},
            "active_rooms_count": len(self.rooms),
            "active_rooms_list": list(self.rooms.keys()),
            "total_messages_routed": self.total_messages_routed,
            "uptime_seconds": round(time.time() - self.start_time, 1),
            "engine": "FastAPI Native Asynchronous WebSocket Bus",
            "timestamp": time.time()
        }

manager = RealtimeConnectionManager()


@router.websocket("/ws/realtime/{client_type}/{client_id}")
async def websocket_realtime_endpoint(
    websocket: WebSocket,
    client_type: str,
    client_id: str,
    company_id: Optional[str] = None,
    session_id: Optional[str] = None
):
    await manager.connect(websocket, client_id, client_type, company_id, session_id)
    try:
        while True:
            data_text = await websocket.receive_text()
            try:
                msg = json.loads(data_text)
                msg_type = msg.get("type", "UNKNOWN")
                target_room = msg.get("targetRoom")
                payload = msg.get("payload", {})
                
                # Tag message with routing timestamp
                msg["server_timestamp"] = time.time()

                if msg_type == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG", "timestamp": time.time()}))
                    continue

                elif msg_type == "INTERVIEW_TELEMETRY":
                    # Broadcast telemetry to session room, company room, and super admins
                    sess_id = payload.get("sessionId")
                    if sess_id:
                        await manager.broadcast_to_room(f"interview_{sess_id}", msg, exclude_client_id=client_id)
                    comp_id = payload.get("companyId")
                    if comp_id:
                        await manager.broadcast_to_room(f"tenant_{comp_id}", msg, exclude_client_id=client_id)
                    # Forward to all Super Admins
                    await manager.broadcast_to_role("SUPER_ADMIN", msg)

                elif msg_type == "PROCTORING_FLAG":
                    # Instant anti-cheat broadcast to recruiters & super admins
                    comp_id = payload.get("companyId")
                    if comp_id:
                        await manager.broadcast_to_room(f"tenant_{comp_id}", msg)
                    await manager.broadcast_to_role("SUPER_ADMIN", msg)

                elif msg_type == "RECRUITER_INTERCOM":
                    # Recruiter injects hint/question directly into candidate's session
                    sess_id = payload.get("sessionId")
                    if sess_id:
                        await manager.broadcast_to_room(f"interview_{sess_id}", msg)
                    # Also notify Super Admins for audit
                    await manager.broadcast_to_role("SUPER_ADMIN", msg)

                elif msg_type == "SUPER_ADMIN_BROADCAST":
                    # Platform-wide broadcast to all connected clients
                    await manager.broadcast_all(msg)

                elif msg_type == "PANEL_CHAT":
                    # In-room chat or private panel whisper
                    room = target_room or (f"interview_{payload.get('roomId')}" if payload.get('roomId') else "global_broadcast")
                    is_private = payload.get("isPrivatePanelOnly", False)
                    if is_private:
                        # Whisper only to panel members (exclude candidates)
                        for cid, meta in list(manager.client_metadata.items()):
                            if meta.get("role") in ("SUPER_ADMIN", "COMPANY_ADMIN", "RECRUITER", "EMPLOYEE"):
                                await manager.send_to_client(cid, msg)
                    else:
                        await manager.broadcast_to_room(room, msg, exclude_client_id=client_id)

                elif msg_type == "LIVE_SCORE_CONSENSUS":
                    # Synchronized live scorecard ratings across all panel interviewers
                    room = target_room or (f"interview_{payload.get('sessionId')}" if payload.get('sessionId') else "global_broadcast")
                    await manager.broadcast_to_room(room, msg)
                    await manager.broadcast_to_role("SUPER_ADMIN", msg)

                elif msg_type == "VIDEO_MEETING_SIGNAL":
                    # Target specific room or broadcast
                    if target_room:
                        await manager.broadcast_to_room(target_room, msg, exclude_client_id=client_id)
                    else:
                        await manager.broadcast_all(msg)

                else:
                    if target_room:
                        await manager.broadcast_to_room(target_room, msg, exclude_client_id=client_id)
                    else:
                        await manager.broadcast_all(msg)

            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(client_id)
        await manager.broadcast_presence()
    except Exception:
        manager.disconnect(client_id)
        await manager.broadcast_presence()


@router.websocket("/ws/interview/{session_id}")
async def websocket_interview_room(websocket: WebSocket, session_id: str, client_id: str = "guest"):
    await manager.connect(websocket, client_id, "CANDIDATE", session_id=session_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                await manager.broadcast_to_room(f"interview_{session_id}", msg, exclude_client_id=client_id)
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception:
        manager.disconnect(client_id)


@router.get("/api/v1/realtime/stats")
async def get_realtime_network_stats():
    """
    Returns real-time network matrix, active peer connections, and WebSocket bus metrics.
    """
    return manager.get_stats()


@router.post("/api/v1/realtime/broadcast")
async def send_system_broadcast(data: dict):
    """
    HTTP trigger for Super Admins to broadcast an emergency announcement or maintenance alert.
    """
    broadcast_msg = {
        "type": "SUPER_ADMIN_BROADCAST",
        "senderId": data.get("senderId", "usr_super_admin"),
        "senderRole": "SUPER_ADMIN",
        "payload": {
            "id": f"bcast_{int(time.time())}",
            "title": data.get("title", "Platform Announcement"),
            "message": data.get("message", ""),
            "severity": data.get("severity", "INFO"),
            "timestamp": datetime.utcnow().isoformat()
        },
        "timestamp": time.time()
    }
    await manager.broadcast_all(broadcast_msg)
    return {"status": "SUCCESS", "routed_to_clients": len(manager.active_connections)}
