import re
from typing import Dict, Any, List, Optional
from rapidfuzz import fuzz
from .normalize import (
    clean_text,
    normalize_role,
    normalize_company,
    normalize_domain,
    normalize_skill,
    COMPANY_ALIASES,
    ROLE_FAMILIES,
    DOMAIN_MAPPINGS
)

# Known Role Terms for Matching
KNOWN_ROLES = []
for fam_roles in ROLE_FAMILIES.values():
    KNOWN_ROLES.extend(fam_roles)
# Sort longest first so "ai research scientist" matches before "scientist"
KNOWN_ROLES = sorted(list(set(KNOWN_ROLES)), key=lambda x: len(x), reverse=True)

# Common extraction regex patterns
ROLE_PATTERNS = [
    r'(?:become|join as|work as|role of|position of|aspiring|pursuing|target role|aiming for|be a|be an)\s+([a-zA-Z0-9\s\/\+\#\.\-]+?)(?:\s+(?:at|in|with|for|@)\s+|\s*$|\.|\,)',
    r'([a-zA-Z0-9\s\/\+\#\.\-]+?)\s+(?:at|in|with|for|@)\s+([a-zA-Z0-9\s\.\-]+)'
]

COMPANY_PATTERNS = [
    r'(?:at|in|with|for|@|join)\s+([a-zA-Z0-9\s\.\-]+?)(?:\s+(?:as|for|role|position)|\s*$|\.|\,)'
]

def parse_career_intent(
    query_text: str,
    domain_hint: Optional[str] = None,
    skills_hint: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Extract structured career intent (role, company, domain, skills)
    from student query text using deterministic pattern matching & RapidFuzz.
    """
    if not query_text:
        query_text = ""

    raw_clean = clean_text(query_text)
    
    target_company = None
    target_role = None
    target_domain = None

    # 1. Company Extraction
    # First check exact or substring match in COMPANY_ALIASES
    for alias, canonical in COMPANY_ALIASES.items():
        # Match whole word boundary or substring
        pattern = r'\b' + re.escape(alias) + r'\b'
        if re.search(pattern, raw_clean):
            target_company = canonical
            break

    if not target_company:
        for pat in COMPANY_PATTERNS:
            match = re.search(pat, raw_clean)
            if match:
                candidate = match.group(1).strip()
                if candidate in COMPANY_ALIASES:
                    target_company = COMPANY_ALIASES[candidate]
                    break
                # Fuzzy match
                for alias, canonical in COMPANY_ALIASES.items():
                    if fuzz.ratio(candidate, alias) > 85:
                        target_company = canonical
                        break
            if target_company:
                break

    # 2. Role Extraction
    # Match against KNOWN_ROLES
    for role in KNOWN_ROLES:
        pattern = r'\b' + re.escape(role) + r'\b'
        if re.search(pattern, raw_clean):
            target_role = role
            break

    if not target_role:
        for pat in ROLE_PATTERNS:
            match = re.search(pat, raw_clean)
            if match:
                candidate = match.group(1).strip()
                for role in KNOWN_ROLES:
                    if fuzz.partial_ratio(candidate, role) > 85 or fuzz.ratio(candidate, role) > 80:
                        target_role = role
                        break
            if target_role:
                break

    # 3. Domain Extraction
    if domain_hint:
        target_domain = normalize_domain(domain_hint)
    else:
        for d_alias, d_canonical in DOMAIN_MAPPINGS.items():
            pattern = r'\b' + re.escape(d_alias) + r'\b'
            if re.search(pattern, raw_clean):
                target_domain = d_canonical
                break
        
        # If still no domain, deduce from target_role
        if not target_domain and target_role:
            for fam, roles in ROLE_FAMILIES.items():
                if target_role in roles:
                    if fam in ["AI_RESEARCH", "MACHINE_LEARNING"]:
                        target_domain = "AI/ML"
                    elif fam == "SOFTWARE_ENGINEERING":
                        target_domain = "Software Engineering"
                    elif fam == "CYBERSECURITY":
                        target_domain = "Cybersecurity"
                    elif fam == "DATA":
                        target_domain = "Data Science"
                    elif fam == "CLOUD_DEVOPS":
                        target_domain = "Cloud"
                    elif fam == "EMBEDDED_ROBOTICS":
                        target_domain = "Embedded Systems"
                    elif fam == "PRODUCT_MANAGEMENT":
                        target_domain = "Product Management"
                    elif fam == "BLOCKCHAIN":
                        target_domain = "Blockchain"
                    break

    # 4. Normalize Skills
    extracted_skills = []
    if skills_hint:
        for s in skills_hint:
            norm = normalize_skill(s)
            if norm and norm not in extracted_skills:
                extracted_skills.append(norm)

    return {
        "raw_query": query_text,
        "target_role": target_role,
        "target_company": target_company,
        "target_domain": target_domain or "Software Engineering",
        "skills": extracted_skills,
        "career_goal": query_text.strip()
    }
