"""
Auth router – login, token refresh, forgot password, current user.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from auth import verify_password, create_access_token, hash_password
from middleware import get_current_user
from models.user import User
from schemas.user import LoginRequest, TokenResponse, UserOut, ForgotPasswordRequest

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return JWT + user info."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    token = create_access_token({
        "sub": user.email,
        "user_id": user.id,
        "role": user.role,
    })
    return TokenResponse(
        access_token=token,
        user=UserOut.model_validate(user),
    )


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Return current authenticated user profile."""
    return current_user


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Simulated forgot password endpoint.
    In production, this would send a reset email.
    For hackathon, resets to 'password123'.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # Don't reveal user existence
        return {"detail": "If the email exists, a reset link has been sent."}

    user.hashed_password = hash_password("password123")
    db.commit()
    return {"detail": "If the email exists, a reset link has been sent. (Demo: password reset to 'password123')"}
