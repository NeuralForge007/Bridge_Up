import logging
from typing import Dict, Any, List, Optional, Tuple
from ..embeddings.model import encode_text
from ..database.student_vector_repository import search_student_candidates
from ..preprocessing.normalize import normalize_college, get_college_name

logger = logging.getLogger("ai_service.teammate_recommender")

TEAMMATE_BASE_WEIGHTS = {
    "required_skills": 0.35,
    "semantic_compatibility": 0.20,
    "hackathon_experience": 0.12,
    "successful_projects": 0.12,
    "preferred_role": 0.08,
    "domain_compatibility": 0.05,
    "collaboration_mode": 0.04,
    "teammate_rating": 0.02,
    "response_rate": 0.02
}


def compute_adaptive_teammate_weights(
    required_skills: List[str],
    desired_role: Optional[str],
    project_domains: List[str]
) -> Dict[str, float]:
    weights = dict(TEAMMATE_BASE_WEIGHTS)
    if not required_skills:
        weights["required_skills"] = 0.0
    if not desired_role:
        weights["preferred_role"] = 0.0
    if not project_domains:
        weights["domain_compatibility"] = 0.0

    total = sum(weights.values())
    if total > 0:
        for k in weights:
            weights[k] = weights[k] / total
    return weights


def get_teammate_recommendations(
    requirement_id: Optional[str] = None,
    hackathon_id: Optional[int] = None,
    owner_student_id: Optional[int] = None,
    desired_role: Optional[str] = None,
    required_skills: Optional[List[str]] = None,
    project_idea: Optional[str] = None,
    preferred_gender: Optional[str] = None,
    min_hackathons: int = 0,
    min_projects: int = 0,
    preferred_college_id: Optional[int] = None,
    collaboration_mode: Optional[str] = None,
    excluded_student_ids: Optional[List[int]] = None,
    limit: int = 8
) -> Dict[str, Any]:
    """
    Teammate Recommender:
    Builds requirement query embedding -> pgvector / SBERT candidate search -> adaptive hybrid reranker.
    Separates into exact 'matches' and 'near_matches'.
    """
    req_skills = [s.strip() for s in (required_skills or []) if s.strip()]
    role = (desired_role or "").strip()
    pitch = (project_idea or "").strip()

    logger.info(f"Recommending teammates for req='{requirement_id}', role='{role}', skills={req_skills}, college={preferred_college_id}, gender={preferred_gender}")

    # Build semantic requirement query text
    query_text = f"Seeking teammate role: {role}. Required skills: {', '.join(req_skills)}. Project pitch: {pitch}."
    query_embedding = encode_text(query_text, normalize=True)

    # Search top candidates from vector repository with hard filters
    candidates = search_student_candidates(
        query_embedding=query_embedding,
        exclude_student_id=owner_student_id,
        preferred_college_id=preferred_college_id,
        preferred_gender=preferred_gender,
        min_hackathons=min_hackathons,
        min_projects=min_projects,
        match_count=60
    )

    excluded_set = set(excluded_student_ids or [])
    if owner_student_id:
        excluded_set.add(int(owner_student_id))

    filtered_candidates = [c for c in candidates if int(c["student_id"]) not in excluded_set]

    weights = compute_adaptive_teammate_weights(req_skills, role, [])

    exact_matches = []
    near_matches = []

    for c in filtered_candidates:
        sid = c["student_id"]
        profile = c["profile"]
        semantic_sim = c["similarity"]

        cand_skills = profile.get("skills") or []
        cand_skills_lower = [s.lower() for s in cand_skills]

        # 1. Required Skill Coverage (35%)
        matched_skills = []
        if req_skills:
            for rs in req_skills:
                for cs in cand_skills:
                    if rs.lower() == cs.lower() or rs.lower() in cs.lower() or cs.lower() in rs.lower():
                        if cs not in matched_skills:
                            matched_skills.append(cs)
                        break
            skill_score = min(1.0, len(matched_skills) / max(1, len(req_skills)))
        else:
            skill_score = 1.0

        # 2. Semantic Compatibility (20%)
        semantic_score = semantic_sim

        # 3. Hackathon Experience (12%)
        hack_count = profile.get("hackathons_participated") or 0
        if min_hackathons > 0:
            hack_score = min(1.0, hack_count / max(1, min_hackathons))
        else:
            hack_score = min(1.0, hack_count / 5.0)

        # 4. Successful Projects (12%)
        proj_count = profile.get("successful_projects") or profile.get("total_projects") or 0
        if min_projects > 0:
            proj_score = min(1.0, proj_count / max(1, min_projects))
        else:
            proj_score = min(1.0, proj_count / 4.0)

        # 5. Preferred Role Match (8%)
        cand_roles = profile.get("preferred_team_roles") or []
        role_score = 0.4
        if role:
            role_lower = role.lower()
            for cr in cand_roles:
                cr_lower = cr.lower()
                if role_lower == cr_lower:
                    role_score = 1.0
                    break
                elif role_lower in cr_lower or cr_lower in role_lower:
                    role_score = 0.8
        else:
            role_score = 1.0

        # 6. Domain Compatibility (5%)
        domain_score = 0.85

        # 7. Collaboration Mode (4%)
        cand_mode = str(profile.get("collaboration_mode") or "Any").lower()
        req_mode = str(collaboration_mode or "Any").lower()
        if req_mode in ["any", "all", ""] or cand_mode in ["any", "all", ""]:
            mode_score = 1.0
        elif req_mode == cand_mode:
            mode_score = 1.0
        else:
            mode_score = 0.5

        # 8. Teammate Rating (2%)
        rating = float(profile.get("teammate_rating") or 4.0)
        rating_score = min(1.0, rating / 5.0)

        # 9. Response Rate (2%)
        response_rate = float(profile.get("response_rate_percent") or 85.0)
        resp_score = min(1.0, response_rate / 100.0)

        # Composite score calculation (0 to 100)
        composite_score = (
            weights["required_skills"] * skill_score +
            weights["semantic_compatibility"] * semantic_score +
            weights["hackathon_experience"] * hack_score +
            weights["successful_projects"] * proj_score +
            weights["preferred_role"] * role_score +
            weights["domain_compatibility"] * domain_score +
            weights["collaboration_mode"] * mode_score +
            weights["teammate_rating"] * rating_score +
            weights["response_rate"] * resp_score
        ) * 100.0

        # Check exact threshold satisfaction
        meets_skills = (not req_skills) or (len(matched_skills) >= max(1, len(req_skills) - 1))
        meets_hackathons = (min_hackathons == 0) or (hack_count >= min_hackathons)
        meets_projects = (min_projects == 0) or (proj_count >= min_projects)
        is_exact = meets_skills and meets_hackathons and meets_projects and (composite_score >= 70.0)

        reasons = []
        if req_skills:
            reasons.append(f"Matches {len(matched_skills)} of {len(req_skills)} required skills ({', '.join(matched_skills) if matched_skills else 'None'})")
        if hack_count > 0:
            reasons.append(f"Has participated in {hack_count} hackathons")
        if proj_count > 0:
            reasons.append(f"Completed {proj_count} successful projects")
        if role and role_score >= 0.8:
            reasons.append(f"Preferred role aligns with '{role}'")

        breakdown = {
            "skill_coverage": round(skill_score * 100, 1),
            "semantic_similarity": round(semantic_score * 100, 1),
            "hackathon_experience": round(hack_score * 100, 1),
            "project_experience": round(proj_score * 100, 1),
            "role_alignment": round(role_score * 100, 1),
            "mode_compatibility": round(mode_score * 100, 1),
            "teammate_rating": round(rating_score * 100, 1),
            "response_rate": round(resp_score * 100, 1)
        }

        # Safe public display name and avatar
        full_name = profile.get("full_name") or f"Student #{sid}"
        cid = profile.get("college_id") or 1
        cname = get_college_name(cid)

        cand_item = {
            "student_id": sid,
            "id": f"std-{sid}",
            "name": full_name,
            "college_id": cid,
            "college_name": cname,
            "year_of_study": profile.get("year_of_study") or 2,
            "department": profile.get("department") or "Computer Science and Engineering",
            "skills": cand_skills,
            "matched_skills": matched_skills,
            "hackathons_participated": hack_count,
            "successful_projects": proj_count,
            "preferred_team_roles": cand_roles,
            "collaboration_mode": profile.get("collaboration_mode") or "Any",
            "teammate_rating": rating,
            "response_rate_percent": int(response_rate),
            "match_score": round(composite_score, 1),
            "match_type": "EXACT" if is_exact else ("STRONG" if composite_score >= 68.0 else "RELATED"),
            "score_breakdown": breakdown,
            "reasons": reasons,
            "avatar": f"https://api.dicebear.com/7.x/avataaars/svg?seed={encodeURIComponent(full_name)}&mouth=smile&eyes=default&clothing=collarAndSweater&backgroundColor=b6e3f4"
        }

        if is_exact:
            exact_matches.append(cand_item)
        else:
            missing_criteria = []
            if not meets_hackathons:
                missing_criteria.append(f"Requires {min_hackathons} hackathons, candidate has {hack_count}")
            if not meets_projects:
                missing_criteria.append(f"Requires {min_projects} projects, candidate has {proj_count}")
            if not meets_skills:
                missing_criteria.append(f"Missing required skills ({set(req_skills) - set(matched_skills)})")

            cand_item["missing_criteria"] = missing_criteria
            cand_item["reasons"].extend(missing_criteria)
            cand_item["match_type"] = "NEAR_MATCH"
            near_matches.append(cand_item)

    exact_matches.sort(key=lambda x: x["match_score"], reverse=True)
    near_matches.sort(key=lambda x: x["match_score"], reverse=True)

    top_matches = exact_matches[:limit]
    top_near_matches = near_matches[:max(0, limit - len(top_matches))] if not top_matches else near_matches[:4]

    return {
        "requirement_id": requirement_id,
        "exact_match_found": len(exact_matches) > 0,
        "total_candidates": len(exact_matches) + len(near_matches),
        "matches": top_matches if top_matches else top_near_matches,
        "exact_matches": top_matches,
        "near_matches": top_near_matches if top_matches else []
    }


def encodeURIComponent(s: str) -> str:
    import urllib.parse
    return urllib.parse.quote(str(s))
