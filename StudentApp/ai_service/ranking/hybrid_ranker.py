from typing import List, Dict, Any, Tuple
from ..config import DEFAULT_WEIGHTS
from ..preprocessing.normalize import (
    normalize_company,
    get_domain_similarity,
    normalize_college,
    get_college_name
)
from .role_matcher import calculate_role_match
from .skill_matcher import calculate_skill_overlap
from .explanations import generate_reasons

def compute_adaptive_weights(target_intent: Dict[str, Any]) -> Dict[str, float]:
    """
    Dynamically adapt feature weights based on provided user intent.
    If company, role, domain, or skills are omitted, their weight is redistributed proportionally to 100%.
    """
    weights = dict(DEFAULT_WEIGHTS)
    
    # Check if target company was explicitly specified
    if not target_intent.get("target_company"):
        weights["target_company"] = 0.0

    # Check if target role was explicitly specified
    if not target_intent.get("target_role"):
        weights["target_role"] = 0.0

    # Check if skills were provided
    if not target_intent.get("skills") or len(target_intent.get("skills")) == 0:
        weights["skill_compatibility"] = 0.0

    # Normalize active weights to sum exactly to 1.0
    total_weight = sum(weights.values())
    if total_weight > 0:
        for k in weights:
            weights[k] = weights[k] / total_weight

    return weights


def rank_candidates(
    candidates: List[Dict[str, Any]],
    target_intent: Dict[str, Any]
) -> Tuple[List[Dict[str, Any]], bool]:
    """
    Stage 2: Hybrid Reranking of retrieved vector candidates.
    Returns (ranked_matches, exact_match_found).
    """
    if not candidates:
        return [], False

    target_role = target_intent.get("target_role")
    target_company = target_intent.get("target_company")
    target_domain = target_intent.get("target_domain")
    target_skills = target_intent.get("skills") or []

    weights = compute_adaptive_weights(target_intent)
    ranked_list = []
    exact_match_found = False

    for cand in candidates:
        semantic_sim = cand.get("similarity", 0.5)  # 0.0 to 1.0 from SBERT + pgvector
        
        # 1. Target Role Score
        cand_role = cand.get("current_role") or cand.get("role_title") or ""
        role_score, role_match_type = calculate_role_match(target_role, cand_role)

        # 2. Target Company Score
        cand_company = cand.get("company") or ""
        company_score = 0.2
        if target_company:
            norm_target_co = normalize_company(target_company)
            norm_cand_co = normalize_company(cand_company)
            if norm_target_co.lower() == norm_cand_co.lower():
                company_score = 1.0
            elif norm_target_co.lower() in norm_cand_co.lower() or norm_cand_co.lower() in norm_target_co.lower():
                company_score = 0.85
            else:
                company_score = 0.10
        else:
            company_score = 1.0

        # 3. Skill Overlap Score
        cand_skills = cand.get("skills") or []
        skill_score, matched_skills = calculate_skill_overlap(target_skills, cand_skills)

        # 4. Domain Compatibility Score
        cand_domain = cand.get("career_domain") or "Software Engineering"
        domain_score = get_domain_similarity(target_domain, cand_domain) if target_domain else 0.85

        # 5. Experience Score (normalized up to 15 years)
        exp_years = cand.get("experience_years") or 0
        exp_score = min(1.0, 0.4 + (exp_years / 15.0) * 0.6)

        # 6. Availability Score
        availability = cand.get("availability") or "Available"
        avail_score = 1.0 if availability.lower() == "available" else (0.6 if availability.lower() == "limited" else 0.2)

        # 7. Mentor Rating Score
        rating = float(cand.get("mentor_rating") or 4.5)
        rating_score = min(1.0, rating / 5.0)

        # Calculate Final Composite Match Score (0.0 to 100.0)
        composite_score = (
            weights["semantic_similarity"] * semantic_sim +
            weights["target_role"] * role_score +
            weights["target_company"] * company_score +
            weights["skill_compatibility"] * skill_score +
            weights["career_domain"] * domain_score +
            weights["relevant_experience"] * exp_score +
            weights["availability"] * avail_score +
            weights["mentor_rating"] * rating_score
        ) * 100.0

        # High-precision classification
        is_exact_company = (not target_company) or (company_score >= 0.85)
        is_exact_role = (not target_role) or (role_score >= 0.90)
        is_exact_domain = (not target_domain) or (domain_score >= 0.80)

        if is_exact_company and is_exact_role and is_exact_domain and composite_score >= 80.0:
            match_type = "EXACT"
            exact_match_found = True
        elif (is_exact_role or is_exact_company) and composite_score >= 68.0:
            match_type = "STRONG"
        else:
            match_type = "RELATED"

        breakdown = {
            "semantic_similarity": round(semantic_sim * 100, 1),
            "role_score": round(role_score * 100, 1),
            "company_score": round(company_score * 100, 1),
            "skill_score": round(skill_score * 100, 1),
            "domain_score": round(domain_score * 100, 1),
            "experience_score": round(exp_score * 100, 1)
        }

        reasons = generate_reasons(cand, breakdown, matched_skills, target_intent)

        # Synthesize natural explanation
        first_role = cand_role or 'Professional'
        first_comp = cand_company or 'Tech Organization'
        explanation = f"Matched ({round(composite_score, 1)}% {match_type.title()} Match) as {cand.get('name')} is a verified {first_role} at {first_comp}."

        cid = normalize_college(cand.get("college_id") or 1)
        cname = cand.get("college_name") or get_college_name(cid)

        final_item = {
            "alumni_id": cand.get("alumni_id"),
            "id": cand.get("id") or f"alm-{cand.get('alumni_id')}",
            "name": cand.get("name") or cand.get("full_name"),
            "full_name": cand.get("full_name") or cand.get("name"),
            "email": cand.get("email"),
            "college_id": cid,
            "college_name": cname,
            "current_role": first_role,
            "role_title": first_role,
            "company": first_comp,
            "career_domain": cand_domain,
            "skills": cand_skills,
            "matched_skills": matched_skills,
            "experience_years": exp_years,
            "graduation_year": cand.get("graduation_year") or 2020,
            "grad_year": cand.get("graduation_year") or 2020,
            "availability": availability,
            "mentor_rating": rating,
            "rating": rating,
            "bio": cand.get("bio") or "",
            "career_path": cand.get("career_path") or f"{cname} → {first_role} @ {first_comp}",
            "avatar": cand.get("avatar") or f"https://api.dicebear.com/7.x/avataaars/svg?seed=${cand.get('alumni_id')}&mouth=smile&eyes=default&clothing=blazerAndShirt&backgroundColor=c0aede",
            "match_score": round(composite_score, 1),
            "matchScore": round(composite_score, 1),
            "match_type": match_type,
            "matchType": match_type,
            "semantic_similarity": round(semantic_sim, 3),
            "reasons": reasons,
            "matchRationale": reasons[1] if len(reasons) > 1 else explanation,
            "aiExplanation": explanation,
            "score_breakdown": breakdown,
            "scoreBreakdown": breakdown
        }
        ranked_list.append(final_item)

    # Sort descending by final composite match score
    ranked_list.sort(key=lambda x: x["match_score"], reverse=True)
    return ranked_list, exact_match_found
