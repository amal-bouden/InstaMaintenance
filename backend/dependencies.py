from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select
from .database import get_session
from .models import User, RoleUtilisateur
from .auth import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session)
) -> User:
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"}
        )
    username = payload.get("sub")
    user = session.exec(select(User).where(User.username == username)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    return user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != RoleUtilisateur.admin:
        raise HTTPException(status_code=403, detail="Accès réservé à l'administrateur")
    return current_user

def require_admin_or_chef_maintenance(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in [RoleUtilisateur.admin, RoleUtilisateur.chef_maintenance]:
        raise HTTPException(status_code=403, detail="Accès réservé à l'admin ou chef maintenance")
    return current_user

def require_chef_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in [
        RoleUtilisateur.admin,
        RoleUtilisateur.chef,
        RoleUtilisateur.chef_maintenance
    ]:
        raise HTTPException(status_code=403, detail="Accès réservé aux chefs d'atelier")
    return current_user

def require_technicien_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in [
        RoleUtilisateur.admin,
        RoleUtilisateur.technicien,
        RoleUtilisateur.chef_maintenance
    ]:
        raise HTTPException(status_code=403, detail="Accès réservé aux techniciens")
    return current_user

def require_any_role(current_user: User = Depends(get_current_user)) -> User:
    return current_user