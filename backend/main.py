from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from datetime import datetime
from sqlmodel import func


from database import create_db_and_tables, get_session, engine
from models import (User, Machine, Intervention,
                    RoleUtilisateur, StatutIntervention)
from schemas import (Token, UserCreate, UserResponse,
                     InterventionCreate, CloturerIntervention)
from auth import hash_password, verify_password, create_access_token
from dependencies import (get_current_user, require_admin,
                           require_chef_or_admin,
                           require_technicien_or_admin,
                           require_any_role)

app = FastAPI(title="InstaMaintenance API", version="2.0")

# Configuration CORS pour communiquer avec le futur Frontend (Vite / React par ex)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    # Le seed est fait via seed.py — pas ici
# ─────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────
@app.post("/auth/login", response_model=Token, tags=["Auth"])
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session)
):
    user = session.exec(select(User).where(User.username == form.username)).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Identifiants incorrects")
    
    token = create_access_token({"sub": user.username, "role": user.role})
    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        username=user.username,
        section=user.section
    )

# ─────────────────────────────────────────
# USERS (admin uniquement)
# ─────────────────────────────────────────
@app.post("/users", response_model=UserResponse, tags=["Users"])
def creer_utilisateur(
    data: UserCreate,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin)
):
    existing = session.exec(select(User).where(User.username == data.username)).first()
    if existing:
        raise HTTPException(400, "Ce nom d'utilisateur existe déjà")
    
    user = User(
        username=data.username,
        hashed_password=hash_password(data.password),
        role=data.role,
        section=data.section
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@app.get("/users", response_model=list[UserResponse], tags=["Users"])
def list_users(
    session: Session = Depends(get_session),
    _: User = Depends(require_admin)
):
    return session.exec(select(User)).all()

# ─────────────────────────────────────────
# MACHINES
# ─────────────────────────────────────────
@app.get("/machines", tags=["Machines"])
def list_machines(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_any_role)
):
    machines = session.exec(select(Machine)).all()
    # Chef d'atelier : filtre automatique sur sa section uniquement
    if current_user.role == RoleUtilisateur.chef:
        machines = [m for m in machines if m.section == current_user.section]
    return machines

# ─────────────────────────────────────────
# INTERVENTIONS
# ─────────────────────────────────────────
@app.post("/interventions", status_code=201, tags=["Interventions"])
def creer_intervention(
    data: InterventionCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_chef_or_admin)
):
    machine = session.get(Machine, data.machine_id)
    if not machine:
        raise HTTPException(404, "Machine introuvable")
    
    # Chef d'atelier : interdiction de déclarer une panne hors de sa section
    if current_user.role == RoleUtilisateur.chef and machine.section != current_user.section:
        raise HTTPException(403, "Machine hors de votre section")
        
    intervention = Intervention(**data.model_dump(), created_by_id=current_user.id)
    session.add(intervention)
    session.commit()
    session.refresh(intervention)
    return intervention

@app.get("/interventions", tags=["Interventions"])
def list_interventions(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_any_role)
):
    interventions = session.exec(select(Intervention)).all()
    
    # Filtrer les interventions si l'utilisateur est un chef d'atelier
    if current_user.role == RoleUtilisateur.chef:
        machines_section = session.exec(
            select(Machine).where(Machine.section == current_user.section)
        ).all()
        machine_ids = [m.id for m in machines_section]
        interventions = [i for i in interventions if i.machine_id in machine_ids]
        
    return interventions

@app.patch("/interventions/{id}/prendre-en-charge", tags=["Interventions"])
def prendre_en_charge(
    id: int,
    session: Session = Depends(get_session),
    _: User = Depends(require_technicien_or_admin)
):
    intervention = session.get(Intervention, id)
    if not intervention:
        raise HTTPException(404, "Intervention introuvable")
    if intervention.statut != StatutIntervention.en_attente:
        raise HTTPException(400, "Intervention déjà prise en charge")
        
    intervention.heure_debut = datetime.utcnow()
    intervention.statut      = StatutIntervention.en_cours
    
    session.add(intervention)
    session.commit()
    session.refresh(intervention)
    return intervention

@app.patch("/interventions/{id}/cloturer", tags=["Interventions"])
def cloturer(
    id: int,
    data: CloturerIntervention,
    session: Session = Depends(get_session),
    _: User = Depends(require_technicien_or_admin)
):
    intervention = session.get(Intervention, id)
    if not intervention:
        raise HTTPException(404, "Intervention introuvable")
    if intervention.statut != StatutIntervention.en_cours:
        raise HTTPException(400, "L'intervention n'est pas en cours")
        
    intervention.heure_fin     = datetime.utcnow()
    # Calcul précis de la durée arrondie à 2 décimales
    delta_seconds = (intervention.heure_fin - intervention.heure_debut).total_seconds()
    intervention.duree_minutes = round(delta_seconds / 60, 2)
    intervention.statut        = StatutIntervention.resolu
    
    # Mettre à jour dynamiquement les champs de clôture (remarques, pièces, etc.)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(intervention, field, value)
        
    session.add(intervention)
    session.commit()
    session.refresh(intervention)
    return intervention


@app.get("/stats/mttr", tags=["Stats"])
def get_mttr(session: Session = Depends(get_session),
             _: User = Depends(require_any_role)):
    """MTTR moyen par section (interventions résolues uniquement)"""
    results = session.exec(
        select(Machine.section,
               func.avg(Intervention.duree_minutes).label("mttr"),
               func.count(Intervention.id).label("total"))
        .join(Machine, Intervention.machine_id == Machine.id)
        .where(Intervention.statut == StatutIntervention.resolu)
        .where(Intervention.duree_minutes != None)
        .group_by(Machine.section)
    ).all()

    return [
        {
            "section": r[0],
            "mttr_minutes": round(r[1], 2) if r[1] else 0,
            "total_interventions": r[2]
        }
        for r in results
    ]

@app.get("/stats/couts", tags=["Stats"])
def get_couts(session: Session = Depends(get_session),
              _: User = Depends(require_any_role)):
    """Coût total des pièces de rechange par section"""
    results = session.exec(
        select(Machine.section,
               func.sum(Intervention.cout_piece_dt).label("cout_total"),
               func.count(Intervention.id).label("total"))
        .join(Machine, Intervention.machine_id == Machine.id)
        .where(Intervention.cout_piece_dt != None)
        .group_by(Machine.section)
    ).all()

    return [
        {
            "section": r[0],
            "cout_total_dt": round(r[1], 2) if r[1] else 0,
            "total_interventions": r[2]
        }
        for r in results
    ]

@app.get("/stats/historique", tags=["Stats"])
def get_historique(session: Session = Depends(get_session),
                   _: User = Depends(require_any_role)):
    """Nombre d'interventions par statut par section"""
    results = session.exec(
        select(Machine.section,
               Intervention.statut,
               func.count(Intervention.id).label("total"))
        .join(Machine, Intervention.machine_id == Machine.id)
        .group_by(Machine.section, Intervention.statut)
    ).all()

    return [
        {"section": r[0], "statut": r[1], "total": r[2]}
        for r in results
    ] 