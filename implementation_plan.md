# Implementation Plan - Replicating Paper Form & Adding Chef Maintenance Role

The goal of this task is to:
1. Replicate the physical paper-based "Fiche d'intervention maintenance corrective" (FOR-MAI-03) in the PDF generator so that it looks **exactly** like the real form.
2. Add support for missing fields on the form (e.g., operator name, validation testing, observations, applicant and recipient names).
3. Introduce a new user role `chef_maintenance` (Maintenance Supervisor) who has global read-only monitoring access to all technicians and all downloadable forms across all sections.

---

## User Review Required

> [!IMPORTANT]
> **Database Migrations:** We will add 5 new optional columns to the `Intervention` table (`nom_demandeur`, `nom_receptionnaire`, `nom_operateur`, `validation_essai`, `observation`). A lightweight migration script will automatically execute on application startup to apply `ALTER TABLE` commands, ensuring existing data remains intact.
> 
> **User Management:** The `chef_maintenance` role will be assignable by the administrator via the existing `AdminPage` console.

---

## Proposed Changes

### Database & Models (Backend)

#### [MODIFY] [models.py](file:///c:/Users/boude/InstaMaintenance/backend/models.py)
- Add the `chef_maintenance = "chef_maintenance"` value to the `RoleUtilisateur` enum.
- Add the following columns to the `Intervention` model:
  - `nom_demandeur: Optional[str] = None`
  - `nom_receptionnaire: Optional[str] = None`
  - `nom_operateur: Optional[str] = None`
  - `validation_essai: Optional[str] = None`
  - `observation: Optional[str] = None`
  - `technicien_id: Optional[int] = Field(default=None, foreign_key="user.id")` (To track which technician performed the intervention)

#### [MODIFY] [database.py](file:///c:/Users/boude/InstaMaintenance/backend/database.py)
- Update `create_db_and_tables()` to automatically detect if the new columns exist in `instamaintenance.db` and apply `ALTER TABLE` queries to add them if missing.

---

### API Schemas & Endpoints (Backend)

#### [MODIFY] [schemas.py](file:///c:/Users/boude/InstaMaintenance/backend/schemas.py)
- Update `InterventionCreate` schema to accept `nom_demandeur`.
- Update `CloturerIntervention` schema to accept:
  - `nom_receptionnaire`
  - `nom_operateur`
  - `validation_essai`
  - `observation`

#### [MODIFY] [dependencies.py](file:///c:/Users/boude/InstaMaintenance/backend/dependencies.py)
- Define a new role check helper `require_admin_or_chef_maintenance` for querying users list.
- Update `require_chef_or_admin` to allow `chef_maintenance` role.
- Update `require_technicien_or_admin` to allow `chef_maintenance` (so they can inspect or take action if needed).

#### [MODIFY] [main.py](file:///c:/Users/boude/InstaMaintenance/backend/main.py)
- In `creer_intervention`, read `nom_demandeur` from payload. If empty, default to the username of the creator.
- In `prendre_en_charge`, set `intervention.technicien_id = current_user.id`.
- In `cloturer`, set `intervention.technicien_id = current_user.id`.
- In `list_users`, change dependency to `require_admin_or_chef_maintenance`.
- Ensure that `list_machines` and `list_interventions` do not filter by section if the user is `chef_maintenance` (making their access global).

---

### PDF Generation (Backend)

#### [MODIFY] [pdf_generator.py](file:///c:/Users/boude/InstaMaintenance/backend/pdf_generator.py)
- Build a custom `RotatedText` flowable for ReportLab to support the vertical headers (`Demandeur / Applicant`, `Diagnostic / Diagnosis`, `Intervention`).
- Design the entire layout to match the bilingual physical sheet:
  - A4 sheet size with tight margins (e.g. 0.8 cm) to ensure everything fits on exactly 1 page.
  - Draw the oval `tensa` logo at the top left using ReportLab drawing elements.
  - Center title: `Formulaire/Form` / `Fiche d'intervention maintenance corrective` / `Intervention sheet corrective maintenance`.
  - Right top box: `FOR-MAI-03` / `Version 00` / `Page 1/1` / `18/05/2022`.
  - Replicate the exact grid structure with black borders, checkboxes for nature of breakdown, signature placeholders, operator name, validation status, and remarks.

---

### Frontend Components & Pages

#### [MODIFY] [Navbar.jsx](file:///c:/Users/boude/InstaMaintenance/frontend/src/components/Navbar.jsx)
- Register role label for `chef_maintenance: "Chef de Maintenance"`.
- Configure navigation links for `chef_maintenance`:
  - `BI_ANALYTICS` (`/dashboard`)
  - `FLUX_MAINTENANCE` (`/maintenance`)
  - `HISTORIQUE_PANNES` (`/historique`)
  - `TECHNICIENS` (`/techniciens` or similar tab)

#### [MODIFY] [App.jsx](file:///c:/Users/boude/InstaMaintenance/frontend/src/App.jsx)
- Update `ProtectedRoute` for `/dashboard`, `/maintenance`, and `/historique` to include `chef_maintenance`.

#### [MODIFY] [AdminPage.jsx](file:///c:/Users/boude/InstaMaintenance/frontend/src/pages/AdminPage.jsx)
- Register `chef_maintenance` role label and CSS styles.
- Add `chef_maintenance` option to the role select dropdown.

#### [MODIFY] [AtelierPage.jsx](file:///c:/Users/boude/InstaMaintenance/frontend/src/pages/AtelierPage.jsx)
- Add a new input field `Nom du demandeur / Applicant Name` (defaulting to the chef's logged-in name) when declaring an anomaly.

#### [MODIFY] [MaintenancePage.jsx](file:///c:/Users/boude/InstaMaintenance/frontend/src/pages/MaintenancePage.jsx)
- If the logged-in user is `chef_maintenance`, hide operational action buttons ("Prendre en charge", "Remplir FOR-MAI-03") and show a read-only list with a "Télécharger PDF" or "Détails" button.
- In the closing form for technicians, add the missing input fields:
  - `Nom du réceptionnaire / Recipient Name` (defaults to technician username)
  - `Validation et essai / Validation and testing` (e.g. "O/K")
  - `Observation / observations` (e.g. "RAS")
  - `Nom de l'opérateur / Operator Name` (e.g. "Rahma")

#### [NEW] [TechnicienListPage.jsx / Tab](file:///c:/Users/boude/InstaMaintenance/frontend/src/pages/DashboardPage.jsx)
- Add a tab or view in `DashboardPage.jsx` (accessible to `admin` and `chef_maintenance`) that lists all technicians, their availability status (Disponible / Occupé based on active tickets), and counters of their active vs resolved tickets.

---

## Verification Plan

### Automated Verification
- Run the FastAPI server and trigger a PDF download.
- Open the generated PDF in the browser and inspect the layout visually.

### Manual Verification
1. Log in as `admin`, create a `chef_maintenance` user.
2. Log in as `chef_maintenance`, check that all global stats, all machines, and all interventions are visible.
3. Verify that `chef_maintenance` can download the PDF forms for any resolved intervention.
4. Log in as a chef d'atelier, create an intervention, specify the applicant's name.
5. Log in as a technician, take charge of the intervention, close it, and fill out the validation, operator name, and observation fields.
6. Verify that the downloaded PDF matches the visual structure of the paper form.
