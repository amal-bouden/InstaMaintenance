from models import Machine, Intervention
from database import create_db_and_tables, engine
from sqlmodel import Session

create_db_and_tables()

with Session(engine) as session:
    machine = Machine(code="CO-MSJ-052", section="Confection", famille="Machine clip cap")
    session.add(machine)
    session.commit()
    print("Machine créée avec succès :", machine.code)