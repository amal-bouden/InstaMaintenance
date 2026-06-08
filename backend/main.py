from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from datetime import datetime
from sqlmodel import func
from fastapi.responses import Response
# Support running as a module (`python -m backend.main`) or as a plain script
try:
    from .pdf_generator import generate_fiche_pdf
except Exception:
    from pdf_generator import generate_fiche_pdf

from .database import create_db_and_tables, get_session, engine
from .models import (User, Machine, Intervention,
                     RoleUtilisateur, SectionAtelier,
                     StatutIntervention)
from .schemas import (Token, UserCreate, UserResponse,
                      InterventionCreate, CloturerIntervention,
                      MachineCreate, MachineUpdate)
from .auth import hash_password, verify_password, create_access_token
from .dependencies import (get_current_user, require_admin,
                           require_admin_or_chef_maintenance,
                           require_chef_or_admin,
                           require_technicien_or_admin,
                           require_any_role)

app = FastAPI(title="InstaMaintenance API", version="2.0")

# Configuration CORS pour communiquer avec le Frontend (Vite / React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


DEFAULT_USERS = [
    {
        "username": "admin",
        "password": "admin123",
        "role": RoleUtilisateur.admin,
        "section": None,
    },
    {
        "username": "chef_confection",
        "password": "chef123",
        "role": RoleUtilisateur.chef,
        "section": SectionAtelier.confection,
    },
    {
        "username": "technicien",
        "password": "tech123",
        "role": RoleUtilisateur.technicien,
        "section": None,
    },
    {
        "username": "chef_maintenance",
        "password": "maint123",
        "role": RoleUtilisateur.chef_maintenance,
        "section": None,
    },
]


def seed_default_users():
    with Session(engine) as session:
        for user_data in DEFAULT_USERS:
            existing = session.exec(
                select(User).where(User.username == user_data["username"])
            ).first()
            if existing:
                continue
            user = User(
                username=user_data["username"],
                hashed_password=hash_password(user_data["password"]),
                role=user_data["role"],
                section=user_data["section"],
                is_active=True,
            )
            session.add(user)
        session.commit()

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    seed_default_users()

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
# USERS (admin ou chef maintenance uniquement)
# ─────────────────────────────────────────
@app.get("/users", response_model=list[UserResponse], tags=["Users"])
def list_users(
    session: Session = Depends(get_session),
    _: User = Depends(require_admin_or_chef_maintenance)
):
    return session.exec(select(User)).all()

@app.post("/users", response_model=UserResponse, status_code=201, tags=["Users"])
def creer_user(
    data: UserCreate,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin)
):
    existing = session.exec(select(User).where(User.username == data.username)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Ce nom d'utilisateur est déjà pris")
    user = User(
        username=data.username,
        hashed_password=hash_password(data.password),
        role=data.role,
        section=data.section,
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

# ─────────────────────────────────────────
# MACHINES
# ─────────────────────────────────────────
@app.get("/machines", tags=["Machines"])
def list_machines(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_any_role)
):
    machines = session.exec(select(Machine)).all()
    
    # Modif 4 : Chef d'atelier -> filtre automatique sur sa section uniquement
    if current_user.role == RoleUtilisateur.chef:
        machines = [m for m in machines if m.section == current_user.section]
        
    # admin, chef_maintenance, technicien → voient tout
    return machines

@app.post("/machines", status_code=201, tags=["Machines"])
def creer_machine(
    data: MachineCreate,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin)
):
    existing = session.exec(select(Machine).where(Machine.code == data.code)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Une machine avec ce code existe déjà")
    machine = Machine(
        code=data.code,
        section=data.section,
        famille=data.famille,
        etat=data.etat or "Fonctionnelle",
    )
    session.add(machine)
    session.commit()
    session.refresh(machine)
    return machine

@app.patch("/machines/{id}", tags=["Machines"])
def modifier_machine(
    id: int,
    data: MachineUpdate,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin)
):
    machine = session.get(Machine, id)
    if not machine:
        raise HTTPException(status_code=404, detail="Machine introuvable")
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(machine, field, value)
    session.add(machine)
    session.commit()
    session.refresh(machine)
    return machine

