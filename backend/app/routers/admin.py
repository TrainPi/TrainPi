"""
Admin & Organizational Features (Exhibit A) — organization creation,
membership management, and aggregate readiness monitoring across
participants. This is what makes org_admins able to see workforce
readiness across their whole team, not just their own profile.

Role model:
- Every OrganizationMembership has a role: 'participant' or 'org_admin'.
- A user can belong to multiple organizations with different roles.
- User.is_platform_admin is a separate, platform-wide superadmin flag
  (not tied to any one organization) for TrainPi's own operators.
"""
from collections import Counter
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db, get_db_read
from app.models import (
    User,
    Organization,
    OrganizationMembership,
    WorkforceProfile,
    WorkforceAnalysis,
)
from app.schemas import (
    OrganizationCreate,
    OrganizationResponse,
    OrganizationMemberInvite,
    OrganizationMemberResponse,
    OrganizationReadinessSummary,
    ParticipantReadinessSummary,
)
from app.auth import get_current_user

router = APIRouter()

VALID_ROLES = {"participant", "org_admin"}


def _require_org_admin(org_id: int, user: User, db: Session) -> Organization:
    """Raise 403/404 unless the current user is an org_admin of this organization
    (or a platform admin, who can access any organization)."""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if user.is_platform_admin:
        return org

    membership = (
        db.query(OrganizationMembership)
        .filter(
            OrganizationMembership.organization_id == org_id,
            OrganizationMembership.user_id == user.id,
            OrganizationMembership.role == "org_admin",
        )
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Admin access to this organization is required")
    return org


@router.post("/organizations", response_model=OrganizationResponse)
def create_organization(
    body: OrganizationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new organization. The creator is automatically its first org_admin."""
    org = Organization(name=body.name, description=body.description, created_by_user_id=current_user.id)
    db.add(org)
    db.commit()
    db.refresh(org)

    membership = OrganizationMembership(organization_id=org.id, user_id=current_user.id, role="org_admin")
    db.add(membership)
    db.commit()

    return org


@router.get("/organizations", response_model=List[OrganizationResponse])
def list_my_organizations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List organizations the current user belongs to (any role)."""
    org_ids = [
        m.organization_id
        for m in db.query(OrganizationMembership).filter(OrganizationMembership.user_id == current_user.id).all()
    ]
    if not org_ids:
        return []
    return db.query(Organization).filter(Organization.id.in_(org_ids)).all()


@router.post("/organizations/{org_id}/members", response_model=OrganizationMemberResponse)
def invite_member(
    org_id: int,
    body: OrganizationMemberInvite,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add an existing TrainPi user to this organization by email."""
    _require_org_admin(org_id, current_user, db)

    if body.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Role must be one of: {sorted(VALID_ROLES)}")

    target_user = db.query(User).filter(User.email == body.email).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="No TrainPi user found with that email. They must register first.")

    existing = (
        db.query(OrganizationMembership)
        .filter(OrganizationMembership.organization_id == org_id, OrganizationMembership.user_id == target_user.id)
        .first()
    )
    if existing:
        existing.role = body.role
        db.commit()
        db.refresh(existing)
        membership = existing
    else:
        membership = OrganizationMembership(organization_id=org_id, user_id=target_user.id, role=body.role)
        db.add(membership)
        db.commit()
        db.refresh(membership)

    return OrganizationMemberResponse(
        user_id=target_user.id,
        email=target_user.email,
        full_name=target_user.full_name,
        role=membership.role,
        joined_at=membership.joined_at,
    )


@router.delete("/organizations/{org_id}/members/{user_id}")
def remove_member(
    org_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_org_admin(org_id, current_user, db)
    membership = (
        db.query(OrganizationMembership)
        .filter(OrganizationMembership.organization_id == org_id, OrganizationMembership.user_id == user_id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=404, detail="Member not found in this organization")
    db.delete(membership)
    db.commit()
    return {"message": "Member removed"}


@router.get("/organizations/{org_id}/members", response_model=List[OrganizationMemberResponse])
def list_members(
    org_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_org_admin(org_id, current_user, db)
    memberships = (
        db.query(OrganizationMembership)
        .filter(OrganizationMembership.organization_id == org_id)
        .all()
    )
    result = []
    for m in memberships:
        user = db.query(User).filter(User.id == m.user_id).first()
        if user:
            result.append(OrganizationMemberResponse(
                user_id=user.id, email=user.email, full_name=user.full_name,
                role=m.role, joined_at=m.joined_at,
            ))
    return result


@router.get("/organizations/{org_id}/readiness-summary", response_model=OrganizationReadinessSummary)
def get_readiness_summary(
    org_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_read),
):
    """
    Aggregate workforce readiness across every participant in this organization —
    Exhibit A's 'organizational readiness monitoring' and 'workflow gap
    visualization' requirements. This is the core admin dashboard endpoint.
    """
    org = _require_org_admin(org_id, current_user, db)

    memberships = (
        db.query(OrganizationMembership)
        .filter(OrganizationMembership.organization_id == org_id)
        .all()
    )

    participants: list[ParticipantReadinessSummary] = []
    scores: list[float] = []
    readiness_counts: Counter = Counter()
    gap_counts: Counter = Counter()

    for m in memberships:
        user = db.query(User).filter(User.id == m.user_id).first()
        if not user:
            continue

        profile = (
            db.query(WorkforceProfile)
            .filter(WorkforceProfile.user_id == user.id)
            .order_by(WorkforceProfile.created_at.desc())
            .first()
        )
        analysis = (
            db.query(WorkforceAnalysis)
            .filter(WorkforceAnalysis.user_id == user.id)
            .order_by(WorkforceAnalysis.created_at.desc())
            .first()
        )

        if analysis:
            scores.append(analysis.overall_score)
            readiness_counts[analysis.readiness_label or "Unknown"] += 1
            for gap in (analysis.top_gaps or []):
                gap_counts[gap] += 1

        participants.append(ParticipantReadinessSummary(
            user_id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=m.role,
            has_profile=profile is not None,
            has_analysis=analysis is not None,
            overall_score=analysis.overall_score if analysis else None,
            readiness_label=analysis.readiness_label if analysis else None,
            top_gaps=analysis.top_gaps if analysis else [],
            last_analysis_at=analysis.created_at if analysis else None,
        ))

    most_common_gaps = [{"gap": gap, "count": count} for gap, count in gap_counts.most_common(10)]
    average_score = round(sum(scores) / len(scores), 1) if scores else None

    return OrganizationReadinessSummary(
        organization_id=org.id,
        organization_name=org.name,
        total_participants=len(participants),
        participants_with_analysis=len(scores),
        average_readiness_score=average_score,
        readiness_distribution=dict(readiness_counts),
        most_common_gaps=most_common_gaps,
        participants=participants,
    )
