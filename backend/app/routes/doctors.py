"""
Doctor routes: get doctor recommendations based on specialty.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Doctor
from app.schemas import DoctorResponse

router = APIRouter(prefix="/doctors", tags=["doctors"])


@router.get("", response_model=List[DoctorResponse])
def get_doctors(
    specialty: Optional[str] = Query(None, description="Filter doctors by specialty"),
    db: Session = Depends(get_db)
):
    """
    Get list of doctors, optionally filtered by specialty.
    
    Args:
        specialty: Optional specialty filter (e.g., "cardiology", "general")
        db: Database session
        
    Returns:
        List of doctors matching the criteria
    """
    query = db.query(Doctor)
    
    if specialty:
        # Case-insensitive search
        query = query.filter(Doctor.specialty.ilike(f"%{specialty}%"))
    
    doctors = query.limit(20).all()  # Limit to 20 results
    return doctors











