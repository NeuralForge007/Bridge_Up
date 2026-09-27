import re
from typing import Dict, List, Set, Optional
from rapidfuzz import fuzz

# Canonical 8 Role Families
ROLE_FAMILIES: Dict[str, List[str]] = {
    "AI_RESEARCH": [
        "ai research scientist",
        "ai researcher",
        "ml research scientist",
        "nlp researcher",
        "computer vision researcher",
        "research scientist",
        "research engineer",
        "applied scientist",
        "ai scientist"
    ],
    "MACHINE_LEARNING": [
        "machine learning engineer",
        "ml engineer",
        "ai engineer",
        "applied ml engineer",
        "deep learning engineer",
        "computer vision engineer",
        "mle"
    ],
    "SOFTWARE_ENGINEERING": [
        "software engineer",
        "software development engineer",
        "sde",
        "backend engineer",
        "full stack engineer",
        "frontend engineer",
        "technology analyst",
        "gpu software engineer",
        "systems engineer",
        "junior developer"
    ],
    "CYBERSECURITY": [
        "cybersecurity analyst",
        "security analyst",
        "security engineer",
        "cybersecurity engineer",
        "security researcher",
        "security consultant",
        "cybersecurity consultant",
        "soc analyst",
        "incident response analyst"
    ],
    "DATA_SCIENCE": [
        "data scientist",
        "data analyst",
        "data engineer",
        "ml data scientist",
        "applied data scientist",
        "quantitative analyst",
        "quant analyst"
    ],
    "CLOUD_DEVOPS": [
        "cloud/devops engineer",
        "cloud engineer",
        "devops engineer",
        "site reliability engineer",
        "sre",
        "infrastructure engineer"
    ],
    "EMBEDDED_ROBOTICS": [
        "embedded/robotics engineer",
        "embedded systems engineer",
        "embedded software engineer",
        "embedded engineer",
        "robotics engineer",
        "scientist/engineer"
    ],
    "PRODUCT_MANAGEMENT": [
        "product manager",
        "technical product manager",
        "technical program manager",
        "tpm",
        "associate product manager",
        "product lead"
    ]
}

# Company Aliases Mapping
COMPANY_ALIASES: Dict[str, str] = {
    "google": "Google",
    "google llc": "Google",
    "google india": "Google",
    "alphabet": "Google",
    "microsoft": "Microsoft",
    "msft": "Microsoft",
    "amazon": "Amazon",
    "aws": "Amazon",
    "amazon web services": "Amazon",
    "meta": "Meta",
    "facebook": "Meta",
    "nvidia": "NVIDIA",
    "drdo": "DRDO",
    "defence research and development organisation": "DRDO",
    "defence research": "DRDO",
    "isro": "ISRO",
    "indian space research organisation": "ISRO",
    "tcs": "TCS",
    "tata consultancy services": "TCS",
    "infosys": "Infosys",
    "deloitte": "Deloitte",
    "goldman sachs": "Goldman Sachs",
    "gs": "Goldman Sachs",
    "jpmorgan": "JPMorgan Chase",
    "jpmorgan chase": "JPMorgan Chase",
    "jpmc": "JPMorgan Chase",
    "jp morgan": "JPMorgan Chase",
    "ibm": "IBM",
    "adobe": "Adobe",
    "flipkart": "Flipkart",
    "walmart": "Walmart Global Tech",
    "walmart global tech": "Walmart Global Tech",
    "samsung": "Samsung R&D",
    "samsung r&d": "Samsung R&D",
    "bosch": "Bosch",
    "atlassian": "Atlassian",
    "siemens": "Siemens",
    "tata elxsi": "Tata Elxsi",
    "elxsi": "Tata Elxsi",
    "polygon": "Polygon Labs",
    "polygon labs": "Polygon Labs",
    "coindcx": "CoinDCX",
    "accenture": "Accenture"
}

