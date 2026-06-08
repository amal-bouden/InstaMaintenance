#!/usr/bin/env python3
import requests
import sys
import time

BASE = "http://127.0.0.1:8000"
ADMIN_USER = "admin"
ADMIN_PASS = "admin123"
TECH_USER = "tech_e2e"
TECH_PASS = "techpass"

s = requests.Session()

def login(username, password):
    resp = s.post(f"{BASE}/auth/login", data={"username": username, "password": password})
    if resp.status_code != 200:
        print(f"Login failed for {username}:", resp.status_code, resp.text)
        return None
    return resp.json().get("access_token")

print("Logging in as admin to create technicien...")
admin_token = login(ADMIN_USER, ADMIN_PASS)
if not admin_token:
    sys.exit(1)
headers_admin = {"Authorization": f"Bearer {admin_token}"}

# Create technicien user (ignore if exists)
print("Creating technicien user (if not exists)...")
payload = {"username": TECH_USER, "password": TECH_PASS, "role": "technicien", "section": None}
resp = s.post(f"{BASE}/users", json=payload, headers=headers_admin)
if resp.status_code == 201 or resp.status_code == 200:
    print("Technicien user created or already exists:", resp.json())
else:
    print("Create user response:", resp.status_code, resp.text)

# Login as technicien
print("Logging in as technicien...")
tech_token = login(TECH_USER, TECH_PASS)
if not tech_token:
    print("Unable to authenticate technicien")
    sys.exit(1)
headers_tech = {"Authorization": f"Bearer {tech_token}"}

# Fetch interventions
print("Fetching interventions as technicien...")
resp = s.get(f"{BASE}/interventions", headers=headers_tech)
if resp.status_code != 200:
    print("Failed to list interventions for technicien:", resp.status_code, resp.text)
    sys.exit(1)
interventions = resp.json()
interventions = resp.json()
if not interventions:
    print("No interventions available to test. Creating one as admin...")
    # create a simple intervention using the first machine available
    mresp = s.get(f"{BASE}/machines", headers=headers_admin)
    if mresp.status_code != 200:
        print("Failed to list machines:", mresp.status_code, mresp.text)
        sys.exit(1)
    machines = mresp.json()
    if not machines:
        print("No machines available to create an intervention.")
        sys.exit(1)
    machine_id = machines[0]["id"]
    iresp = s.post(f"{BASE}/interventions", json={"machine_id": machine_id, "description": "E2E test intervention"}, headers=headers_admin)
    if iresp.status_code not in (200,201):
        print("Failed to create intervention:", iresp.status_code, iresp.text)
        sys.exit(1)
    print("Created intervention:", iresp.json())
    # refresh list
    resp = s.get(f"{BASE}/interventions", headers=headers_tech)
    interventions = resp.json()

# Choose target
target = None
for it in interventions:
    if it.get("statut") == "en_attente":
        target = it
        break
for it in interventions:
    if it.get("statut") == "en_cours":
        target = it
        break

if not target:
    print("No en_attente/en_cours interventions found — creating a new one as admin...")
    # Create a new intervention as admin
    mresp = s.get(f"{BASE}/machines", headers=headers_admin)
    if mresp.status_code != 200:
        print("Failed to list machines:", mresp.status_code, mresp.text)
        sys.exit(1)
    machines = mresp.json()
    if not machines:
        print("No machines available to create an intervention.")
        sys.exit(1)
    machine_id = machines[0]["id"]
    iresp = s.post(f"{BASE}/interventions", json={"machine_id": machine_id, "description": "E2E technicien fresh intervention"}, headers=headers_admin)
    if iresp.status_code not in (200,201):
        print("Failed to create intervention:", iresp.status_code, iresp.text)
        sys.exit(1)
    target = iresp.json()
    print("Created target intervention:", target)

print("Target intervention:", target.get('id'), "status:", target.get('statut'))

# If en_attente, take in charge
if target.get('statut') == 'en_attente':
    print("Technicien taking in charge...")
    resp = s.patch(f"{BASE}/interventions/{target['id']}/prendre-en-charge", headers=headers_tech)
    print(resp.status_code, resp.text)
    if resp.status_code != 200:
        print("Failed to take in charge")
        sys.exit(1)
    print("Taken in charge")
    # small wait
    time.sleep(0.5)

# Submit closure
print("Submitting closure as technicien...")
payload = {
    "nature_electrique": False,
    "nature_mecanique": True,
    "nature_autre": False,
    "parametres_controles": "valeurs OK",
    "remarques": "E2E technicien test",
    "actions_menees": "Réparation locale",
    "piece_rechange": "REF-TECH",
    "cout_piece_dt": 5.0
}
resp = s.patch(f"{BASE}/interventions/{target['id']}/cloturer", json=payload, headers=headers_tech)
print(resp.status_code)
try:
    print(resp.json())
except Exception:
    print(resp.text)

# Verify
print("Verifying status as technicien...")
resp = s.get(f"{BASE}/interventions", headers=headers_tech)
if resp.status_code == 200:
    for it in resp.json():
        if it.get('id') == target['id']:
            print("Final status:", it.get('statut'), "duree_minutes:", it.get('duree_minutes'))
            break
else:
    print("Failed to re-list interventions", resp.status_code)
