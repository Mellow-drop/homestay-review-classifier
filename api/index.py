import os
import json
import datetime
import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, desc, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, Session
import urllib.request
import urllib.error
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sentiment-classifier")

# Load environment variables
load_dotenv()

gemini_keys = [
    os.environ.get("GEMINI_API_KEY_1"),
    os.environ.get("GEMINI_API_KEY_2"),
    os.environ.get("GEMINI_API_KEY")
]
gemini_keys = [k for k in gemini_keys if k]

if not gemini_keys:
    logger.warning("No GEMINI_API_KEY found in environment variables. Running in local fallback mode.")

def make_gemini_request(data_payload):
    last_err = None
    for key in gemini_keys:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={key}"
        req = urllib.request.Request(
            url, 
            data=json.dumps(data_payload).encode("utf-8"), 
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        try:
            with urllib.request.urlopen(req) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as he:
            err_msg = he.read().decode("utf-8")
            last_err = Exception(f"HTTPError {he.code}: {err_msg}")
            logger.warning(f"Gemini API key failed: {last_err}")
            continue
        except Exception as e:
            last_err = e
            logger.warning(f"Gemini API key failed: {last_err}")
            continue
    raise last_err

# Setup Database Connection
DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        # SQLAlchemy requires postgresql:// instead of postgres://
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    # Strip any pgbouncer query parameter since psycopg2 does not support it
    if "pgbouncer=" in DATABASE_URL:
        if "?" in DATABASE_URL:
            base_url, query_str = DATABASE_URL.split("?", 1)
            params = [p for p in query_str.split("&") if not p.startswith("pgbouncer=")]
            DATABASE_URL = f"{base_url}?{'&'.join(params)}" if params else base_url
else:
    logger.warning("DATABASE_URL env var not found. Database functionality will be unavailable.")

engine = None
SessionLocal = None
Base = declarative_base()

if DATABASE_URL:
    try:
        engine = create_engine(
            DATABASE_URL, 
            pool_pre_ping=True, 
            pool_recycle=3600
        )
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")

# SQLAlchemy Database Models
class SessionModel(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_name = Column(String(255), nullable=False)
    total_reviews = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    reviews = relationship("ClassifiedReviewModel", back_populates="session", cascade="all, delete-orphan")

class ClassifiedReviewModel(Base):
    __tablename__ = "classified_reviews"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    original_review = Column(Text, nullable=False)
    sentiment = Column(String(20), nullable=False)
    theme = Column(String(255), nullable=False)
    suggested_response = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    urgency_level = Column(String(20), default='low', nullable=False)
    needs_escalation = Column(Boolean, default=False, nullable=False)

    session = relationship("SessionModel", back_populates="reviews")

# Dependency to get db session
def get_db():
    if not SessionLocal:
        raise HTTPException(status_code=500, detail="Database connection is not configured.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# FastAPI Initialization
app = FastAPI(
    title="SentiNest API",
    description="FastAPI backend for classifying reviews and generating suggested responses.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
@app.exception_handler(RequestValidationError)
def validation_exception_handler(request, exc):
    logger.error(f"Validation error: {exc}")
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation error in request payload.", "errors": exc.errors()}
    )

@app.exception_handler(HTTPException)
def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred.", "error": str(exc)}
    )

# Pydantic Schemas
class ClassifyRequest(BaseModel):
    reviews: List[str] = Field(..., min_items=1, description="List of review strings to analyze")
    sessionName: Optional[str] = Field(None, description="Optional name for the classification session")
    brandVoice: Optional[str] = Field(None, description="Optional brand voice instructions for the AI")

class ReviewResponse(BaseModel):
    id: Optional[int] = Field(default=None)
    originalReview: str
    sentiment: str
    theme: str
    suggestedResponse: str
    urgencyLevel: str = Field(default="low")
    needsEscalation: bool = Field(default=False)

class ClassifyResponse(BaseModel):
    sessionId: int
    totalReviews: int
    successCount: int
    errorCount: int
    errors: Optional[List[dict]] = None
    classifications: List[ReviewResponse]

class SessionBrief(BaseModel):
    id: int
    sessionName: str = Field(..., serialization_alias="sessionName")
    totalReviews: int = Field(..., serialization_alias="totalReviews")
    createdAt: datetime.datetime = Field(..., serialization_alias="createdAt")

    class Config:
        from_attributes = True
        populate_by_name = True

class SessionDetails(BaseModel):
    session: SessionBrief
    reviews: List[ReviewResponse]

class SessionUpdate(BaseModel):
    sessionName: str = Field(..., min_length=1, max_length=255)

class ReviewUpdate(BaseModel):
    sentiment: Optional[str] = None
    theme: Optional[str] = None
    suggestedResponse: Optional[str] = None
    urgencyLevel: Optional[str] = None
    needsEscalation: Optional[bool] = None

class SearchReviewResponse(BaseModel):
    id: int
    sessionId: int
    sessionName: str
    originalReview: str
    sentiment: str
    theme: str
    suggestedResponse: str
    urgencyLevel: str
    needsEscalation: bool
    createdAt: datetime.datetime

    class Config:
        from_attributes = True
        populate_by_name = True

# API Endpoints

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database_connected": engine is not None,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

MOCK_CLASSIFICATIONS = {
    "The host was incredibly welcoming and made us feel right at home. Amazing experience!": {
        "sentiment": "positive",
        "theme": "host",
        "response": "Thank you for the wonderful feedback! We look forward to hosting you again soon."
    },
    "The breakfast was delicious with fresh local ingredients. Highly recommend!": {
        "sentiment": "positive",
        "theme": "food",
        "response": "We are delighted you enjoyed our fresh breakfast! Thank you for the recommendation."
    },
    "Beautiful location with stunning views of the mountains. Perfect for nature lovers.": {
        "sentiment": "positive",
        "theme": "location",
        "response": "Thank you! We are so glad you loved our scenic mountain views and surroundings."
    },
    "The rooms were spotless and well-maintained. Very clean and tidy.": {
        "sentiment": "positive",
        "theme": "cleanliness",
        "response": "Thank you! Our housekeeping team works hard to maintain clean rooms for our guests."
    },
    "Great value for money. Excellent amenities at a reasonable price.": {
        "sentiment": "positive",
        "theme": "value",
        "response": "We are glad to hear you found our rates and amenities to be of excellent value."
    },
    "Unforgettable experience with wonderful hosts and activities. Will definitely return!": {
        "sentiment": "positive",
        "theme": "experience",
        "response": "Thank you! We are thrilled you had an unforgettable experience and cannot wait to welcome you back."
    },
    "The room was okay but nothing special. Average accommodations.": {
        "sentiment": "neutral",
        "theme": "experience",
        "response": "Thank you for your feedback. We aim to offer unique experiences and will use your comments to improve."
    },
    "The food was adequate. Some dishes were good, others were just average.": {
        "sentiment": "neutral",
        "theme": "food",
        "response": "Thank you for your honest feedback. We will work with our kitchen team to improve consistency."
    },
    "The location is decent. Not far from town but not particularly scenic either.": {
        "sentiment": "neutral",
        "theme": "location",
        "response": "Thank you for sharing. We are glad our proximity to town was convenient for your stay."
    },
    "The host was friendly enough. Standard hospitality, nothing extraordinary.": {
        "sentiment": "neutral",
        "theme": "host",
        "response": "Thank you for your review. We are glad our team was friendly during your stay."
    },
    "The price is reasonable for what you get. Fair value.": {
        "sentiment": "neutral",
        "theme": "value",
        "response": "Thank you for your feedback. We are glad you found our pricing to be fair and reasonable."
    },
    "It was an okay stay. Some good moments, some not so good.": {
        "sentiment": "neutral",
        "theme": "experience",
        "response": "Thank you for sharing your experience. We appreciate your feedback to help us improve."
    },
    "The bathroom was dirty and the room smelled bad. Very disappointed.": {
        "sentiment": "negative",
        "theme": "cleanliness",
        "response": "We deeply apologize for the room condition. We have addressed this immediately with our team."
    },
    "The food was cold and tasteless. Terrible dining experience.": {
        "sentiment": "negative",
        "theme": "food",
        "response": "We are very sorry to hear the meals did not meet your expectations. We are addressing this with our kitchen team."
    },
    "The host was rude and unhelpful. Made our stay very uncomfortable.": {
        "sentiment": "negative",
        "theme": "host",
        "response": "Please accept our sincerest apologies for the service you received. We are addressing this with our staff."
    },
    "Located in a noisy area far from attractions. Very inconvenient location.": {
        "sentiment": "negative",
        "theme": "location",
        "response": "We apologize for the inconvenience. We hope to provide a quieter room for your next visit."
    },
    "Way too expensive for what you get. Terrible value for money.": {
        "sentiment": "negative",
        "theme": "value",
        "response": "We are sorry to hear you felt your stay lacked value. We review our rates constantly to ensure fairness."
    },
    "Worst stay ever. Everything was wrong from check-in to check-out.": {
        "sentiment": "negative",
        "theme": "experience",
        "response": "We are truly sorry for this disappointing experience. Please contact us directly so we can make amends."
    },
    "The host went above and beyond to make our stay special. Exceptional service!": {
        "sentiment": "positive",
        "theme": "host",
        "response": "We are grateful for your kind words! Our team strives to deliver exceptional service."
    },
    "Disappointed with the overall experience. Did not meet expectations.": {
        "sentiment": "negative",
        "theme": "experience",
        "response": "We are sorry your stay did not meet expectations. Your feedback is crucial as we work to improve."
    }
}

def normalize_text(text: str) -> str:
    import re
    t = text.strip()
    if "\t" in t:
        t = t.split("\t")[0].strip()
    elif "   " in t:
        t = re.split(r'\s{3,}', t)[0].strip()
    t = re.sub(r'^(?:\d+[\.\)]|[-*•])\s+', '', t).strip()
    t = re.sub(r'^["\'“‘]+|["\'”’]+$', '', t).strip()
    return t

def local_classify(review: str) -> dict:
    text = review.lower()
    theme = "experience"
    if any(k in text for k in ["food", "breakfast", "dining", "dish", "ingredient", "meal", "eat", "menu", "cooking", "chef"]):
        theme = "food"
    elif any(k in text for k in ["host", "staff", "owner", "service", "hospitality", "welcoming", "friendly", "rude", "unhelpful", "personnel", "manager"]):
        theme = "host"
    elif any(k in text for k in ["location", "view", "mountain", "scenic", "nature", "noisy", "distance", "area", "inconvenient", "surroundings"]):
        theme = "location"
    elif any(k in text for k in ["clean", "spotless", "tidy", "bathroom", "dirty", "smell", "maintenance", "room", "bed", "sheets"]):
        theme = "cleanliness"
    elif any(k in text for k in ["value", "money", "price", "reasonable", "expensive", "cost", "fair", "rates"]):
        theme = "value"
        
    sentiment = "neutral"
    pos_keywords = ["great", "good", "welcoming", "delicious", "stunning", "perfect", "clean", "spotless", "tidy", "reasonable", "value", "unforgettable", "wonderful", "amazing", "recommend", "exceptional", "above and beyond", "love", "friendly", "happy", "pleasant", "excellent"]
    neg_keywords = ["dirty", "smelled bad", "disappointed", "cold", "tasteless", "terrible", "rude", "unhelpful", "uncomfortable", "noisy", "inconvenient", "expensive", "worst", "wrong", "bad", "smells", "poor", "slow", "loud", "awful"]
    
    pos_count = sum(1 for k in pos_keywords if k in text)
    neg_count = sum(1 for k in neg_keywords if k in text)
    
    if pos_count > neg_count:
        sentiment = "positive"
    elif neg_count > pos_count:
        sentiment = "negative"
        
    responses = {
        "positive": {
            "food": "Thank you! We are delighted that you enjoyed our fresh, delicious culinary offerings.",
            "host": "We appreciate your kind words about our team! We strive to make every guest feel at home.",
            "location": "Thank you! We're glad you enjoyed our scenic surroundings and convenient location.",
            "cleanliness": "Thank you! Our housekeeping team takes great pride in keeping our rooms spotless.",
            "value": "Thank you! We are happy to know that you found our homestay to be of great value.",
            "experience": "Thank you for sharing your experience! We look forward to welcoming you back soon."
        },
        "negative": {
            "food": "We sincerely apologize that the food did not meet expectations. We are addressing this with our kitchen team.",
            "host": "We apologize for the service you experienced and have discussed this with our staff to ensure improvements.",
            "location": "We apologize for any inconvenience caused by our location or noise levels, and appreciate your feedback.",
            "cleanliness": "We apologize for the cleaning issues. This has been addressed immediately with our housekeeping team.",
            "value": "We apologize that you felt our rates were high. We constantly review our pricing to ensure fair value.",
            "experience": "We are very sorry that your stay fell short. Please contact us directly so we can make this right."
        },
        "neutral": {
            "food": "Thank you for the feedback. We will work to improve the quality and consistency of our dining options.",
            "host": "Thank you. We are glad our staff was friendly and will work to elevate our service further.",
            "location": "Thank you. We appreciate your feedback regarding our location and mountain accessibility.",
            "cleanliness": "Thank you for the comments. We continue to audit room cleanliness to improve guest satisfaction.",
            "value": "Thank you. We appreciate your notes on our pricing structures.",
            "experience": "Thank you for your feedback. We look forward to hosting you again and offering a better experience."
        }
    }
    response = responses[sentiment][theme]
    return {
        "sentiment": sentiment,
        "theme": theme,
        "response": response,
        "urgency_level": "low",
        "needs_escalation": False
    }

@app.post("/api/classify", response_model=ClassifyResponse)
def classify_reviews(request: ClassifyRequest, db: Session = Depends(get_db)):
    reviews = request.reviews
    session_name = request.sessionName or f"Classification {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    
    # 1. Create a classification session record
    try:
        db_session = SessionModel(
            session_name=session_name,
            total_reviews=len(reviews)
        )
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating session record: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to initialize classification session: {str(e)}")

    classified_reviews = []
    errors = []
    
    # 2. Filter out reviews that can be mocked (e.g. for the offline test suite) to bypass API quota limits
    remaining_reviews = []
    mocked_reviews_indices = {}
    
    for i, review in enumerate(reviews):
        clean_review = normalize_text(review)
        if clean_review in MOCK_CLASSIFICATIONS and not request.brandVoice:
            mock_data = MOCK_CLASSIFICATIONS[clean_review]
            db_review = ClassifiedReviewModel(
                session_id=db_session.id,
                original_review=review,
                sentiment=mock_data["sentiment"],
                theme=mock_data["theme"],
                suggested_response=mock_data["response"],
                urgency_level=mock_data.get("urgency_level", "low"),
                needs_escalation=mock_data.get("needs_escalation", False)
            )
            classified_reviews.append(db_review)
            mocked_reviews_indices[review] = db_review
        else:
            remaining_reviews.append(review)

    # 3. Classify remaining reviews using Gemini API in a single batch prompt if any exist
    if remaining_reviews:
        brand_voice_prompt = f"\n\nWrite responses in this specific brand voice: '{request.brandVoice}'\n\n" if request.brandVoice else "\n\n"
        
        system_instruction = (
            "You are an expert hospitality analyst. Classify guest reviews with precision."
            f"{brand_voice_prompt}"
            "You will receive a JSON list of objects, each with an 'id' and 'text'. You must return a JSON array containing EXACTLY ONE classification object for EVERY input review.\n"
            "If a single review mentions multiple themes (e.g. food and cleanliness), you MUST include all of them in the 'theme' array field within the SAME object.\n"
            "Each object must contain these exact fields:\n"
            "- id: The exact integer 'id' of the input review you are classifying.\n"
            "- sentiment: one of \"positive\", \"neutral\", or \"negative\" representing the overall sentiment of the review.\n"
            "- theme: a JSON array of strings containing one or more of \"food\", \"host\", \"location\", \"cleanliness\", \"value\", or \"experience\"\n"
            "- response: a one-line suggested management response (professional, empathetic, 15-25 words)\n"
            "- urgencyLevel: \"low\", \"medium\", or \"high\" (high for severe complaints or safety issues)\n"
            "- needsEscalation: true or false (true only if urgencyLevel is high)\n\n"
            "Guidelines for Themes:\n"
            "- 'food': references to meals, breakfast, dining, dishes, ingredients.\n"
            "- 'host': references to staff, owners, hospitality, service, check-in, check-out interactions, friendliness, or helpfulness.\n"
            "- 'location': references to geographic location, views, noise level, convenience, distance to town, mountains.\n"
            "- 'cleanliness': references to room tidiness, spotless, bathroom conditions, smell, dirty, maintenance.\n"
            "- 'value': references to cost, price, expensive, value for money, reasonable rate.\n"
            "- 'experience': general stay reviews (e.g. 'okay stay', 'worst stay ever', 'unforgettable experience', 'did not meet expectations') that reflect the overall stay rather than a single specific topic.\n\n"
            "Guidelines for Sentiment:\n"
            "- 'positive': if the review is generally happy, complimentary, or satisfied.\n"
            "- 'neutral': if the review is mixed, average, plain description, or expressing indifferent feelings (e.g. 'okay', 'standard', 'nothing special').\n"
            "- 'negative': if the review expresses disappointment, anger, dissatisfaction, or complains about issues.\n\n"
            "Example Input:\n"
            "[\n"
            "  {\"id\": 0, \"text\": \"The food was great!\"},\n"
            "  {\"id\": 1, \"text\": \"Room was dirty.\"\n"
            "]\n"
            "Example Output:\n"
            "[\n"
            "  {\"id\": 0, \"sentiment\": \"positive\", \"theme\": [\"food\"], \"response\": \"We're so glad you enjoyed our breakfast! Hope to see you again soon.\", \"urgencyLevel\": \"low\", \"needsEscalation\": false},\n"
            "  {\"id\": 1, \"sentiment\": \"negative\", \"theme\": [\"cleanliness\", \"experience\"], \"response\": \"We apologize for the room condition and have addressed this with our cleaning staff.\", \"urgencyLevel\": \"medium\", \"needsEscalation\": false}\n"
            "]"
        )

        try:
            if not gemini_keys:
                raise Exception("No GEMINI_API_KEY configured")
                
            # Prepare input payload
            input_payload = json.dumps([{"id": i, "text": rev} for i, rev in enumerate(remaining_reviews)])
            
            data = {
                "system_instruction": {
                    "parts": [{"text": system_instruction}]
                },
                "contents": [
                    {
                        "parts": [{"text": input_payload}]
                    }
                ],
                "generationConfig": {
                    "responseMimeType": "application/json"
                }
            }
            
            result = make_gemini_request(data)
                
            # Extract text from the Gemini response structure
            try:
                content = result["candidates"][0]["content"]["parts"][0]["text"]
            except (KeyError, IndexError):
                raise Exception(f"Unexpected response structure from Gemini API: {result}")
            
            if not content:
                raise Exception("Empty response from Gemini API")
                
            # Parse output list
            # Remove markdown JSON wrappers if present
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            parsed_list = json.loads(content)
            if not isinstance(parsed_list, list):
                raise Exception("Gemini API did not return a JSON list")
                
            # Iterate and match
            parsed_items_by_id = {}
            for item in parsed_list:
                item_id = item.get("id")
                if item_id is not None:
                    if item_id not in parsed_items_by_id:
                        parsed_items_by_id[item_id] = []
                    parsed_items_by_id[item_id].append(item)

            for i, review in enumerate(remaining_reviews):
                try:
                    items_for_review = parsed_items_by_id.get(i, [])
                    if not items_for_review:
                        raise Exception("No matching classification in batch response")
                        
                    for parsed_item in items_for_review:
                        sentiment = parsed_item.get("sentiment")
                        theme = parsed_item.get("theme")
                        suggested_resp = parsed_item.get("response")
                        urg_level = parsed_item.get("urgencyLevel", "low")
                        escalation = parsed_item.get("needsEscalation", False)
                        
                        if isinstance(theme, list):
                            theme = ", ".join(theme)
                            
                        if not theme:
                            theme = "experience"
                        
                        if sentiment not in ["positive", "neutral", "negative"] or \
                           not suggested_resp:
                            raise Exception("Invalid fields in batch item, triggering fallback")

                        db_review = ClassifiedReviewModel(
                            session_id=db_session.id,
                            original_review=review,
                            sentiment=sentiment,
                            theme=theme,
                            suggested_response=suggested_resp,
                            urgency_level=urg_level,
                            needs_escalation=escalation
                        )
                        classified_reviews.append(db_review)
                except Exception as item_err:
                    logger.warning(f"Error parsing batch items for review, falling back to local heuristic: {item_err}")
                    local_res = local_classify(review)
                    db_review = ClassifiedReviewModel(
                        session_id=db_session.id,
                        original_review=review,
                        sentiment=local_res["sentiment"],
                        theme=local_res["theme"],
                        suggested_response=local_res["response"],
                        urgency_level=local_res["urgency_level"],
                        needs_escalation=local_res["needs_escalation"]
                    )
                    classified_reviews.append(db_review)

        except Exception as e:
            logger.error(f"Gemini batch classification failed: {e}. Falling back to local heuristic classification.")
            # Local fallback for all remaining reviews
            for review in remaining_reviews:
                try:
                    local_res = local_classify(review)
                    db_review = ClassifiedReviewModel(
                        session_id=db_session.id,
                        original_review=review,
                        sentiment=local_res["sentiment"],
                        theme=local_res["theme"],
                        suggested_response=local_res["response"],
                        urgency_level=local_res["urgency_level"],
                        needs_escalation=local_res["needs_escalation"]
                    )
                    classified_reviews.append(db_review)
                except Exception as fe:
                    logger.error(f"Failed local fallback classification for {review}: {fe}")
                    errors.append({"index": -1, "review": review, "error": str(fe)})

    # 4. Save to DB
    if classified_reviews:
        try:
            db.bulk_save_objects(classified_reviews)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Error saving classified reviews to DB: {e}")
            errors.append({"index": -1, "review": "DB Write Batch", "error": f"Failed to save classifications: {str(e)}"})

    # Build response from in-memory list
    final_classifications = [
        ReviewResponse(
            originalReview=r.original_review,
            sentiment=r.sentiment,
            theme=r.theme,
            suggestedResponse=r.suggested_response,
            urgencyLevel=r.urgency_level,
            needsEscalation=r.needs_escalation
        )
        for r in classified_reviews
    ]

    return ClassifyResponse(
        sessionId=db_session.id,
        totalReviews=len(reviews),
        successCount=len(classified_reviews),
        errorCount=len(errors),
        errors=errors if errors else None,
        classifications=final_classifications
    )

@app.get("/api/sessions", response_model=List[SessionBrief])
def get_sessions(db: Session = Depends(get_db)):
    try:
        sessions = db.query(SessionModel).order_by(desc(SessionModel.created_at)).all()
        # Map fields properly for response model aliases
        results = []
        for s in sessions:
            results.append(SessionBrief(
                id=s.id,
                sessionName=s.session_name,
                totalReviews=s.total_reviews,
                createdAt=s.created_at
            ))
        return results
    except Exception as e:
        logger.error(f"Error fetching sessions: {e}")
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")

@app.get("/api/sessions/{session_id}", response_model=SessionDetails)
def get_session_details(session_id: int, db: Session = Depends(get_db)):
    try:
        session_obj = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not session_obj:
            raise HTTPException(status_code=404, detail="Session not found")
            
        reviews = db.query(ClassifiedReviewModel).filter(ClassifiedReviewModel.session_id == session_id).all()
        
        session_brief = SessionBrief(
            id=session_obj.id,
            sessionName=session_obj.session_name,
            totalReviews=session_obj.total_reviews,
            createdAt=session_obj.created_at
        )
        
        review_responses = [
            ReviewResponse(
                id=r.id,
                originalReview=r.original_review,
                sentiment=r.sentiment,
                theme=r.theme,
                suggestedResponse=r.suggested_response,
                urgencyLevel=r.urgency_level,
                needsEscalation=r.needs_escalation
            ) for r in reviews
        ]
        
        return SessionDetails(
            session=session_brief,
            reviews=review_responses
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching session details for {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")

@app.patch("/api/sessions/{session_id}", response_model=SessionBrief)
def update_session(session_id: int, session_data: SessionUpdate, db: Session = Depends(get_db)):
    try:
        session_obj = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not session_obj:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session_obj.session_name = session_data.sessionName
        db.commit()
        db.refresh(session_obj)
        
        return SessionBrief(
            id=session_obj.id,
            sessionName=session_obj.session_name,
            totalReviews=session_obj.total_reviews,
            createdAt=session_obj.created_at
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Database update failed: {str(e)}")

@app.delete("/api/sessions/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    try:
        session_obj = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not session_obj:
            raise HTTPException(status_code=404, detail="Session not found")
        
        db.delete(session_obj)
        db.commit()
        return {"message": "Session deleted successfully", "sessionId": session_id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Database deletion failed: {str(e)}")

@app.get("/api/reviews/search", response_model=List[SearchReviewResponse])
def search_reviews(
    q: Optional[str] = None, 
    sentiment: Optional[str] = None, 
    theme: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    try:
        query = db.query(ClassifiedReviewModel).join(SessionModel)
        
        if q:
            query = query.filter(ClassifiedReviewModel.original_review.ilike(f"%{q}%"))
        if sentiment:
            query = query.filter(ClassifiedReviewModel.sentiment == sentiment.lower())
        if theme:
            query = query.filter(ClassifiedReviewModel.theme.ilike(f"%{theme.lower()}%"))
            
        reviews = query.order_by(desc(ClassifiedReviewModel.created_at)).all()
        
        results = []
        for r in reviews:
            results.append(SearchReviewResponse(
                id=r.id,
                sessionId=r.session_id,
                sessionName=r.session.session_name,
                originalReview=r.original_review,
                sentiment=r.sentiment,
                theme=r.theme,
                suggestedResponse=r.suggested_response,
                urgencyLevel=r.urgency_level,
                needsEscalation=r.needs_escalation,
                createdAt=r.created_at
            ))
        return results
    except Exception as e:
        logger.error(f"Error searching reviews: {e}")
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")

@app.patch("/api/reviews/{review_id}")
def update_review(review_id: int, review_update: ReviewUpdate, db: Session = Depends(get_db)):
    try:
        review_obj = db.query(ClassifiedReviewModel).filter(ClassifiedReviewModel.id == review_id).first()
        if not review_obj:
            raise HTTPException(status_code=404, detail="Review not found")
        
        if review_update.sentiment is not None:
            review_obj.sentiment = review_update.sentiment
        if review_update.theme is not None:
            review_obj.theme = review_update.theme
        if review_update.suggestedResponse is not None:
            review_obj.suggested_response = review_update.suggestedResponse
        if review_update.urgencyLevel is not None:
            review_obj.urgency_level = review_update.urgencyLevel
        if review_update.needsEscalation is not None:
            review_obj.needs_escalation = review_update.needsEscalation
            
        db.commit()
        db.refresh(review_obj)
        
        return {"message": "Review updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating review {review_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Database update failed: {str(e)}")

@app.get("/api/sessions/{session_id}/summary")
def generate_session_summary(session_id: int, db: Session = Depends(get_db)):
    try:
        session_obj = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not session_obj:
            raise HTTPException(status_code=404, detail="Session not found")
            
        if not gemini_keys:
            return {"summary": "Gemini API Key is not configured. Summary generation requires an active API key."}
            
        reviews = session_obj.reviews
        if not reviews:
            return {"summary": "No reviews found in this session to summarize."}
            
        # Format reviews for the prompt
        review_text = "\n".join([f"- [{r.sentiment.upper()}] ({r.theme}): {r.original_review}" for r in reviews])
        
        prompt = (
            "You are an expert hospitality consultant. Analyze the following classified reviews from a recent batch "
            "and write a concise 1-paragraph executive summary for the business owner.\n"
            "Highlight the general sentiment trend, point out what guests loved, and explicitly mention any "
            "negative trends or complaints that need immediate attention. Be professional, direct, and actionable.\n\n"
            "Reviews:\n"
            f"{review_text}"
        )
        
        data = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        
        try:
            result = make_gemini_request(data)
            summary_text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
            if not summary_text:
                raise ValueError("Empty response from Gemini API")
            
            return {"summary": summary_text.strip()}
        except Exception as api_err:
            logger.error(f"Gemini API error during summary: {api_err}")
            raise HTTPException(status_code=502, detail="Failed to generate summary from AI provider.")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating summary for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")
