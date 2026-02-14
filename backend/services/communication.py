import vonage
from mailjet_rest import Client
from config import get_settings
from typing import Dict, Any, Optional

settings = get_settings()

class CommunicationService:
    """Service for handling external communications (Email, SMS)"""
    
    def __init__(self):
        self.mailjet = None
        if settings.MAILJET_API_KEY and settings.MAILJET_SECRET_KEY:
            self.mailjet = Client(auth=(settings.MAILJET_API_KEY, settings.MAILJET_SECRET_KEY), version='v3.1')
            
        self.vonage_client = None
        if settings.VONAGE_API_KEY and settings.VONAGE_API_SECRET:
            from vonage import Vonage, Auth
            self.vonage_auth = Auth(api_key=settings.VONAGE_API_KEY, api_secret=settings.VONAGE_API_SECRET)
            self.vonage_client = Vonage(self.vonage_auth)

    async def send_email(self, to_email: str, subject: str, content: str, from_name: str = "CareOps"):
        """Send an email using Mailjet"""
        if not self.mailjet:
            print("ERROR: Mailjet not configured")
            return False
            
        data = {
            'Messages': [
                {
                    "From": {
                        "Email": settings.MAILJET_API_KEY.lower().split('_')[0] + "@careops.io", # Fallback logic
                        "Name": from_name
                    },
                    "To": [
                        {
                            "Email": to_email,
                            "Name": to_email.split('@')[0]
                        }
                    ],
                    "Subject": subject,
                    "TextPart": content,
                    "HTMLPart": f"<h3>{subject}</h3><p>{content}</p>"
                }
            ]
        }
        
        # In a real environment, we'd use a verified sender email from settings
        # For the hackathon, we attempt to use the provided keys
        try:
            # Overwrite with a real verified email if one exists in settings or ENV
            from_email = getattr(settings, "MAILJET_SENDER_EMAIL", "notifications@careops.io")
            data['Messages'][0]['From']['Email'] = from_email
            
            result = self.mailjet.send.create(data=data)
            return result.status_code == 200
        except Exception as e:
            print(f"ERROR: Failed to send email: {str(e)}")
            return False

    async def send_sms(self, to_phone: str, content: str, from_name: str = "CareOps"):
        """Send an SMS using Vonage"""
        if not self.vonage_client:
            print("ERROR: Vonage not configured")
            return False
            
        try:
            # Vonage requires numbers in E.164 format
            response = self.vonage_client.sms.send_message({
                "from": from_name,
                "to": to_phone.replace('+', '').replace(' ', ''),
                "text": content,
            })

            if response["messages"][0]["status"] == "0":
                return True
            else:
                print(f"ERROR: Vonage Error: {response['messages'][0]['error-text']}")
                return False
        except Exception as e:
            print(f"ERROR: Failed to send SMS: {str(e)}")
            return False

# Singleton instance
communication_service = CommunicationService()
