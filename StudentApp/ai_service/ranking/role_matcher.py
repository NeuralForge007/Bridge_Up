from typing import Tuple, Optional
from rapidfuzz import fuzz
from ..preprocessing.normalize import (
    clean_text,
    normalize_role,
    get_role_family,
    ROLE_FAMILIES
)

def calculate_role_match(
    target_role: Optional[str],
    alumni_role: Optional[str]
) -> Tuple[float, str]:
    """
    Compute role match score between target role and alumnus role (0.0 to 1.0).
    Returns (score, match_type_description).
    """
    if not target_role:
        return 1.0, "NO_ROLE_SPECIFIED"
    if not alumni_role:
        return 0.1, "NO_ALUMNI_ROLE"

    target_norm = normalize_role(target_role)
    alumni_norm = normalize_role(alumni_role)

    # 1. Exact match
    if target_norm == alumni_norm:
        return 1.0, "EXACT_ROLE_MATCH"

    # 2. Role Family match
    target_family = get_role_family(target_norm)
    alumni_family = get_role_family(alumni_norm)

    if target_family and alumni_family and target_family == alumni_family:
        # Check if high similarity within family
        ratio = fuzz.token_sort_ratio(target_norm, alumni_norm) / 100.0
        family_score = 0.85 + (0.10 * ratio)
        return min(0.95, family_score), "ROLE_FAMILY_MATCH"

    # 3. Fuzzy string matching
    ratio = fuzz.token_sort_ratio(target_norm, alumni_norm) / 100.0
    partial = fuzz.partial_ratio(target_norm, alumni_norm) / 100.0

    if ratio >= 0.80:
        return ratio, "FUZZY_ROLE_MATCH"
    if partial >= 0.85 and (target_norm in alumni_norm or alumni_norm in target_norm):
        return 0.75, "PARTIAL_ROLE_MATCH"

    # Low / Weak alignment
    return max(0.05, ratio * 0.4), "WEAK_ROLE_MATCH"
