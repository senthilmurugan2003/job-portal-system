import os
import re
from flask import current_app
from app.models import Job

# Normalized mapping for tech aliases and synonyms
SYNONYM_MAP = {
    "js": "javascript",
    "ts": "typescript",
    "py": "python",
    "react.js": "react",
    "reactjs": "react",
    "vue.js": "vue",
    "vuejs": "vue",
    "node.js": "nodejs",
    "node": "nodejs",
    "postgres": "postgresql",
    "k8s": "kubernetes",
    "golang": "go",
    "cpp": "c++",
    "c#": "csharp",
    "c sharp": "csharp",
    "aws": "amazon web services",
    "gcp": "google cloud",
    "azure": "microsoft azure",
    "ml": "machine learning",
    "ai": "artificial intelligence",
    "dl": "deep learning",
    "nlp": "natural language processing",
    "ci/cd": "cicd",
    "html5": "html",
    "css3": "css",
    "mongo": "mongodb",
    "restful": "rest api",
    "rest": "rest api",
    "drf": "django rest framework",
    "ror": "ruby on rails",
    "fe": "frontend",
    "be": "backend"
}

# Common technical skills / languages / frameworks keywords glossary
TECH_GLOSSARY = {
    "python", "javascript", "typescript", "java", "c++", "c#", "csharp", "c", "ruby", "php",
    "go", "golang", "rust", "kotlin", "swift", "scala", "r", "dart", "sql", "html", "css",
    "react", "angular", "vue", "next.js", "nextjs", "nuxt", "svelte", "jquery", "bootstrap",
    "tailwind", "node", "nodejs", "express", "flask", "django", "fastapi", "spring", "spring boot",
    "asp.net", "laravel", "rails", "ruby on rails", "graphql", "rest api", "rest", "grpc",
    "postgresql", "postgres", "mysql", "sqlite", "mongodb", "redis", "elasticsearch", "cassandra",
    "dynamodb", "oracle", "mariadb", "firebase", "supabase", "docker", "kubernetes", "k8s",
    "aws", "amazon web services", "azure", "gcp", "google cloud", "jenkins", "gitlab", "github actions",
    "terraform", "ansible", "linux", "git", "ci/cd", "cicd", "microservices", "agile", "scrum",
    "machine learning", "deep learning", "nlp", "computer vision", "pytorch", "tensorflow",
    "keras", "scikit-learn", "pandas", "numpy", "opencv", "spark", "hadoop", "kafka"
}

ROLE_DOMAINS = {
    "frontend": ["frontend", "front-end", "ui", "ux", "react", "angular", "vue", "web developer", "html", "css"],
    "backend": ["backend", "back-end", "server", "python", "node", "java", "api", "database", "flask", "django", "spring"],
    "fullstack": ["fullstack", "full stack", "full-stack", "software engineer", "web developer"],
    "data_science": ["data scientist", "data analyst", "machine learning", "ai", "deep learning", "nlp", "data engineer", "analytics"],
    "devops": ["devops", "cloud", "sre", "infrastructure", "kubernetes", "docker", "aws", "ci/cd", "sysadmin"],
    "mobile": ["mobile", "android", "ios", "flutter", "react native", "swift", "kotlin"],
    "qa": ["qa", "testing", "test engineer", "automation", "quality assurance", "selenium"],
    "product": ["product manager", "project manager", "scrum master", "business analyst"]
}


def normalize_token(token):
    """
    Normalizes a single skill or keyword token.
    """
    if not token:
        return ""
    cleaned = token.strip().lower()
    cleaned = re.sub(r'[\s\-_]+', ' ', cleaned)
    return SYNONYM_MAP.get(cleaned, cleaned)


def parse_skills_list(skills_str):
    """
    Parses a string of delimiter-separated skills into a list of clean normalized tokens and original tokens.
    """
    if not skills_str:
        return []
    raw = [s.strip() for s in re.split(r'[,/;|\n\r]+', str(skills_str)) if s.strip()]
    return raw


