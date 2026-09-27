import math
from typing import List, Dict, Any

def is_candidate_relevant(candidate: Dict[str, Any], criteria: Dict[str, Any]) -> bool:
    """
    Determine if a candidate alumnus satisfies the evaluation ground-truth relevance criteria.
    """
    from ..preprocessing.normalize import get_role_family, normalize_company, normalize_domain

    exp_college = criteria.get("college_id")
    exp_co = criteria.get("company")
    exp_domain = criteria.get("domain")
    exp_fam = criteria.get("role_family")

    # Check College if required (Hard Filter)
    if exp_college:
        cand_college = candidate.get("college_id")
        if cand_college and int(cand_college) != int(exp_college):
            return False

    # Check Company if required
    if exp_co:
        cand_co = normalize_company(candidate.get("company") or "")
        if exp_co.lower() not in cand_co.lower():
            return False

    # Check Domain if required
    if exp_domain:
        cand_domain = normalize_domain(candidate.get("career_domain") or "")
        if exp_domain.lower() != cand_domain.lower() and exp_domain.lower() not in cand_domain.lower():
            # Check if closely related domain
            from ..preprocessing.normalize import get_domain_similarity
            if get_domain_similarity(exp_domain, cand_domain) < 0.70:
                return False

    # Check Role Family if required
    if exp_fam:
        cand_role = candidate.get("current_role") or candidate.get("role_title") or ""
        cand_fam = get_role_family(cand_role)
        if cand_fam != exp_fam:
            return False

    return True


def precision_at_k(recommended: List[Dict[str, Any]], criteria: Dict[str, Any], k: int = 5) -> float:
    """Calculate Precision@K."""
    top_k = recommended[:k]
    if not top_k:
        return 0.0
    relevant_count = sum(1 for c in top_k if is_candidate_relevant(c, criteria))
    return relevant_count / len(top_k)


def recall_at_k(recommended: List[Dict[str, Any]], total_relevant_in_db: int, criteria: Dict[str, Any], k: int = 5) -> float:
    """Calculate Recall@K."""
    if total_relevant_in_db <= 0:
        return 1.0
    top_k = recommended[:k]
    relevant_count = sum(1 for c in top_k if is_candidate_relevant(c, criteria))
    return min(1.0, relevant_count / total_relevant_in_db)


def mean_reciprocal_rank(recommended: List[Dict[str, Any]], criteria: Dict[str, Any]) -> float:
    """Calculate Reciprocal Rank (RR)."""
    for idx, c in enumerate(recommended, start=1):
        if is_candidate_relevant(c, criteria):
            return 1.0 / idx
    return 0.0


def ndcg_at_k(recommended: List[Dict[str, Any]], criteria: Dict[str, Any], k: int = 5) -> float:
    """Calculate Normalized Discounted Cumulative Gain (NDCG@K)."""
    top_k = recommended[:k]
    if not top_k:
        return 0.0

    dcg = 0.0
    for i, c in enumerate(top_k):
        rel = 1.0 if is_candidate_relevant(c, criteria) else 0.0
        dcg += rel / math.log2(i + 2)

    # Ideal DCG
    total_rel = sum(1 for c in top_k if is_candidate_relevant(c, criteria))
    idcg = sum(1.0 / math.log2(i + 2) for i in range(min(k, total_rel)))

    if idcg == 0.0:
        return 0.0
    return dcg / idcg
