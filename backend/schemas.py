from pydantic import BaseModel, validator
from typing import Optional
from .models import RoleUtilisateur, StatutIntervention, SectionAtelier

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
    nom_demandeur: Optional[str] = None

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
    nom_receptionnaire:   Optional[str] = None
    nom_operateur:        Optional[str] = None
    validation_essai:     Optional[str] = None
    observation:          Optional[str] = None

    @validator("actions_menees")
    def actions_required(cls, v):
        if not v.strip():
            raise ValueError("Les actions menées sont obligatoires")
        return v

# --- Machines ---
class MachineCreate(BaseModel):
    code: str
    section: SectionAtelier
    famille: str
    etat: Optional[str] = "Fonctionnelle"

    @validator("code")
    def normalize_code(cls, v):
        if not v or not v.strip():
            raise ValueError("Le code machine est obligatoire")
        return v.strip()

    @validator("famille")
    def famille_required(cls, v):
        if not v or not v.strip():
            raise ValueError("La famille machine est obligatoire")
        return v.strip()

class MachineUpdate(BaseModel):
    code: Optional[str] = None
    section: Optional[SectionAtelier] = None
    famille: Optional[str] = None
    etat: Optional[str] = None

    @validator("code")
    def normalize_code(cls, v):
        return v.strip() if v else v

    @validator("famille")
    def normalize_famille(cls, v):
        return v.strip() if v else v
