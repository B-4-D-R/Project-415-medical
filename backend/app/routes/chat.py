"""
Chat routes: manage chat sessions and messages.
All endpoints require authentication.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models import User, Chat, Message
from app.schemas import (
    ChatCreate, ChatResponse, ChatWithMessagesResponse,
    MessageCreate, MessageResponse
)
from app.dependencies import get_current_user
from app.services.triage import run_triage_model
from app.services.gemini import get_response_from_AI


router = APIRouter(prefix="/chats", tags=["chats"])


@router.get("", response_model=List[ChatResponse])
def get_user_chats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all chats for the current authenticated user.
    Returns list of chats with id, title, and timestamps.
    
    Args:
        current_user: Authenticated user (from dependency)
        db: Database session
        
    Returns:
        List of user's chats
    """
    chats = db.query(Chat).filter(Chat.user_id == current_user.id).order_by(Chat.updated_at.desc()).all()
    return chats


@router.post("", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
def create_chat(
    chat_data: ChatCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new chat session for the current user.
    
    Args:
        chat_data: Chat creation data (optional title)
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Created chat object
    """
    new_chat = Chat(
        user_id=current_user.id,
        title=chat_data.title
    )
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    return new_chat


@router.get("/{chat_id}", response_model=ChatWithMessagesResponse)
def get_chat(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific chat with all its messages.
    Only the chat owner can access it.
    
    Args:
        chat_id: ID of the chat to retrieve
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Chat object with all messages
        
    Raises:
        HTTPException: If chat not found or user doesn't own it
    """
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found"
        )
    
    # Ensure user owns this chat
    if chat.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this chat"
        )
    
    return chat


@router.post("/{chat_id}/messages", response_model=List[MessageResponse])
def create_message(
    chat_id: int,
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    if chat.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    user_message = Message(
        chat_id=chat_id,
        sender="user",
        text=message_data.message
    )
    db.add(user_message)
    db.flush()

    previous_messages = db.query(Message).filter(
        Message.chat_id == chat_id
    ).order_by(Message.timestamp.desc()).limit(7).all()

    previous_messages = list(reversed(previous_messages))

    array_messages = []
    for msg in previous_messages:
        role = "user" if msg.sender == "user" else "assistant"
        array_messages.append(f"{role}: {msg.text}")


    triage_result = run_triage_model(message_data.message, [])

    raw_medical_response = (
        f"التخصص: {triage_result.specialty}\n"
        f"الشدة: {triage_result.severity_level}\n"
        f"عاجل: {'نعم' if triage_result.urgent else 'لا'}\n"
        f"الإجابة: {triage_result.answer}\n"
        f"مستوى ثقة الإجابة: {triage_result.answer_confidence}\n"
        f"مستوى الثقة العام للناتج: {triage_result.confidence}\n"
        f"تفسير النظام: {triage_result.explanation}\n"
    )

    array_messages.append(f"ناتج_النظام_الطبي:\n{raw_medical_response}")

    final_response = get_response_from_AI(array_messages)

    assistant_message = Message(
        chat_id=chat_id,
        sender="assistant",
        text=final_response,
        raw_model_response=raw_medical_response
    )
    db.add(assistant_message)

    chat.updated_at = datetime.utcnow()
    db.commit()

    # all_messages = db.query(Message).filter(
    #     Message.chat_id == chat_id
    # ).order_by(Message.timestamp.asc()).all()

    last_message = db.query(Message).filter(
    Message.chat_id == chat_id
    ).order_by(Message.timestamp.desc()).first() 

    return [last_message] 


@router.delete("/{chat_id}", status_code=200)
def delete_chat(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a chat and all its messages.
    Only the owner of the chat can delete it.
    """
    # Get chat
    chat = db.query(Chat).filter(Chat.id == chat_id).first()

    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found"
        )
    
    # Ensure user owns chat
    if chat.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this chat"
        )
    
    # Delete messages first (if cascade not set in DB model)
    db.query(Message).filter(Message.chat_id == chat_id).delete()

    # Delete chat
    db.delete(chat)
    db.commit()

    return {"message": "Chat deleted successfully"}
