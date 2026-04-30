# Team Task Manager

A modern, responsive Kanban-style project management application designed for teams. It features a robust role-based access control (RBAC) system, real-time drag-and-drop task boards, and comprehensive dashboards to track project progress. Built with a FastAPI Python backend and a React (Vite) frontend.

## 🚀 Features

- **Secure Authentication:** JWT-based signup and login with hashed passwords.
- **Role-Based Access Control (RBAC):**
  - *Global Roles:* Account-level "Admin" and "Member" roles.
  - *Project Roles:* "Project Admin" (can invite/remove members, delete tasks) and "Project Member".
- **Kanban Task Boards:**
  - Drag-and-drop tasks across "To Do", "In Progress", and "Done" columns.
  - Create tasks with assignees, due dates, and priority levels.
- **Project Management:** Create new projects, view project progress, and manage team members via email invites.
- **Personalized "My Tasks" Dashboard:** Centralized view of all tasks across projects, filterable by status, priority, and project.
- **Analytics Dashboard:** Visual overview of total projects, overdue tasks, completed tasks, and recent activity.

## 💻 Tech Stack

**Frontend:**
- React 18 (Vite)
- TypeScript
- Tailwind CSS
- Shadcn UI & Lucide React
- React Query
- React Router DOM
- @hello-pangea/dnd (Drag and Drop)

**Backend:**
- Python 3.13
- FastAPI
- SQLAlchemy (ORM) & SQLite
- Pydantic
- Passlib & python-jose (JWT Auth)

## 🛠️ Run Locally

### 1. Clone the repository
```bash
git clone https://github.com/nishith135/team-task-manager.git
cd team-task-manager
```

### 2. Start the Backend
```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
# On Windows: venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn app.main:app --reload --port 8000
```

### 3. Start the Frontend
```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

## 📡 API Reference

**Auth**
- `POST /auth/signup` - Register a new user
- `POST /auth/login` - Authenticate and receive JWT

**Projects**
- `GET /projects` - List user's projects
- `POST /projects` - Create a project
- `GET /projects/{id}` - Get project details & members
- `POST /projects/{id}/members` - Invite member
- `DELETE /projects/{id}/members/{user_id}` - Remove member

**Tasks**
- `GET /projects/{id}/tasks` - List project tasks
- `POST /projects/{id}/tasks` - Create a task
- `GET /tasks/my` - Get all tasks for user's projects
- `PATCH /tasks/{id}` - Update a task
- `DELETE /tasks/{id}` - Delete a task
