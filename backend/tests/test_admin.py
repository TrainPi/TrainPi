"""
Access control for org-scoped admin endpoints — the audit confirmed every
sensitive endpoint in admin.py calls _require_org_admin, but flagged that
no test code existed anywhere to make that reproducible. These tests lock
that behavior in.
"""


def _create_org(client, name="Acme Corp"):
    resp = client.post("/api/admin/organizations", json={"name": name, "description": "test org"})
    assert resp.status_code == 200
    return resp.json()


def test_org_creator_becomes_admin_and_can_read_own_org(client, auth_as, make_user):
    owner = make_user(email="owner@example.com")
    client = auth_as(owner)

    org = _create_org(client)

    resp = client.get(f"/api/admin/organizations/{org['id']}/members")
    assert resp.status_code == 200
    members = resp.json()
    assert len(members) == 1
    assert members[0]["email"] == "owner@example.com"
    assert members[0]["role"] == "org_admin"


def test_outsider_cannot_read_org_members(client, auth_as, make_user):
    owner = make_user(email="owner2@example.com")
    outsider = make_user(email="outsider@example.com")

    org = _create_org(auth_as(owner))

    resp = auth_as(outsider).get(f"/api/admin/organizations/{org['id']}/members")
    assert resp.status_code == 403


def test_participant_role_cannot_access_admin_endpoints(client, auth_as, make_user):
    owner = make_user(email="owner3@example.com")
    participant = make_user(email="participant@example.com")

    org = _create_org(auth_as(owner))
    invite_resp = auth_as(owner).post(
        f"/api/admin/organizations/{org['id']}/members",
        json={"email": "participant@example.com", "role": "participant"},
    )
    assert invite_resp.status_code == 200
    assert invite_resp.json()["role"] == "participant"

    # A participant (not org_admin) must be rejected from admin-only views
    resp = auth_as(participant).get(f"/api/admin/organizations/{org['id']}/readiness-summary")
    assert resp.status_code == 403

    resp = auth_as(participant).get(f"/api/admin/organizations/{org['id']}/ai-interactions")
    assert resp.status_code == 403


def test_platform_admin_can_access_any_org(client, auth_as, make_user):
    owner = make_user(email="owner4@example.com")
    platform_admin = make_user(email="superadmin@example.com", is_platform_admin=True)

    org = _create_org(auth_as(owner))

    resp = auth_as(platform_admin).get(f"/api/admin/organizations/{org['id']}/readiness-summary")
    assert resp.status_code == 200


def test_nonexistent_org_returns_404_not_403(client, auth_as, make_user):
    user = make_user(email="user5@example.com")
    resp = auth_as(user).get("/api/admin/organizations/999999/members")
    assert resp.status_code == 404


def test_readiness_summary_empty_org_has_clean_zero_state(client, auth_as, make_user):
    owner = make_user(email="owner6@example.com")
    org = _create_org(auth_as(owner))

    resp = auth_as(owner).get(f"/api/admin/organizations/{org['id']}/readiness-summary")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_participants"] == 1  # the owner themself
    assert data["participants_with_analysis"] == 0
    assert data["average_readiness_score"] is None


def test_ai_interactions_empty_org_has_clean_zero_state(client, auth_as, make_user):
    owner = make_user(email="owner7@example.com")
    org = _create_org(auth_as(owner))

    resp = auth_as(owner).get(f"/api/admin/organizations/{org['id']}/ai-interactions")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_interactions"] == 0
    assert data["total_credits_used"] == 0
    assert data["by_feature"] == []
    assert data["recent_events"] == []


def test_remove_member_requires_admin(client, auth_as, make_user):
    owner = make_user(email="owner8@example.com")
    participant = make_user(email="participant2@example.com")
    org = _create_org(auth_as(owner))
    auth_as(owner).post(
        f"/api/admin/organizations/{org['id']}/members",
        json={"email": "participant2@example.com", "role": "participant"},
    )

    # Participant (non-admin) cannot remove anyone
    resp = auth_as(participant).delete(f"/api/admin/organizations/{org['id']}/members/{owner.id}")
    assert resp.status_code == 403

    # Owner (admin) can remove the participant
    resp = auth_as(owner).delete(f"/api/admin/organizations/{org['id']}/members/{participant.id}")
    assert resp.status_code == 200
