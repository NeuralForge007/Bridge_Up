import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Add path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR.parent) not in sys.path:
    sys.path.insert(0, str(BASE_DIR.parent))

from ai_service.config import AI_SERVICE_HOST, AI_SERVICE_PORT, EMBEDDING_MODEL_NAME, EMBEDDING_DIM
from ai_service.embeddings.model import get_embedding_model
from ai_service.embeddings.index_alumni import index_all_alumni, index_single_alumnus
from ai_service.services.recommender import get_mentor_recommendations
from ai_service.database.vector_repository import log_recommendation_event

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("ai_service.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context: Load Sentence-BERT model once at startup into memory.
    """
    logger.info("=========================================================")
    logger.info(f"🚀 Initializing BridgeUp AI Recommendation Service...")
    logger.info(f"📦 Model: {EMBEDDING_MODEL_NAME} (Embedding Dim: {EMBEDDING_DIM})")
    logger.info("=========================================================")
    
    # Preload Sentence-BERT model
    try:
        get_embedding_model()
        logger.info("✅ Sentence-BERT model initialized and ready.")
    except Exception as e:
        logger.error(f"❌ Failed to load embedding model: {e}")

    yield

    logger.info("Shutting down BridgeUp AI Service...")


app = FastAPI(
    title="BridgeUp AI Recommendation Service",
    description="High-precision Sentence-BERT + pgvector + Hybrid Reranking Engine for Alumni Mentorship",
    version="2.0.0",
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


# Request & Response Schemas
class RecommendationRequest(BaseModel):
    career_goal: str = Field(..., example="I want to become an AI Researcher at Google")
    career_domain: Optional[str] = Field(None, example="AI/ML")
    skills: Optional[List[str]] = Field(default_factory=list, example=["Python", "Machine Learning", "PyTorch"])
    college_id: Optional[int] = Field(1, example=1)
    student_id: Optional[str] = Field(None, example="1001")
    limit: Optional[int] = Field(8, example=8)


class FeedbackRequest(BaseModel):
    student_id: str
    alumni_id: int
    query_text: Optional[str] = ""
    target_role: Optional[str] = None
    target_company: Optional[str] = None
    target_domain: Optional[str] = None
    match_score: Optional[float] = None
    match_type: Optional[str] = "EXACT"
    event_type: str = Field("shown", example="clicked")


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "online",
        "service": "BridgeUp AI Service",
        "model": EMBEDDING_MODEL_NAME,
        "embedding_dim": EMBEDDING_DIM
    }


@app.post("/recommend")
def recommend_mentors(req: RecommendationRequest):
    """
    Main Recommendation Endpoint:
    Processes student query through NLP Intent Parser, Sentence-BERT 384-d Embedding,
    Supabase pgvector (Top 30), and 2-Stage Hybrid Re-ranker.
    """
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
        logger.error(f"Error during recommendation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI matching error: {str(e)}"
        )


@app.post("/index/all")
def index_all():
    """
    Index or re-index all 300 alumni profiles into Supabase pgvector table.
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
    Re-index a single alumnus profile when their details are updated.
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


@app.post("/feedback")
def log_feedback(feedback: FeedbackRequest):
    """
    Log recommendation interaction events (shown, clicked, mentorship_requested, etc.).
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
