from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from models.schemas import (
    WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse,
    IntegrationCreate, IntegrationResponse,
    ServiceTypeCreate, ServiceTypeResponse,
    AvailabilitySlotCreate,
    FormTemplateCreate,
    InventoryItemCreate,
    VoiceOnboardingResponse
)
from auth import get_current_active_user, require_owner
from database import get_supabase
from services.voice_onboarding import voice_service
from typing import Optional
import base64
import io

router = APIRouter(prefix="/api/onboarding", tags=["Onboarding"])

# ============================================
# STEP 1: CREATE WORKSPACE
# ============================================

@router.post("/workspace", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    workspace_data: WorkspaceCreate,
    current_user: dict = Depends(require_owner),
    supabase = Depends(get_supabase)
):
    """Step 1: Create workspace"""
    
    workspace_dict = {
        "name": workspace_data.name,
        "address": workspace_data.address,
        "timezone": workspace_data.timezone,
        "contact_email": workspace_data.contact_email,
        "is_active": False  # Not active until onboarding complete
    }
    
    result = supabase.table("workspaces").insert(workspace_dict).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create workspace"
        )
    
    workspace = result.data[0]
    
    # Update user's workspace_id
    supabase.table("users").update(
        {"workspace_id": workspace["id"]}
    ).eq("id", current_user["id"]).execute()
    
    return workspace

@router.get("/workspace", response_model=WorkspaceResponse)
async def get_workspace(
    current_user: dict = Depends(get_current_active_user),
    supabase = Depends(get_supabase)
):
    """Get current user's workspace"""
    
    if not current_user.get("workspace_id"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No workspace found for this user"
        )
    
    result = supabase.table("workspaces").select("*").eq(
        "id", current_user["workspace_id"]
    ).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    return result.data[0]

@router.get("/workspace/{workspace_id}/public")
async def get_workspace_public(
    workspace_id: str,
    supabase = Depends(get_supabase)
):
    """Get public workspace details by ID"""
    
    result = supabase.table("workspaces").select("id, name, address, timezone").eq(
        "id", workspace_id
    ).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
        
    return result.data[0]

# ============================================
# STEP 2: INTEGRATIONS (EMAIL & SMS)
# ============================================

@router.post("/integrations", response_model=IntegrationResponse, status_code=status.HTTP_201_CREATED)
async def create_integration(
    integration_data: IntegrationCreate,
    current_user: dict = Depends(require_owner),
    supabase = Depends(get_supabase)
):
    """Step 2: Set up email/SMS integrations"""
    
    if not current_user.get("workspace_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Create workspace first"
        )
    
    integration_dict = {
        "workspace_id": current_user["workspace_id"],
        "type": integration_data.type,
        "provider": integration_data.provider,
        "config": integration_data.config,
        "is_active": True
    }
    
    result = supabase.table("integrations").insert(integration_dict).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create integration"
        )
    
    return result.data[0]

@router.get("/integrations")
async def list_integrations(
    current_user: dict = Depends(get_current_active_user),
    supabase = Depends(get_supabase)
):
    """List all integrations for workspace"""
    
    result = supabase.table("integrations").select("*").eq(
        "workspace_id", current_user["workspace_id"]
    ).execute()
    
    return result.data

# ============================================
# STEP 3: CREATE CONTACT FORM
# ============================================

@router.post("/contact-form", response_model=FormTemplateCreate, status_code=status.HTTP_201_CREATED)
async def create_contact_form(
    form_data: FormTemplateCreate,
    current_user: dict = Depends(require_owner),
    supabase = Depends(get_supabase)
):
    """Step 3: Create a public contact form"""
    
    form_dict = {
        "workspace_id": current_user["workspace_id"],
        "name": form_data.name,
        "description": form_data.description,
        "fields": form_data.fields,
        "is_active": True
    }
    
    result = supabase.table("form_templates").insert(form_dict).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create contact form"
        )
    
    return result.data[0]

# ============================================
# STEP 4: SERVICE TYPES & AVAILABILITY
# ============================================

