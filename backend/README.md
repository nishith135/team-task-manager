# Team Task Manager — Backend

FastAPI backend for the Team Task Manager application.

## Setup

1. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate     # Windows
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables:**
   Copy `.env.example` to `.env` and fill in your MySQL credentials and a strong secret key.

4. **Run the server:**
   ```bash
   uvicorn app.main:app --reload
   ```

   The API will be available at `http://localhost:8000`. Interactive docs at `/docs`.

## Deployment (Railway)

Push to your Railway project — the `Procfile` handles the rest.