def extract_resume_text(resume_path):
    """
    Extracts text content from uploaded resume if present and accessible on disk.
    """
    if not resume_path:
        return ""

    try:
        if current_app:
            base_dir = current_app.root_path
        else:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

        clean_path = resume_path.lstrip("/\\")
        if clean_path.startswith("static/"):
            file_path = os.path.join(base_dir, clean_path)
        else:
            file_path = os.path.join(base_dir, "static", clean_path)

        if not os.path.isfile(file_path):
            return ""

        ext = file_path.rsplit(".", 1)[-1].lower()

        # Text files
        if ext in ("txt", "md"):
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()

        # PDF files
        if ext == "pdf":
            try:
                import pypdf
                reader = pypdf.PdfReader(file_path)
                return " ".join([page.extract_text() or "" for page in reader.pages])
            except Exception:
                try:
                    import PyPDF2
                    reader = PyPDF2.PdfReader(file_path)
                    return " ".join([page.extract_text() or "" for page in reader.pages])
                except Exception:
                    # Fallback binary string extraction
                    with open(file_path, "rb") as f:
                        raw = f.read()
                        text_chunks = re.findall(rb'[\x20-\x7E]{4,}', raw)
                        return " ".join([chunk.decode("utf-8", errors="ignore") for chunk in text_chunks])

        # DOCX files
        if ext == "docx":
            try:
                import docx
                doc = docx.Document(file_path)
                return " ".join([p.text for p in doc.paragraphs])
            except Exception:
                pass

    except Exception as e:
        print(f"Resume text extraction notice: {e}")

    return ""


# =========================================================================
# 1. SKILL MATCHING (40% WEIGHT)
# =========================================================================

def compute_skill_match(job_seeker, job, resume_text=""):
    """
    Evaluates Technical skills, programming languages, framework skills,
    bio keywords, and resume information vs job required skills and description.
    Returns: (skill_score_0_to_40, matched_skills_list, missing_skills_list)
    """
    # 1. Gather all candidate text sources
    cand_sources = [
        getattr(job_seeker, "skills", "") or "",
        getattr(job_seeker, "bio", "") or "",
        getattr(job_seeker, "preferred_role", "") or "",
        resume_text or ""
    ]
    cand_text_combined = " ".join(cand_sources).lower()
    
    # Candidate explicit skill tokens
    cand_explicit_skills = parse_skills_list(getattr(job_seeker, "skills", ""))
    cand_skill_set = set()
    for s in cand_explicit_skills:
        cand_skill_set.add(s.lower().strip())
        cand_skill_set.add(normalize_token(s))

    # Also detect any known tech terms mentioned in candidate bio/resume
    for tech in TECH_GLOSSARY:
        if re.search(r'\b' + re.escape(tech) + r'\b', cand_text_combined):
            cand_skill_set.add(tech)
            cand_skill_set.add(normalize_token(tech))

    # 2. Gather Job Required Skills
    raw_job_skills = parse_skills_list(getattr(job, "skills", ""))
    job_required_set = []

    if raw_job_skills:
        job_required_set = raw_job_skills
    else:
        # Fallback: extract tech keywords from job description
        job_desc = (getattr(job, "description", "") or "").lower()
        job_title = (getattr(job, "title", "") or "").lower()
        combined_job = f"{job_title} {job_desc}"
        found = []
        for tech in TECH_GLOSSARY:
            if re.search(r'\b' + re.escape(tech) + r'\b', combined_job):
                found.append(tech.title())
        job_required_set = found

    # If still empty, evaluate candidate skills against job title
    if not job_required_set:
        if cand_skill_set:
            return 25.0, list(cand_explicit_skills[:5]), []
        return 20.0, [], []

    matched_skills = []
    missing_skills = []

    for req_skill in job_required_set:
        req_clean = req_skill.strip()
        req_norm = normalize_token(req_clean)
        req_lower = req_clean.lower()

        # Check exact or normalized containment
        is_matched = False
        if req_lower in cand_skill_set or req_norm in cand_skill_set:
            is_matched = True
        elif any(req_lower in cs or cs in req_lower for cs in cand_skill_set if len(cs) > 2):
            is_matched = True
        elif re.search(r'\b' + re.escape(req_lower) + r'\b', cand_text_combined):
            is_matched = True
        elif req_norm and re.search(r'\b' + re.escape(req_norm) + r'\b', cand_text_combined):
            is_matched = True

        if is_matched:
            if req_clean not in matched_skills:
                matched_skills.append(req_clean)
        else:
            if req_clean not in missing_skills:
                missing_skills.append(req_clean)

    # Ratio of required skills matched
    total_req = len(job_required_set)
    matched_count = len(matched_skills)

    if total_req > 0:
        ratio = matched_count / total_req
    else:
        ratio = 0.5

    # Skill Score (Weight 40%)
    skill_score = min(40.0, max(0.0, ratio * 40.0))
    return skill_score, matched_skills, missing_skills


