import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
import traceback
try:
    import backend.main as main
    print('IMPORT_OK')
    print('MAIN_FILE', getattr(main, '__file__', '<unknown>'))
    print('HAS_CREER_UTILISATEUR', hasattr(main, 'creer_utilisateur'))
    print('ROUTE_COUNT', len(main.app.routes))
    for r in main.app.routes:
        if r.path.startswith('/users'):
            print('ROUTE', r.path, r.methods, r.name)
    # show functions starting with creer
    print('FUNCTIONS:', [n for n in dir(main) if n.startswith('creer')])
    import inspect
    src = inspect.getsource(main)
    idx = src.find('def creer_utilisateur')
    print('DEF_POS', idx)
    if idx!=-1:
        print('SNIPPET', src[idx:idx+300])
except Exception as e:
    print('IMPORT_ERROR')
    traceback.print_exc()
