from groq import Groq
from config import get_settings
import json
from typing import Dict, Any

settings = get_settings()
client = Groq(api_key=settings.GROQ_API_KEY)

class VoiceOnboardingService:
    """Service for handling voice-based onboarding using Groq AI"""
    
    def __init__(self):
        self.client = client
    
    async def transcribe_audio(self, audio_file) -> str:
        """Transcribe audio to text using Groq Whisper"""
        try:
            transcription = self.client.audio.transcriptions.create(
                file=audio_file,
                model="whisper-large-v3",
                response_format="text"
            )
            return transcription
        except Exception as e:
            raise Exception(f"Transcription failed: {str(e)}")
    
    async def extract_onboarding_data(self, transcript: str, step: str) -> Dict[str, Any]:
        """Extract structured data from transcript based on onboarding step"""
        
        prompts = {
            "workspace": """
                Extract the following information from the transcript:
                - Business name
                - Business address (if mentioned)
                - Contact email (if mentioned)
                - Timezone preference (if mentioned, otherwise use UTC)
                
                Return ONLY a valid JSON object with these keys: name, address, contact_email, timezone
                If any field is not mentioned, use null for that field.
                """,
            
            "service_type": """
                Extract the following information about the service:
                - Service name
                - Description
                - Duration in minutes
                - Location (if mentioned)
                
                Return ONLY a valid JSON object with these keys: name, description, duration_minutes, location
                """,
            
            "availability": """
                Extract availability information:
                - Days of the week (0=Sunday, 1=Monday, etc.)
                - Start time (HH:MM format)
                - End time (HH:MM format)
                
                Return ONLY a valid JSON array of objects with keys: day_of_week, start_time, end_time
                """,
            
            "inventory": """
                Extract inventory items mentioned:
                - Item name
                - Initial quantity
                - Low stock threshold
                - Unit of measurement
                
                Return ONLY a valid JSON array of objects with keys: name, quantity, low_stock_threshold, unit
                """,
            
            "general": """
                Extract any business setup information from the transcript.
                Identify what the user is trying to configure and return structured data.
                Return ONLY a valid JSON object.
                """
        }
        
        prompt = prompts.get(step, prompts["general"])
        
        try:
            completion = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "system",
                        "content": f"""You are an AI assistant helping with business onboarding. 
                        Extract structured information from user speech. 
                        {prompt}
                        Be precise and only extract information that is clearly stated.
                        Always return valid JSON only, no additional text."""
                    },
                    {
                        "role": "user",
                        "content": transcript
                    }
                ],
                temperature=0.1,
                max_tokens=1000
            )
            
            response_text = completion.choices[0].message.content.strip()
            
            # Clean up response to ensure it's valid JSON
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            extracted_data = json.loads(response_text)
            
            return {
                "extracted_data": extracted_data,
                "confidence": 0.85,  # Could be enhanced with actual confidence scoring
                "transcript": transcript
            }
            
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse AI response as JSON: {str(e)}")
        except Exception as e:
            raise Exception(f"Data extraction failed: {str(e)}")
    
    async def process_voice_input(self, audio_file, step: str = "general") -> Dict[str, Any]:
        """Complete pipeline: transcribe audio and extract data"""
        
        # Step 1: Transcribe audio
        transcript = await self.transcribe_audio(audio_file)
        
        # Step 2: Extract structured data
        result = await self.extract_onboarding_data(transcript, step)
        
        return result
    
    async def validate_extracted_data(self, data: Dict[str, Any], step: str) -> Dict[str, Any]:
        """Validate extracted data based on step requirements"""
        
        validation_rules = {
            "workspace": {
                "required": ["name", "contact_email"],
                "optional": ["address", "timezone"]
            },
            "service_type": {
                "required": ["name", "duration_minutes"],
                "optional": ["description", "location"]
            },
            "availability": {
                "required": ["day_of_week", "start_time", "end_time"],
                "optional": []
            }
        }
        
        rules = validation_rules.get(step, {"required": [], "optional": []})
        
        errors = []
        for field in rules["required"]:
            if field not in data or data[field] is None:
                errors.append(f"Missing required field: {field}")
        
        return {
            "is_valid": len(errors) == 0,
            "errors": errors,
            "data": data
        }

# Singleton instance
voice_service = VoiceOnboardingService()
