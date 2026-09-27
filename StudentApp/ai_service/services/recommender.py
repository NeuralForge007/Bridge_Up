import logging
from typing import Dict, Any, List, Optional
from ..preprocessing.career_parser import parse_career_intent
from ..preprocessing.profile_builder import build_student_query_profile
from ..preprocessing.normalize import normalize_college, get_college_name
from ..embeddings.model import encode_text
from ..database.vector_repository import (
    search_vector_candidates,
    fetch_alumni_by_ids,
    log_recommendation_event
)
from ..ranking.hybrid_ranker import rank_candidates

logger = logging.getLogger("ai_service.recommender")

def get_mentor_recommendations(
    career_goal: str,
    career_domain: Optional[str] = None,
    skills: Optional[List[str]] = None,
    college_id: Optional[any] = 1,
    student_id: Optional[str] = None,
    limit: int = 8
) -> Dict[str, Any]:
    """
    Main recommendation orchestrator:
    Student Query -> Intent Parser -> SBERT 384-d Embedding -> pgvector Retrieval (Top 30) -> Hybrid Reranker -> Top Matches.
    """
    cid = normalize_college(college_id)
    cname = get_college_name(cid)

    logger.info(f"Generating mentor recommendations for query: '{career_goal}' | Domain: {career_domain} | College: {cid} ({cname})")

    # 1. Career Intent Extraction
    parsed_intent = parse_career_intent(
        query_text=career_goal,
        domain_hint=career_domain,
        skills_hint=skills
    )

    # 2. Build Student Semantic Profile
    semantic_query_text = build_student_query_profile(
        parsed_intent=parsed_intent,
        raw_query=career_goal,
        skills=skills,
        college_name=cname
    )

    # 3. Generate 384-dimensional Normalized SBERT Embedding
    query_embedding = encode_text(semantic_query_text, normalize=True)

    # 4. pgvector Retrieval: Hard filter same college and verified alumni (Top 30)
    vector_candidates = search_vector_candidates(
        query_embedding=query_embedding,
        college_id=cid,
        match_count=30
    )
    logger.info(f"Retrieved {len(vector_candidates)} initial vector candidates from pgvector for college {cid}.")

    if not vector_candidates:
        return {
            "query": {
                "target_role": parsed_intent.get("target_role"),
                "target_company": parsed_intent.get("target_company"),
                "target_domain": parsed_intent.get("target_domain"),
                "skills": parsed_intent.get("skills", [])
            },
            "student_college": {
                "id": cid,
                "name": cname
            },
            "exact_match_found": False,
            "total_candidates": 0,
            "matches": []
        }

    # 5. Fetch Full Alumni Data with Skills
    candidate_ids = [c["alumni_id"] for c in vector_candidates if c.get("alumni_id")]
    full_alumni_records = fetch_alumni_by_ids(candidate_ids)
    
    # Merge similarity into full records
    sim_map = {c["alumni_id"]: c.get("similarity", 0.5) for c in vector_candidates}
    for a in full_alumni_records:
        a["similarity"] = sim_map.get(a.get("alumni_id"), 0.5)

    # 6. Stage 2: Hybrid Re-ranking with Adaptive Weights
    ranked_matches, exact_match_found = rank_candidates(
        candidates=full_alumni_records,
        target_intent=parsed_intent
    )

    final_top_matches = ranked_matches[:limit]

    # 7. Log Recommendation Event (Analytics)
    if student_id and final_top_matches:
        top_match = final_top_matches[0]
        log_recommendation_event({
            "student_id": str(student_id),
            "alumni_id": top_match.get("alumni_id"),
            "query_text": career_goal,
            "target_role": parsed_intent.get("target_role"),
            "target_company": parsed_intent.get("target_company"),
            "target_domain": parsed_intent.get("target_domain"),
            "match_score": top_match.get("match_score"),
            "match_type": top_match.get("match_type"),
            "event_type": "shown"
        })

    logger.info(f"Successfully ranked {len(ranked_matches)} alumni. Returning top {len(final_top_matches)} matches (Exact match: {exact_match_found}).")

    return {
        "query": {
            "target_role": parsed_intent.get("target_role"),
            "target_company": parsed_intent.get("target_company"),
            "target_domain": parsed_intent.get("target_domain"),
            "skills": parsed_intent.get("skills", [])
        },
        "student_college": {
            "id": cid,
            "name": cname
        },
        "exact_match_found": exact_match_found,
        "total_candidates": len(ranked_matches),
        "matches": final_top_matches
    }
