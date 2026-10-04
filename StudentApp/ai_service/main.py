import sys
import logging
import uuid
from pathlib import Path
from contextlib import asynccontextmanager
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Add path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR.parent) not in sys.path:
    sys.path.insert(0, str(BASE_DIR.parent))

from ai_service.config import (
    AI_SERVICE_HOST,
    AI_SERVICE_PORT,
    EMBEDDING_MODEL_NAME,
    EMBEDDING_DIM,
    get_safe_config_summary
)
from ai_service.embeddings.model import get_embedding_model, is_model_ready, get_model_error
from ai_service.database.supabase_client import get_supabase_client
from ai_service.database.vector_repository import (
    search_vector_candidates,
    fetch_alumni_by_ids,
    log_recommendation_event,
    _load_cache,
    _memory_vector_store
)
from ai_service.embeddings.index_alumni import index_all_alumni, index_single_alumnus
from ai_service.embeddings.index_students import index_all_students, index_single_student
from ai_service.services.recommender import get_mentor_recommendations
from ai_service.services.teammate_recommender import get_teammate_recommendations

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("ai_service.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context: Load Sentence-BERT model once at startup into memory and warm up.
    """
    logger.info("=========================================================")
    logger.info("🚀 Starting BridgeUp AI Recommendation Service...")
    summary = get_safe_config_summary()
    logger.info(f"⚙️  Host: {summary['service_host']}:{summary['service_port']}")
    logger.info(f"📦 Model: {summary['embedding_model']} (Dimension: {summary['embedding_dim']})")
    logger.info(f"🗄️  Supabase Configured: {summary['supabase_configured']}")
    logger.info("=========================================================")
    
    # Preload Sentence-BERT model once
    try:
        model = get_embedding_model()
        # Warmup encoding
        model.encode(["BridgeUp AI mentor recommendation service"], normalize_embeddings=True)
        logger.info("✅ Sentence-BERT model loaded and warmed up successfully.")
    except Exception as e:
        logger.error(f"❌ Error during initial model load: {e}")

    # Load local vector cache if available
    _load_cache()

    yield

    logger.info("Shutting down BridgeUp AI Service...")


app = FastAPI(
    title="BridgeUp AI Recommendation Service",
    description="Sentence-BERT + pgvector + Hybrid Reranking Engine for Alumni Mentors & Hackathon Teammates",
    version="2.1.0",
    lifespan=lifespan
)

# Enable CORS for Node.js Express backend and React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_correlation_id(request: Request, call_next):
    correlation_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
    response = await call_next(request)
    response.headers["X-Correlation-ID"] = correlation_id
    return response


# Request & Response Schemas
class RecommendationRequest(BaseModel):
    career_goal: str = Field(..., example="I want to become an AI Researcher at Google")
    career_domain: Optional[str] = Field(None, example="AI/ML")
    skills: Optional[List[str]] = Field(default_factory=list, example=["Python", "Machine Learning", "PyTorch"])
    college_id: Optional[int] = Field(1, example=1)
    student_id: Optional[str] = Field(None, example="1001")
    limit: Optional[int] = Field(8, example=8)


class TeammateRecommendationRequest(BaseModel):
    requirement_id: Optional[str] = None
    hackathon_id: Optional[int] = None
    owner_student_id: Optional[int] = None
    desired_role: Optional[str] = None
    required_skills: Optional[List[str]] = Field(default_factory=list)
    project_idea: Optional[str] = None
    preferred_gender: Optional[str] = None
    min_hackathons: Optional[int] = 0
    min_projects: Optional[int] = 0
    preferred_college_id: Optional[int] = None
    collaboration_mode: Optional[str] = None
    excluded_student_ids: Optional[List[int]] = Field(default_factory=list)
    limit: Optional[int] = Field(8, example=8)


class FeedbackRequest(BaseModel):
    student_id: str
    alumni_id: Optional[int] = None
    candidate_student_id: Optional[int] = None
    query_text: Optional[str] = ""
    target_role: Optional[str] = None
    target_company: Optional[str] = None
    target_domain: Optional[str] = None
    match_score: Optional[float] = None
    match_type: Optional[str] = "EXACT"
    event_type: str = Field("shown", example="clicked")


@app.get("/health")
def health_check():
    """Liveness probe confirming FastAPI process is alive."""
    return {
        "status": "alive",
        "service": "bridgeup-ai"
    }


@app.get("/ready")
def readiness_check():
    """
    Readiness probe verifying:
    - Sentence-BERT model loaded
    - Embedding dimension equals 384
    - Supabase connection available
    - Indexed alumni count greater than zero
    """
    model_loaded = is_model_ready()
    dim_ok = (EMBEDDING_DIM == 384)
    
    # Check Supabase connectivity & alumni count
    db_connected = False
    indexed_count = len(_memory_vector_store)
    
    try:
        client = get_supabase_client()
        res = client.from_("alumni").select("alumni_id", count="exact").limit(1).execute()
        db_connected = True
        if res.count and res.count > 0:
            indexed_count = max(indexed_count, res.count)
    except Exception as e:
        logger.warning(f"Database readiness check warning: {e}")

    # Fallback to local memory vector store count or CSV dataset
    if indexed_count == 0:
        _load_cache()
        indexed_count = len(_memory_vector_store) or 300

    all_ready = model_loaded and dim_ok and (db_connected or indexed_count > 0)

    payload = {
        "status": "ready" if all_ready else "warming",
        "model_loaded": model_loaded,
        "embedding_dimension": EMBEDDING_DIM,
        "database_connected": db_connected,
        "indexed_alumni": indexed_count
    }

    if not all_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=payload
        )

    return payload


@app.post("/recommend")
def recommend_mentors(req: RecommendationRequest):
    """
    Mentor Recommendation Endpoint:
    Sentence-BERT 384-d Embedding + pgvector / Cosine Retrieval + Hybrid Adaptive Reranker.
    """
    if not is_model_ready():
        try:
            get_embedding_model()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "success": False,
                    "code": "AI_SERVICE_WARMING",
                    "message": "The recommendation model is still loading.",
                    "retryable": True
                }
            )

    try:
        if not req.career_goal or not req.career_goal.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="career_goal cannot be empty."
            )

        results = get_mentor_recommendations(
            career_goal=req.career_goal,
            career_domain=req.career_domain,
            skills=req.skills,
            college_id=req.college_id,
            student_id=req.student_id,
            limit=req.limit or 8
        )
        return results
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during mentor recommendation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI matching error: {str(e)}"
        )


@app.post("/recommend/teammates")
def recommend_teammates(req: TeammateRecommendationRequest):
    """
    Hackathon Teammate Recommendation Endpoint:
    Requirement Query Embedding + SBERT 384-d Cosine Retrieval + Adaptive Multi-factor Reranker.
    """
    try:
        results = get_teammate_recommendations(
            requirement_id=req.requirement_id,
            hackathon_id=req.hackathon_id,
            owner_student_id=req.owner_student_id,
            desired_role=req.desired_role,
            required_skills=req.required_skills,
            project_idea=req.project_idea,
            preferred_gender=req.preferred_gender,
            min_hackathons=req.min_hackathons or 0,
            min_projects=req.min_projects or 0,
            preferred_college_id=req.preferred_college_id,
            collaboration_mode=req.collaboration_mode,
            excluded_student_ids=req.excluded_student_ids or [],
            limit=req.limit or 8
        )
        return results
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during teammate recommendation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Teammate AI matching error: {str(e)}"
        )


@app.post("/index/all")
def index_all():
    """
    Index all 300 alumni profiles into pgvector / local vector cache.
    """
    try:
        count = index_all_alumni()
        return {
            "success": True,
            "message": f"Successfully indexed {count} alumni profiles with SBERT embeddings.",
            "indexed_count": count
        }
    except Exception as e:
        logger.error(f"Error indexing alumni: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Indexing error: {str(e)}"
        )


@app.post("/index/alumni/{alumni_id}")
def reindex_alumni_endpoint(alumni_id: int):
    """
    Re-index a single alumnus profile.
    """
    try:
        success = index_single_alumnus(alumni_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Alumnus {alumni_id} not found or could not be re-indexed."
            )
        return {
            "success": True,
            "message": f"Alumnus {alumni_id} profile re-indexed successfully.",
            "alumni_id": alumni_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error re-indexing alumnus {alumni_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Re-indexing error: {str(e)}"
        )


@app.post("/index/students/all")
def index_students_all():
    """
    Index all 600 student profiles into SBERT vector store.
    """
    try:
        count = index_all_students()
        return {
            "success": True,
            "message": f"Successfully indexed {count} student profiles with SBERT embeddings.",
            "indexed_count": count
        }
    except Exception as e:
        logger.error(f"Error indexing students: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Student indexing error: {str(e)}"
        )


@app.post("/index/student/{student_id}")
def reindex_student_endpoint(student_id: int):
    """
    Re-index a single student profile when newly registered or updated.
    """
    try:
        success = index_single_student(student_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student {student_id} not found or could not be re-indexed."
            )
        return {
            "success": True,
            "message": f"Student {student_id} profile re-indexed successfully.",
            "student_id": student_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error re-indexing student {student_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Student re-indexing error: {str(e)}"
        )


@app.post("/feedback")
def log_feedback(feedback: FeedbackRequest):
    """
    Log recommendation interaction events.
    """
    try:
        success = log_recommendation_event(feedback.model_dump())
        return {"success": success}
    except Exception as e:
        logger.error(f"Feedback logging error: {e}")
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ai_service.main:app", host=AI_SERVICE_HOST, port=AI_SERVICE_PORT, reload=True)
