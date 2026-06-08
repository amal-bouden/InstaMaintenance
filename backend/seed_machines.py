import os
import openpyxl
from sqlmodel import Session, select
from database import engine, create_db_and_tables
from models import Machine

def normalize_section(s):
    if not s:
        return "Autre"
    s_low = str(s).strip().lower()
    if "auto" in s_low:
        return "Automatique"
    elif "conf" in s_low:
        return "Confection"
    elif "ster" in s_low or "stér" in s_low or "str" in s_low or "str" in s_low:
        return "Sterile"
    elif "coupe" in s_low:
        return "Zone de coupe"
    elif "lab" in s_low:
        return "Laboratoire"
    return "Autre"

def seed_machines():
    create_db_and_tables()
    
    # Trouver le fichier excel
    home = os.path.expanduser("~")
    possible_paths = [
        os.path.join(home, "Downloads", "suivi FOR-MAI-03 2026.xlsx"),
        os.path.join(home, "Downloads", "suivi_FOR-MAI-03_2026.xlsx"),
        "suivi_FOR-MAI-03_2026.xlsx",
        "suivi FOR-MAI-03 2026.xlsx",
        os.path.join("..", "suivi_FOR-MAI-03_2026.xlsx"),
        os.path.join("..", "suivi FOR-MAI-03 2026.xlsx"),
        os.path.join("backend", "suivi_FOR-MAI-03_2026.xlsx"),
        os.path.join("backend", "suivi FOR-MAI-03 2026.xlsx"),
    ]
    
    excel_path = None
    for p in possible_paths:
        if os.path.exists(p):
            excel_path = p
            break
            
    if not excel_path:
        print("[-] Fichier Excel 'suivi FOR-MAI-03 2026.xlsx' introuvable dans les chemins testes.")
        print("Veuillez copier le fichier dans le dossier racine ou dans vos Telechargements.")
        return
        
    print(f"[-] Lecture du fichier Excel : {excel_path}")
    
    wb = openpyxl.load_workbook(excel_path, data_only=True)
    all_machines = {}
    
    for sheet in wb.worksheets:
        print(f"  -> Chargement de la feuille : {sheet.title}")
        rows = list(sheet.iter_rows(min_row=2, values_only=True))
        for r in rows:
            if r and r[0] and str(r[0]).strip().startswith("CO-"):
                code = str(r[0]).strip()
                section = normalize_section(r[3])
                famille = str(r[4]).strip() if r[4] else "Inconnu"
                etat = str(r[5]).strip() if r[5] else "Fonctionnelle"
                
                all_machines[code] = Machine(
                    code=code,
                    section=section,
                    famille=famille,
                    etat=etat
                )

    machines_to_add = list(all_machines.values())
    
    if not machines_to_add:
        print("[-] Aucune machine valide trouvee dans le fichier Excel.")
        return

    with Session(engine) as session:
        # Supprimer les anciennes machines
        existing = session.exec(select(Machine)).all()
        for m in existing:
            session.delete(m)
        session.commit()
        print(f"[-] {len(existing)} anciennes machines supprimees")
        
        # Insérer les nouvelles machines
        for m in machines_to_add:
            session.add(m)
        session.commit()
        
        # Résumé par section
        par_section = {}
        for m in machines_to_add:
            par_section[m.section] = par_section.get(m.section, 0) + 1
            
        print(f"\n[+] {len(machines_to_add)} machines importees avec succes depuis {os.path.basename(excel_path)}")
        print("\nRepartition par section :")
        for section, count in sorted(par_section.items()):
            print(f"  {section:<20} : {count} machines")

if __name__ == "__main__":
    seed_machines()
