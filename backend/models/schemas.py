from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID

# ============================================
# WORKSPACE MODELS
# ============================================

class WorkspaceCreate(BaseModel):
    name: str
    address: Optional[str] = None
    timezone: str = "UTC"
    contact_email: EmailStr

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    timezone: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    is_active: Optional[bool] = None

class WorkspaceResponse(BaseModel):
    id: UUID
    name: str
    address: Optional[str]
    timezone: str
    contact_email: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

# ============================================
# USER MODELS
# ============================================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = Field(..., pattern="^(owner|staff)$")
    workspace_id: Optional[UUID] = None
    workspace_name: Optional[str] = None
    workspace_address: Optional[str] = None
    workspace_timezone: Optional[str] = "UTC"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: UUID
    workspace_id: Optional[UUID]
    email: str
    full_name: str
    role: str
    permissions: Dict[str, Any]
    is_active: bool
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# ============================================
# CONTACT MODELS
# ============================================

class ContactCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    metadata: Dict[str, Any] = {}

class ContactResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    name: str
    email: Optional[str]
    phone: Optional[str]
    metadata: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

# ============================================
# MESSAGE MODELS
# ============================================

class MessageCreate(BaseModel):
    conversation_id: UUID
    sender_type: str = Field(..., pattern="^(system|staff|customer)$")
    sender_id: Optional[UUID] = None
    channel: str = Field(..., pattern="^(email|sms|internal)$")
    content: str
    metadata: Dict[str, Any] = {}

class MessageResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    sender_type: str
    sender_id: Optional[UUID]
    channel: str
    content: str
    metadata: Dict[str, Any]
    is_read: bool
    created_at: datetime

# ============================================
# BOOKING MODELS
# ============================================

class ServiceTypeCreate(BaseModel):
    name: str
    description: Optional[str] = None
    duration_minutes: int
    location: Optional[str] = None

class ServiceTypeResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    name: str
    description: Optional[str]
    duration_minutes: int
    location: Optional[str]
    is_active: bool
    created_at: datetime

class AvailabilitySlotCreate(BaseModel):
    service_type_id: UUID
    day_of_week: int = Field(..., ge=0, le=6)
    start_time: str
    end_time: str

class BookingCreate(BaseModel):
    contact_id: Optional[UUID] = None
    service_type_id: UUID
    scheduled_at: datetime
    notes: Optional[str] = None

class PublicBookingRequest(BaseModel):
    booking_data: BookingCreate
    contact_data: ContactCreate
    workspace_id: UUID

class ContactFormRequest(BaseModel):
    workspace_id: UUID
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str

class BookingResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    contact_id: UUID
    service_type_id: UUID
    scheduled_at: datetime
    status: str
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

# ============================================
# FORM MODELS
# ============================================

class FormTemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    service_type_id: Optional[UUID] = None
    fields: List[Dict[str, Any]]
    file_url: Optional[str] = None

class FormSubmissionCreate(BaseModel):
    form_template_id: UUID
    booking_id: UUID
    contact_id: UUID
    data: Dict[str, Any] = {}

class FormSubmissionResponse(BaseModel):
    id: UUID
    form_template_id: UUID
    booking_id: UUID
    contact_id: UUID
    status: str
    data: Dict[str, Any]
    submitted_at: Optional[datetime]
    created_at: datetime

# ============================================
# INVENTORY MODELS
# ============================================

class InventoryItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    quantity: int = 0
    low_stock_threshold: int = 10
    unit: Optional[str] = None

class InventoryItemResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    name: str
    description: Optional[str]
    quantity: int
    low_stock_threshold: int
    unit: Optional[str]
    created_at: datetime
    updated_at: datetime

# ============================================
# ALERT MODELS
# ============================================

class AlertCreate(BaseModel):
    type: str
    severity: str = Field(default="info", pattern="^(info|warning|critical)$")
    title: str
    message: str
    link_to: Optional[str] = None

class AlertResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    type: str
    severity: str
    title: str
    message: str
    link_to: Optional[str]
    is_read: bool
    created_at: datetime

# ============================================
# INTEGRATION MODELS
# ============================================

class IntegrationCreate(BaseModel):
    type: str = Field(..., pattern="^(email|sms|calendar|webhook|storage)$")
    provider: str
    config: Dict[str, Any]

class IntegrationResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    type: str
    provider: str
    config: Dict[str, Any]
    is_active: bool
    created_at: datetime

# ============================================
# VOICE ONBOARDING MODELS
# ============================================

class VoiceOnboardingRequest(BaseModel):
    audio_data: str  # Base64 encoded audio
    workspace_id: Optional[UUID] = None

class VoiceOnboardingResponse(BaseModel):
    extracted_data: Dict[str, Any]
    confidence: float
    next_step: str
