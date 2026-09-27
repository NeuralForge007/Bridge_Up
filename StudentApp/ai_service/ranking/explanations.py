from typing import List, Dict, Any
from ..preprocessing.normalize import get_college_name, normalize_college

def generate_reasons(
    alumni: Dict[str, Any],
    score_breakdown: Dict[str, float],
    matched_skills: List[str],
    target_intent: Dict[str, Any]
) -> List[str]:
    """
    Generate deterministic, feature-derived explanation bullet points for recommendation cards.
    """
    reasons = []

    # 1. College Alignment (Hard Filter)
    college_id = normalize_college(alumni.get("college_id") or 1)
    college_name = alumni.get("college_name") or get_college_name(college_id)
    reasons.append(f"✓ Same college: {college_name}")

    # 2. Company Alignment
    target_company = target_intent.get("target_company")
    alumni_company = alumni.get("company")
    if target_company and alumni_company and target_company.lower() in alumni_company.lower():
        reasons.append(f"✓ Works at target organization: {alumni_company}")
    elif alumni_company:
        reasons.append(f"✓ Industry leader at {alumni_company}")

    # 3. Role Alignment
    role_score = score_breakdown.get("role_score", 0)
    current_role = alumni.get("current_role") or alumni.get("role_title") or "Engineer"
    if role_score >= 90.0:
        reasons.append(f"✓ Exact target career role: {current_role}")
    elif role_score >= 75.0:
        reasons.append(f"✓ Strong career-role alignment: {current_role}")
    elif role_score >= 50.0:
        reasons.append(f"✓ Relevant career pathway: {current_role}")

    # 4. Skills Match
    if matched_skills:
        reasons.append(f"✓ Matches {len(matched_skills)} target skills ({', '.join(matched_skills[:3])})")
    elif alumni.get("skills"):
        top_skills = [str(s).title() for s in (alumni.get("skills") or [])[:3]]
        reasons.append(f"✓ Strong foundation in {', '.join(top_skills)}")

    # 5. Career Path / Experience
    career_path = alumni.get("career_path")
    exp_years = alumni.get("experience_years") or 0
    if career_path and "→" in career_path:
        reasons.append(f"✓ Trajectory: {career_path}")
    elif exp_years > 0:
        reasons.append(f"✓ {exp_years}+ years of professional domain experience")

    # 6. Availability & Mentorship Rating
    availability = alumni.get("availability") or "Available"
    rating = alumni.get("mentor_rating") or 4.8
    if availability.lower() == "available":
        reasons.append(f"✓ Available for 1:1 mentorship (⭐ {rating}/5.0)")

    return reasons[:5]
