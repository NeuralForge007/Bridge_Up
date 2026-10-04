import sys
import os
import logging``
import argparse
from pathlib import Path
from typing import Optional, List, Dict, Any

# Ensure parent directory is in path for module imports
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR.parent) not in sys.path:
    sys.path.insert(0, str(BASE_DIR.parent))

from ai_service.database.supabase_client import get_supabase_client
from ai_service.embeddings.model import encode_text, get_embedding_model
from ai_service.database.student_vector_repository import (
    upsert_student_ai_profile,
    get_all_student_vector_profiles
)
from ai_service.preprocessing.normalize import normalize_skill_list

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("ai_service.student_indexer")


def build_student_semantic_profile(student: Dict[str, Any]) -> str:
    """
    Build a career-safe, privacy-preserving semantic profile for student teammate matching.
    Includes: skills, preferred roles, project domains, career domain, bio, collaboration mode, experience counts.
    Strictly excludes: email, password, private contact info, gender, CGPA.
    """
    skills = student.get("skills") or []
    if isinstance(skills, str):
        skills = [s.strip() for s in skills.split(";") if s.strip()]
    
    meta = student.get("projects") or {}
    if not isinstance(meta, dict):
        meta = {}

    preferred_roles = meta.get("preferred_team_roles") or []
    if isinstance(preferred_roles, str):
        preferred_roles = [r.strip() for r in preferred_roles.split(";") if r.strip()]

    project_domains = meta.get("project_domains") or []
    if isinstance(project_domains, str):
        project_domains = [d.strip() for d in project_domains.split(";") if d.strip()]

    career_domain = student.get("career_domain") or "Software Engineering"
    career_goal = student.get("career_goal") or ""
    primary_skill = student.get("primary_skill") or ""
    bio = student.get("bio") or ""
    collaboration_mode = meta.get("collaboration_mode") or "Any"
    hackathons = meta.get("hackathons_participated") or 0
    projects = meta.get("total_projects") or 0
    leadership = "Experienced in team leadership. " if meta.get("team_leadership_experience") else ""

    parts = [
        f"Career Domain: {career_domain}.",
        f"Primary Skill: {primary_skill}.",
        f"Technical Skills: {', '.join(skills)}.",
        f"Preferred Team Roles: {', '.join(preferred_roles)}.",
        f"Project Domains: {', '.join(project_domains)}.",
        f"Collaboration Mode: {collaboration_mode}.",
        f"Experience: Participated in {hackathons} hackathons and built {projects} projects. {leadership}",
        f"Career Goal: {career_goal}.",
        f"About: {bio}"
    ]

    return " ".join([p for p in parts if p.strip()])


def index_single_student(student_id: int) -> bool:
    """
    Re-index a single student when profile fields change.
    """
    logger.info(f"Re-indexing student ID: {student_id}...")
    client = get_supabase_client()
    try:
        res = client.from_("students").select("*").eq("student_id", student_id).maybe_single().execute()
        student = res.data
        if not student:
            logger.warning(f"Student {student_id} not found in database.")
            return False

        semantic_profile = build_student_semantic_profile(student)
        embedding = encode_text(semantic_profile, normalize=True)

        meta = student.get("projects") or {}
        if not isinstance(meta, dict):
            meta = {}

        skills = student.get("skills") or []
        if isinstance(skills, str):
            skills = [s.strip() for s in skills.split(";") if s.strip()]

        preferred_roles = meta.get("preferred_team_roles") or []
        if isinstance(preferred_roles, str):
            preferred_roles = [r.strip() for r in preferred_roles.split(";") if r.strip()]

        profile_data = {
            "student_id": student_id,
            "semantic_profile": semantic_profile,
            "embedding": embedding,
            "college_id": student.get("college_id") or 1,
            "gender": meta.get("gender") or "Prefer not to say",
            "skills": skills,
            "preferred_team_roles": preferred_roles,
            "project_domains": meta.get("project_domains") or [],
            "hackathons_participated": meta.get("hackathons_participated") or 0,
            "hackathons_won": meta.get("hackathons_won") or 0,
            "total_projects": meta.get("total_projects") or 0,
            "successful_projects": meta.get("successful_projects") or 0,
            "collaboration_mode": meta.get("collaboration_mode") or "Any",
            "availability": meta.get("availability") or "Available",
            "teammate_rating": meta.get("teammate_rating") or 4.5,
            "response_rate_percent": meta.get("response_rate_percent") or 85,
            "verification_status": student.get("verification_status") or "Verified",
            "profile_visibility": meta.get("profile_visibility") or "Platform members",
            "open_to_team_requests": meta.get("open_to_team_requests") is not False,
            "updated_at": "now()"
        }

        success = upsert_student_ai_profile(profile_data)
        if success:
            logger.info(f"✅ Re-indexed student {student_id} ({student.get('full_name')}) with 384-d SBERT vector.")
        return success
    except Exception as e:
        logger.error(f"Failed to re-index student {student_id}: {e}")
        return False


