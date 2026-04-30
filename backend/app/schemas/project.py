from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.schemas.auth import UserResponse


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None


class ProjectMemberAdd(BaseModel):
    email: EmailStr
    role: str = "member"


class ProjectMemberResponse(BaseModel):
    id: int
    user_id: int
    role: str
    user: UserResponse | None = None

    model_config = {"from_attributes": True}


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str | None
    owner_id: int
    created_at: datetime
    members: list[ProjectMemberResponse] = []

    model_config = {"from_attributes": True}
