from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import MessageDB, UserDB, MessageCreate, Message
from routes.auth import get_current_user

router = APIRouter(prefix="/chat", tags=["chat"])

@router.get("/contacts")
def get_contacts(current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(UserDB).filter(UserDB.id != current_user.id, UserDB.status == "Active")
    if current_user.school_id is not None:
        query = query.filter(UserDB.school_id == current_user.school_id)
    contacts = query.all()
    result = [{"id": u.id, "name": u.name, "role": u.role, "online": True} for u in contacts]
    
    # Add group chat for Admins and Super Admins
    if current_user.role in ["Admin", "Super Admin"]:
        group_query = db.query(UserDB).filter(
            UserDB.status == "Active",
            UserDB.role.in_(["Admin", "Super Admin", "Teacher"])
        )
        if current_user.school_id is not None:
            group_query = group_query.filter(UserDB.school_id == current_user.school_id)
        group_members = group_query.all()
        member_names = [u.name for u in group_members]
        result.insert(0, {
            "id": 0,
            "name": "Staff Group",
            "role": f"{len(member_names)} members",
            "online": True,
            "is_group": True
        })
    
    return result

@router.get("/messages/{contact_id}", response_model=List[Message])
def get_messages(contact_id: int, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    if contact_id == 0:
        # Group messages
        query = db.query(MessageDB).filter(MessageDB.is_group == True)
        if current_user.school_id is not None:
            query = query.filter(MessageDB.school_id == current_user.school_id)
        messages = query.order_by(MessageDB.timestamp.asc()).all()
        return messages
    else:
        # Direct messages
        query = db.query(MessageDB).filter(
            ((MessageDB.sender_id == current_user.id) & (MessageDB.receiver_id == contact_id)) |
            ((MessageDB.sender_id == contact_id) & (MessageDB.receiver_id == current_user.id))
        )
        if current_user.school_id is not None:
            query = query.filter(MessageDB.school_id == current_user.school_id)
        messages = query.order_by(MessageDB.timestamp.asc()).all()
        return messages

@router.post("/send", response_model=Message)
def send_message(msg: MessageCreate, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    # Group message
    if msg.receiver_id == 0 and current_user.role in ["Admin", "Super Admin"]:
        db_msg = MessageDB(
            sender_id=current_user.id,
            receiver_id=0,
            content=msg.content,
            is_group=True,
            school_id=current_user.school_id or 1
        )
    else:
        db_msg = MessageDB(
            sender_id=current_user.id,
            receiver_id=msg.receiver_id,
            content=msg.content,
            school_id=current_user.school_id or 1
        )
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)
    return db_msg