# =========================================================================
# 2. EXPERIENCE MATCHING (25% WEIGHT)
# =========================================================================

def parse_experience_years(text):
    """
    Parses experience text into (min_years, max_years) float tuple.
    Handles 'fresher', '0-2 years', '3+ years', '5 years', etc.
    """
    if not text:
        return None

    s = str(text).strip().lower()

    if any(k in s for k in ("fresher", "entry level", "graduate", "intern", "trainee", "0 years", "0 yr")):
        return (0.0, 1.0)

    # Match range pattern: "0-2 years", "1 to 3 yrs", "2-5 yrs"
    range_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)?', s)
    if range_match:
        try:
            low = float(range_match.group(1))
            high = float(range_match.group(2))
            return (min(low, high), max(low, high))
        except ValueError:
            pass

    # Match "X+ years", "min X years", "X years"
    single_match = re.search(r'(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?|yr)?', s)
    if single_match:
        try:
            val = float(single_match.group(1))
            if "+" in s or "min" in s:
                return (val, val + 5.0)
            return (val, val)
        except ValueError:
            pass

    return None


def compute_experience_match(job_seeker, job, resume_text=""):
    """
    Compares candidate experience with job required experience.
    Returns: experience_score_0_to_25
    """
    cand_exp_str = getattr(job_seeker, "experience", "") or ""
    job_exp_str = getattr(job, "experience", "") or ""

    # Fallback to searching description/bio
    if not cand_exp_str and resume_text:
        cand_exp_parsed = parse_experience_years(resume_text)
    else:
        cand_exp_parsed = parse_experience_years(cand_exp_str)

    if not job_exp_str:
        job_exp_parsed = parse_experience_years(getattr(job, "description", ""))
    else:
        job_exp_parsed = parse_experience_years(job_exp_str)

    # If neither specifies experience, default neutral matching
    if cand_exp_parsed is None and job_exp_parsed is None:
        return 18.0

    # If job does not specify experience requirement
    if job_exp_parsed is None:
        return 22.0 if cand_exp_parsed is not None else 18.0

    job_min, job_max = job_exp_parsed

    # If candidate did not specify experience
    if cand_exp_parsed is None:
        if job_min == 0:
            return 20.0  # Entry level friendly
        return 10.0

    cand_min, cand_max = cand_exp_parsed
    cand_val = cand_max if cand_max is not None else cand_min

    # Job is entry-level / fresher friendly
    if job_min == 0:
        if cand_val <= 3.0:
            return 25.0
        return 22.5  # Slightly overqualified for fresher job

    # Experienced job requirement
    if cand_val >= job_min:
        if cand_val <= job_max + 3.0:
            return 25.0  # Exact/Ideal experience bracket
        return 22.5  # Overqualified candidate

    # Candidate has less experience than required
    diff = job_min - cand_val
    if diff <= 1.0:
        return 17.5  # Close (e.g. 2 yrs vs 3 yrs required) -> 70%
    elif diff <= 2.0:
        return 10.0  # Moderate gap -> 40%
    else:
        return 3.0   # Large gap -> 12%


# =========================================================================
# 3. QUALIFICATION MATCHING (15% WEIGHT)
# =========================================================================

