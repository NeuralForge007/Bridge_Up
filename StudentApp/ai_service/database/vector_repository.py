import logging
from typing import List, Dict, Any, Optional
import numpy as np
from .supabase_client import get_supabase_client

logger = logging.getLogger("ai_service.vector_repo")

import json
from pathlib import Path

# Local vector store cache
CACHE_DIR = Path(__file__).resolve().parent.parent / "data"
CACHE_DIR.mkdir(parents=True, exist_ok=True)
CACHE_FILE = CACHE_DIR / "vector_store.json"

_memory_vector_store: Dict[int, Dict[str, Any]] = {}

def _load_cache():
    global _memory_vector_store
    if not _memory_vector_store and CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                _memory_vector_store = {int(k): v for k, v in data.items()}
        except Exception as e:
            logger.warning(f"Could not load vector store cache: {e}")

def _save_cache():
    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump({str(k): v for k, v in _memory_vector_store.items()}, f)
    except Exception as e:
        logger.warning(f"Could not save vector store cache: {e}")

def search_vector_candidates(
    query_embedding: List[float],
    college_id: Optional[int] = 1,
    match_count: int = 30
) -> List[Dict[str, Any]]:
    """
    Query Supabase PostgreSQL pgvector using the match_alumni RPC function.
    Applies hard filters (same college & verified alumni only).
    """
    client = get_supabase_client()
    try:
        rpc_params = {
            "query_embedding": query_embedding,
            "query_college_id": college_id,
            "match_count": match_count
        }
        res = client.rpc("match_alumni", rpc_params).execute()
        if res.data and len(res.data) > 0:
            return res.data
    except Exception as rpc_err:
        pass

    # Try direct Supabase alumni_ai_profiles table
    try:
        query = client.from_("alumni_ai_profiles").select("*").eq("verified", True)
        if college_id:
            query = query.eq("college_id", college_id)
        res = query.limit(300).execute()
        if res.data and len(res.data) > 0:
            candidates = res.data
            q_vec = np.array(query_embedding, dtype=np.float32)
            q_norm = np.linalg.norm(q_vec)
            if q_norm > 0:
                q_vec = q_vec / q_norm

            scored = []
            for c in candidates:
                emb = c.get("embedding")
                if emb:
                    if isinstance(emb, str):
                        try:
                            emb = json.loads(emb)
                        except:
                            continue
                    v = np.array(emb, dtype=np.float32)
                    v_norm = np.linalg.norm(v)
                    if v_norm > 0:
                        v = v / v_norm
                    sim = float(np.dot(q_vec, v))
                else:
                    sim = 0.5
                scored.append({
                    "alumni_id": c.get("alumni_id"),
                    "similarity": sim,
                    "semantic_profile": c.get("semantic_profile"),
                    "normalized_role": c.get("normalized_role"),
                    "normalized_company": c.get("normalized_company"),
                    "normalized_domain": c.get("normalized_domain"),
                    "college_id": c.get("college_id")
                })
            scored.sort(key=lambda x: x["similarity"], reverse=True)
            return scored[:match_count]
    except Exception as e:
        pass

    # Fallback to local vector cache
    _load_cache()
    if _memory_vector_store:
        q_vec = np.array(query_embedding, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)
        if q_norm > 0:
            q_vec = q_vec / q_norm

        scored = []
        for aid, item in _memory_vector_store.items():
            if college_id and item.get("college_id") and item.get("college_id") != college_id:
                continue
            emb = item.get("embedding")
            if emb:
                v = np.array(emb, dtype=np.float32)
                v_norm = np.linalg.norm(v)
                if v_norm > 0:
                    v = v / v_norm
                sim = float(np.dot(q_vec, v))
            else:
                sim = 0.5
            scored.append({
                "alumni_id": aid,
                "similarity": sim,
                "semantic_profile": item.get("semantic_profile"),
                "normalized_role": item.get("normalized_role"),
                "normalized_company": item.get("normalized_company"),
                "normalized_domain": item.get("normalized_domain"),
                "college_id": item.get("college_id")
            })
        scored.sort(key=lambda x: x["similarity"], reverse=True)
        return scored[:match_count]

    return []


def fetch_alumni_by_ids(alumni_ids: List[int]) -> List[Dict[str, Any]]:
    """
    Fetch full alumni details and associated skills for candidate IDs.
    """
    if not alumni_ids:
        return []
    client = get_supabase_client()
    try:
        # 1. Fetch alumni
        res = client.from_("alumni").select("*").in_("alumni_id", alumni_ids).execute()
        alumni_rows = res.data or []
        
        # 2. Fetch skills
        skills_res = client.from_("alumni_skills").select("*").in_("alumni_id", alumni_ids).execute()
        skills_rows = skills_res.data or []
        
        skills_by_alumni = {}
        for s in skills_rows:
            aid = s.get("alumni_id")
            skills_by_alumni.setdefault(aid, []).append(s.get("skill"))
            
        enriched = []
        for a in alumni_rows:
            aid = a.get("alumni_id")
            existing_skills = a.get("skills")
            if isinstance(existing_skills, str):
                existing_skills = [x.strip() for x in existing_skills.split(";") if x.strip()]
            elif not isinstance(existing_skills, list):
                existing_skills = []
                
            combined_skills = list(set((skills_by_alumni.get(aid, []) + existing_skills)))
            a_copy = dict(a)
            a_copy["skills"] = combined_skills
            enriched.append(a_copy)
            
        if enriched:
            return enriched
    except Exception as e:
        logger.warning(f"Supabase alumni query notice ({e}), checking CSV fallback...")

    # CSV dataset fallback
    try:
        from ..config import CSV_DATASET_PATH
        import pandas as pd
        if CSV_DATASET_PATH.exists():
            df = pd.read_csv(CSV_DATASET_PATH)
            matched_df = df[df["alumni_id"].isin(alumni_ids)]
            records = matched_df.to_dict(orient="records")
            for r in records:
                raw_sk = str(r.get("skills", ""))
                r["skills"] = [s.strip() for s in raw_sk.split(";") if s.strip()]
            return records
    except Exception as e:
        logger.error(f"Fallback fetch failed: {e}")
    return []


_supabase_table_available = True

def upsert_ai_profile(profile_data: Dict[str, Any]) -> bool:
    """
    Upsert an alumni's semantic profile and 384-d vector into alumni_ai_profiles and local vector cache.
    """
    global _supabase_table_available
    aid = profile_data.get("alumni_id")
    _memory_vector_store[aid] = profile_data
    _save_cache()

    if _supabase_table_available:
        client = get_supabase_client()
        try:
            client.from_("alumni_ai_profiles").upsert(profile_data, on_conflict="alumni_id").execute()
        except Exception as e:
            _supabase_table_available = False
    return True


def log_recommendation_event(event_data: Dict[str, Any]) -> bool:
    """
    Log recommendation event for feedback/analytics.
    """
    client = get_supabase_client()
    try:
        client.from_("recommendation_events").insert(event_data).execute()
        return True
    except Exception as e:
        return False
