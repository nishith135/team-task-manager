from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.task import Task, TaskStatus
from app.models.project_member import ProjectMember

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("")
def dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return a summary dashboard for the current user."""
    # Projects the user is a member of
    project_ids = [
        row[0] for row in
        db.query(ProjectMember.project_id).filter(ProjectMember.user_id == current_user.id).all()
    ]

    total_projects = len(project_ids)

    # All tasks across the user's projects
    all_tasks = db.query(Task).filter(Task.project_id.in_(project_ids)).all() if project_ids else []
    total_tasks = len(all_tasks)

    tasks_by_status = {"todo": 0, "in_progress": 0, "done": 0}
    overdue_count = 0
    my_tasks_count = 0

    for task in all_tasks:
        tasks_by_status[task.status.value] = tasks_by_status.get(task.status.value, 0) + 1
        if task.assigned_to == current_user.id:
            my_tasks_count += 1
        if task.due_date and task.due_date < date.today() and task.status != TaskStatus.done:
            overdue_count += 1

    return {
        "total_projects": total_projects,
        "total_tasks": total_tasks,
        "tasks_by_status": tasks_by_status,
        "overdue_count": overdue_count,
        "my_tasks_count": my_tasks_count,
    }
