import os
import sys

# Add nested job-portal-system directory to sys.path
sys.path.insert(0, r"c:\Users\pc\Downloads\job-portal-system\job-portal-system")

from app.services.recommendation import (
    calculate_match,
    compute_skill_match,
    compute_experience_match,
    compute_qualification_match,
    compute_location_match,
    compute_role_match
)


class MockJob:
    def __init__(self, id=1, title="", skills="", experience="", description="", location="", job_type="Full Time", company_name="Tech Corp"):
        self.id = id
        self.title = title
        self.skills = skills
        self.experience = experience
        self.description = description
        self.location = location
        self.job_type = job_type
        self.created_at = None
        self.company = type("MockCompany", (), {"company_name": company_name})()


class MockJobSeeker:
    def __init__(self, skills="", experience="", qualification="", location="", preferred_role="", bio="", resume_path=None):
        self.skills = skills
        self.experience = experience
        self.qualification = qualification
        self.location = location
        self.preferred_role = preferred_role
        self.bio = bio
        self.resume_path = resume_path


def run_tests():
    print("==================================================")
    print("TESTING AI RECOMMENDATION WEIGHTED MATCHING ENGINE")
    print("==================================================")

    # Test Case 1: Ideal Match (~95% - 100%)
    job1 = MockJob(
        id=101,
        title="Python Developer",
        skills="Python, Flask, PostgreSQL, Docker",
        experience="2-4 Years",
        description="Looking for a Python Developer with B.Tech or MCA in Computer Science.",
        location="Chennai",
        job_type="Full Time"
    )

    candidate1 = MockJobSeeker(
        skills="Python, Flask, PostgreSQL, Docker, Git",
        experience="3 Years",
        qualification="B.Tech Computer Science",
        location="Chennai",
        preferred_role="Python Developer",
        bio="Passionate Python developer building web applications."
    )

    res1 = calculate_match(candidate1, job1)
    print(f"\n[Test 1] Ideal Match Test:")
    print(f"  Score: {res1['match_percentage']}%")
    print(f"  Breakdown: {res1['breakdown']}")
    print(f"  Matched Skills: {res1['matched_skills']}")
    print(f"  Missing Skills: {res1['missing_skills']}")

    assert res1['match_percentage'] >= 90, f"Expected >= 90%, got {res1['match_percentage']}"
    assert res1['breakdown']['skill_score'] == 40.0
    assert res1['breakdown']['experience_score'] == 25.0
    assert res1['breakdown']['qualification_score'] == 15.0
    assert res1['breakdown']['location_score'] == 10.0
    assert res1['breakdown']['role_score'] == 10.0
    print("  => PASS: 100% breakdown weights matched perfectly.")

    # Test Case 2: Complete Mismatch (should be low, between 0% and 25%)
    job2 = MockJob(
        id=102,
        title="Senior Android Kotlin Architect",
        skills="Kotlin, Android SDK, Jetpack Compose, Coroutines, Dagger Hilt",
        experience="8+ Years",
        description="Requires M.Tech or PhD with extensive mobile architecture experience.",
        location="London, UK",
        job_type="Full Time"
    )

    candidate2 = MockJobSeeker(
        skills="PHP, WordPress, HTML, CSS",
        experience="Fresher",
        qualification="High School / 12th",
        location="Mumbai, India",
        preferred_role="Web Content Editor",
        bio="Looking for entry level content entry work."
    )

    res2 = calculate_match(candidate2, job2)
    print(f"\n[Test 2] Low Match / Mismatch Test:")
    print(f"  Score: {res2['match_percentage']}%")
    print(f"  Breakdown: {res2['breakdown']}")
    print(f"  Matched Skills: {res2['matched_skills']}")
    print(f"  Missing Skills: {res2['missing_skills']}")

    assert 0 <= res2['match_percentage'] <= 25, f"Expected 0-25%, got {res2['match_percentage']}"
    assert res2['breakdown']['skill_score'] == 0.0
    assert len(res2['missing_skills']) == 5
    print("  => PASS: Correctly scored low match.")

    # Test Case 3: Partial Match (e.g. 50% skills, right location & role, slightly less experience)
    job3 = MockJob(
        id=103,
        title="Full Stack Engineer",
        skills="React, Node.js, AWS, MongoDB",
        experience="3-5 Years",
        description="Full stack engineer required. Bachelor's degree required.",
        location="Bangalore",
        job_type="Full Time"
    )

    candidate3 = MockJobSeeker(
        skills="React, Node.js",  # 2 of 4 skills (50% skills => 20/40)
        experience="2 Years",     # 1 yr diff (17.5/25)
        qualification="B.E Information Technology", # Tier 3 (15/15)
        location="Bangalore",     # Location match (10/10)
        preferred_role="Full Stack Developer", # Role match (10/10)
        bio="Building web apps with React and Node"
    )

    res3 = calculate_match(candidate3, job3)
    print(f"\n[Test 3] Partial Match Test:")
    print(f"  Score: {res3['match_percentage']}%")
    print(f"  Breakdown: {res3['breakdown']}")
    print(f"  Matched: {res3['matched_skills']}, Missing: {res3['missing_skills']}")

    assert 65 <= res3['match_percentage'] <= 80, f"Expected 65-80%, got {res3['match_percentage']}"
    assert res3['breakdown']['skill_score'] == 20.0
    assert res3['breakdown']['qualification_score'] == 15.0
    assert res3['breakdown']['location_score'] == 10.0
    print("  => PASS: Accurately calculated partial weighted components.")

    # Test Case 4: Remote Job Handling
    job4 = MockJob(
        id=104,
        title="Backend Developer",
        skills="Python, Django",
        experience="1-3 Years",
        description="Remote work position.",
        location="Remote",
        job_type="Full Time"
    )

    candidate4 = MockJobSeeker(
        skills="Python, Django",
        experience="2 Years",
        qualification="BSc Computer Science",
        location="Tokyo, Japan",
        preferred_role="Backend Developer"
    )

    res4 = calculate_match(candidate4, job4)
    print(f"\n[Test 4] Remote Job Test:")
    print(f"  Score: {res4['match_percentage']}%")
    print(f"  Location Score: {res4['breakdown']['location_score']}/10")
    assert res4['breakdown']['location_score'] == 10.0, "Remote job should give full location score"
    assert res4['match_percentage'] >= 95
    print("  => PASS: Remote job location scoring verified.")

    # Test Case 5: Bound check (0 <= score <= 100)
    for score_item in [res1, res2, res3, res4]:
        assert 0 <= score_item['match_percentage'] <= 100
        total_parts = sum(score_item['breakdown'].values())
        assert 0 <= total_parts <= 100.1

    print("\n==================================================")
    print("ALL 5 AI RECOMMENDATION TEST SUITES PASSED!")
    print("==================================================")


if __name__ == "__main__":
    run_tests()
