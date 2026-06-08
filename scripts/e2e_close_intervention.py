#!/usr/bin/env python3
import requests
import sys

BASE = "http://127.0.0.1:8000"
ADMIN_USER = "admin"
ADMIN_PASS = "admin123"

s = requests.Session()

print("Logging in...")
resp = s.post(f"{BASE}/auth/login", data={"username": ADMIN_USER, "password": ADMIN_PASS})
if resp.status_code != 200:
    print("Login failed:", resp.status_code, resp.text)
    sys.exit(1)

token = resp.json().get("access_token")
print("Token received")
headers = {"Authorization": f"Bearer {token}"}

print("Fetching interventions list...")
resp = s.get(f"{BASE}/interventions", headers=headers)
if resp.status_code != 200:
    print("Failed to list interventions:", resp.status_code, resp.text)
    sys.exit(1)

interventions = resp.json()
if not interventions:
    print("No interventions available to test.")
    sys.exit(1)

# Prefer an intervention already in progress
target = None
for it in interventions:
    if it.get("statut") == "en_cours":
        target = it
        break
if not target:
    for it in interventions:
        if it.get("statut") == "en_attente":
            target = it
            break

if not target:
    print("No suitable intervention found (en_cours or en_attente)")
    sys.exit(1)

print("Target intervention:", target.get("id"), "status:", target.get("statut"))

if target.get("statut") == "en_attente":
    print("Taking in charge...")
    resp = s.patch(f"{BASE}/interventions/{target['id']}/prendre-en-charge", headers=headers)
    print(resp.status_code, resp.text)
    if resp.status_code != 200:
        print("Failed to take in charge")
        sys.exit(1)
    print("Taken in charge")

print("Submitting closure payload...")
payload = {
    "nature_electrique": True,
    "nature_mecanique": False,
    "nature_autre": False,
    "parametres_controles": "tension ok",
    "remarques": "Test clôture via e2e script",
    "actions_menees": "Remplacement composant, vérification calibrage",
    "piece_rechange": "REF-1234",
    "cout_piece_dt": 12.5
}
resp = s.patch(f"{BASE}/interventions/{target['id']}/cloturer", json=payload, headers=headers)
print(resp.status_code)
try:
    print(resp.json())
except Exception:
    print(resp.text)

print("Verifying final status...")
resp = s.get(f"{BASE}/interventions", headers=headers)
if resp.status_code == 200:
    for it in resp.json():
        if it.get("id") == target['id']:
            print("Final status:", it.get("statut"), "duree_minutes:", it.get("duree_minutes"))
            break
else:
    print("Failed to re-list interventions", resp.status_code)