QUALIFICATION_TIERS = {
    # Tier 5: Doctorate
    5: ["phd", "ph.d", "doctorate", "doctoral"],
    # Tier 4: Masters
    4: ["master", "m.tech", "mtech", "ms", "m.s", "mca", "mba", "m.sc", "msc", "m.e", "me", "post graduate", "pg", "m.com", "m.a"],
    # Tier 3: Bachelors
    3: ["bachelor", "b.tech", "btech", "b.e", "be", "b.sc", "bsc", "bca", "bba", "b.com", "bcom", "b.a", "ba", "bs", "graduate", "undergraduate", "degree", "b.arch"],
    # Tier 2: Diploma / Associates
    2: ["diploma", "associate", "polytechnic"],
    # Tier 1: High School
    1: ["12th", "high school", "secondary", "hsc", "ssc", "10th", "matriculation"]
}


def parse_qualification_tier(text):
    """
    Determines qualification tier (1 to 5) from text string.
    """
    if not text:
        return 0

    s = str(text).lower()
    for tier in (5, 4, 3, 2, 1):
        for pattern in QUALIFICATION_TIERS[tier]:
            if re.search(r'\b' + re.escape(pattern) + r'\b', s):
                return tier

    return 0


def compute_qualification_match(job_seeker, job, resume_text=""):
    """
    Compares candidate qualification with job qualification requirement.
    Returns: qualification_score_0_to_15
    """
    cand_qual_str = getattr(job_seeker, "qualification", "") or ""
    cand_tier = parse_qualification_tier(cand_qual_str)

    if cand_tier == 0 and getattr(job_seeker, "bio", ""):
        cand_tier = parse_qualification_tier(job_seeker.bio)

    if cand_tier == 0 and resume_text:
        cand_tier = parse_qualification_tier(resume_text)

    # Check job requirement in description or skills
    job_desc = getattr(job, "description", "") or ""
    job_skills = getattr(job, "skills", "") or ""
    job_title = getattr(job, "title", "") or ""
    job_text = f"{job_title} {job_desc} {job_skills}"

    job_tier = parse_qualification_tier(job_text)
    if job_tier == 0:
        # Default typical job requirement is Bachelor (Tier 3)
        job_tier = 3

    if cand_tier == 0:
        # Candidate qualification unspecified
        return 6.0

    if cand_tier >= job_tier:
        return 15.0  # Fully qualified or higher degree
    elif cand_tier == job_tier - 1:
        return 10.0  # 1 tier below (e.g. Diploma for Bachelor role)
    elif cand_tier == job_tier - 2:
        return 5.0   # 2 tiers below
    else:
        return 2.0


# =========================================================================
# 4. LOCATION MATCHING (10% WEIGHT)
# =========================================================================

def compute_location_match(job_seeker, job):
    """
    Evaluates candidate location against job location and job type.
    Returns: location_score_0_to_10
    """
    cand_loc = (getattr(job_seeker, "location", "") or "").strip().lower()
    job_loc = (getattr(job, "location", "") or "").strip().lower()
    job_type = (getattr(job, "job_type", "") or "").strip().lower()

    # Remote / Work from home
    if any(k in job_loc for k in ("remote", "work from home", "wfh", "anywhere", "flexible")) or "remote" in job_type or "remote" in cand_loc:
        return 10.0

    if not job_loc or not cand_loc:
        return 6.0

    # Clean location tokens
    cand_tokens = set([t.strip() for t in re.split(r'[,/\s\-]+', cand_loc) if len(t.strip()) > 2])
    job_tokens = set([t.strip() for t in re.split(r'[,/\s\-]+', job_loc) if len(t.strip()) > 2])

    # Direct substring or token overlap (e.g. "Chennai", "Bangalore", "New York")
    if cand_loc in job_loc or job_loc in cand_loc or (cand_tokens & job_tokens):
        return 10.0

    # Common country matching (e.g. both in India or US)
    countries = {"india", "usa", "us", "uk", "canada", "germany", "australia", "singapore", "uae"}
    if (cand_tokens & countries) and (job_tokens & countries) and (cand_tokens & countries == job_tokens & countries):
        return 6.5

    # Relocation / Open to other locations
    return 1.5


# =========================================================================
# 5. ROLE / JOB TITLE MATCHING (10% WEIGHT)
# =========================================================================

