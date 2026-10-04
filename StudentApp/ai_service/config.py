import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / "backend" / ".env")
load_dotenv(BASE_DIR.parent / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

AI_SERVICE_HOST = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", "8001"))

EMBEDDING_MODEL_NAME = os.getenv("SBERT_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
EMBEDDING_DIM = int(os.getenv("EMBEDDING_DIM", "384"))

# Configure Sentence-Transformers cache dir if set
SENTENCE_TRANSFORMERS_HOME = os.getenv("SENTENCE_TRANSFORMERS_HOME")
if SENTENCE_TRANSFORMERS_HOME:
    os.environ["SENTENCE_TRANSFORMERS_HOME"] = SENTENCE_TRANSFORMERS_HOME

# Centralized Scoring Weights (Normalized to 100%)
DEFAULT_WEIGHTS = {
    "semantic_similarity": 0.25,
    "target_role": 0.25,
    "target_company": 0.20,
    "skill_compatibility": 0.15,
    "career_domain": 0.05,
    "relevant_experience": 0.05,
    "availability": 0.03,
    "mentor_rating": 0.02
}

CSV_DATASET_PATH = BASE_DIR.parent / "backend" / "bridgeup_kolkata_alumni_dataset.csv"

def get_safe_config_summary() -> dict:
    """Return safe configuration info without exposing secret keys."""
    return {
        "service_host": AI_SERVICE_HOST,
        "service_port": AI_SERVICE_PORT,
        "embedding_model": EMBEDDING_MODEL_NAME,
        "embedding_dim": EMBEDDING_DIM,
        "supabase_configured": bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY),
        "dataset_path_exists": CSV_DATASET_PATH.exists()
    }
