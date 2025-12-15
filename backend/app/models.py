"""
Database models (SQLAlchemy ORM).
These classes represent tables in the database.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class User(Base):
    """
    User table - stores user account information.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships - allows easy access to related data
    chats = relationship("Chat", back_populates="user", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="user", cascade="all, delete-orphan")
    test_results = relationship("TestResult", back_populates="user", cascade="all, delete-orphan")


class Chat(Base):
    """
    Chat table - stores chat sessions/conversations.
    Each chat belongs to a user and contains multiple messages.
    """
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=True)  # Optional chat title
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="chats")
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan", order_by="Message.timestamp")


class Message(Base):
    """
    Message table - stores individual messages in a chat.
    Each message has a sender type: "user" or "assistant".
    """
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id"), nullable=False)
    sender = Column(String, nullable=False)  # "user" or "assistant"
    text = Column(Text, nullable=False)
    raw_model_response = Column(Text, nullable=True) 
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    chat = relationship("Chat", back_populates="messages")


class Prescription(Base):
    """
    Prescription table - stores uploaded prescription images.
    Linked to a user and optionally to a chat.
    """
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    chat_id = Column(Integer, ForeignKey("chats.id"), nullable=True)  # Optional link to chat
    image_path = Column(String, nullable=False)  # Path to stored image file
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="prescriptions")
    chat = relationship("Chat")


class TestResult(Base):
    """
    TestResult table - stores uploaded test results (text or file info).
    Contains raw content and an AI-generated summary.
    """
    __tablename__ = "test_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    chat_id = Column(Integer, ForeignKey("chats.id"), nullable=True)  # Optional link to chat
    raw_text = Column(Text, nullable=True)  # Raw text content or file path
    summary_text = Column(Text, nullable=True)  # AI-generated summary (placeholder for now)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="test_results")
    chat = relationship("Chat")


class Doctor(Base):
    """
    Doctor table - stores mock doctor data for recommendations.
    In a real system, this would be populated from a real database.
    """
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    specialty = Column(String, nullable=False, index=True)  # e.g., "cardiology", "pediatrics"
    location_text = Column(String, nullable=False)  # e.g., "Downtown Medical Center"
    contact_info = Column(String, nullable=True)  # Phone or email


