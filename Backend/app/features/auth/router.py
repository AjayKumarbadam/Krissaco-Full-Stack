from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.core.deps import get_current_user
from app.common.models.user import User
from app.features.auth.schema import LoginRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role, "name": user.full_name, "id": user.id}
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.get("/demo-users")
def get_demo_users():
    """Returns quick credentials for UI demo switching."""
    return [
        {"username": "accountant@krissaco.com", "password": "accountant123", "role": "Accountant", "name": "Alice (Accountant)"},
        {"manager@krissaco.com": "manager@krissaco.com", "username": "manager@krissaco.com", "password": "manager123", "role": "Manager", "name": "Bob (Manager)"},
        {"username": "auditor@krissaco.com", "password": "auditor123", "role": "Auditor", "name": "Carol (Auditor)"},
    ]
