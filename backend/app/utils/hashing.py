from passlib.context import CryptContext
import json
import time
from pathlib import Path

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
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


def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt (truncated to 72 bytes to prevent size errors)."""
    truncated = password.encode('utf-8')[:72].decode('utf-8', 'ignore')
    # region agent log
    _debug_log(
        "H1",
        "backend/app/utils/hashing.py:23",
        "hash_password truncation info",
        {
            "input_char_len": len(password),
            "input_byte_len": len(password.encode("utf-8")),
            "truncated_char_len": len(truncated),
            "truncated_byte_len": len(truncated.encode("utf-8")),
        },
    )
    # endregion
    return pwd_context.hash(truncated)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    truncated = plain_password.encode('utf-8')[:72].decode('utf-8', 'ignore')
    # region agent log
    _debug_log(
        "H2",
        "backend/app/utils/hashing.py:39",
        "verify_password truncation info",
        {
            "input_char_len": len(plain_password),
            "input_byte_len": len(plain_password.encode("utf-8")),
            "truncated_char_len": len(truncated),
            "truncated_byte_len": len(truncated.encode("utf-8")),
            "hash_present": bool(hashed_password),
        },
    )
    # endregion
    return pwd_context.verify(truncated, hashed_password)
