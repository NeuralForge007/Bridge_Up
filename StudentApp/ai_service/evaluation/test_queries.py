from typing import List, Dict, Any

# Ground truth test queries tailored per Kolkata college network
TEST_QUERIES: List[Dict[str, Any]] = [
    {
        "query": "I want to become an AI Research Scientist at Google.",
        "college_id": 1,
        "college_name": "Institute of Engineering and Management",
        "target_role": "AI Research Scientist",
        "target_company": "Google",
        "target_domain": "AI/ML",
        "skills": ["Python", "PyTorch", "Deep Learning", "NLP"],
        "expected_criteria": {
            "college_id": 1,
            "company": "Google",
            "domain": "AI/ML",
            "role_family": "AI_RESEARCH"
        }
    },
    {
        "query": "I want to join DRDO as a cybersecurity analyst.",
        "college_id": 1,
        "college_name": "Institute of Engineering and Management",
        "target_role": "Cybersecurity Analyst",
        "target_company": "DRDO",
        "target_domain": "Cybersecurity",
        "skills": ["Linux", "Python", "Cloud Security", "Incident Response"],
        "expected_criteria": {
            "college_id": 1,
            "company": "DRDO",
            "domain": "Cybersecurity",
            "role_family": "CYBERSECURITY"
        }
    },
    {
        "query": "I want to become a Machine Learning Engineer at Amazon.",
        "college_id": 2,
        "college_name": "Jadavpur University",
        "target_role": "Machine Learning Engineer",
        "target_company": "Amazon",
        "target_domain": "AI/ML",
        "skills": ["Python", "Machine Learning", "PyTorch", "MLOps"],
        "expected_criteria": {
            "college_id": 2,
            "company": "Amazon",
            "domain": "AI/ML",
            "role_family": "MACHINE_LEARNING"
        }
    },
    {
        "query": "I want to become a Data Scientist at Walmart Global Tech.",
        "college_id": 3,
        "college_name": "University of Calcutta",
        "target_role": "Data Scientist",
        "target_company": "Walmart Global Tech",
        "target_domain": "Data Science",
        "skills": ["Python", "Tableau", "SQL", "Statistics", "Pandas"],
        "expected_criteria": {
            "college_id": 3,
            "company": "Walmart Global Tech",
            "domain": "Data Science",
            "role_family": "DATA_SCIENCE"
        }
    },
    {
        "query": "I want to work as an Embedded/Robotics Engineer at ISRO.",
        "college_id": 4,
        "college_name": "IIT Kharagpur",
        "target_role": "Embedded/Robotics Engineer",
        "target_company": "ISRO",
        "target_domain": "Embedded Systems & Robotics",
        "skills": ["Embedded C", "Microcontrollers", "ROS", "C++", "C"],
        "expected_criteria": {
            "college_id": 4,
            "company": "ISRO",
            "domain": "Embedded Systems & Robotics",
            "role_family": "EMBEDDED_ROBOTICS"
        }
    },
    {
        "query": "I want to become a Software Engineer at Microsoft.",
        "college_id": 5,
        "college_name": "NIT Durgapur",
        "target_role": "Software Engineer",
        "target_company": "Microsoft",
        "target_domain": "Software Engineering",
        "skills": ["Data Structures", "Java", "C++", "Python", "System Design"],
        "expected_criteria": {
            "college_id": 5,
            "company": "Microsoft",
            "domain": "Software Engineering",
            "role_family": "SOFTWARE_ENGINEERING"
        }
    },
    {
        "query": "I want to become a Cloud/DevOps Engineer at Microsoft.",
        "college_id": 1,
        "college_name": "Institute of Engineering and Management",
        "target_role": "Cloud/DevOps Engineer",
        "target_company": "Microsoft",
        "target_domain": "Cloud & DevOps",
        "skills": ["Linux", "Kubernetes", "Docker", "Azure", "AWS", "Terraform"],
        "expected_criteria": {
            "college_id": 1,
            "company": "Microsoft",
            "domain": "Cloud & DevOps",
            "role_family": "CLOUD_DEVOPS"
        }
    },
    {
        "query": "I want to become a Product Manager at Flipkart.",
        "college_id": 2,
        "college_name": "Jadavpur University",
        "target_role": "Product Manager",
        "target_company": "Flipkart",
        "target_domain": "Product Management",
        "skills": ["User Research", "Agile", "Analytics", "SQL", "Roadmapping"],
        "expected_criteria": {
            "college_id": 2,
            "company": "Flipkart",
            "domain": "Product Management",
            "role_family": "PRODUCT_MANAGEMENT"
        }
    },
    {
        "query": "I want to become an AI Research Scientist at DRDO.",
        "college_id": 3,
        "college_name": "University of Calcutta",
        "target_role": "AI Research Scientist",
        "target_company": "DRDO",
        "target_domain": "AI/ML",
        "skills": ["Deep Learning", "Transformers", "NLP", "Python", "PyTorch"],
        "expected_criteria": {
            "college_id": 3,
            "company": "DRDO",
            "domain": "AI/ML",
            "role_family": "AI_RESEARCH"
        }
    },
    {
        "query": "I want to become a Machine Learning Engineer at Google.",
        "college_id": 4,
        "college_name": "IIT Kharagpur",
        "target_role": "Machine Learning Engineer",
        "target_company": "Google",
        "target_domain": "AI/ML",
        "skills": ["SQL", "MLOps", "Python", "PyTorch", "Machine Learning", "TensorFlow"],
        "expected_criteria": {
            "college_id": 4,
            "company": "Google",
            "domain": "AI/ML",
            "role_family": "MACHINE_LEARNING"
        }
    }
]
