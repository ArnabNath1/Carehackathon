from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings
from routers import auth, onboarding, dashboard, bookings, inbox

settings = get_settings()

app = FastAPI(
    title="CareOps API",
    description="Unified Operations Platform for Service-Based Businesses",
    version="1.0.0"
)

@app.middleware("http")
async def add_process_time_header(request, call_next):
    origin = request.headers.get("origin")
    print(f"Request: {request.method} {request.url.path} from {origin}")
    response = await call_next(request)
    return response

# CORS Configuration
origins = []
if isinstance(settings.CORS_ORIGINS, list):
    origins = settings.CORS_ORIGINS
elif isinstance(settings.CORS_ORIGINS, str):
    # Handle comma-separated string if provided instead of JSON list
    origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]

# Add local defaults
origins = list(set(origins + ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(onboarding.router)
app.include_router(dashboard.router)
app.include_router(bookings.router)
app.include_router(inbox.router)

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "Welcome to CareOps API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": "2026-02-14T11:42:25+05:30"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
