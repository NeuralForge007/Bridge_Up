import logging
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
import numpy as np

logger = logging.getLogger("ai_service.student_vector_repo")

CACHE_DIR = Path(__file__).resolve().parent.parent / "data"
CACHE_DIR.mkdir(parents=True, exist_ok=True)
STUDENT_CACHE_FILE = CACHE_DIR / "student_vector_store.json"

_student_vector_store: Dict[int, Dict[str, Any]] = {}

def _load_student_cache():
    global _student_vector_store
    if not _student_vector_store and STUDENT_CACHE_FILE.exists():
        try:
            with open(STUDENT_CACHE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                _student_vector_store = {int(k): v for k, v in data.items()}
        except Exception as e:
            logger.warning(f"Could not load student vector store cache: {e}")

def _save_student_cache():
    try:
        with open(STUDENT_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump({str(k): v for k, v in _student_vector_store.items()}, f)
    except Exception as e:
        logger.warning(f"Could not save student vector store cache: {e}")

def upsert_student_ai_profile(profile_data: Dict[str, Any]) -> bool:
    """
    Store student vector profile in memory and disk cache.
    """
    _load_student_cache()
    sid = int(profile_data.get("student_id"))
    _student_vector_store[sid] = profile_data
    _save_student_cache()
    return True

def get_all_student_vector_profiles() -> Dict[int, Dict[str, Any]]:
    _load_student_cache()
    return _student_vector_store

def search_student_candidates(
    query_embedding: List[float],
    exclude_student_id: Optional[int] = None,
    preferred_college_id: Optional[int] = None,
    preferred_gender: Optional[str] = None,
    min_hackathons: int = 0,
    min_projects: int = 0,
    match_count: int = 50
) -> List[Dict[str, Any]]:
    """
    Search student candidates applying hard filters and computing cosine similarity.
    Hard filters:
      - candidate student_id != exclude_student_id
      - verification_status == 'Verified' (or Active)
      - profile_visibility != 'Private'
      - open_to_team_requests == True
      - gender match if preferred_gender not in [None, '', 'ANY', 'Any']
      - college match if preferred_college_id not in [None, '', 'ANY', 'Any', 0]
    """
    _load_student_cache()
    if not _student_vector_store:
        return []

    q_vec = np.array(query_embedding, dtype=np.float32)
    q_norm = np.linalg.norm(q_vec)
    if q_norm > 0:
        q_vec = q_vec / q_norm

    scored_candidates = []
    norm_pref_gender = (preferred_gender or "").strip().lower()
    apply_gender_filter = norm_pref_gender and norm_pref_gender not in ["any", "all", "none", ""]

    for sid, item in _student_vector_store.items():
        # 1. Exclude requester
        if exclude_student_id and int(sid) == int(exclude_student_id):
            continue

        # 2. Hard filter: open to team requests
        if not item.get("open_to_team_requests", True):
            continue

        # 3. Hard filter: profile visibility
        vis = str(item.get("profile_visibility", "")).lower()
        if vis in ["private", "hidden"]:
            continue

        # 4. Hard filter: gender if explicitly requested
        if apply_gender_filter:
            cand_gender = str(item.get("gender", "")).strip().lower()
            if cand_gender != norm_pref_gender:
                continue

        # 5. Hard filter: college if explicitly specified (not None / not 0 / not ANY)
        if preferred_college_id and int(preferred_college_id) > 0:
            if int(item.get("college_id", 0)) != int(preferred_college_id):
                continue

        # Compute cosine similarity
        emb = item.get("embedding")
        if emb:
            v = np.array(emb, dtype=np.float32)
            v_norm = np.linalg.norm(v)
            if v_norm > 0:
                v = v / v_norm
            sim = float(np.dot(q_vec, v))
        else:
            sim = 0.5

        scored_candidates.append({
            "student_id": sid,
            "similarity": max(0.0, min(1.0, sim)),
            "profile": item
        })

    scored_candidates.sort(key=lambda x: x["similarity"], reverse=True)
    return scored_candidates[:match_count]
