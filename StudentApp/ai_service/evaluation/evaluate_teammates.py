import sys
from pathlib import Path
import pandas as pd
import math

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR.parent) not in sys.path:
    sys.path.insert(0, str(BASE_DIR.parent))

from ai_service.services.teammate_recommender import get_teammate_recommendations
from ai_service.database.student_vector_repository import get_all_student_vector_profiles

TEAMMATE_TEST_QUERIES = [
    {
        "name": "AI Healthcare Web App Team",
        "req": {
            "project_pitch": "Building an AI-assisted diagnostic web portal for early disease detection",
            "desired_role": "Full Stack Developer",
            "required_skills": ["React", "Python", "PyTorch"],
            "preferred_college_id": None,
            "preferred_gender": "ANY",
            "min_hackathons": 2,
            "min_projects": 1,
            "collaboration_mode": "Hybrid"
        },
        "target_skills": ["React", "Python", "PyTorch"],
        "target_domains": ["Healthcare", "AI / Machine Learning", "AI for Social Good"]
    },
    {
        "name": "Smart City IoT Device Team",
        "req": {
            "project_pitch": "IoT sensor network for urban air quality monitoring and smart traffic",
            "desired_role": "Embedded Systems Engineer",
            "required_skills": ["ESP32", "Arduino", "C++"],
            "preferred_college_id": 1,  # IEM only
            "preferred_gender": "ANY",
            "min_hackathons": 1,
            "min_projects": 1,
            "collaboration_mode": "Any"
        },
        "target_skills": ["ESP32", "Arduino", "C++"],
        "target_domains": ["Smart Cities", "IoT / Embedded Systems"]
    },
    {
        "name": "FinTech Web3 Pitch & UI Team",
        "req": {
            "project_pitch": "Decentralized micro-lending platform for student micro-loans with smart contracts",
            "desired_role": "UI/UX Designer",
            "required_skills": ["Figma", "UI/UX", "Market Research"],
            "preferred_college_id": 2,  # Jadavpur University
            "preferred_gender": "ANY",
            "min_hackathons": 1,
            "min_projects": 0,
            "collaboration_mode": "Remote"
        },
        "target_skills": ["Figma", "UI/UX", "Market Research"],
        "target_domains": ["FinTech", "Web3", "Product / Business"]
    },
    {
        "name": "Women in Tech AI Team",
        "req": {
            "project_pitch": "Computer vision assistive navigation app for visually impaired persons",
            "desired_role": "ML Engineer",
            "required_skills": ["Computer Vision", "TensorFlow", "Deep Learning"],
            "preferred_college_id": None,
            "preferred_gender": "Female",
            "min_hackathons": 2,
            "min_projects": 1,
            "collaboration_mode": "Any"
        },
        "target_skills": ["Computer Vision", "TensorFlow", "Deep Learning"],
        "target_domains": ["Accessibility", "AI / Machine Learning"]
    },
    {
        "name": "IIT KGP High Performance Cloud Team",
        "req": {
            "project_pitch": "Distributed fault-tolerant microservices backend for disaster emergency response",
            "desired_role": "Backend Developer",
            "required_skills": ["Docker", "TypeScript", "Node.js", "PostgreSQL"],
            "preferred_college_id": 4,  # IIT Kharagpur
            "preferred_gender": "ANY",
            "min_hackathons": 1,
            "min_projects": 1,
            "collaboration_mode": "Any"
        },
        "target_skills": ["Docker", "TypeScript", "Node.js", "PostgreSQL"],
        "target_domains": ["Disaster Management", "Web / Cloud"]
    },
    {
        "name": "NIT Durgapur Data Science Team",
        "req": {
            "project_pitch": "Agricultural predictive yield modeling using multi-spectral satellite data",
            "desired_role": "Data Scientist",
            "required_skills": ["Pandas", "Python", "NumPy", "Statistics"],
            "preferred_college_id": 5,  # NIT Durgapur
            "preferred_gender": "ANY",
            "min_hackathons": 0,
            "min_projects": 1,
            "collaboration_mode": "Any"
        },
        "target_skills": ["Pandas", "Python", "NumPy", "Statistics"],
        "target_domains": ["Agriculture", "Data Science"]
    },
    {
        "name": "Calcutta University Full Stack Team",
        "req": {
            "project_pitch": "Real-time collaborative edtech platform with live whiteboards and chat",
            "desired_role": "Full Stack Developer",
            "required_skills": ["React", "Express", "Node.js", "JavaScript"],
            "preferred_college_id": 3,  # Calcutta University
            "preferred_gender": "ANY",
            "min_hackathons": 1,
            "min_projects": 1,
            "collaboration_mode": "Any"
        },
        "target_skills": ["React", "Express", "Node.js", "JavaScript"],
        "target_domains": ["EdTech", "Web / Cloud"]
    },
    {
        "name": "Robotics & Hardware Hack Team",
        "req": {
            "project_pitch": "Autonomous rover for agricultural weed detection and automated soil sampling",
            "desired_role": "Robotics Engineer",
            "required_skills": ["ROS", "Robotics", "MATLAB", "Arduino"],
            "preferred_college_id": None,
            "preferred_gender": "ANY",
            "min_hackathons": 2,
            "min_projects": 2,
            "collaboration_mode": "In-person"
        },
        "target_skills": ["ROS", "Robotics", "MATLAB", "Arduino"],
        "target_domains": ["Robotics", "Embedded / Robotics", "Agriculture"]
    }
]


