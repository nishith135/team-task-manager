from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import json
import time
from pathlib import Path
from app.dependencies import get_db
from app.models.user import User
from app.schemas.auth import UserCreate, LoginRequest, TokenResponse, UserResponse
from app.utils.hashing import hash_password, verify_password
from app.utils.auth import create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])
DEBUG_LOG_PATH = Path(__file__).resolve().parents[2] / "debug-0a3a35.log"


def _debug_log(hypothesis_id: str, location: str, message: str, data: dict) -> None:
    payload = {
        "sessionId": "0a3a35",
        "runId": "pre-fix",
        "hypothesisId": hypothesis_id,
        "location": location,
        "message": message,
        "data": data,
        "timestamp": int(time.time() * 1000),
    }
    with DEBUG_LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=True) + "\n")


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user and return user details."""
    try:
        # region agent log
        _debug_log(
            "H3",
            "backend/app/routes/auth.py:35",
            "signup request received",
            {
                "email": data.email,
                "password_char_len": len(data.password),
                "password_byte_len": len(data.password.encode("utf-8")),
            },
        )
        # endregion
        if db.query(User).filter(User.email == data.email).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

        if len(data.password.encode("utf-8")) > 72:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"message": "Password must be 72 characters or fewer"},
            )

        user = User(
            full_name=data.full_name, 
            email=data.email, 
            password_hash=hash_password(data.password),
            role=data.role
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        return user
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        # region agent log
        _debug_log(
            "H4",
            "backend/app/routes/auth.py:56",
            "signup exception",
            {"error_type": type(e).__name__, "error_message": str(e)},
        )
        # endregion
        print(f"Error during signup: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate a user and return a JWT token."""
    # region agent log
    _debug_log(
        "H5",
        "backend/app/routes/auth.py:67",
        "login request received",
        {
            "email": data.email,
            "password_char_len": len(data.password),
            "password_byte_len": len(data.password.encode("utf-8")),
        },
    )
    # endregion
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token({"user_id": user.id})
    return {"access_token": token}