def index_all_students() -> int:
    """
    Generate Sentence-BERT 384-d embeddings for all students from Supabase and cache them.
    """
    logger.info("=========================================================")
    logger.info("🚀 Starting Student Vector Indexing Pipeline...")
    logger.info("=========================================================")

    get_embedding_model()
    client = get_supabase_client()
    
    # Query all students in pages/batches
    all_students: List[Dict[str, Any]] = []
    page_size = 1000
    try:
        res = client.from_("students").select("*").limit(page_size).execute()
        if res.data:
            all_students = res.data
        logger.info(f"Fetched {len(all_students)} students from Supabase.")
    except Exception as e:
        logger.error(f"Error reading students table: {e}")
        return 0

    if not all_students:
        logger.warning("No student records found to index.")
        return 0

    logger.info(f"Generating 384-d SBERT embeddings for {len(all_students)} student profiles...")

    count = 0
    for idx, student in enumerate(all_students, start=1):
        sid = int(student.get("student_id") or idx)
        semantic_profile = build_student_semantic_profile(student)
        embedding = encode_text(semantic_profile, normalize=True)

        meta = student.get("projects") or {}
        if not isinstance(meta, dict):
            meta = {}

        skills = student.get("skills") or []
        if isinstance(skills, str):
            skills = [s.strip() for s in skills.split(";") if s.strip()]

        preferred_roles = meta.get("preferred_team_roles") or []
        if isinstance(preferred_roles, str):
            preferred_roles = [r.strip() for r in preferred_roles.split(";") if r.strip()]

        profile_data = {
            "student_id": sid,
            "semantic_profile": semantic_profile,
            "embedding": embedding,
            "college_id": student.get("college_id") or 1,
            "gender": meta.get("gender") or "Prefer not to say",
            "skills": skills,
            "preferred_team_roles": preferred_roles,
            "project_domains": meta.get("project_domains") or [],
            "hackathons_participated": meta.get("hackathons_participated") or 0,
            "hackathons_won": meta.get("hackathons_won") or 0,
            "total_projects": meta.get("total_projects") or 0,
            "successful_projects": meta.get("successful_projects") or 0,
            "collaboration_mode": meta.get("collaboration_mode") or "Any",
            "availability": meta.get("availability") or "Available",
            "teammate_rating": meta.get("teammate_rating") or 4.5,
            "response_rate_percent": meta.get("response_rate_percent") or 85,
            "verification_status": student.get("verification_status") or "Verified",
            "profile_visibility": meta.get("profile_visibility") or "Platform members",
            "open_to_team_requests": meta.get("open_to_team_requests") is not False,
            "updated_at": "now()"
        }

        upsert_student_ai_profile(profile_data)
        count += 1
        if count % 100 == 0 or count == len(all_students):
            logger.info(f"Indexed {count}/{len(all_students)} student vectors...")

    logger.info("=========================================================")
    logger.info(f"✨ Student Indexing Complete! Indexed {count} student profiles with 384-d SBERT vectors.")
    logger.info("=========================================================")
    return count


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Index student profiles with Sentence-BERT embeddings.")
    parser.add_argument("--student-id", type=int, help="Single student ID to index")
    args = parser.parse_args()

    if args.student_id:
        success = index_single_student(args.student_id)
        sys.exit(0 if success else 1)
    else:
        cnt = index_all_students()
        sys.exit(0 if cnt > 0 else 1)