# Domain Aliases & Relatability Matrix
DOMAIN_MAPPINGS: Dict[str, str] = {
    "ai/ml": "AI/ML",
    "ai": "AI/ML",
    "ml": "AI/ML",
    "artificial intelligence": "AI/ML",
    "machine learning": "AI/ML",
    "deep learning": "AI/ML",
    "data science": "Data Science",
    "data analytics": "Data Science",
    "software engineering": "Software Engineering",
    "software development": "Software Engineering",
    "cybersecurity": "Cybersecurity",
    "infosec": "Cybersecurity",
    "information security": "Cybersecurity",
    "security": "Cybersecurity",
    "cloud & devops": "Cloud & DevOps",
    "cloud and devops": "Cloud & DevOps",
    "cloud": "Cloud & DevOps",
    "devops": "Cloud & DevOps",
    "embedded systems & robotics": "Embedded Systems & Robotics",
    "embedded systems and robotics": "Embedded Systems & Robotics",
    "embedded systems": "Embedded Systems & Robotics",
    "embedded": "Embedded Systems & Robotics",
    "robotics": "Embedded Systems & Robotics",
    "product management": "Product Management",
    "product": "Product Management",
    "space technology": "Space Technology",
    "defence research": "Defence Research",
    "data engineering": "Data Science"
}

# Domain Relatedness Scores (0.0 to 1.0)
DOMAIN_RELATEDNESS: Dict[str, Dict[str, float]] = {
    "AI/ML": {"Data Science": 0.85, "Software Engineering": 0.65, "Embedded Systems & Robotics": 0.60},
    "Data Science": {"AI/ML": 0.85, "Software Engineering": 0.55, "Cloud & DevOps": 0.50},
    "Cybersecurity": {"Cloud & DevOps": 0.75, "Software Engineering": 0.60, "Embedded Systems & Robotics": 0.50},
    "Software Engineering": {"Cloud & DevOps": 0.85, "AI/ML": 0.65, "Data Science": 0.55, "Embedded Systems & Robotics": 0.60},
    "Cloud & DevOps": {"Software Engineering": 0.85, "Cybersecurity": 0.75, "Data Science": 0.50},
    "Embedded Systems & Robotics": {"Software Engineering": 0.60, "AI/ML": 0.60, "Cybersecurity": 0.50},
    "Product Management": {"Software Engineering": 0.60, "Data Science": 0.55, "Cloud & DevOps": 0.50}
}

# Skill Normalization Dictionary
SKILL_ALIASES: Dict[str, str] = {
    "ml": "machine learning",
    "dl": "deep learning",
    "nlp": "nlp",
    "cv": "computer vision",
    "js": "javascript",
    "ts": "typescript",
    "py": "python",
    "tf": "tensorflow",
    "k8s": "kubernetes",
    "gcp": "gcp",
    "aws": "aws",
    "azure": "azure",
    "cpp": "c++",
    "c plus plus": "c++",
    "c#": "c#",
    "c sharp": "c#",
    "golang": "go",
    "reactjs": "react",
    "react.js": "react",
    "nodejs": "node.js",
    "node": "node.js",
    "siem": "siem",
    "soc": "soc",
    "iam": "iam",
    "etl": "etl",
    "llm": "transformers",
    "llms": "transformers",
    "genai": "generative ai",
    "ros": "ros",
    "rtos": "rtos",
    "embedded c": "embedded c"
}

# Canonical College Mappings
COLLEGE_MAP: Dict[int, str] = {
    1: "Institute of Engineering and Management",
    2: "Jadavpur University",
    3: "University of Calcutta",
    4: "IIT Kharagpur",
    5: "NIT Durgapur"
}

