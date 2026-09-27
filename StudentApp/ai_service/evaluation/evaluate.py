import sys
from pathlib import Path
import pandas as pd

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Ensure module path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR.parent) not in sys.path:
    sys.path.insert(0, str(BASE_DIR.parent))

from ai_service.config import CSV_DATASET_PATH
from ai_service.evaluation.test_queries import TEST_QUERIES
from ai_service.evaluation.metrics import (
    precision_at_k,
    recall_at_k,
    mean_reciprocal_rank,
    ndcg_at_k,
    is_candidate_relevant
)
from ai_service.services.recommender import get_mentor_recommendations
from ai_service.embeddings.index_alumni import index_all_alumni


def baseline_keyword_matcher(query_text: str, skills: list, all_alumni: list, k: int = 5):
    """
    Simulates standard legacy keyword / rule-based matching.
    """
    q_words = set(query_text.lower().split())
    scored = []
    for a in all_alumni:
        score = 0
        raw_skills = str(a.get("skills", "")).lower()
        role = str(a.get("current_role", "")).lower()
        company = str(a.get("company", "")).lower()
        
        for w in q_words:
            if len(w) > 3:
                if w in role:
                    score += 3
                if w in company:
                    score += 4
                if w in raw_skills:
                    score += 2
        for s in skills:
            if s.lower() in raw_skills:
                score += 2

        a_copy = dict(a)
        a_copy["baseline_score"] = score
        scored.append(a_copy)
        
    scored.sort(key=lambda x: x["baseline_score"], reverse=True)
    return scored[:k]


def run_evaluation():
    print("\n==========================================================================")
    print("🎯 BRIDGEUP AI RECOMMENDATION ENGINE: COMPREHENSIVE EVALUATION & BENCHMARK")
    print("==========================================================================")

    # Load master CSV to know ground truth counts
    df = pd.read_csv(CSV_DATASET_PATH)
    all_alumni = df.to_dict(orient="records")

    baseline_p5_list, hybrid_p5_list = [], []
    baseline_r5_list, hybrid_r5_list = [], []
    baseline_mrr_list, hybrid_mrr_list = [], []
    baseline_ndcg_list, hybrid_ndcg_list = [], []

    print(f"\nEvaluating on {len(TEST_QUERIES)} diverse target career test cases...\n")

    for idx, tq in enumerate(TEST_QUERIES, start=1):
        query = tq["query"]
        skills = tq["skills"]
        criteria = tq["expected_criteria"]

        # Count total relevant candidates in entire dataset
        total_relevant = sum(1 for a in all_alumni if is_candidate_relevant(a, criteria))
        total_relevant = max(1, total_relevant)

        # 1. Baseline Keyword Matcher
        base_results = baseline_keyword_matcher(query, skills, all_alumni, k=5)
        b_p5 = precision_at_k(base_results, criteria, k=5)
        b_r5 = recall_at_k(base_results, total_relevant, criteria, k=5)
        b_mrr = mean_reciprocal_rank(base_results, criteria)
        b_ndcg = ndcg_at_k(base_results, criteria, k=5)

        baseline_p5_list.append(b_p5)
        baseline_r5_list.append(b_r5)
        baseline_mrr_list.append(b_mrr)
        baseline_ndcg_list.append(b_ndcg)

        # 2. SBERT + pgvector Hybrid Matcher
        hybrid_res = get_mentor_recommendations(
            career_goal=query,
            career_domain=tq.get("target_domain"),
            skills=skills,
            college_id=tq.get("college_id", 1),
            limit=5
        )
        h_matches = hybrid_res.get("matches", [])
        h_p5 = precision_at_k(h_matches, criteria, k=5)
        h_r5 = recall_at_k(h_matches, total_relevant, criteria, k=5)
        h_mrr = mean_reciprocal_rank(h_matches, criteria)
        h_ndcg = ndcg_at_k(h_matches, criteria, k=5)

        hybrid_p5_list.append(h_p5)
        hybrid_r5_list.append(h_r5)
        hybrid_mrr_list.append(h_mrr)
        hybrid_ndcg_list.append(h_ndcg)

        top_match_name = h_matches[0]["name"] if h_matches else "None"
        top_match_role = f"{h_matches[0]['current_role']} @ {h_matches[0]['company']}" if h_matches else ""
        top_match_score = f"{h_matches[0]['match_score']}%" if h_matches else ""
        top_match_type = h_matches[0]['match_type'] if h_matches else ""

        print(f"[{idx:02d}] Query: '{query}'")
        print(f"     ➔ Top SBERT Match: {top_match_name} ({top_match_role}) | {top_match_score} [{top_match_type}]")
        print(f"     ➔ Precision@5: Base={b_p5:.2f} | Hybrid={h_p5:.2f}  |  MRR: Base={b_mrr:.2f} | Hybrid={h_mrr:.2f}")
        print("--------------------------------------------------------------------------")

    # Aggregate Metrics
    avg_base_p5 = sum(baseline_p5_list) / len(baseline_p5_list)
    avg_hybrid_p5 = sum(hybrid_p5_list) / len(hybrid_p5_list)

    avg_base_r5 = sum(baseline_r5_list) / len(baseline_r5_list)
    avg_hybrid_r5 = sum(hybrid_r5_list) / len(hybrid_r5_list)

    avg_base_mrr = sum(baseline_mrr_list) / len(baseline_mrr_list)
    avg_hybrid_mrr = sum(hybrid_mrr_list) / len(hybrid_mrr_list)

    avg_base_ndcg = sum(baseline_ndcg_list) / len(baseline_ndcg_list)
    avg_hybrid_ndcg = sum(hybrid_ndcg_list) / len(hybrid_ndcg_list)

    print("\n==========================================================================")
    print("📊 FINAL BENCHMARK COMPARISON RESULTS")
    print("==========================================================================")
    print(f"{'Metric':<20} | {'Legacy Keyword Matcher':<25} | {'SBERT + pgvector Hybrid':<25} | {'Improvement':<12}")
    print("-" * 88)
    print(f"{'Precision@5':<20} | {avg_base_p5*100:>20.2f}% | {avg_hybrid_p5*100:>20.2f}% | {((avg_hybrid_p5-avg_base_p5)/(avg_base_p5 or 1))*100:>+10.1f}%")
    print(f"{'Recall@5':<20} | {avg_base_r5*100:>20.2f}% | {avg_hybrid_r5*100:>20.2f}% | {((avg_hybrid_r5-avg_base_r5)/(avg_base_r5 or 1))*100:>+10.1f}%")
    print(f"{'MRR (Mean Recip. Rank)':<20} | {avg_base_mrr:>24.3f} | {avg_hybrid_mrr:>24.3f} | {((avg_hybrid_mrr-avg_base_mrr)/(avg_base_mrr or 1))*100:>+10.1f}%")
    print(f"{'NDCG@5':<20} | {avg_base_ndcg:>24.3f} | {avg_hybrid_ndcg:>24.3f} | {((avg_hybrid_ndcg-avg_base_ndcg)/(avg_base_ndcg or 1))*100:>+10.1f}%")
    print("==========================================================================\n")


if __name__ == "__main__":
    run_evaluation()