@router.post("/service-types", response_model=ServiceTypeResponse, status_code=status.HTTP_201_CREATED)
async def create_service_type(
    service_data: ServiceTypeCreate,
    current_user: dict = Depends(require_owner),
    supabase = Depends(get_supabase)
):
    """Step 4: Create service type"""
    
    service_dict = {
        "workspace_id": current_user["workspace_id"],
        "name": service_data.name,
        "description": service_data.description,
        "duration_minutes": service_data.duration_minutes,
        "location": service_data.location,
        "is_active": True
    }
    
    result = supabase.table("service_types").insert(service_dict).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create service type"
        )
    
    return result.data[0]

@router.post("/availability-slots", status_code=status.HTTP_201_CREATED)
async def create_availability_slot(
    slot_data: AvailabilitySlotCreate,
    current_user: dict = Depends(require_owner),
    supabase = Depends(get_supabase)
):
    """Add availability slot for service type"""
    
    slot_dict = {
        "service_type_id": str(slot_data.service_type_id),
        "day_of_week": slot_data.day_of_week,
        "start_time": slot_data.start_time,
        "end_time": slot_data.end_time
    }
    
    result = supabase.table("availability_slots").insert(slot_dict).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create availability slot"
        )
    
    return result.data[0]

# ============================================
# STEP 5: SET UP FORMS (POST-BOOKING)
# ============================================

@router.post("/post-booking-forms", response_model=FormTemplateCreate, status_code=status.HTTP_201_CREATED)
async def create_post_booking_form(
    form_data: FormTemplateCreate,
    current_user: dict = Depends(require_owner),
    supabase = Depends(get_supabase)
):
    """Step 5: Create a post-booking form linked to a service"""
    
    if not form_data.service_type_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Service type ID is required for post-booking forms"
        )
    
    form_dict = {
        "workspace_id": current_user["workspace_id"],
        "service_type_id": str(form_data.service_type_id),
        "name": form_data.name,
        "description": form_data.description,
        "fields": form_data.fields,
        "is_active": True
    }
    
    result = supabase.table("form_templates").insert(form_dict).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create post-booking form"
        )
    
    return result.data[0]

# ============================================
# STEP 6: INVENTORY
# ============================================

@router.post("/inventory", status_code=status.HTTP_201_CREATED)
async def create_inventory_item(
    item_data: InventoryItemCreate,
    current_user: dict = Depends(require_owner),
    supabase = Depends(get_supabase)
):
    """Step 6: Create inventory item"""
    
    item_dict = {
        "workspace_id": current_user["workspace_id"],
        "name": item_data.name,
        "description": item_data.description,
        "quantity": item_data.quantity,
        "low_stock_threshold": item_data.low_stock_threshold,
        "unit": item_data.unit
    }
    
    result = supabase.table("inventory_items").insert(item_dict).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create inventory item"
        )
    
    return result.data[0]

# ============================================
# STEP 7: ADD STAFF
# ============================================

@router.post("/staff", status_code=status.HTTP_201_CREATED)
async def add_staff(
    staff_data: dict,  # Simplification for prototype
    current_user: dict = Depends(require_owner),
    supabase = Depends(get_supabase)
):
    """Step 7: Add a staff member to the workspace"""
    
    # In a real app, this would send an invite or create a user
    # For prototype, we'll just create the user directly
    from auth import get_password_hash
    
    hashed_password = get_password_hash(staff_data.get("password", "staff123"))
    
    user_dict = {
        "workspace_id": current_user["workspace_id"],
        "email": staff_data.get("email"),
        "password_hash": hashed_password,
        "full_name": staff_data.get("full_name"),
        "role": "staff",
        "permissions": staff_data.get("permissions", {})
    }
    
    result = supabase.table("users").insert(user_dict).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create staff user"
        )
    
    return result.data[0]

# ============================================
# STEP 8: ACTIVATE WORKSPACE
# ============================================

