from fastapi import FastAPI, APIRouter, File, UploadFile, HTTPException, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import base64
import tempfile
import cv2
import numpy as np
from pdf2image import convert_from_bytes
import pytesseract
import requests
from huggingface_hub import InferenceClient

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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ Models ============

class User(BaseModel):
    user_id: str = Field(default_factory=lambda: str(datetime.now().timestamp()))
    name: str
    email: str
    age: int
    gender: str
    height: float  # in cm
    weight: Optional[float] = None  # in kg
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    name: str
    email: str
    age: int
    gender: str
    height: float
    weight: Optional[float] = None

class HealthReport(BaseModel):
    report_id: str = Field(default_factory=lambda: str(datetime.now().timestamp()))
    user_id: str
    pdf_base64: str
    extracted_text: str
    ai_analysis: Optional[str] = None
    parameters_extracted: Optional[Dict[str, Any]] = None
    upload_date: datetime = Field(default_factory=datetime.utcnow)

class HealthReportResponse(BaseModel):
    report_id: str
    user_id: str
    extracted_text: str
    ai_analysis: Optional[str] = None
    parameters_extracted: Optional[Dict[str, Any]] = None
    upload_date: datetime

class DailyLog(BaseModel):
    log_id: str = Field(default_factory=lambda: str(datetime.now().timestamp()))
    user_id: str
    log_date: date
    breakfast: Dict[str, Any]
    lunch: Dict[str, Any]
    dinner: Dict[str, Any]
    snacks: Dict[str, Any]
    water_intake: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DailyLogCreate(BaseModel):
    user_id: str
    log_date: str
    breakfast: Dict[str, Any]
    lunch: Dict[str, Any]
    dinner: Dict[str, Any]
    snacks: Dict[str, Any]
    water_intake: str

class WorkoutPlan(BaseModel):
    plan_id: str = Field(default_factory=lambda: str(datetime.now().timestamp()))
    user_id: str
    plan_date: date
    exercises: List[Dict[str, Any]]
    recommendations: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WorkoutPlanCreate(BaseModel):
    user_id: str

class AnalysisRequest(BaseModel):
    report_id: str
    hf_api_key: str

# ============ Helper Functions ============

def extract_text_from_pdf_base64(pdf_base64: str) -> str:
    """Extract text from PDF using OCR"""
    try:
        # Decode base64 to bytes
        pdf_bytes = base64.b64decode(pdf_base64)
        
        # Convert PDF to images
        pages = convert_from_bytes(pdf_bytes)
        
        full_text = []
        for page_num, page in enumerate(pages):
            # Convert PIL to OpenCV format
            img_array = np.array(page)
            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            
            # Preprocess: grayscale, threshold for better accuracy
            gray = cv2.cvtColor(img_array, cv2.COLOR_BGR2GRAY)
            thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
            
            # Extract text
            text = pytesseract.image_to_string(thresh)
            full_text.append(f"--- Page {page_num + 1} ---\n{text}")
        
        return "\n".join(full_text)
    except Exception as e:
        logger.error(f"OCR extraction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OCR failed: {str(e)}")

