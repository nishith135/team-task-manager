import enum
from sqlalchemy import ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class ProjectRole(str, enum.Enum):
    admin = "admin"
    member = "member"


class ProjectMember(Base):
    __tablename__ = "project_members"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    role: Mapped[ProjectRole] = mapped_column(Enum(ProjectRole), default=ProjectRole.member)
