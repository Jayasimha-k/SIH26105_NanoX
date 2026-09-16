import bcrypt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against its bcrypt hash."""
    try:
        if isinstance(hashed_password, str):
            hashed_bytes = hashed_password.encode("utf-8")
        else:
            hashed_bytes = hashed_password
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Generates a secure bcrypt hash for a password."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

