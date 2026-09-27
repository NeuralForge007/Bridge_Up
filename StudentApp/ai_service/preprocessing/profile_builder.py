from typing import Dict, Any, List
from .normalize import clean_text, get_college_name, normalize_college

def build_alumni_semantic_profile(alumni: Dict[str, Any]) -> str:
    """
    Construct high-fidelity semantic text for an alumnus profile to embed with Sentence-BERT.
    """
    college_id = normalize_college(alumni.get("college_id"))
    college_name = alumni.get("college_name") or get_college_name(college_id)
    role = alumni.get("current_role") or alumni.get("role_title") or "Software Engineer"
    company = alumni.get("company") or "Tech Organization"
    domain = alumni.get("career_domain") or "Software Engineering"
    
    # Skills formatting
    raw_skills = alumni.get("skills") or []
    if isinstance(raw_skills, str):
        skills_list = [s.strip() for s in raw_skills.split(";") if s.strip()]
    elif isinstance(raw_skills, list):
        skills_list = [str(s).strip() for s in raw_skills if str(s).strip()]
    else:
        skills_list = []
    skills_text = ", ".join(skills_list) if skills_list else "General Technical Skills"

    exp_years = alumni.get("experience_years") or 0
    career_path = alumni.get("career_path") or f"{college_name} → {role} @ {company}"
    bio = alumni.get("bio") or ""

    profile_parts = [
        f"College: {college_name}.",
        f"Current career role: {role}.",
        f"Organization: {company}.",
        f"Career domain: {domain}.",
        f"Technical skills: {skills_text}.",
        f"Professional experience: {exp_years} years.",
        f"Career path: {career_path}."
    ]
    if bio:
        profile_parts.append(f"Profile: {bio}")

    return " ".join(profile_parts)


def build_student_query_profile(
    parsed_intent: Dict[str, Any],
    raw_query: str = "",
    skills: List[str] = None,
    college_name: str = ""
) -> str:
    """
    Construct high-fidelity semantic query text for the student to embed with Sentence-BERT.
    """
    target_role = parsed_intent.get("target_role") or "Software Engineer"
    target_company = parsed_intent.get("target_company")
    target_domain = parsed_intent.get("target_domain") or "Software Engineering"
    
    skills_list = skills or parsed_intent.get("skills") or []
    skills_text = ", ".join(skills_list) if skills_list else "General Technical Skills"

    goal = raw_query or parsed_intent.get("career_goal") or f"Become a {target_role}"

    parts = []
    if college_name:
        parts.append(f"College: {college_name}.")
    parts.append(f"Desired career role: {target_role.title() if target_role else 'Engineering Professional'}.")
    if target_company:
        parts.append(f"Target organization: {target_company}.")
    parts.append(f"Career domain: {target_domain}.")
    parts.append(f"Current technical skills: {skills_text}.")
    parts.append(f"Career objective: {goal}.")

    return " ".join(parts)
