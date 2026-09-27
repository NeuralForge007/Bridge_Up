from typing import List, Tuple, Set
from ..preprocessing.normalize import normalize_skill, normalize_skill_list

def calculate_skill_overlap(
    target_skills: List[str],
    alumni_skills: List[str]
) -> Tuple[float, List[str]]:
    """
    Calculate structured skill overlap between student target skills and alumnus skills.
    Returns (overlap_score 0.0 to 1.0, list_of_matched_skills).
    """
    if not target_skills:
        return 1.0, []  # If student didn't specify skills, don't penalize

    norm_target = normalize_skill_list(target_skills)
    norm_alumni = normalize_skill_list(alumni_skills)

    if not norm_target:
        return 1.0, []
    if not norm_alumni:
        return 0.1, []

    matched = []
    for ts in norm_target:
        for als in norm_alumni:
            if ts == als or ts in als or als in ts:
                matched.append(als.title())
                break

    matched_unique = list(dict.fromkeys(matched))
    
    # Overlap calculation relative to target requirements
    overlap_ratio = len(matched_unique) / max(1, len(norm_target))
    
    # Jaccard component
    union_len = len(set(norm_target).union(set(norm_alumni)))
    jaccard = len(matched_unique) / max(1, union_len) if union_len > 0 else 0.0
    
    # Weighted score favoring meeting student's target skills
    score = (0.75 * min(1.0, overlap_ratio)) + (0.25 * jaccard)
    return min(1.0, max(0.0, score)), matched_unique
