from fastapi import APIRouter, Depends, HTTPException, status
from models.schemas import (
    BookingCreate, BookingResponse,
    ContactCreate, ContactResponse,
    PublicBookingRequest
)
from auth import get_current_active_user
from database import get_supabase
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])

@router.post("/public", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_public_booking(
    request: PublicBookingRequest,
    supabase = Depends(get_supabase)
):
    """Public endpoint for customers to create bookings (no auth required)"""
    
    booking_data = request.booking_data
    contact_data = request.contact_data
    workspace_id = request.workspace_id
    
    # Verify workspace is active
    workspace = supabase.table("workspaces").select("*").eq("id", str(workspace_id)).execute()
    
    if not workspace.data or not workspace.data[0]["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workspace not available for bookings"
        )
    
    # Create or get contact
    existing_contact = None
    if contact_data.email:
        existing_contact = supabase.table("contacts").select("*").eq(
            "workspace_id", str(workspace_id)
        ).eq("email", contact_data.email).execute()
    
    if existing_contact and existing_contact.data:
        contact = existing_contact.data[0]
    else:
        # Create new contact
        contact_dict = {
            "workspace_id": str(workspace_id),
            "name": contact_data.name,
            "email": contact_data.email,
            "phone": contact_data.phone,
            "metadata": contact_data.metadata
        }
        contact_result = supabase.table("contacts").insert(contact_dict).execute()
        contact = contact_result.data[0]
        
        # Create conversation for new contact
        conversation_dict = {
            "workspace_id": str(workspace_id),
            "contact_id": contact["id"],
            "status": "active"
        }
        supabase.table("conversations").insert(conversation_dict).execute()
    
    # Create booking
    booking_dict = {
        "workspace_id": str(workspace_id),
        "contact_id": contact["id"],
        "service_type_id": str(booking_data.service_type_id),
        "scheduled_at": booking_data.scheduled_at.isoformat(),
        "status": "pending",
        "notes": booking_data.notes
    }
    
    booking_result = supabase.table("bookings").insert(booking_dict).execute()
    
    if not booking_result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create booking"
        )
    
    booking = booking_result.data[0]
    
    # TODO: Trigger automation - send confirmation, create forms
    
    return booking

@router.get("/", response_model=List[BookingResponse])
async def list_bookings(
    current_user: dict = Depends(get_current_active_user),
    supabase = Depends(get_supabase),
    status_filter: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None
):
    """List all bookings for workspace"""
    
    query = supabase.table("bookings").select(
        "*, contacts(*), service_types(*)"
    ).eq("workspace_id", current_user["workspace_id"])
    
    if status_filter:
        query = query.eq("status", status_filter)
    
    if from_date:
        query = query.gte("scheduled_at", from_date)
    
    if to_date:
        query = query.lte("scheduled_at", to_date)
    
    result = query.order("scheduled_at", desc=False).execute()
    
    return result.data

@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: str,
    current_user: dict = Depends(get_current_active_user),
    supabase = Depends(get_supabase)
):
    """Get specific booking details"""
    
    result = supabase.table("bookings").select(
        "*, contacts(*), service_types(*)"
    ).eq("id", booking_id).eq("workspace_id", current_user["workspace_id"]).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return result.data[0]

@router.patch("/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    new_status: str,
    current_user: dict = Depends(get_current_active_user),
    supabase = Depends(get_supabase)
):
    """Update booking status (staff action)"""
    
    valid_statuses = ["pending", "confirmed", "completed", "no_show", "cancelled"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    result = supabase.table("bookings").update(
        {"status": new_status}
    ).eq("id", booking_id).eq("workspace_id", current_user["workspace_id"]).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # TODO: Trigger automation based on status change
    
    return result.data[0]

@router.get("/service-types/available-slots")
async def get_available_slots(
    service_type_id: str,
    date: str,
    workspace_id: str,
    supabase = Depends(get_supabase)
):
    """Get available time slots for a service type on a specific date (public endpoint)"""
    
    # Get service type
    service = supabase.table("service_types").select("*").eq("id", service_type_id).execute()
    
    if not service.data:
        raise HTTPException(status_code=404, detail="Service type not found")
    
    # Get availability slots for this service
    target_date = datetime.fromisoformat(date)
    day_of_week = target_date.weekday()  # 0=Monday, 6=Sunday
    # Convert to our format (0=Sunday)
    day_of_week = (day_of_week + 1) % 7
    
    slots = supabase.table("availability_slots").select("*").eq(
        "service_type_id", service_type_id
    ).eq("day_of_week", day_of_week).execute()
    
    if not slots.data:
        return {"available_slots": []}
    
    # Get existing bookings for this date
    existing_bookings = supabase.table("bookings").select("*").eq(
        "service_type_id", service_type_id
    ).gte(
        "scheduled_at", f"{date}T00:00:00"
    ).lt(
        "scheduled_at", f"{date}T23:59:59"
    ).execute()
    
    booked_times = [
        datetime.fromisoformat(b["scheduled_at"].replace('Z', '+00:00')).time()
        for b in existing_bookings.data
    ]
    
    # Generate available slots
    available_slots = []
    for slot in slots.data:
        start_time = datetime.strptime(slot["start_time"], "%H:%M:%S").time()
        end_time = datetime.strptime(slot["end_time"], "%H:%M:%S").time()
        
        # Generate time slots based on service duration
        current_time = datetime.combine(target_date, start_time)
        end_datetime = datetime.combine(target_date, end_time)
        duration = timedelta(minutes=service.data[0]["duration_minutes"])
        
        while current_time + duration <= end_datetime:
            if current_time.time() not in booked_times:
                available_slots.append(current_time.isoformat())
            current_time += duration
    
    return {"available_slots": available_slots}
