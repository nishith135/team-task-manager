from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.project_member import ProjectMember, ProjectRole
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectMemberAdd, ProjectMemberResponse
from app.schemas.auth import UserResponse

router = APIRouter(prefix="/projects", tags=["Projects"])


def _get_project_or_404(project_id: int, db: Session) -> Project:
    """Fetch a project by ID or raise 404."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


def _require_project_admin(project_id: int, user_id: int, db: Session) -> ProjectMember:
    """Verify the user is an admin of the given project or raise 403."""
    membership = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id,
    ).first()
    if not membership or membership.role != ProjectRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Project admin access required")
    return membership


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(data: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a new project. The creator is automatically added as project admin."""
    project = Project(name=data.name, description=data.description, owner_id=current_user.id)
    db.add(project)
    db.commit()
    db.refresh(project)

    # Add creator as project admin
    member = ProjectMember(project_id=project.id, user_id=current_user.id, role=ProjectRole.admin)
    db.add(member)
    db.commit()

    return _build_project_response(project, db)


@router.get("", response_model=list[ProjectResponse])
def list_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return all projects the current user is a member of."""
    project_ids = (
        db.query(ProjectMember.project_id)
        .filter(ProjectMember.user_id == current_user.id)
        .subquery()
    )
    projects = db.query(Project).filter(Project.id.in_(project_ids)).all()
    return [_build_project_response(p, db) for p in projects]


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return project details including its member list."""
    project = _get_project_or_404(project_id, db)
    return _build_project_response(project, db)


@router.post("/{project_id}/members", response_model=ProjectMemberResponse, status_code=status.HTTP_201_CREATED)
def add_member(project_id: int, data: ProjectMemberAdd, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Add a member to a project by email. Only project admins can do this."""
    _get_project_or_404(project_id, db)
    _require_project_admin(project_id, current_user.id, db)

    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found with that email")

    existing = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already a member")

    role = ProjectRole(data.role) if data.role in ProjectRole.__members__ else ProjectRole.member
    member = ProjectMember(project_id=project_id, user_id=user.id, role=role)
    db.add(member)
    db.commit()
    db.refresh(member)

    return ProjectMemberResponse(
        id=member.id,
        user_id=member.user_id,
        role=member.role.value,
        user=UserResponse.model_validate(user),
    )


@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(project_id: int, user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Remove a member from a project. Only project admins can do this."""
    _get_project_or_404(project_id, db)
    _require_project_admin(project_id, current_user.id, db)

    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    db.delete(member)
    db.commit()


def _build_project_response(project: Project, db: Session) -> ProjectResponse:
    """Build a ProjectResponse with nested member + user data."""
    memberships = db.query(ProjectMember).filter(ProjectMember.project_id == project.id).all()
    members = []
    for m in memberships:
        user = db.query(User).filter(User.id == m.user_id).first()
        members.append(ProjectMemberResponse(
            id=m.id,
            user_id=m.user_id,
            role=m.role.value,
            user=UserResponse.model_validate(user) if user else None,
        ))
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        owner_id=project.owner_id,
        created_at=project.created_at,
        members=members,
    )
