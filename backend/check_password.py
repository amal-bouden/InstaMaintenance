# backend/check_password.py
import bcrypt
from sqlmodel import Session, select
from database import engine
from models import User

with Session(engine) as session:
    user = session.exec(select(User).where(User.username == "admin")).first()
    if not user:
        print("❌ Admin introuvable en BDD")
    else:
        print(f"Hash en BDD : {user.hashed_password}")
        result = bcrypt.checkpw("admin123".encode(), user.hashed_password.encode())
        print(f"Vérification password 'admin123' : {'✅ OK' if result else '❌ ECHEC'}")