from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import auth, projects, tasks, dashboard

app = FastAPI(title="Team Task Manager API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://taskmanager-production-0d96.up.railway.app"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600,
)

# Register routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(dashboard.router)


@app.on_event("startup")
def on_startup():
    """Create all database tables on application startup."""
    Base.metadata.create_all(bind=engine)


@app.get("/", tags=["Health"])
def health_check():
    """Basic health check endpoint."""
    return {"status": "ok"}
