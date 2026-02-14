from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_active_user
from database import get_supabase
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
from groq import Groq
from config import get_settings

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/overview")
async def get_dashboard_overview(
    target_date: str = None,
    current_user: dict = Depends(get_current_active_user),
    supabase = Depends(get_supabase)
) -> Dict[str, Any]:
    """Get complete dashboard overview for business owner"""
    
    workspace_id = current_user["workspace_id"]
    
    if target_date:
        try:
            today = datetime.fromisoformat(target_date).date()
        except ValueError:
            today = datetime.now().date()
    else:
        today = datetime.now().date()
    
    # ============================================
    # 1. BOOKING OVERVIEW
    # ============================================
    
    # Today's bookings
    today_bookings = supabase.table("bookings").select("*, contacts(*), service_types(*)").eq(
        "workspace_id", workspace_id
    ).gte(
        "scheduled_at", f"{today}T00:00:00"
    ).lt(
        "scheduled_at", f"{today}T23:59:59"
    ).execute()
    
    # Upcoming bookings (next 7 days)
    next_week = today + timedelta(days=7)
    upcoming_bookings = supabase.table("bookings").select("*, contacts(*), service_types(*)").eq(
        "workspace_id", workspace_id
    ).gte(
        "scheduled_at", f"{today}T00:00:00"
    ).lt(
        "scheduled_at", f"{next_week}T23:59:59"
    ).execute()
    
    # Booking stats
    completed_bookings = [b for b in today_bookings.data if b["status"] == "completed"]
    no_show_bookings = [b for b in today_bookings.data if b["status"] == "no_show"]
    
    booking_overview = {
        "today_count": len(today_bookings.data),
        "upcoming_count": len(upcoming_bookings.data),
        "completed_today": len(completed_bookings),
        "no_show_today": len(no_show_bookings),
        "today_bookings": today_bookings.data[:5]  # First 5 for preview
    }
    
    # ============================================
    # 2. LEADS & CONVERSATIONS
    # ============================================
    
    # Get all conversations
    conversations = supabase.table("conversations").select(
        "*, contacts(*)"
    ).eq("workspace_id", workspace_id).execute()
    
    # New inquiries (last 24 hours) - using UTC to match database
    yesterday = datetime.now(timezone.utc) - timedelta(days=1)
    new_conversations = [
        c for c in conversations.data 
        if datetime.fromisoformat(c["created_at"].replace('Z', '+00:00')) > yesterday
    ]
    
    # Get unread messages count
    conversation_ids = [c["id"] for c in conversations.data]
    if conversation_ids:
        unread_messages = supabase.table("messages").select("*").in_(
            "conversation_id", conversation_ids
        ).eq("is_read", False).eq("sender_type", "customer").execute()
    else:
        unread_messages = type('obj', (object,), {'data': []})()
    
    leads_overview = {
        "total_conversations": len(conversations.data),
        "new_inquiries_24h": len(new_conversations),
        "unread_messages": len(unread_messages.data),
        "active_conversations": len([c for c in conversations.data if c["status"] == "active"])
    }
    
    # ============================================
    # 3. FORMS STATUS
    # ============================================
    
    # Get all form submissions
    form_submissions = supabase.table("form_submissions").select(
        "*, form_templates(*), contacts(*)"
    ).eq("form_templates.workspace_id", workspace_id).execute()
    
    pending_forms = [f for f in form_submissions.data if f["status"] == "pending"]
    overdue_forms = [f for f in form_submissions.data if f["status"] == "overdue"]
    completed_forms = [f for f in form_submissions.data if f["status"] == "completed"]
    
    forms_overview = {
        "pending_count": len(pending_forms),
        "overdue_count": len(overdue_forms),
        "completed_count": len(completed_forms),
        "pending_forms": pending_forms[:5]  # First 5 for preview
    }
    
    # ============================================
    # 4. INVENTORY ALERTS
    # ============================================
    
    # Get low stock items
    inventory_items = supabase.table("inventory_items").select("*").eq(
        "workspace_id", workspace_id
    ).execute()
    
    low_stock_items = [
        item for item in inventory_items.data 
        if item["quantity"] <= item["low_stock_threshold"]
    ]
    
    critical_items = [
        item for item in low_stock_items 
        if item["quantity"] <= (item["low_stock_threshold"] * 0.5)
    ]
    
    inventory_overview = {
        "low_stock_count": len(low_stock_items),
        "critical_count": len(critical_items),
        "low_stock_items": low_stock_items
    }
    
    # ============================================
    # 5. KEY ALERTS
    # ============================================
    
    # Get unread alerts
    alerts = supabase.table("alerts").select("*").eq(
        "workspace_id", workspace_id
    ).eq("is_read", False).order("created_at", desc=True).limit(10).execute()
    
    critical_alerts = [a for a in alerts.data if a["severity"] == "critical"]
    
    alerts_overview = {
        "total_unread": len(alerts.data),
        "critical_count": len(critical_alerts),
        "recent_alerts": alerts.data
    }
    
    # ============================================
    # COMBINED DASHBOARD
    # ============================================
    
    return {
        "workspace_id": workspace_id,
        "timestamp": datetime.now().isoformat(),
        "bookings": booking_overview,
        "leads": leads_overview,
        "forms": forms_overview,
        "inventory": inventory_overview,
        "alerts": alerts_overview,
        "quick_stats": {
            "total_contacts": len(conversations.data),
            "active_services": len(
                supabase.table("service_types").select("*").eq(
                    "workspace_id", workspace_id
                ).eq("is_active", True).execute().data
            ),
            "total_bookings_this_month": len([
                b for b in supabase.table("bookings").select("*").eq(
                    "workspace_id", workspace_id
                ).execute().data
                if datetime.fromisoformat(b["created_at"].replace('Z', '+00:00')).month == today.month
            ])
        }
    }

