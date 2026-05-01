import json
import time
from pathlib import Path
from passlib.context import CryptContext

# bcrypt_sha256 pre-hashes input before bcrypt, removing bcrypt's 72-byte limit.
# Keeping "bcrypt" in the context preserves verification for legacy hashes.
pwd_context = CryptContext(schemes=["bcrypt_sha256", "bcrypt"], deprecated="auto")
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
    """Hash a plain-text password using bcrypt_sha256 for >72-byte safety."""
    # region agent log
    _debug_log(
        "H1",
        "backend/app/utils/hashing.py:25",
        "hash_password input info",
        {
            "input_char_len": len(password),
            "input_byte_len": len(password.encode("utf-8")),
            "active_scheme": "bcrypt_sha256",
        },
    )
    # endregion
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt_sha256 or legacy bcrypt hashes."""
    # region agent log
    _debug_log(
        "H2",
        "backend/app/utils/hashing.py:40",
        "verify_password input info",
        {
            "input_char_len": len(plain_password),
            "input_byte_len": len(plain_password.encode("utf-8")),
            "hash_present": bool(hashed_password),
            "hash_scheme": pwd_context.identify(hashed_password) if hashed_password else None,
        },
    )
    # endregion
    return pwd_context.verify(plain_password, hashed_password)
