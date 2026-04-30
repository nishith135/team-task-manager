from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from starlette import status as http_status
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.project import Project
from app.models.project_member import ProjectMember, ProjectRole
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter(tags=["Tasks"])


def _require_project_membership(project_id: int, user_id: int, db: Session):
    """Verify the user is a member of the project or raise 403."""
    membership = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id,
    ).first()
    if not membership:
        raise HTTPException(status_code=http_status.HTTP_403_FORBIDDEN, detail="Not a member of this project")
    return membership


def _task_to_response(task: Task, db: Session) -> TaskResponse:
    """Serialize a Task ORM object to TaskResponse, resolving assignee name."""
    assignee_name = None
    if task.assigned_to:
        user = db.query(User).filter(User.id == task.assigned_to).first()
        assignee_name = user.name if user else None
    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        project_id=task.project_id,
        assigned_to=task.assigned_to,
        assigned_to_name=assignee_name,
        status=task.status.value if hasattr(task.status, "value") else task.status,
        priority=task.priority.value if hasattr(task.priority, "value") else task.priority,
        due_date=task.due_date,
        created_at=task.created_at,
    )


@router.post("/projects/{project_id}/tasks", response_model=TaskResponse, status_code=http_status.HTTP_201_CREATED)
def create_task(project_id: int, data: TaskCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a task in a project and optionally assign it to a member."""
    if not db.query(Project).filter(Project.id == project_id).first():
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Project not found")
    _require_project_membership(project_id, current_user.id, db)

    task = Task(
        title=data.title,
        description=data.description,
        project_id=project_id,
        assigned_to=data.assigned_to,
        status=TaskStatus(data.status),
        priority=TaskPriority(data.priority),
        due_date=data.due_date,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return _task_to_response(task, db)


@router.get("/projects/{project_id}/tasks", response_model=list[TaskResponse])
def list_project_tasks(
    project_id: int,
    task_status: str | None = Query(None, alias="status"),
    assigned_to: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List tasks for a project with optional status and assigned_to filters."""
    if not db.query(Project).filter(Project.id == project_id).first():
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Project not found")
    _require_project_membership(project_id, current_user.id, db)

    query = db.query(Task).filter(Task.project_id == project_id)
    if task_status:
        query = query.filter(Task.status == task_status)
    if assigned_to is not None:
        query = query.filter(Task.assigned_to == assigned_to)
    return [_task_to_response(t, db) for t in query.all()]


@router.get("/tasks/my", response_model=list[TaskResponse])
def my_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return all tasks from projects the current user is a member of."""
    project_ids = (
        db.query(ProjectMember.project_id)
        .filter(ProjectMember.user_id == current_user.id)
        .subquery()
    )
    tasks = db.query(Task).filter(Task.project_id.in_(project_ids)).order_by(Task.created_at.desc()).all()
    return [_task_to_response(t, db) for t in tasks]


@router.get("/tasks/overdue", response_model=list[TaskResponse])
def overdue_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return tasks where due_date is past and status is not done."""
    tasks = (
        db.query(Task)
        .filter(Task.assigned_to == current_user.id, Task.due_date < date.today(), Task.status != TaskStatus.done)
        .all()
    )
    return [_task_to_response(t, db) for t in tasks]


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, data: TaskUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Update a task's fields (status, assignee, title, description, due_date, priority)."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Task not found")
    _require_project_membership(task.project_id, current_user.id, db)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return _task_to_response(task, db)


@router.delete("/tasks/{task_id}", status_code=http_status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Delete a task. Only project admins can do this."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Task not found")

    membership = db.query(ProjectMember).filter(
        ProjectMember.project_id == task.project_id,
        ProjectMember.user_id == current_user.id,
    ).first()
    if not membership or membership.role != ProjectRole.admin:
        raise HTTPException(status_code=http_status.HTTP_403_FORBIDDEN, detail="Project admin access required")

    db.delete(task)
    db.commit()
