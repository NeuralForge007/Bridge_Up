import sys
import os
import logging
from pathlib import Path
import pandas as pd
from typing import Optional, List, Dict, Any

# Ensure parent directory is in path for module imports
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR.parent) not in sys.path:
    sys.path.insert(0, str(BASE_DIR.parent))

from ai_service.config import CSV_DATASET_PATH
from ai_service.database.supabase_client import get_supabase_client
from ai_service.database.vector_repository import upsert_ai_profile
from ai_service.embeddings.model import encode_text, get_embedding_model
from ai_service.preprocessing.normalize import (
    normalize_role,
    normalize_company,
    normalize_domain,
    normalize_skill_list
)
from ai_service.preprocessing.profile_builder import build_alumni_semantic_profile

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ai_service.indexer")


def index_single_alumnus(alumni_id: int) -> bool:
    """
    Re-index a single alumnus when their profile fields change.
    """
    logger.info(f"Re-indexing single alumnus ID: {alumni_id}...")
    client = get_supabase_client()
    try:
        # Fetch alumnus
        res = client.from_("alumni").select("*").eq("alumni_id", alumni_id).maybe_single().execute()
        alumnus = res.data
        if not alumnus:
            logger.warning(f"Alumnus {alumni_id} not found in database.")
            return False

        # Fetch skills
        skills_res = client.from_("alumni_skills").select("skill").eq("alumni_id", alumni_id).execute()
        skills_list = [s["skill"] for s in (skills_res.data or [])]
        
        existing_skills = alumnus.get("skills")
        if isinstance(existing_skills, str):
            existing_skills = [x.strip() for x in existing_skills.split(";") if x.strip()]
        elif not isinstance(existing_skills, list):
            existing_skills = []
            
        combined_skills = normalize_skill_list(skills_list + existing_skills)
        alumnus["skills"] = combined_skills

        # Build semantic text
        semantic_profile = build_alumni_semantic_profile(alumnus)
        # Generate embedding
        embedding = encode_text(semantic_profile, normalize=True)

        # Upsert
        profile_data = {
            "alumni_id": alumni_id,
            "semantic_profile": semantic_profile,
            "embedding": embedding,
            "normalized_role": normalize_role(alumnus.get("current_role") or alumnus.get("role_title") or ""),
            "normalized_company": normalize_company(alumnus.get("company") or ""),
            "normalized_domain": normalize_domain(alumnus.get("career_domain") or ""),
            "college_id": alumnus.get("college_id") or 1,
            "verified": alumnus.get("verification_status") == "Verified" or alumnus.get("verified") in ["Yes", True],
            "available_for_mentorship": (alumnus.get("availability") or "").lower() != "unavailable",
            "updated_at": "now()"
        }

        success = upsert_ai_profile(profile_data)
        if success:
            logger.info(f"✅ Successfully re-indexed alumnus {alumni_id} ({alumnus.get('full_name')})")
        return success
    except Exception as e:
        logger.error(f"Failed to re-index alumnus {alumni_id}: {e}")
        return False


def index_all_alumni(force_csv_fallback: bool = False) -> int:
    """
    Generate Sentence-BERT 384-d embeddings for all verified alumni and save to Supabase pgvector.
    """
    logger.info("=========================================================")
    logger.info("🚀 Starting Alumni Vector Indexing Pipeline...")
    logger.info("=========================================================")

    # Warm up SBERT model
    get_embedding_model()

    client = get_supabase_client()
    alumni_records: List[Dict[str, Any]] = []

    if not force_csv_fallback:
        try:
            logger.info("Querying Supabase 'alumni' table...")
            res = client.from_("alumni").select("*").execute()
            if res.data and len(res.data) > 0:
                alumni_records = res.data
                logger.info(f"Retrieved {len(alumni_records)} alumni from Supabase.")
        except Exception as e:
            logger.warning(f"Could not read from Supabase alumni table ({e}). Using CSV dataset fallback...")

    # Fallback to CSV if Supabase table is empty or unpopulated
    if not alumni_records:
        if not CSV_DATASET_PATH.exists():
            logger.error(f"CSV dataset not found at: {CSV_DATASET_PATH}")
            return 0
        logger.info(f"Reading synthetic dataset directly from CSV: {CSV_DATASET_PATH}")
        df = pd.read_csv(CSV_DATASET_PATH)
        alumni_records = df.to_dict(orient="records")

    logger.info(f"Processing and embedding {len(alumni_records)} alumni profiles...")

    indexed_count = 0
    for idx, a in enumerate(alumni_records, start=1):
        alumni_id = int(a.get("alumni_id"))
        
        # Parse skills
        raw_skills = a.get("skills")
        if isinstance(raw_skills, str):
            skills = [s.strip() for s in raw_skills.split(";") if s.strip()]
        elif isinstance(raw_skills, list):
            skills = [str(s).strip() for s in raw_skills]
        else:
            skills = []
        skills = normalize_skill_list(skills)
        a["skills"] = skills

        # 1. Build rich semantic profile
        semantic_profile = build_alumni_semantic_profile(a)

        # 2. Generate normalized 384-dimensional SBERT embedding
        embedding = encode_text(semantic_profile, normalize=True)

        role = a.get("current_role") or a.get("role_title") or ""
        company = a.get("company") or ""
        domain = a.get("career_domain") or ""

        # 3. Prepare AI Profile Record
        profile_data = {
            "alumni_id": alumni_id,
            "semantic_profile": semantic_profile,
            "embedding": embedding,
            "normalized_role": normalize_role(role),
            "normalized_company": normalize_company(company),
            "normalized_domain": normalize_domain(domain),
            "college_id": int(a.get("college_id") or 1),
            "verified": True,
            "available_for_mentorship": str(a.get("availability")).lower() != "unavailable"
        }

        # 4. Upsert to pgvector table
        if upsert_ai_profile(profile_data):
            indexed_count += 1
            if idx % 50 == 0 or idx == len(alumni_records):
                logger.info(f"Indexed {idx}/{len(alumni_records)} alumni vectors...")

    logger.info("=========================================================")
    logger.info(f"✨ Alumni Indexing Complete! Indexed {indexed_count} profiles with 384-d SBERT vectors.")
    logger.info("=========================================================")
    return indexed_count


if __name__ == "__main__":
    count = index_all_alumni()
    print(f"Total alumni indexed: {count}")
