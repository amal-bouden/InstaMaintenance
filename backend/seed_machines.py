from sqlmodel import Session, select
from database import engine, create_db_and_tables
from models import Machine

def seed_machines():
    create_db_and_tables()
    with Session(engine) as session:
        # Supprimer les anciennes machines de test
        existing = session.exec(select(Machine)).all()
        for m in existing:
            session.delete(m)
        session.commit()
        print(f"🗑️  {len(existing)} anciennes machines supprimées")

        machines = [
            # ── Automatique (58 machines) ──────────────────────────────
            Machine(code='CO-MCC001',        section='Automatique',    famille='Machine clip cap'),
            Machine(code='CO-MCC002',        section='Automatique',    famille='Machine clip cap'),
            Machine(code='CO-MCCH001',       section='Automatique',    famille='Machine couvre chaussure'),
            Machine(code='CO-MCCH002',       section='Automatique',    famille='Machine couvre chaussure'),
            Machine(code='CO-MCN001',        section='Automatique',    famille='Machine calot automatique'),
            Machine(code='CO-MMC001',        section='Automatique',    famille='Machine masque carrée'),
            Machine(code='CO-MMC002',        section='Automatique',    famille='Machine masque carrée'),
            Machine(code='CO-MMC003',        section='Automatique',    famille='Machine masque carrée'),
            Machine(code='CO-MMC004',        section='Automatique',    famille='Machine masque carrée'),
            Machine(code='CO-MME001',        section='Automatique',    famille='Machine masque elastique'),
            Machine(code='CO-MME002',        section='Automatique',    famille='Machine masque elastique'),
            Machine(code='CO-MME003',        section='Automatique',    famille='Machine masque elastique'),
            Machine(code='CO-MME004',        section='Automatique',    famille='Machine masque elastique'),
            Machine(code='CO-MME005',        section='Automatique',    famille='Machine masque elastique'),
            Machine(code='CO-MME006',        section='Automatique',    famille='Machine masque elastique'),
            Machine(code='CO-MME007',        section='Automatique',    famille='Machine masque elastique'),
            Machine(code='CO-MME008',        section='Automatique',    famille='Machine masque elastique'),
            Machine(code='CO-MME009',        section='Automatique',    famille='Machine masque elastique'),
            Machine(code='CO-MME010',        section='Automatique',    famille='Machine masque elastique'),
            Machine(code='CO-MME011',        section='Automatique',    famille='Machine masque elastique'),
            Machine(code='CO-MME012',        section='Automatique',    famille='Machine masque elastique'),
            Machine(code='CO-MME013',        section='Automatique',    famille='Machine masque elastique'),
            Machine(code='CO-MME014',        section='Automatique',    famille='Machine masque elastique'),
            Machine(code='CO-MME015',        section='Automatique',    famille='Machine masque elastique'),
            Machine(code='CO-MME016',        section='Automatique',    famille='Machine masque elastique'),
            Machine(code='CO-MME017',        section='Automatique',    famille='Machine masque elastique'),
            Machine(code='CO-MME018',        section='Automatique',    famille='Machine masque elastique'),
            Machine(code='CO-MME019',        section='Automatique',    famille='Machine masque elastique'),
            Machine(code='CO-MME020',        section='Automatique',    famille='Machine masque elastique'),
            Machine(code='CO-MME021',        section='Automatique',    famille='Machine masque elastique'),
            Machine(code='CO-MME022',        section='Automatique',    famille='Machine masque elastique'),
            Machine(code='CO-MME023',        section='Automatique',    famille='Machine masque elastique'),
            Machine(code='CO-MME024',        section='Automatique',    famille='Machine masque elastique'),
            Machine(code='CO-MME025',        section='Automatique',    famille='Machine masque elastique'),
            Machine(code='CO-MME026',        section='Automatique',    famille='Machine masque elastique'),
            Machine(code='CO-MMEA001',       section='Automatique',    famille='Machine masque elastique automatique'),
            Machine(code='CO-MSAME002',      section='Automatique',    famille='Machine semi automatique masque elastique'),
            Machine(code='CO-MSAME003',      section='Automatique',    famille='Machine semi automatique masque elastique'),
            Machine(code='CO-MSAME004',      section='Automatique',    famille='Machine semi automatique masque elastique'),
            Machine(code='CO-MCE002',        section='Automatique',    famille='Machine ciseaux elastique'),
            Machine(code='CO-MMT001',        section='Automatique',    famille='Machine masque TIE ON'),
            Machine(code='CO-MMT002',        section='Automatique',    famille='Machine masque TIE ON'),
            Machine(code='CO-MEAME001',      section='Automatique',    famille='Machine emballage automatique masque elastique'),
            Machine(code='CO-MEAME002',      section='Automatique',    famille='Machine emballage automatique masque elastique'),
            Machine(code='CO-MSC001',        section='Automatique',    famille='Machine soudeuse contenu'),
            Machine(code='CO-MSPP-001',      section='Automatique',    famille='Machine soudeuse plastique pneumatique'),
            Machine(code='CO-MSS 021',       section='Automatique',    famille='Machine soudeuse sachet'),
            Machine(code='CO-MSS 016',       section='Automatique',    famille='Machine soudeuse sachet'),
            Machine(code='CO-MSSP001',       section='Automatique',    famille='Machine soudeuse sachet avec pression'),
            Machine(code='CO-MSSP004',       section='Automatique',    famille='Machine soudeuse sachet avec pression'),
            Machine(code='CO-CLIM 002',      section='Automatique',    famille='Climeur'),
            Machine(code='CO-CLIM 007',      section='Automatique',    famille='Climeur'),
            Machine(code='CO-CLIM-6L-001',   section='Automatique',    famille='Climeur'),
            Machine(code='CO-CLIM-6L-002',   section='Automatique',    famille='Climeur'),
            Machine(code='CO-CLIM-6L-003',   section='Automatique',    famille='Climeur'),
            Machine(code='CO-CLIM-6L-004',   section='Automatique',    famille='Climeur'),
            Machine(code='CO-ETIQUETEUSE-003', section='Automatique',  famille='Etiqueteuse ZEBRA TZ411'),
            Machine(code='CO-MCOMPV-001',    section='Automatique',    famille='Compresseur à vis'),

            # ── Confection (54 machines) ───────────────────────────────
            Machine(code='CO-MCL 002',       section='Confection',     famille='Machine colorette'),
            Machine(code='CO-MCL 005',       section='Confection',     famille='Machine colorette'),
            Machine(code='CO-MCL 0010',      section='Confection',     famille='Machine colorette'),
            Machine(code='CO-MCL 008',       section='Confection',     famille='Machine colorette'),
            Machine(code='CO-MCL 011',       section='Confection',     famille='Machine colorette'),
            Machine(code='CO-MCL 012',       section='Confection',     famille='Machine colorette'),
            Machine(code='CO-MBOA 003',      section='Confection',     famille='Machine boutonnière automatique'),
            Machine(code='CO-MBOA 004',      section='Confection',     famille='Machine boutonnière automatique'),
            Machine(code='CO-MBOA-002',      section='Confection',     famille='Machine boutonnière automatique'),
            Machine(code='CO-MSI 009',       section='Confection',     famille='Machine simple'),
            Machine(code='CO-MSI 015',       section='Confection',     famille='Machine simple'),
            Machine(code='CO-MSI 017',       section='Confection',     famille='Machine simple'),
            Machine(code='CO-MSI 018',       section='Confection',     famille='Machine simple'),
            Machine(code='CO-MSI 019',       section='Confection',     famille='Machine simple'),
            Machine(code='CO-MSI 020',       section='Confection',     famille='Machine simple'),
            Machine(code='CO-MSI 022',       section='Confection',     famille='Machine simple'),
            Machine(code='CO-MSI 023',       section='Confection',     famille='Machine simple'),
            Machine(code='CO-MSJ 007',       section='Confection',     famille='Machine surjet'),
            Machine(code='CO-MSJ 008',       section='Confection',     famille='Machine surjet'),
            Machine(code='CO-MSJ 011',       section='Confection',     famille='Machine surjet'),
            Machine(code='CO-MSJ 012',       section='Confection',     famille='Machine surjet'),
            Machine(code='CO-MSJ 034',       section='Confection',     famille='Machine surjet'),
            Machine(code='CO-MSJ 040',       section='Confection',     famille='Machine surjet'),
            Machine(code='CO-MSJ 042',       section='Confection',     famille='Machine surjet'),
            Machine(code='CO-MSJ 044',       section='Confection',     famille='Machine surjet'),
            Machine(code='CO-MSJ 045',       section='Confection',     famille='Machine surjet'),
            Machine(code='CO-MSJ 046',       section='Confection',     famille='Machine surjet'),
            Machine(code='CO-MSJ 047',       section='Confection',     famille='Machine surjet'),
            Machine(code='CO-MSJ 048',       section='Confection',     famille='Machine surjet'),
            Machine(code='CO-MSJ 049',       section='Confection',     famille='Machine surjet'),
            Machine(code='CO-MSJ 051',       section='Confection',     famille='Machine surjet'),
            Machine(code='CO-MSJ 052',       section='Confection',     famille='Machine surjet'),
            Machine(code='CO-MSJ 053',       section='Confection',     famille='Machine surjet'),
            Machine(code='CO-MSJ 058',       section='Confection',     famille='Machine surjet'),
            Machine(code='CO-MSJ 059',       section='Confection',     famille='Machine surjet'),
            Machine(code='CO-MSJ 060',       section='Confection',     famille='Machine surjet'),
            Machine(code='CO-MSJ 061',       section='Confection',     famille='Machine surjet'),
            Machine(code='CO-MSJ 062',       section='Confection',     famille='Machine surjet'),
            Machine(code='CO-MSJ 063',       section='Confection',     famille='Machine surjet'),
            Machine(code='CO-MSJ 065',       section='Confection',     famille='Machine surjet'),
            Machine(code='CO-MSJ 066',       section='Confection',     famille='Machine surjet'),
            Machine(code='CO-MSJ 067',       section='Confection',     famille='Machine surjet'),
            Machine(code='CO-MUS 001',       section='Confection',     famille='Machine ultrasonique'),
            Machine(code='CO-MUS 004',       section='Confection',     famille='Machine ultrasonique'),
            Machine(code='CO-MUS 005',       section='Confection',     famille='Machine ultrasonique'),
            Machine(code='CO-MUS 006',       section='Confection',     famille='Machine ultrasonique'),
            Machine(code='CO-MUS 010',       section='Confection',     famille='Machine ultrasonique'),
            Machine(code='CO-MUS 012',       section='Confection',     famille='Machine ultrasonique'),
            Machine(code='CO-MUS 013',       section='Confection',     famille='Machine ultrasonique'),
            Machine(code='CO-MUS 016',       section='Confection',     famille='Machine ultrasonique'),
            Machine(code='CO-MUS 017',       section='Confection',     famille='Machine ultrasonique'),
            Machine(code='CO-MUS-PACK-001',  section='Confection',     famille='Machine ultrasonique PACKMED'),
            Machine(code='CO-MUS-pack-003',  section='Confection',     famille='Machine ultrasonique'),
            Machine(code='CO-MSS 001',       section='Confection',     famille='Machine soudeuse sachet'),
            Machine(code='CO-MSS 008',       section='Confection',     famille='Machine soudeuse sachet'),
            Machine(code='CO-MSS 010',       section='Confection',     famille='Machine soudeuse sachet'),
            Machine(code='CO-MSS 015',       section='Confection',     famille='Machine soudeuse sachet'),
            Machine(code='CO-MMP002',        section='Confection',     famille='Machine mini perceuse'),
            Machine(code='CO-MMP003',        section='Confection',     famille='Machine mini perceuse'),
            Machine(code='CO-MCCD 001',      section='Confection',     famille='Machine distribution colle à chaud'),
            Machine(code='CO-ETIQUETEUSE - 001', section='Confection', famille='Etiqueteuse'),
            Machine(code='CO-MCL 003',       section='Confection',     famille='Machine collerette'),
            Machine(code='CO-MCL 007',       section='Confection',     famille='Machine collerette'),
            Machine(code='CO-MSG002',        section='Confection',     famille='Machine soudeuse gaine'),
            Machine(code='CO-MSG007',        section='Confection',     famille='Machine soudeuse gaine'),
            Machine(code='CO-MSP003',        section='Confection',     famille='Machine soudeuse plastique'),
            Machine(code='CO-MSPTY002',      section='Confection',     famille='Machine soudeuse tyvec'),
            Machine(code='CO-MMP002-conf',   section='Confection',     famille='Machine mini perceuse'),

            # ── Stérile (22 machines) ──────────────────────────────────
            Machine(code='CO-CTA-001',       section='Sterile',        famille="Centrale traitement d'air"),
            Machine(code='CO-SYS-ECH-AIR-001', section='Sterile',     famille="Système d'échange d'air"),
            Machine(code='CO-SYS-AIR-NEUF-001', section='Sterile',    famille="Système d'air neuf"),
            Machine(code='CO-SECHR AIR-001', section='Sterile',        famille="Secheur d'air"),
            Machine(code='CO-SECHR AIR-002', section='Sterile',        famille="Secheur d'air"),
            Machine(code='CO-POMP001',       section='Sterile',        famille="Pompe d'eau"),
            Machine(code='CO-POMP002',       section='Sterile',        famille="Pompe d'eau"),
            Machine(code='CO-COMP 005',      section='Sterile',        famille='Compresseur'),
            Machine(code='CO-MSPTY001',      section='Sterile',        famille='Machine soudeuse tyvec'),
            Machine(code='CO-MSG001',        section='Sterile',        famille='Machine soudeuse gaine'),
            Machine(code='CO-MSG005',        section='Sterile',        famille='Machine soudeuse gaine'),
            Machine(code='CO-MSG006',        section='Sterile',        famille='Machine soudeuse gaine'),
            Machine(code='CO-MST-001',       section='Sterile',        famille='Stérilisateur'),
            Machine(code='CO-STE-001',       section='Sterile',        famille="Station traitement d'eau"),
            Machine(code='CO-MTHF-001',      section='Sterile',        famille='Machine thermoformeuse'),
            Machine(code='CO-MTHF-002',      section='Sterile',        famille='Machine thermoformeuse'),
            Machine(code='CO-MCCD 002',      section='Sterile',        famille='Machine distribution colle à chaud'),
            Machine(code='CO-MCCD 003',      section='Sterile',        famille='Machine distribution colle à chaud'),

            # ── Zone de coupe (17 machines) ────────────────────────────
            Machine(code='CO-MPH 02',        section='Zone de coupe',  famille='Machine presse hydraulique'),
            Machine(code='CO-MLC003',        section='Zone de coupe',  famille='Machine lame de coupe'),
            Machine(code='CO-MLC004',        section='Zone de coupe',  famille='Machine lame de coupe'),
            Machine(code='CO-MLC005',        section='Zone de coupe',  famille='Machine lame de coupe'),
            Machine(code='CO-MLC006',        section='Zone de coupe',  famille='Machine lame de coupe'),
            Machine(code='CO-MMP001',        section='Zone de coupe',  famille='Machine mini perceuse'),
            Machine(code='CO-MMP004',        section='Zone de coupe',  famille='Machine mini perceuse'),
            Machine(code='CO-MSP001',        section='Zone de coupe',  famille='Machine soudeuse plastique'),
            Machine(code='CO-MSP002',        section='Zone de coupe',  famille='Machine soudeuse plastique'),
            Machine(code='CO-MSP004',        section='Zone de coupe',  famille='Machine soudeuse plastique'),
            Machine(code='CO-MSP005',        section='Zone de coupe',  famille='Machine soudeuse plastique'),
            Machine(code='CO-MSP007',        section='Zone de coupe',  famille='Machine soudeuse plastique'),
            Machine(code='CO-MSBPP001',      section='Zone de coupe',  famille='Machine soudeuse biposition plastique'),
            Machine(code='CO-MSS 009',       section='Zone de coupe',  famille='Machine soudeuse sachet'),
            Machine(code='CO-MSS-MINI-010',  section='Zone de coupe',  famille='Machine mini soudeuse sachet'),
            Machine(code='CO-MSS 003',       section='Zone de coupe',  famille='Machine soudeuse sachet'),
            Machine(code='CO-MCHM 002',      section='Zone de coupe',  famille='Machine chariot matelasseur'),

            # ── Laboratoire (8 machines) ───────────────────────────────
            Machine(code='CO-INC001',        section='Laboratoire',    famille='Incubateur'),
            Machine(code='CO-INC002',        section='Laboratoire',    famille='Incubateur'),
            Machine(code='CO-MHOT01',        section='Laboratoire',    famille='Hote'),
            Machine(code='CO-MAJ001',        section='Laboratoire',    famille='Ajitateur'),
            Machine(code='CO-BM001',         section='Laboratoire',    famille='Bain marie'),
            Machine(code='CO-MTEST001',      section='Laboratoire',    famille='Testometrie'),
            Machine(code='CO-REFRE-ARS-ST',  section='Laboratoire',    famille='Réfrigérateur'),
            Machine(code='CO-REFRE-BIOLUX',  section='Laboratoire',    famille='Réfrigérateur'),
        ]

        for m in machines:
            session.add(m)
        session.commit()

        # Résumé par section
        par_section = {}
        for m in machines:
            par_section[m.section] = par_section.get(m.section, 0) + 1

        print(f"\n✅ {len(machines)} machines importées depuis FOR-MAI-03 2026.xlsx")
        print("\nRépartition par section :")
        for section, count in sorted(par_section.items()):
            print(f"  {section:<20} : {count} machines")

if __name__ == "__main__":
    seed_machines()
