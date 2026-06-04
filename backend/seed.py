from sqlmodel import Session, select
from database import engine, create_db_and_tables
from models import User, RoleUtilisateur
import bcrypt

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def seed():
    create_db_and_tables()
    with Session(engine) as session:
        # Vérifie si l'admin existe déjà
        existing = session.exec(select(User).where(User.username == "admin")).first()
        if existing:
            print("Admin existe déjà, suppression...")
            session.delete(existing)
            session.commit()

        admin = User(
            username="admin",
            hashed_password=hash_password("admin123"),
            role=RoleUtilisateur.admin,
            section=None,
            is_active=True
        )
        session.add(admin)
        session.commit()
        session.refresh(admin)
        print(f"✅ Admin créé — id: {admin.id}")
        print(f"   username : admin")
        print(f"   password : admin123")
        print(f"   hash     : {admin.hashed_password}")

if __name__ == "__main__":
    seed()