@app.delete("/machines/{id}", status_code=204, tags=["Machines"])
def supprimer_machine(
    id: int,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin)
):
    machine = session.get(Machine, id)
    if not machine:
        raise HTTPException(status_code=404, detail="Machine introuvable")
    session.delete(machine)
    session.commit()

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
        
    # Modif 2 : Instanciation explicite sécurisée du modèle
    intervention = Intervention(
        machine_id=data.machine_id,
        description=data.description,
        created_by_id=current_user.id,
        nom_demandeur=data.nom_demandeur or current_user.username
    )
    
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

@app.get("/interventions/{id}/telecharger-pdf", tags=["Interventions"])
def telecharger_pdf(
    id: int,
    session: Session = Depends(get_session),
    _: User = Depends(require_any_role)
):
    intervention = session.get(Intervention, id)
    if not intervention:
        raise HTTPException(status_code=404, detail="Intervention introuvable")
    
    machine = session.get(Machine, intervention.machine_id)
    if not machine:
        raise HTTPException(status_code=404, detail="Machine introuvable")
        
    pdf_bytes = generate_fiche_pdf(intervention, machine)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=FOR-MAI-03_{id}.pdf"}
    )

@app.patch("/interventions/{id}/prendre-en-charge", tags=["Interventions"])
def prendre_en_charge(
    id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_technicien_or_admin)
):
    intervention = session.get(Intervention, id)
    if not intervention:
        raise HTTPException(404, "Intervention introuvable")
    if intervention.statut != StatutIntervention.en_attente:
        raise HTTPException(400, "Intervention déjà prise en charge")
        
    # Modif 3 : Assignation temporelle, d'état et liaison du technicien
    intervention.heure_debut   = datetime.utcnow()
    intervention.statut         = StatutIntervention.en_cours
    intervention.technicien_id  = current_user.id
        
    session.add(intervention)
    session.commit()
    session.refresh(intervention)
    return intervention

@app.patch("/interventions/{id}/cloturer", tags=["Interventions"])
def cloturer(
    id: int,
    data: CloturerIntervention,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_technicien_or_admin)
):
    intervention = session.get(Intervention, id)
    if not intervention:
        raise HTTPException(404, "Intervention introuvable")
    if intervention.statut != StatutIntervention.en_cours:
        raise HTTPException(400, "L'intervention n'est pas en cours")
        
    intervention.heure_fin     = datetime.utcnow()
    delta_seconds = (intervention.heure_fin - intervention.heure_debut).total_seconds()
    intervention.duree_minutes = round(delta_seconds / 60, 2)
    intervention.statut        = StatutIntervention.resolu
    intervention.technicien_id = current_user.id
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(intervention, field, value)
        
    if not intervention.nom_receptionnaire:
        intervention.nom_receptionnaire = current_user.username
        
    session.add(intervention)
    session.commit()
    session.refresh(intervention)
    return intervention

# ─────────────────────────────────────────
# STATS / METRIQUES BI
# ─────────────────────────────────────────
@app.get("/stats/mttr", tags=["Stats"])
def get_mttr(session: Session = Depends(get_session), _: User = Depends(require_any_role)):
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
def get_couts(session: Session = Depends(get_session), _: User = Depends(require_any_role)):
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
def get_historique(session: Session = Depends(get_session), _: User = Depends(require_any_role)):
    """Nombre d'interventions par statut par section"""
    results = session.exec(
        select(Machine.section, Intervention.statut, func.count(Intervention.id).label("total"))
        .join(Machine, Intervention.machine_id == Machine.id)
        .group_by(Machine.section, Intervention.statut)
    ).all()

    return [
        {"section": r[0], "statut": r[1], "total": r[2]}
        for r in results
    ]