@router.post("/activate", status_code=status.HTTP_200_OK)
async def activate_workspace(
    current_user: dict = Depends(require_owner),
    supabase = Depends(get_supabase)
):
    """Step 8: Activate workspace after validation"""
    
    workspace_id = current_user["workspace_id"]
    
    # Validate requirements
    # 1. Check for at least one integration (email or SMS)
    integrations = supabase.table("integrations").select("*").eq(
        "workspace_id", workspace_id
    ).execute()
    
    if not integrations.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one communication channel (email or SMS) is required"
        )
    
    # 2. Check for at least one service type
    services = supabase.table("service_types").select("*").eq(
        "workspace_id", workspace_id
    ).execute()
    
    if not services.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one service type is required"
        )
    
    # 3. Check for availability slots
    service_ids = [s["id"] for s in services.data]
    slots = supabase.table("availability_slots").select("*").in_(
        "service_type_id", service_ids
    ).execute()
    
    if not slots.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Availability slots are required for at least one service"
        )
    
    # Activate workspace
    result = supabase.table("workspaces").update(
        {"is_active": True}
    ).eq("id", workspace_id).execute()
    
    return {"message": "Workspace activated successfully", "workspace": result.data[0]}

# ============================================
# VOICE ONBOARDING
# ============================================

@router.post("/voice/transcribe", response_model=VoiceOnboardingResponse)
async def voice_onboarding_transcribe(
    audio: UploadFile = File(...),
    step: str = Form("general"),
    current_user: dict = Depends(get_current_active_user)
):
    """Process voice input for onboarding"""
    
    try:
        # Read audio file
        audio_content = await audio.read()
        
        # Create file-like object for Groq
        file_obj = io.BytesIO(audio_content)
        file_obj.name = audio.filename or "recording.webm"
        
        # Process voice input
        result = await voice_service.process_voice_input(file_obj, step)
        
        return {
            "extracted_data": result["extracted_data"],
            "confidence": result["confidence"],
            "next_step": f"Review and confirm {step} details"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Voice processing failed: {str(e)}"
        )

@router.get("/status")
async def get_onboarding_status(
    current_user: dict = Depends(get_current_active_user),
    supabase = Depends(get_supabase)
):
    """Get onboarding completion status"""
    
    workspace_id = current_user.get("workspace_id")
    
    if not workspace_id:
        return {
            "completed": False,
            "current_step": 1,
            "steps": {
                "workspace_created": False,
                "integrations_configured": False,
                "contact_form_created": False,
                "service_types_created": False,
                "post_booking_forms_created": False,
                "inventory_set": False,
                "staff_invited": False,
                "workspace_active": False
            }
        }
    
    # Check each step
    workspace = supabase.table("workspaces").select("*").eq("id", workspace_id).execute()
    integrations = supabase.table("integrations").select("*").eq("workspace_id", workspace_id).execute()
    
    # Contact form (Step 3) - form template with no service_type_id
    contact_forms = supabase.table("form_templates").select("*").eq("workspace_id", workspace_id).is_("service_type_id", "null").execute()
    
    services = supabase.table("service_types").select("*").eq("workspace_id", workspace_id).execute()
    
    # Post-booking forms (Step 5) - form template WITH service_type_id
    post_booking_forms = supabase.table("form_templates").select("*").eq("workspace_id", workspace_id).not_.is_("service_type_id", "null").execute()
    
    inventory = supabase.table("inventory_items").select("*").eq("workspace_id", workspace_id).execute()
    
    staff = supabase.table("users").select("*").eq("workspace_id", workspace_id).eq("role", "staff").execute()
    
    steps = {
        "workspace_created": bool(workspace.data),
        "integrations_configured": bool(integrations.data),
        "contact_form_created": bool(contact_forms.data),
        "service_types_created": bool(services.data),
        "post_booking_forms_created": bool(post_booking_forms.data),
        "inventory_set": bool(inventory.data),
        "staff_invited": bool(staff.data),
        "workspace_active": workspace.data[0]["is_active"] if workspace.data else False
    }
    
    completed_count = sum(steps.values())
    
    return {
        "completed": steps["workspace_active"],
        "current_step": completed_count + 1,
        "steps": steps,
        "progress_percentage": (completed_count / 8) * 100
    }
