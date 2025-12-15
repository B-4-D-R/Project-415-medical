"""
Pydantic schemas for request/response validation.
These models define the structure of data sent to and received from the API.
"""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List


# ========== User Schemas ==========

class UserCreate(BaseModel):
    """Schema for user registration."""
    name: str
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user data in responses."""
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True  # Allows conversion from SQLAlchemy models


# ========== Auth Schemas ==========

class Token(BaseModel):
    """Schema for JWT token response."""
    token: str
    user: UserResponse


class LoginRequest(BaseModel):
    """Schema for login request."""
    email: EmailStr
    password: str


# ========== Chat Schemas ==========

class ChatCreate(BaseModel):
    """Schema for creating a new chat."""
    title: Optional[str] = None


class ChatResponse(BaseModel):
    """Schema for chat data in responses."""
    id: int
    user_id: int
    title: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ========== Message Schemas ==========

class MessageCreate(BaseModel):
    """Schema for creating a new message."""
    message: str
    extra_info: Optional[dict] = None  # Optional fields like age, gender, etc.


class MessageResponse(BaseModel):
    """Schema for message data in responses."""
    id: int
    chat_id: int
    sender: str
    text: str
    raw_model_response: Optional[str] = None 
    timestamp: datetime

    class Config:
        from_attributes = True


class ChatWithMessagesResponse(BaseModel):
    """Schema for chat with all its messages."""
    id: int
    user_id: int
    title: Optional[str]
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse]

    class Config:
        from_attributes = True


# ========== Triage Schemas ==========

class TriageResult(BaseModel):
    """Schema for triage analysis result."""
    specialty: str  # Recommended medical specialty
    severity_level: str  # "low", "medium", or "high"
    urgent: bool  # Whether immediate attention is needed
    explanation: str  # Explanation text
    confidence: Optional[float] = 0.0  # Confidence score for the prediction (0-1)
    answer: Optional[str] = ""  # Retrieved answer from Q&A database
    answer_confidence: Optional[float] = 0.0  # Confidence score for the answer (0-1)
    disclaimer: str = "This is not a medical diagnosis. Always consult a real doctor."  # Safety disclaimer


# ========== Prescription Schemas ==========

class PrescriptionResponse(BaseModel):
    """Schema for prescription data in responses."""
    id: int
    user_id: int
    chat_id: Optional[int]
    image_path: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


# ========== Test Result Schemas ==========

class TestResultResponse(BaseModel):
    """Schema for test result data in responses."""
    id: int
    user_id: int
    chat_id: Optional[int]
    raw_text: Optional[str]
    summary_text: Optional[str]
    uploaded_at: datetime

    class Config:
        from_attributes = True


# ========== Doctor Schemas ==========

class DoctorResponse(BaseModel):
    """Schema for doctor data in responses."""
    id: int
    name: str
    specialty: str
    location_text: str
    contact_info: Optional[str]

    class Config:
        from_attributes = True


