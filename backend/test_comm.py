import asyncio
from services.communication import communication_service

async def test_comm():
    print("Testing Communication Service...")
    
    # Test Email (Replace with your email to test)
    # email_success = await communication_service.send_email("test@example.com", "Test Subject", "Hello from CareOps!")
    # print(f"Email Success: {email_success}")
    
    # Test SMS (Replace with your phone number to test)
    # sms_success = await communication_service.send_sms("+1234567890", "Hello from CareOps!")
    # print(f"SMS Success: {sms_success}")
    
    print("Service initialized. Provide real credentials in .env to send for real.")

if __name__ == "__main__":
    asyncio.run(test_comm())