def is_teammate_relevant(student: dict, target_skills: list, target_domains: list, min_hackathons: int = 0, min_projects: int = 0, gender_filter: str = "ANY", college_filter: int = None) -> bool:
    # Check hard filters
    if college_filter and str(student.get("college_id")) != str(college_filter):
        return False
    if gender_filter and gender_filter != "ANY" and student.get("gender", "").strip().lower() != gender_filter.strip().lower():
        return False
    if student.get("hackathons_participated", 0) < min_hackathons:
        return False
    if student.get("successful_projects", 0) < min_projects:
        return False

    # Check skill overlap
    raw_skills = [s.lower() for s in student.get("skills", [])]
    matched_skills = [ts for ts in target_skills if ts.lower() in raw_skills]
    skill_match_ratio = len(matched_skills) / max(1, len(target_skills))

    # Check domain overlap
    career_domain = student.get("career_domain", "")
    project_domains = student.get("project_domains", [])
    domain_match = any(d.lower() in career_domain.lower() or any(d.lower() in pd.lower() for pd in project_domains) for d in target_domains)

    # Relevant if matches at least 50% of required skills OR (1 skill and matching domain)
    return (skill_match_ratio >= 0.5) or (len(matched_skills) >= 1 and domain_match)


def evaluate_teammates():
    print("\n==========================================================================")
    print("🤝 BRIDGEUP AI TEAMMATE RECOMMENDER: BENCHMARK & EVALUATION")
    print("==========================================================================")

    profiles = get_all_student_vector_profiles()
    all_students = [s for s in profiles.values()]
    print(f"Loaded {len(all_students)} student profiles across 5 partner universities.")

    p5_list, r5_list, mrr_list, ndcg_list = [], [], [], []

    print(f"\nEvaluating on {len(TEAMMATE_TEST_QUERIES)} multi-domain hackathon requirement cases...\n")

    for idx, tcase in enumerate(TEAMMATE_TEST_QUERIES, start=1):
        req = tcase["req"]
        t_skills = tcase["target_skills"]
        t_domains = tcase["target_domains"]

        # Calculate ground truth total relevant in corpus
        total_relevant = sum(
            1 for s in all_students
            if is_teammate_relevant(
                s, t_skills, t_domains,
                min_hackathons=req.get("min_hackathons", 0),
                min_projects=req.get("min_projects", 0),
                gender_filter=req.get("preferred_gender", "ANY"),
                college_filter=req.get("preferred_college_id")
            )
        )
        total_relevant = max(1, total_relevant)

        # Execute Teammate Recommender
        res = get_teammate_recommendations(
            project_idea=req["project_pitch"],
            desired_role=req["desired_role"],
            required_skills=req["required_skills"],
            preferred_college_id=req["preferred_college_id"],
            preferred_gender=req["preferred_gender"],
            min_hackathons=req["min_hackathons"],
            min_projects=req["min_projects"],
            collaboration_mode=req["collaboration_mode"],
            owner_student_id=None,
            limit=5
        )

        matches = res.get("matches", [])
        if len(matches) < 5 and res.get("near_matches"):
            matches = matches + res.get("near_matches", [])[:5 - len(matches)]
        matches = matches[:5]

        # Calculate metrics
        rel_hits = []
        for rank, m in enumerate(matches):
            rel = is_teammate_relevant(
                m, t_skills, t_domains,
                min_hackathons=req.get("min_hackathons", 0),
                min_projects=req.get("min_projects", 0),
                gender_filter=req.get("preferred_gender", "ANY"),
                college_filter=req.get("preferred_college_id")
            )
            rel_hits.append(1 if rel else 0)

        p5 = sum(rel_hits) / 5.0
        r5 = sum(rel_hits) / float(total_relevant)
        r5 = min(1.0, r5)

        # MRR
        mrr = 0.0
        for rank, hit in enumerate(rel_hits, start=1):
            if hit == 1:
                mrr = 1.0 / rank
                break

        # NDCG@5
        dcg = sum(hit / math.log2(rank + 1) for rank, hit in enumerate(rel_hits, start=1))
        idcg = sum(1.0 / math.log2(rank + 1) for rank in range(1, min(total_relevant, 5) + 1))
        ndcg = (dcg / idcg) if idcg > 0 else 0.0

        p5_list.append(p5)
        r5_list.append(r5)
        mrr_list.append(mrr)
        ndcg_list.append(ndcg)

        top_match = matches[0] if matches else {}
        top_name = top_match.get("name", "None")
        top_college = top_match.get("college_name", "")
        top_skills = ", ".join(top_match.get("matched_skills", []))
        top_score = top_match.get("match_score", 0)
        top_type = top_match.get("match_type", "")

        print(f"[{idx:02d}] Req: '{tcase['name']}' ({req['desired_role']})")
        print(f"     ➔ Top Match: {top_name} ({top_college}) | Skills: [{top_skills}] | Score: {top_score}% [{top_type}]")
        print(f"     ➔ Precision@5: {p5:.2f} | Recall@5: {r5:.2f} | MRR: {mrr:.2f} | NDCG@5: {ndcg:.2f} | (Pool relevant: {total_relevant})")
        print("--------------------------------------------------------------------------")

    avg_p5 = sum(p5_list) / len(p5_list)
    avg_r5 = sum(r5_list) / len(r5_list)
    avg_mrr = sum(mrr_list) / len(mrr_list)
    avg_ndcg = sum(ndcg_list) / len(ndcg_list)

    print("\n==========================================================================")
    print("📊 AI TEAMMATE RECOMMENDER EVALUATION SUMMARY")
    print("==========================================================================")
    print(f"{'Metric':<30} | {'SBERT + pgvector Teammate Matcher':<25}")
    print("-" * 60)
    print(f"{'Precision@5':<30} | {avg_p5*100:>22.2f}%")
    print(f"{'Recall@5':<30} | {avg_r5*100:>22.2f}%")
    print(f"{'MRR (Mean Reciprocal Rank)':<30} | {avg_mrr:>22.3f}")
    print(f"{'NDCG@5':<30} | {avg_ndcg:>22.3f}")
    print("==========================================================================\n")
    return {
        "precision_at_5": avg_p5,
        "recall_at_5": avg_r5,
        "mrr": avg_mrr,
        "ndcg_at_5": avg_ndcg,
        "queries_tested": len(TEAMMATE_TEST_QUERIES)
    }


if __name__ == "__main__":
    evaluate_teammates()
