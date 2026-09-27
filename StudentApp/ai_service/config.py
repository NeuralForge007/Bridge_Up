import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / "backend" / ".env")
load_dotenv(BASE_DIR.parent / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://qcgekkenmgycmnhraxia.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjZ2Vra2VubWd5Y21uaHJheGlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDUwNDM3MSwiZXhwIjoyMTA2MDgwMzcxfQ.FR_k8rI75g3twaLNqQIT51_AHPspd_l--BIVRycen_M"
)
SUPABASE_ANON_KEY = os.getenv(
    "SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjZ2Vra2VubWd5Y21uaHJheGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MDQzNzEsImV4cCI6MjEwNjA4MDM3MX0.8XsGzesadLI_-WXSK6_Xfl9wJ97CPB1QMDaPSq7jWvU"
)

AI_SERVICE_HOST = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", "8001"))

EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIM = 384

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
