from fastapi import FastAPI, APIRouter, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import math


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class DustbinCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    latitude: float
    longitude: float

class Dustbin(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = ""
    latitude: float
    longitude: float
    added_by: str = "admin"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdminLoginRequest(BaseModel):
    password: str

class AdminLoginResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    message: str

class NearestDustbinResponse(BaseModel):
    dustbin: Optional[Dustbin] = None
    distance_km: Optional[float] = None


# Helper function to calculate distance between two coordinates
def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two coordinates using Haversine formula
    Returns distance in kilometers
    """
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    distance = R * c
    return round(distance, 2)


# Simple admin authentication (password: admin123)
ADMIN_PASSWORD = "admin123"
ADMIN_TOKEN = "admin_token_secure_12345"

# Admin routes
@api_router.post("/admin/login", response_model=AdminLoginResponse)
async def admin_login(request: AdminLoginRequest):
    if request.password == ADMIN_PASSWORD:
        return AdminLoginResponse(
            success=True,
            token=ADMIN_TOKEN,
            message="Login successful"
        )
    else:
        return AdminLoginResponse(
            success=False,
            message="Invalid password"
        )

# Dustbin CRUD routes
@api_router.get("/dustbins", response_model=List[Dustbin])
async def get_all_dustbins():
    dustbins = await db.dustbins.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for dustbin in dustbins:
        if isinstance(dustbin.get('created_at'), str):
            dustbin['created_at'] = datetime.fromisoformat(dustbin['created_at'])
    
    return dustbins

@api_router.post("/dustbins", response_model=Dustbin)
async def create_dustbin(
    dustbin_data: DustbinCreate,
    authorization: Optional[str] = Header(None)
):
    # Verify admin token
    if not authorization or authorization != f"Bearer {ADMIN_TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    dustbin = Dustbin(**dustbin_data.model_dump())
    doc = dustbin.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.dustbins.insert_one(doc)
    return dustbin

@api_router.put("/dustbins/{dustbin_id}", response_model=Dustbin)
async def update_dustbin(
    dustbin_id: str,
    dustbin_data: DustbinCreate,
    authorization: Optional[str] = Header(None)
):
    # Verify admin token
    if not authorization or authorization != f"Bearer {ADMIN_TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Check if dustbin exists
    existing = await db.dustbins.find_one({"id": dustbin_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Dustbin not found")
    
    # Update the dustbin
    update_data = dustbin_data.model_dump()
    await db.dustbins.update_one(
        {"id": dustbin_id},
        {"$set": update_data}
    )
    
    # Return updated dustbin
    updated = await db.dustbins.find_one({"id": dustbin_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    
    return Dustbin(**updated)

@api_router.delete("/dustbins/{dustbin_id}")
async def delete_dustbin(
    dustbin_id: str,
    authorization: Optional[str] = Header(None)
):
    # Verify admin token
    if not authorization or authorization != f"Bearer {ADMIN_TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    result = await db.dustbins.delete_one({"id": dustbin_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Dustbin not found")
    
    return {"success": True, "message": "Dustbin deleted successfully"}

@api_router.get("/dustbins/nearest", response_model=NearestDustbinResponse)
async def get_nearest_dustbin(lat: float, lng: float):
    dustbins = await db.dustbins.find({}, {"_id": 0}).to_list(1000)
    
    if not dustbins:
        return NearestDustbinResponse(dustbin=None, distance_km=None)
    
    # Convert ISO string timestamps back to datetime objects
    for dustbin in dustbins:
        if isinstance(dustbin.get('created_at'), str):
            dustbin['created_at'] = datetime.fromisoformat(dustbin['created_at'])
    
    # Find nearest dustbin
    nearest = None
    min_distance = float('inf')
    
    for dustbin in dustbins:
        distance = calculate_distance(lat, lng, dustbin['latitude'], dustbin['longitude'])
        if distance < min_distance:
            min_distance = distance
            nearest = dustbin
    
    if nearest:
        return NearestDustbinResponse(
            dustbin=Dustbin(**nearest),
            distance_km=min_distance
        )
    
    return NearestDustbinResponse(dustbin=None, distance_km=None)

@api_router.get("/")
async def root():
    return {"message": "Dustbin Locator API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()