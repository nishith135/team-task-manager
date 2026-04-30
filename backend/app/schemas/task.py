from datetime import datetime, date
from pydantic import BaseModel


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    assigned_to: int | None = None
    status: str = "todo"
    priority: str = "medium"
    due_date: date | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    assigned_to: int | None = None
    status: str | None = None
    priority: str | None = None
    due_date: date | None = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str | None
    project_id: int
    assigned_to: int | None
    assigned_to_name: str | None = None   # resolved from User table
    status: str
    priority: str
    due_date: date | None
    created_at: datetime

    model_config = {"from_attributes": True}
