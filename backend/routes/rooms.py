import os
import uuid
import json
import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from database import get_db
from models import VideoRoomDB, VideoRoomCreate, VideoRoomResponse
from routes.auth import get_current_user, require_admin_or_super
from models import UserDB

router = APIRouter(prefix="/rooms", tags=["rooms"])

# In-memory storage for active WebSocket connections and signaling
# Structure: { room_code: { "connections": { user_id: websocket }, "participants": [{ user_id, name, role, joined_at }] } }
active_rooms: dict = {}

@router.get("/", response_model=list)
def get_rooms(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    query = db.query(VideoRoomDB)
    if current_user.role == "Teacher":
        query = query.filter(VideoRoomDB.teacher_id == current_user.id)
    rooms = query.order_by(VideoRoomDB.created_at.desc()).all()
    result = []
    for r in rooms:
        room_data = {
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "teacher_id": r.teacher_id,
            "teacher_name": r.teacher_name,
            "subject": r.subject,
            "room_code": r.room_code,
            "max_participants": r.max_participants,
            "status": r.status,
            "scheduled_at": r.scheduled_at.isoformat() if r.scheduled_at else None,
            "created_at": r.created_at.isoformat(),
            "ended_at": r.ended_at.isoformat() if r.ended_at else None,
            "participant_count": len(active_rooms.get(r.room_code, {}).get("participants", [])) if r.status == "active" else 0
        }
        result.append(room_data)
    return result

@router.post("/", response_model=VideoRoomResponse)
def create_room(
    data: VideoRoomCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role not in ["Teacher", "Admin", "Super Admin"]:
        raise HTTPException(status_code=403, detail="Only teachers and admins can create rooms")

    room_code = str(uuid.uuid4())[:8].upper()

    db_room = VideoRoomDB(
        title=data.title,
        description=data.description,
        teacher_id=current_user.id,
        teacher_name=current_user.name,
        subject=data.subject,
        room_code=room_code,
        max_participants=data.max_participants,
        status="scheduled",
        scheduled_at=data.scheduled_at
    )
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

@router.post("/{room_id}/start")
def start_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    room = db.query(VideoRoomDB).filter(VideoRoomDB.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room.teacher_id != current_user.id and current_user.role not in ["Admin", "Super Admin"]:
        raise HTTPException(status_code=403, detail="Only the teacher or admin can start this room")

    room.status = "active"
    active_rooms[room.room_code] = {"connections": {}, "participants": []}
    db.commit()
    return {"message": "Room started", "room_code": room.room_code}

@router.post("/{room_id}/end")
def end_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    room = db.query(VideoRoomDB).filter(VideoRoomDB.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room.teacher_id != current_user.id and current_user.role not in ["Admin", "Super Admin"]:
        raise HTTPException(status_code=403, detail="Only the teacher or admin can end this room")

    room.status = "ended"
    room.ended_at = datetime.datetime.utcnow()
    if room.room_code in active_rooms:
        # Notify all participants
        for ws in active_rooms[room.room_code]["connections"].values():
            try:
                import asyncio
                asyncio.create_task(ws.send_json({"type": "room_ended", "message": "Room has been ended by the teacher"}))
            except:
                pass
        del active_rooms[room.room_code]
    db.commit()
    return {"message": "Room ended"}

@router.delete("/{room_id}")
def delete_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_super)
):
    room = db.query(VideoRoomDB).filter(VideoRoomDB.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room.room_code in active_rooms:
        del active_rooms[room.room_code]
    db.delete(room)
    db.commit()
    return {"message": "Room deleted"}

@router.get("/{room_id}")
def get_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    room = db.query(VideoRoomDB).filter(VideoRoomDB.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    participants = active_rooms.get(room.room_code, {}).get("participants", [])
    return {
        "id": room.id,
        "title": room.title,
        "description": room.description,
        "teacher_id": room.teacher_id,
        "teacher_name": room.teacher_name,
        "subject": room.subject,
        "room_code": room.room_code,
        "max_participants": room.max_participants,
        "status": room.status,
        "scheduled_at": room.scheduled_at.isoformat() if room.scheduled_at else None,
        "created_at": room.created_at.isoformat(),
        "ended_at": room.ended_at.isoformat() if room.ended_at else None,
        "participants": participants
    }

@router.post("/join-by-code")
def join_by_code(
    room_code: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    room = db.query(VideoRoomDB).filter(VideoRoomDB.room_code == room_code).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room.status != "active":
        raise HTTPException(status_code=400, detail="Room is not active")
    if len(active_rooms.get(room_code, {}).get("participants", [])) >= room.max_participants:
        raise HTTPException(status_code=400, detail="Room is full")
    return {"room": {"id": room.id, "title": room.title, "room_code": room.room_code, "teacher_name": room.teacher_name}}

# WebSocket endpoint for WebRTC signaling
@router.websocket("/ws/{room_code}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, room_code: str, user_id: str):
    await websocket.accept()

    # Find room in DB
    from database import SessionLocal
    db = SessionLocal()
    room = db.query(VideoRoomDB).filter(VideoRoomDB.room_code == room_code).first()
    if not room:
        await websocket.close(code=4004, reason="Room not found")
        db.close()
        return

    user = db.query(UserDB).filter(UserDB.id == int(user_id)).first()
    if not user:
        await websocket.close(code=4004, reason="User not found")
        db.close()
        return

    # Initialize room in memory if not exists (teacher started it)
    if room_code not in active_rooms:
        active_rooms[room_code] = {"connections": {}, "participants": []}

    # Check if room is full
    if len(active_rooms[room_code]["participants"]) >= room.max_participants:
        await websocket.send_json({"type": "error", "message": "Room is full"})
        await websocket.close(code=4003, reason="Room is full")
        db.close()
        return

    # Add participant
    participant_info = {
        "user_id": int(user_id),
        "name": user.name,
        "role": user.role,
        "is_teacher": user.id == room.teacher_id
    }
    active_rooms[room_code]["participants"].append(participant_info)
    active_rooms[room_code]["connections"][int(user_id)] = websocket

    # Notify participant
    await websocket.send_json({
        "type": "joined",
        "participant": participant_info,
        "participants": active_rooms[room_code]["participants"]
    })

    # Notify others
    for uid, ws in active_rooms[room_code]["connections"].items():
        if uid != int(user_id):
            try:
                await ws.send_json({
                    "type": "participant_joined",
                    "participant": participant_info
                })
            except:
                pass

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "offer":
                # Forward offer to target peer
                target_id = data.get("target")
                if target_id and target_id in active_rooms[room_code]["connections"]:
                    await active_rooms[room_code]["connections"][target_id].send_json({
                        "type": "offer",
                        "offer": data["offer"],
                        "sender_id": int(user_id),
                        "sender_name": user.name
                    })

            elif msg_type == "answer":
                # Forward answer to target peer
                target_id = data.get("target")
                if target_id and target_id in active_rooms[room_code]["connections"]:
                    await active_rooms[room_code]["connections"][target_id].send_json({
                        "type": "answer",
                        "answer": data["answer"],
                        "sender_id": int(user_id)
                    })

            elif msg_type == "ice_candidate":
                # Forward ICE candidate to target peer
                target_id = data.get("target")
                if target_id and target_id in active_rooms[room_code]["connections"]:
                    await active_rooms[room_code]["connections"][target_id].send_json({
                        "type": "ice_candidate",
                        "candidate": data["candidate"],
                        "sender_id": int(user_id)
                    })

            elif msg_type == "screen_share_start":
                for uid, ws in active_rooms[room_code]["connections"].items():
                    if uid != int(user_id):
                        try:
                            await ws.send_json({
                                "type": "screen_share_start",
                                "user_id": int(user_id),
                                "name": user.name
                            })
                        except:
                            pass

            elif msg_type == "screen_share_stop":
                for uid, ws in active_rooms[room_code]["connections"].items():
                    try:
                        await ws.send_json({
                            "type": "screen_share_stop",
                            "user_id": int(user_id)
                        })
                    except:
                        pass

            elif msg_type == "chat_message":
                for uid, ws in active_rooms[room_code]["connections"].items():
                    try:
                        await ws.send_json({
                            "type": "chat_message",
                            "user_id": int(user_id),
                            "name": user.name,
                            "message": data["message"],
                            "timestamp": datetime.datetime.utcnow().isoformat()
                        })
                    except:
                        pass

            elif msg_type == "mute_video":
                for uid, ws in active_rooms[room_code]["connections"].items():
                    if uid != int(user_id):
                        try:
                            await ws.send_json({
                                "type": "participant_muted_video",
                                "user_id": int(user_id),
                                "muted": True
                            })
                        except:
                            pass

            elif msg_type == "unmute_video":
                for uid, ws in active_rooms[room_code]["connections"].items():
                    if uid != int(user_id):
                        try:
                            await ws.send_json({
                                "type": "participant_muted_video",
                                "user_id": int(user_id),
                                "muted": False
                            })
                        except:
                            pass

            elif msg_type == "mute_audio":
                for uid, ws in active_rooms[room_code]["connections"].items():
                    if uid != int(user_id):
                        try:
                            await ws.send_json({
                                "type": "participant_muted_audio",
                                "user_id": int(user_id),
                                "muted": True
                            })
                        except:
                            pass

            elif msg_type == "unmute_audio":
                for uid, ws in active_rooms[room_code]["connections"].items():
                    if uid != int(user_id):
                        try:
                            await ws.send_json({
                                "type": "participant_muted_audio",
                                "user_id": int(user_id),
                                "muted": False
                            })
                        except:
                            pass

            elif msg_type == "raise_hand":
                for uid, ws in active_rooms[room_code]["connections"].items():
                    if uid != int(user_id):
                        try:
                            await ws.send_json({
                                "type": "hand_raised",
                                "user_id": int(user_id),
                                "name": user.name
                            })
                        except:
                            pass

            elif msg_type == "lower_hand":
                for uid, ws in active_rooms[room_code]["connections"].items():
                    if uid != int(user_id):
                        try:
                            await ws.send_json({
                                "type": "hand_lowered",
                                "user_id": int(user_id)
                            })
                        except:
                            pass

    except WebSocketDisconnect:
        pass
    finally:
        # Remove participant
        if room_code in active_rooms:
            connections = active_rooms[room_code]["connections"]
            participants = active_rooms[room_code]["participants"]

            if int(user_id) in connections:
                del connections[int(user_id)]

            active_rooms[room_code]["participants"] = [
                p for p in participants if p["user_id"] != int(user_id)
            ]

            # Notify others
            for uid, ws in list(connections.items()):
                try:
                    await ws.send_json({
                        "type": "participant_left",
                        "user_id": int(user_id),
                        "name": user.name
                    })
                except:
                    pass

            # If no participants left, mark room as inactive in memory
            if not connections:
                del active_rooms[room_code]

        db.close()
