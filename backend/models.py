from typing import Optional
from datetime import datetime
from enum import Enum
from sqlmodel import Field, SQLModel, create_engine, Session, Relationship

class RoleUtilisateur(str, Enum):
    admin    = "admin"
    chef     = "chef"
    technicien = "technicien"
    chef_maintenance = "chef_maintenance"

class StatutIntervention(str, Enum):
    en_attente = "en_attente"
    en_cours   = "en_cours"
    resolu     = "resolu"

class SectionAtelier(str, Enum):
    automatique   = "Automatique"
    confection    = "Confection"
    sterile       = "Sterile"
    zone_coupe    = "Zone de coupe"
    laboratoire   = "Laboratoire"
class User(SQLModel, table=True):
    id:            Optional[int]    = Field(default=None, primary_key=True)
    username:      str              = Field(index=True, unique=True)
    hashed_password: str
    role:          RoleUtilisateur
    # Pour les chefs : restreint à une section (None = accès global pour admin/technicien)
    section: Optional[SectionAtelier] = None
    is_active:     bool             = Field(default=True)

class Machine(SQLModel, table=True):
    id:      Optional[int] = Field(default=None, primary_key=True)
    code:    str           = Field(index=True, unique=True)
    section: str
    famille: str
    etat:    str           = Field(default="Fonctionnelle")

class Intervention(SQLModel, table=True):
    id:                   Optional[int]      = Field(default=None, primary_key=True)
    machine_id:           int                = Field(foreign_key="machine.id")
    created_by_id:        Optional[int]      = Field(default=None, foreign_key="user.id")
    technicien_id:        Optional[int]      = Field(default=None, foreign_key="user.id")
    description:          str
    statut:               StatutIntervention = Field(default=StatutIntervention.en_attente)
    heure_reclamation:    datetime           = Field(default_factory=datetime.utcnow)
    heure_debut:          Optional[datetime] = None
    heure_fin:            Optional[datetime] = None
    duree_minutes:        Optional[float]    = None
    nature_electrique:    bool               = Field(default=False)
    nature_mecanique:     bool               = Field(default=False)
    nature_autre:         bool               = Field(default=False)
    parametres_controles: Optional[str]      = None
    remarques:            Optional[str]      = None
    actions_menees:       Optional[str]      = None
    piece_rechange:       Optional[str]      = None
    cout_piece_dt:        Optional[float]    = None
    nom_demandeur:        Optional[str]      = None
    nom_receptionnaire:   Optional[str]      = None
    nom_operateur:        Optional[str]      = None
    validation_essai:     Optional[str]      = None
    observation:          Optional[str]      = None