COLLEGE_ALIASES: Dict[str, int] = {
    "iem": 1,
    "iem kolkata": 1,
    "institute of engineering and management": 1,
    "institute of engineering & management": 1,
    "ju": 2,
    "jadavpur": 2,
    "jadavpur university": 2,
    "cu": 3,
    "calcutta university": 3,
    "university of calcutta": 3,
    "iit kgp": 4,
    "iit kharagpur": 4,
    "indian institute of technology kharagpur": 4,
    "nit dgp": 5,
    "nit durgapur": 5,
    "national institute of technology durgapur": 5
}

def clean_text(text: str) -> str:
    """Standard lowercase alphanumeric clean."""
    if not text:
        return ""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s\+\#\/\.\-]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def normalize_role(role: str) -> str:
    """Normalize role string."""
    clean = clean_text(role)
    if not clean:
        return ""
    for family, roles in ROLE_FAMILIES.items():
        for r in roles:
            if clean == r:
                return r
    return clean

def get_role_family(role: str) -> Optional[str]:
    """Get the canonical role family for a given role."""
    norm = normalize_role(role)
    if not norm:
        return None
    for family, roles in ROLE_FAMILIES.items():
        if norm in roles:
            return family
        for r in roles:
            if r in norm or norm in r or fuzz.ratio(norm, r) > 85:
                return family
    return None

def normalize_company(company: str) -> str:
    """Normalize company name to canonical format."""
    clean = clean_text(company)
    if not clean:
        return ""
    if clean in COMPANY_ALIASES:
        return COMPANY_ALIASES[clean]
    for alias, canonical in COMPANY_ALIASES.items():
        if alias in clean or fuzz.ratio(clean, alias) > 85:
            return canonical
    return company.strip()

def normalize_domain(domain: str) -> str:
    """Normalize career domain."""
    clean = clean_text(domain)
    if not clean:
        return "Software Engineering"
    if clean in DOMAIN_MAPPINGS:
        return DOMAIN_MAPPINGS[clean]
    for k, v in DOMAIN_MAPPINGS.items():
        if k in clean or fuzz.ratio(clean, k) > 85:
            return v
    return domain.strip()

def normalize_skill(skill: str) -> str:
    """Normalize technical skill."""
    clean = clean_text(skill)
    if not clean:
        return ""
    if clean in SKILL_ALIASES:
        return SKILL_ALIASES[clean]
    return clean

def normalize_skill_list(skills: List[str]) -> List[str]:
    """Normalize a list of skills and remove duplicates."""
    res = []
    seen = set()
    for s in skills:
        norm = normalize_skill(s)
        if norm and norm not in seen:
            seen.add(norm)
            res.append(norm)
    return res

def normalize_college(college_input: any) -> int:
    """Convert college ID or string name to canonical college_id (1-5)."""
    if isinstance(college_input, int) and 1 <= college_input <= 5:
        return college_input
    if isinstance(college_input, str):
        c_str = clean_text(college_input)
        if c_str.isdigit():
            c_id = int(c_str)
            if 1 <= c_id <= 5:
                return c_id
        if c_str in COLLEGE_ALIASES:
            return COLLEGE_ALIASES[c_str]
        for alias, cid in COLLEGE_ALIASES.items():
            if alias in c_str or fuzz.ratio(c_str, alias) > 80:
                return cid
    return 1

def get_college_name(college_id: int) -> str:
    """Get canonical college name for a given ID."""
    return COLLEGE_MAP.get(college_id, "Institute of Engineering and Management")

def get_domain_similarity(domain1: str, domain2: str) -> float:
    """Calculate domain similarity score between 0.0 and 1.0."""
    d1 = normalize_domain(domain1)
    d2 = normalize_domain(domain2)
    if d1.lower() == d2.lower():
        return 1.0
    if d1 in DOMAIN_RELATEDNESS and d2 in DOMAIN_RELATEDNESS[d1]:
        return DOMAIN_RELATEDNESS[d1][d2]
    if d2 in DOMAIN_RELATEDNESS and d1 in DOMAIN_RELATEDNESS[d2]:
        return DOMAIN_RELATEDNESS[d2][d1]
    return 0.15
