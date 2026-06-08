from sqlmodel import create_engine, Session, SQLModel

DATABASE_URL = "sqlite:///./instamaintenance.db"

engine = create_engine(
    DATABASE_URL,
    echo=True,
    connect_args={"check_same_thread": False}
)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    import sqlite3
    import os
    # Detect the correct path of the database relative to the current directory
    db_paths = ["instamaintenance.db", "backend/instamaintenance.db"]
    target_db = None
    for path in db_paths:
        if os.path.exists(path):
            target_db = path
            break
    if not target_db:
        # Fallback to local file if it hasn't been created yet
        target_db = "instamaintenance.db"
    
    try:
        conn = sqlite3.connect(target_db)
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(intervention)")
        columns = [row[1] for row in cursor.fetchall()]
        new_cols = {
            "technicien_id": "INTEGER",
            "nom_demandeur": "VARCHAR",
            "nom_receptionnaire": "VARCHAR",
            "nom_operateur": "VARCHAR",
            "validation_essai": "VARCHAR",
            "observation": "VARCHAR"
        }
        for col, col_type in new_cols.items():
            if col not in columns:
                cursor.execute(f"ALTER TABLE intervention ADD COLUMN {col} {col_type}")
                print(f"[Migration] Added column {col} to intervention table")
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[Migration Error] Failed to check/migrate SQLite columns: {e}")

def get_session():
    with Session(engine) as session:
        yield session