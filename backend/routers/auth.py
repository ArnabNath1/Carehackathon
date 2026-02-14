from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from models.schemas import (
    UserCreate, UserLogin, Token, UserResponse,
    WorkspaceCreate, WorkspaceResponse
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_active_user
)
from database import get_supabase
from datetime import timedelta
from config import get_settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
settings = get_settings()

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, supabase = Depends(get_supabase)):
    """Register a new user (owner creates workspace, staff joins existing)"""
    
    # Check if user already exists
    existing = supabase.table("users").select("*").eq("email", user_data.email).execute()
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Handle owner registration (create workspace if needed)
    workspace_id = user_data.workspace_id
    if user_data.role == "owner" and not workspace_id:
        if not user_data.workspace_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workspace name required for owner registration"
            )
        
        # Create workspace first (publicly during registration)
        workspace_dict = {
            "name": user_data.workspace_name,
            "address": user_data.workspace_address,
            "timezone": user_data.workspace_timezone,
            "contact_email": user_data.email,
            "is_active": False
        }
        
        ws_result = supabase.table("workspaces").insert(workspace_dict).execute()
        if not ws_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create workspace during registration"
            )
        workspace_id = ws_result.data[0]["id"]

        # AUTO-PROVISION INTEGRATIONS (using global .env keys for demo)
        if settings.MAILJET_API_KEY:
            supabase.table("integrations").insert({
                "workspace_id": workspace_id,
                "type": "email",
                "provider": "mailjet",
                "config": {"api_key": settings.MAILJET_API_KEY, "secret_key": settings.MAILJET_SECRET_KEY},
                "is_active": True
            }).execute()
        
        if settings.VONAGE_API_KEY:
            supabase.table("integrations").insert({
                "workspace_id": workspace_id,
                "type": "sms",
                "provider": "vonage",
                "config": {"api_key": settings.VONAGE_API_KEY, "secret_key": settings.VONAGE_API_SECRET},
                "is_active": True
            }).execute()
    
    # Create user
    user_dict = {
        "email": user_data.email,
        "password_hash": hashed_password,
        "full_name": user_data.full_name,
        "role": user_data.role,
        "workspace_id": str(workspace_id) if workspace_id else None,
        "permissions": {},
        "is_active": True
    }
    
    result = supabase.table("users").insert(user_dict).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
    
    user = result.data[0]
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user["id"]},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "workspace_id": user["workspace_id"],
            "is_active": user["is_active"],
            "permissions": user["permissions"],
            "created_at": user["created_at"]
        }
    }

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, supabase = Depends(get_supabase)):
    """Login user"""
    
    # Get user by email
    result = supabase.table("users").select("*").eq("email", credentials.email).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    user = result.data[0]
    
    # Verify password
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check if user is active
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive"
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user["id"]},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_active_user)):
    """Get current user information"""
    return current_user