def analyze_health_report_with_ai(extracted_text: str, hf_api_key: str) -> Dict[str, Any]:
    """Analyze health report using Hugging Face free models"""
    try:
        # Use Hugging Face Inference API with free models
        client = InferenceClient(token=hf_api_key)
        
        prompt = f"""You are a health analysis AI. Analyze the following lab report and provide:
1. A summary of all health parameters found
2. Identify which parameters are normal, high, or low
3. Provide health recommendations based on the results

Lab Report Text:
{extracted_text}

Please provide a detailed analysis in the following format:
### Parameters Found:
[List all parameters with their values and units]

### Health Status:
[Indicate normal/high/low for each parameter]

### Recommendations:
[Provide specific health and lifestyle recommendations]
"""
        
        # Using Mistral-7B or similar free model
        response = client.text_generation(
            prompt,
            model="mistralai/Mistral-7B-Instruct-v0.2",
            max_new_tokens=1000,
            temperature=0.7
        )
        
        return {
            "analysis": response,
            "model_used": "mistralai/Mistral-7B-Instruct-v0.2"
        }
    except Exception as e:
        logger.error(f"AI analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

def get_workout_exercises_from_wger(query: str = "fitness", limit: int = 10) -> List[Dict[str, Any]]:
    """Fetch exercises from WGER API"""
    try:
        base_url = "https://wger.de/api/v2"
        response = requests.get(f"{base_url}/exercise/?language=2&limit={limit}")
        
        if response.status_code == 200:
            data = response.json()
            exercises = []
            for ex in data.get('results', [])[:limit]:
                exercises.append({
                    "id": ex.get('id'),
                    "name": ex.get('name'),
                    "description": ex.get('description', ''),
                    "category": ex.get('category', ''),
                    "equipment": ex.get('equipment', [])
                })
            return exercises
        else:
            logger.warning(f"WGER API returned status {response.status_code}")
            return []
    except Exception as e:
        logger.error(f"WGER API call failed: {str(e)}")
        return []

def generate_adaptive_workout_plan(user_id: str, daily_logs: List[Dict], hf_api_key: str) -> Dict[str, Any]:
    """Generate adaptive workout plan based on daily logs using AI"""
    try:
        # Get recent logs summary
        logs_summary = []
        for log in daily_logs[-7:]:  # Last 7 days
            logs_summary.append(f"Date: {log.get('log_date')}, Water: {log.get('water_intake')}")
        
        # Get exercises from WGER
        exercises = get_workout_exercises_from_wger(limit=15)
        exercises_text = "\n".join([f"- {ex['name']}: {ex.get('description', 'No description')[:100]}" for ex in exercises])
        
        prompt = f"""You are a fitness coach AI. Based on the user's recent activity logs, create a personalized workout plan for tomorrow.

Recent Activity (last 7 days):
{chr(10).join(logs_summary)}

Available Exercises:
{exercises_text}

Create a balanced workout plan with:
1. Warm-up (5-10 minutes)
2. Main workout (30-40 minutes) - select 5-7 exercises from the list above
3. Cool-down (5-10 minutes)

Format your response as:
### Workout Plan for Tomorrow
[Brief motivational message]

### Warm-up:
[List warm-up exercises]

### Main Workout:
[List main exercises with sets/reps/duration]

### Cool-down:
[List cool-down exercises]

### Tips:
[Additional tips based on their recent activity]
"""
        
        client = InferenceClient(token=hf_api_key)
        response = client.text_generation(
            prompt,
            model="mistralai/Mistral-7B-Instruct-v0.2",
            max_new_tokens=800,
            temperature=0.8
        )
        
        return {
            "recommendations": response,
            "exercises": exercises[:7],  # Return some exercises for display
            "model_used": "mistralai/Mistral-7B-Instruct-v0.2"
        }
    except Exception as e:
        logger.error(f"Workout plan generation failed: {str(e)}")
        # Return fallback plan
        return {
            "recommendations": "Please maintain regular physical activity. Aim for 30 minutes of moderate exercise daily.",
            "exercises": get_workout_exercises_from_wger(limit=7),
            "model_used": "fallback"
        }

# ============ API Routes ============

@api_router.get("/")
async def root():
    return {"message": "Health Coach API", "status": "running"}

# User endpoints
@api_router.post("/users", response_model=User)
async def create_user(user_input: UserCreate):
    """Create a new user"""
    user = User(**user_input.dict())
    await db.users.insert_one(user.dict())
    return user

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    """Get user by ID"""
    user = await db.users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

@api_router.get("/users", response_model=List[User])
async def get_all_users():
    """Get all users"""
    users = await db.users.find().to_list(1000)
    return [User(**user) for user in users]

# Health Report endpoints
@api_router.post("/health-reports/upload")
async def upload_health_report(
    user_id: str = Form(...),
    file: UploadFile = File(...)
):
    """Upload PDF health report and extract text"""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        # Read file and convert to base64
        pdf_bytes = await file.read()
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        
        # Extract text using OCR
        extracted_text = extract_text_from_pdf_base64(pdf_base64)
        
        # Create report document
        report = HealthReport(
            user_id=user_id,
            pdf_base64=pdf_base64,
            extracted_text=extracted_text
        )
        
        await db.health_reports.insert_one(report.dict())
        
        return {
            "report_id": report.report_id,
            "user_id": report.user_id,
            "extracted_text": extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text,
            "message": "Report uploaded successfully. Use /analyze endpoint to get AI analysis."
        }
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.post("/health-reports/analyze")
async def analyze_report(analysis_req: AnalysisRequest):
    """Analyze health report with AI"""
    report = await db.health_reports.find_one({"report_id": analysis_req.report_id})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    try:
        # Get AI analysis
        ai_result = analyze_health_report_with_ai(report['extracted_text'], analysis_req.hf_api_key)
        
        # Update report with analysis
        await db.health_reports.update_one(
            {"report_id": analysis_req.report_id},
            {"$set": {
                "ai_analysis": ai_result['analysis'],
                "parameters_extracted": {"model": ai_result['model_used']}
            }}
        )
        
        return {
            "report_id": analysis_req.report_id,
            "analysis": ai_result['analysis'],
            "model_used": ai_result['model_used']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/health-reports/{user_id}", response_model=List[HealthReportResponse])
async def get_user_reports(user_id: str):
    """Get all reports for a user"""
    reports = await db.health_reports.find({"user_id": user_id}).to_list(100)
    return [HealthReportResponse(
        report_id=r['report_id'],
        user_id=r['user_id'],
        extracted_text=r['extracted_text'][:500] + "..." if len(r['extracted_text']) > 500 else r['extracted_text'],
        ai_analysis=r.get('ai_analysis'),
        parameters_extracted=r.get('parameters_extracted'),
        upload_date=r['upload_date']
    ) for r in reports]

# Daily Log endpoints
@api_router.post("/daily-logs", response_model=DailyLog)
async def create_daily_log(log_input: DailyLogCreate):
    """Create daily food and activity log"""
    log = DailyLog(
        **log_input.dict(),
        log_date=datetime.strptime(log_input.log_date, "%Y-%m-%d").date()
    )
    await db.daily_logs.insert_one(log.dict())
    return log

@api_router.get("/daily-logs/{user_id}", response_model=List[DailyLog])
async def get_user_logs(user_id: str, limit: int = 30):
    """Get user's daily logs"""
    logs = await db.daily_logs.find({"user_id": user_id}).sort("log_date", -1).to_list(limit)
    return [DailyLog(**log) for log in logs]

# Workout Plan endpoints
@api_router.post("/workout-plans/generate")
async def generate_workout_plan(user_id: str = Form(...), hf_api_key: str = Form(...)):
    """Generate adaptive workout plan based on daily logs"""
    try:
        # Get recent logs
        logs = await db.daily_logs.find({"user_id": user_id}).sort("log_date", -1).to_list(7)
        
        # Generate plan
        plan_data = generate_adaptive_workout_plan(user_id, logs, hf_api_key)
        
        # Create workout plan
        plan = WorkoutPlan(
            user_id=user_id,
            plan_date=date.today(),
            exercises=plan_data['exercises'],
            recommendations=plan_data['recommendations']
        )
        
        await db.workout_plans.insert_one(plan.dict())
        
        return {
            "plan_id": plan.plan_id,
            "recommendations": plan.recommendations,
            "exercises": plan.exercises,
            "message": "Workout plan generated successfully"
        }
    except Exception as e:
        logger.error(f"Workout plan generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/workout-plans/{user_id}", response_model=List[WorkoutPlan])
async def get_user_workout_plans(user_id: str, limit: int = 10):
    """Get user's workout plans"""
    plans = await db.workout_plans.find({"user_id": user_id}).sort("plan_date", -1).to_list(limit)
    return [WorkoutPlan(**plan) for plan in plans]

@api_router.get("/exercises/search")
async def search_exercises(query: str = "fitness", limit: int = 20):
    """Search exercises from WGER API"""
    exercises = get_workout_exercises_from_wger(query, limit)
    return {"exercises": exercises}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
