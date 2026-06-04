from pydantic import BaseModel, validator
from typing import Optional
from models import RoleUtilisateur, StatutIntervention

# --- Auth ---
class Token(BaseModel):
    access_token: str
    token_type:   str
    role:         str
    username:     str
    section:      Optional[str]

class TokenData(BaseModel):
    username: Optional[str] = None

# --- Users ---
class UserCreate(BaseModel):
    username: str
    password: str
    role:     RoleUtilisateur
    section:  Optional[str] = None  # Obligatoire si role == chef

    @validator("section")
    def section_required_for_chef(cls, v, values):
        if values.get("role") == RoleUtilisateur.chef and not v:
            raise ValueError("La section est obligatoire pour un chef d'atelier")
        return v

class UserResponse(BaseModel):
    id:       int
    username: str
    role:     RoleUtilisateur
    section:  Optional[str]
    is_active: bool

    class Config:
        from_attributes = True

# --- Interventions ---
class InterventionCreate(BaseModel):
    machine_id:  int
    description: str

    @validator("description")
    def not_empty(cls, v):
        if not v.strip():
            raise ValueError("La description est obligatoire")
        return v

class CloturerIntervention(BaseModel):
    nature_electrique:    bool
    nature_mecanique:     bool
    nature_autre:         bool
    parametres_controles: Optional[str] = None
    remarques:            Optional[str] = None
    actions_menees:       str
    piece_rechange:       Optional[str] = None
    cout_piece_dt:        Optional[float] = None

    @validator("actions_menees")
    def actions_required(cls, v):
        if not v.strip():
            raise ValueError("Les actions menées sont obligatoires")
        return v