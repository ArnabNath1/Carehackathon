from fastapi import APIRouter, Depends, HTTPException, status
from models.schemas import MessageCreate, MessageResponse, ContactResponse, ContactFormRequest
from auth import get_current_active_user
from database import get_supabase
from typing import List
from datetime import datetime
from services.communication import communication_service

router = APIRouter(prefix="/api/inbox", tags=["Inbox"])

@router.post("/public/contact")
async def submit_public_contact_form(
    form_request: ContactFormRequest,
    supabase = Depends(get_supabase)
):
    """Public endpoint for contact form submission"""
    
    # 1. Ensure workspace exists
    workspace = supabase.table("workspaces").select("*").eq("id", str(form_request.workspace_id)).execute()
    if not workspace.data:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    # 2. Find or create contact
    contact_res = supabase.table("contacts").select("*").eq(
        "workspace_id", str(form_request.workspace_id)
    ).eq("email", form_request.email).execute()
    
    if contact_res.data:
        contact_id = contact_res.data[0]["id"]
    else:
        new_contact = supabase.table("contacts").insert({
            "workspace_id": str(form_request.workspace_id),
            "name": form_request.name,
            "email": form_request.email,
            "phone": form_request.phone,
            "metadata": {"source": "public_contact_form"}
        }).execute()
        contact_id = new_contact.data[0]["id"]
        
    # 3. Find or create active conversation
    conversation = supabase.table("conversations").select("*").eq(
        "workspace_id", str(form_request.workspace_id)
    ).eq("contact_id", contact_id).eq("status", "active").execute()
    
    if conversation.data:
        conversation_id = conversation.data[0]["id"]
    else:
        new_conv = supabase.table("conversations").insert({
            "workspace_id": str(form_request.workspace_id),
            "contact_id": contact_id,
            "status": "active"
        }).execute()
        conversation_id = new_conv.data[0]["id"]
        
    # 4. Create message
    supabase.table("messages").insert({
        "conversation_id": conversation_id,
        "sender_type": "customer",
        "channel": "email",
        "content": form_request.message,
        "metadata": {}
    }).execute()
    
    # 5. Update conversation last_message_at
    supabase.table("conversations").update(
        {"last_message_at": datetime.now().isoformat()}
    ).eq("id", conversation_id).execute()
    
    # 6. Create alert
    supabase.table("alerts").insert({
        "workspace_id": str(form_request.workspace_id),
        "type": "contact_message",
        "title": "New Contact Message",
        "message": f"{form_request.name} sent a message: {form_request.message[:50]}...",
        "severity": "info",
        "is_read": False
    }).execute()
    
    return {"message": "Form submitted successfully"}

@router.get("/conversations")
async def list_conversations(
    current_user: dict = Depends(get_current_active_user),
    supabase = Depends(get_supabase),
    status_filter: str = "active"
):
    """List all conversations for workspace"""
    
    result = supabase.table("conversations").select(
        "*, contacts(*)"
    ).eq("workspace_id", current_user["workspace_id"]).eq("status", status_filter).order("last_message_at", desc=True).execute()
    
    for conversation in result.data:
        unread = supabase.table("messages").select("id").eq(
            "conversation_id", conversation["id"]
        ).eq("is_read", False).eq("sender_type", "customer").execute()
        
        conversation["unread_count"] = len(unread.data)
    
    return result.data

@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: str,
    current_user: dict = Depends(get_current_active_user),
    supabase = Depends(get_supabase)
):
    """Get all messages in a conversation"""
    
    # Verify conversation belongs to workspace
    conversation = supabase.table("conversations").select("*").eq(
        "id", conversation_id
    ).eq("workspace_id", current_user["workspace_id"]).execute()
    
    if not conversation.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get messages
    messages = supabase.table("messages").select("*").eq(
        "conversation_id", conversation_id
    ).order("created_at", desc=False).execute()
    
    # Mark customer messages as read
    supabase.table("messages").update(
        {"is_read": True}
    ).eq("conversation_id", conversation_id).eq(
        "sender_type", "customer"
    ).eq("is_read", False).execute()
    
    return {
        "conversation": conversation.data[0],
        "messages": messages.data
    }

@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: str,
    content: str,
    channel: str,
    current_user: dict = Depends(get_current_active_user),
    supabase = Depends(get_supabase)
):
    """Send a message in a conversation (staff reply)"""
    
    # 1. Verify conversation and get contact info
    conversation = supabase.table("conversations").select("*, contacts(*)").eq(
        "id", conversation_id
    ).eq("workspace_id", current_user["workspace_id"]).execute()
    
    if not conversation.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # 2. Create message in DB
    message_dict = {
        "conversation_id": conversation_id,
        "sender_type": "staff",
        "sender_id": current_user["id"],
        "channel": channel,
        "content": content,
        "is_read": True,
        "metadata": {}
    }
    
    result = supabase.table("messages").insert(message_dict).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send message"
        )
    
    # 3. Update conversation last_message_at
    supabase.table("conversations").update(
        {"last_message_at": datetime.now().isoformat()}
    ).eq("id", conversation_id).execute()
    
    # 4. Trigger actual email/SMS via service
    conv_data = conversation.data[0]
    contact = conv_data.get("contacts")
    
    if contact and channel in ["email", "sms"]:
        if channel == "email" and contact.get("email"):
            await communication_service.send_email(
                to_email=contact["email"],
                subject=f"Update from {current_user.get('full_name', 'CareOps')}",
                content=content
            )
        elif channel == "sms" and contact.get("phone"):
            await communication_service.send_sms(
                to_phone=contact["phone"],
                content=content
            )
    
    return result.data[0]

@router.get("/unread-count")
async def get_unread_count(
    current_user: dict = Depends(get_current_active_user),
    supabase = Depends(get_supabase)
):
    """Get total unread message count"""
    
    # Get all conversations for workspace
    conversations = supabase.table("conversations").select("id").eq(
        "workspace_id", current_user["workspace_id"]
    ).execute()
    
    conversation_ids = [c["id"] for c in conversations.data]
    
    if not conversation_ids:
        return {"unread_count": 0}
    
    # Count unread messages
    unread = supabase.table("messages").select("id").in_(
        "conversation_id", conversation_ids
    ).eq("is_read", False).eq("sender_type", "customer").execute()
    
    return {"unread_count": len(unread.data)}

@router.patch("/conversations/{conversation_id}/archive")
async def archive_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_active_user),
    supabase = Depends(get_supabase)
):
    """Archive a conversation"""
    
    result = supabase.table("conversations").update(
        {"status": "archived"}
    ).eq("id", conversation_id).eq(
        "workspace_id", current_user["workspace_id"]
    ).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return result.data[0]
