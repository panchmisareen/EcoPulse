from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.core.config import settings
from app.models.user import User

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Extract and validate current user from JWT or demo mode."""
    if credentials:
        payload = decode_token(credentials.credentials)
        if payload:
            user_id = int(payload.get("sub", 0))
            user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
            if user:
                return user

    # Demo mode fallback
    if settings.DEMO_MODE:
        demo_user = db.query(User).filter(
            User.id == settings.DEMO_USER_ID, User.is_active == True
        ).first()
        if demo_user:
            return demo_user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User | None:
    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None
