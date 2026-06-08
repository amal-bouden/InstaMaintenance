import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from backend import main
app = main.app
for r in app.routes:
    if r.path == '/users':
        print('ROUTE', r.path, r.methods, r.name)
print('ALL_USER_ROUTES')
for r in app.routes:
    if '/users' in r.path:
        print(r.path, r.methods, r.name)
