"""
Exhibit A workforce pipeline — resume upload credit deduct/refund behavior,
and the 402/404 guardrails around analysis and roadmap generation. AI calls
are mocked here (no live Gemini traffic in the test suite); the pipeline has
separately been verified against the real API — see docs/TrainPi-Remaining-Checklist.md.
"""
from unittest.mock import patch


def test_resume_upload_deducts_credits_on_success(client, auth_as, make_user):
    user = make_user(email="wf1@example.com", credits=100)
    client = auth_as(user)

    fake_result = {
        "work_history": ["SOC Analyst, 2 years"],
        "skills": ["log analysis", "SIEM basics"],
        "certifications": [],
        "tools": ["Splunk"],
        "years_experience": 2,
        "strengths": ["Fast triage"],
        "missing_or_unclear_skills": ["formal certs"],
    }
    with patch("app.routers.workforce.get_gemini_json_response", return_value=fake_result):
        resp = client.post(
            "/api/workforce/profile/upload-resume",
            files={"file": ("resume.txt", b"Jane Doe, SOC Analyst", "text/plain")},
        )

    assert resp.status_code == 200
    data = resp.json()
    assert data["extracted_skills"] == ["log analysis", "SIEM basics"]

    balance = client.get("/api/credits/balance").json()
    assert balance["credits"] == 95  # CREDITS_PER_WORKFORCE_PROFILE_ANALYZE = 5


def test_resume_upload_refunds_credits_on_ai_failure(client, auth_as, make_user):
    user = make_user(email="wf2@example.com", credits=100)
    client = auth_as(user)

    with patch("app.routers.workforce.get_gemini_json_response", return_value={"error": "quota exceeded"}):
        resp = client.post(
            "/api/workforce/profile/upload-resume",
            files={"file": ("resume.txt", b"Jane Doe, SOC Analyst", "text/plain")},
        )

    # Upload itself still succeeds (soft-degrade: profile persists, extraction fields stay empty)
    assert resp.status_code == 200
    data = resp.json()
    assert data["extracted_skills"] == []

    balance = client.get("/api/credits/balance").json()
    assert balance["credits"] == 100  # refunded back to full


def test_resume_upload_rejects_when_insufficient_credits(client, auth_as, make_user):
    user = make_user(email="wf3@example.com", credits=2)  # less than the 5-credit cost
    client = auth_as(user)

    resp = client.post(
        "/api/workforce/profile/upload-resume",
        files={"file": ("resume.txt", b"Jane Doe", "text/plain")},
    )
    assert resp.status_code == 402


def test_analyze_with_no_profile_or_documents_still_calls_ai(client, auth_as, make_user):
    """/analyze has no guard requiring a profile/documents to exist first —
    it auto-creates an empty profile and analyzes against zero documents.
    Documenting actual behavior rather than assuming a 400/404 guard exists
    (there isn't one in workforce.py); worth a product judgment call on
    whether that's desired, but it's not a bug this test suite should mask."""
    user = make_user(email="wf4@example.com", credits=100)
    client = auth_as(user)

    fake_result = {
        "overall_score": 0,
        "readiness_label": "Not Ready",
        "summary": "No data available for comparison.",
    }
    with patch("app.routers.workforce.get_gemini_json_response", return_value=fake_result):
        resp = client.post("/api/workforce/analyze")

    assert resp.status_code == 200


def test_roadmap_requires_existing_analysis(client, auth_as, make_user):
    user = make_user(email="wf5@example.com", credits=100)
    client = auth_as(user)

    resp = client.post("/api/workforce/roadmap")
    assert resp.status_code == 404


def test_context_upload_rejects_invalid_category(client, auth_as, make_user):
    user = make_user(email="wf6@example.com", credits=100)
    client = auth_as(user)

    resp = client.post(
        "/api/workforce/context/upload",
        files={"file": ("doc.txt", b"some SOP text", "text/plain")},
        data={"category": "not-a-real-category"},
    )
    assert resp.status_code == 400


def test_context_upload_extracts_all_documented_fields(client, auth_as, make_user):
    user = make_user(email="wf7@example.com", credits=100)
    client = auth_as(user)

    fake_result = {
        "document_type": "Incident Response SOP",
        "requirements": ["15-minute triage SLA"],
        "skills": ["SIEM"],
        "workflows": ["Triage -> Escalate -> Resolve"],
        "role_expectations": ["On-call rotation"],
        "keywords": ["SOC", "SIEM"],
        "tools": ["Splunk"],
        "compliance_requirements": ["CP-114"],
        "mission_objectives": ["24/7 coverage"],
    }
    with patch("app.routers.workforce.get_gemini_json_response", return_value=fake_result):
        resp = client.post(
            "/api/workforce/context/upload",
            files={"file": ("sop.txt", b"Incident Response SOP text", "text/plain")},
            data={"category": "sop"},
        )

    assert resp.status_code == 200
    data = resp.json()
    assert data["document_type"] == "Incident Response SOP"
    assert data["extracted_compliance_requirements"] == ["CP-114"]
    assert data["extracted_mission_objectives"] == ["24/7 coverage"]