@router.get("/alerts")
async def get_alerts(
    current_user: dict = Depends(get_current_active_user),
    supabase = Depends(get_supabase),
    unread_only: bool = False
):
    """Get all alerts for workspace"""
    
    query = supabase.table("alerts").select("*").eq(
        "workspace_id", current_user["workspace_id"]
    )
    
    if unread_only:
        query = query.eq("is_read", False)
    
    result = query.order("created_at", desc=True).execute()
    
    return result.data

@router.patch("/alerts/{alert_id}/read")
async def mark_alert_read(
    alert_id: str,
    current_user: dict = Depends(get_current_active_user),
    supabase = Depends(get_supabase)
):
    """Mark alert as read"""
    
    result = supabase.table("alerts").update(
        {"is_read": True}
    ).eq("id", alert_id).eq("workspace_id", current_user["workspace_id"]).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Alert not found")
    
@router.post("/analysis")
async def get_ai_analysis(
    target_date: str = None,
    current_user: dict = Depends(get_current_active_user),
    supabase = Depends(get_supabase)
):
    """Generate AI insights for a specific date (defaults to today)"""
    
    # 1. Gather dashboard data for the requested date
    overview = await get_dashboard_overview(target_date, current_user, supabase)
    settings = get_settings()
    
    display_date = target_date if target_date else "today"
    
    if not settings.GROQ_API_KEY:
        return {"analysis": "AI Analysis is not configured. Please add GROQ_API_KEY to your environment."}

    client = Groq(api_key=settings.GROQ_API_KEY)
    
    # 2. Extract key metrics for the prompt
    metrics = {
        "today_bookings": overview["bookings"]["today_count"],
        "unread_messages": overview["leads"]["unread_messages"],
        "pending_forms": overview["forms"]["pending_count"],
        "low_stock_items": [i["name"] for i in overview["inventory"]["low_stock_items"]],
        "critical_alerts": [a["title"] for a in overview["alerts"]["recent_alerts"] if a["severity"] == "critical"]
    }

    # 3. Create prompt
    is_future = target_date and datetime.fromisoformat(target_date).date() > datetime.now().date()
    perspective = f"preparing for {target_date}" if is_future else f"managing the business today ({display_date})"

    prompt = f"""
    You are a business consultant AI for a service-based business. 
    Analyze the following operational dashboard data and provide 3-4 concise, actionable insights focused on {perspective}.
    Format your response in Markdown with bullet points.
    
    Data for {display_date}:
    - Bookings for this date: {metrics['today_bookings']}
    - Unread Customer Messages: {metrics['unread_messages']}
    - Pending Intake Forms: {metrics['pending_forms']}
    - Current Low Stock Items: {', '.join(metrics['low_stock_items']) if metrics['low_stock_items'] else 'None'}
    - Critical System Alerts: {', '.join(metrics['critical_alerts']) if metrics['critical_alerts'] else 'None'}
    
    If this is a future date, focus on preparation (staffing, inventory, logistics).
    If it is today, focus on immediate priorities.
    """

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a helpful business operations assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=500
        )
        return {"analysis": completion.choices[0].message.content}
    except Exception as e:
        print(f"AI Analysis Error: {str(e)}")
        raise HTTPException(status_code=500, detail="AI Analysis failed")