def compute_role_match(job_seeker, job, resume_text=""):
    """
    Compares candidate preferred role & profile summary with job title and type.
    Returns: role_score_0_to_10
    """
    cand_role = (getattr(job_seeker, "preferred_role", "") or "").strip().lower()
    cand_bio = (getattr(job_seeker, "bio", "") or "").strip().lower()
    job_title = (getattr(job, "title", "") or "").strip().lower()

    if not job_title:
        return 5.0

    if not cand_role:
        if cand_bio:
            cand_role = cand_bio
        elif resume_text:
            cand_role = resume_text[:200].lower()
        else:
            return 5.0

    # Direct substring match
    if cand_role in job_title or job_title in cand_role:
        return 10.0

    # Stopwords removal for title comparison
    stopwords = {"developer", "engineer", "specialist", "senior", "junior", "lead", "associate", "intern", "software", "the", "a", "an", "for", "at", "in", "and", "of"}
    cand_tokens = set(re.findall(r'[a-z]+', cand_role)) - stopwords
    job_tokens = set(re.findall(r'[a-z]+', job_title)) - stopwords

    if cand_tokens and job_tokens:
        intersection = cand_tokens & job_tokens
        if intersection:
            similarity = len(intersection) / len(job_tokens)
            return min(10.0, max(6.0, similarity * 10.0))

    # Domain category comparison (e.g. Frontend, Backend, Data Science)
    cand_domains = []
    job_domains = []
    for domain, keywords in ROLE_DOMAINS.items():
        if any(k in cand_role for k in keywords):
            cand_domains.append(domain)
        if any(k in job_title for k in keywords):
            job_domains.append(domain)

    if cand_domains and job_domains:
        if set(cand_domains) & set(job_domains):
            return 8.5
        if ("fullstack" in cand_domains and any(d in job_domains for d in ("frontend", "backend"))) or \
           ("fullstack" in job_domains and any(d in cand_domains for d in ("frontend", "backend"))):
            return 7.5

    return 2.0


# =========================================================================
# MAIN MATCHING ENGINE (0% - 100% WEIGHTED)
# =========================================================================

def calculate_match(job_seeker, job):
    """
    Compares a JobSeeker profile with a Job post using the 5-pillar weighted matching algorithm:
    - Skill Match: 40%
    - Experience Match: 25%
    - Qualification Match: 15%
    - Location Match: 10%
    - Role/Job Title Match: 10%

    Final Score: Bounded between 0% - 100%.
    """
    resume_text = extract_resume_text(getattr(job_seeker, "resume_path", None))

    # 1. Skill Match (40%)
    skill_score, matched_skills, missing_skills = compute_skill_match(job_seeker, job, resume_text)

    # 2. Experience Match (25%)
    exp_score = compute_experience_match(job_seeker, job, resume_text)

    # 3. Qualification Match (15%)
    qual_score = compute_qualification_match(job_seeker, job, resume_text)

    # 4. Location Match (10%)
    loc_score = compute_location_match(job_seeker, job)

    # 5. Role Match (10%)
    role_score = compute_role_match(job_seeker, job, resume_text)

    # Total Score Calculation (0 - 100)
    total_score = skill_score + exp_score + qual_score + loc_score + role_score
    final_percentage = int(round(max(0.0, min(100.0, total_score))))

    return {
        "job_id": job.id,
        "title": job.title,
        "company": job.company.company_name if (hasattr(job, "company") and job.company) else "Company",
        "location": job.location,
        "salary": job.salary or "Competitive",
        "job_type": job.job_type,
        "experience": job.experience or "Not specified",
        "description": job.description,
        "match_percentage": final_percentage,
        "breakdown": {
            "skill_score": round(skill_score, 1),
            "experience_score": round(exp_score, 1),
            "qualification_score": round(qual_score, 1),
            "location_score": round(loc_score, 1),
            "role_score": round(role_score, 1)
        },
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "created_at": getattr(job, "created_at", None)
    }


def get_job_recommendations(job_seeker):
    """
    Fetches all open jobs and ranks them by match_percentage descending for the given job_seeker.
    """
    open_jobs = Job.query.filter_by(status="open").all()

    recommendations = []
    for job in open_jobs:
        rec = calculate_match(job_seeker, job)
        recommendations.append(rec)

    # Sort descending by match_percentage, then by id
    recommendations.sort(key=lambda x: (x["match_percentage"], x.get("job_id", 0)), reverse=True)
    return recommendations
