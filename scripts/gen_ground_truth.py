# Runs the canonical (reference) Python dwml over all test fixtures and writes
# tests/ground-truth.json for the TS port to compare against (100% fidelity check).
import io
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'reference'))
from dwml import omml  # noqa: E402

HERE = os.path.dirname(__file__)
ROOT = os.path.join(HERE, '..')
FIXDIR = os.path.join(ROOT, 'reference', 'tests-base')
OUT = os.path.join(ROOT, 'tests', 'ground-truth.json')

fixtures = [
    'simple.xml',
    'group.xml',
    'lim.xml',
    'm.xml',
    'd.xml',
    'd-np.xml',
    'nobar.xml',
    'composite.xml',
]

data = {}
for name in fixtures:
    path = os.path.join(FIXDIR, name)
    try:
        results = []
        with io.open(path, 'rb') as fh:
            for omath in omml.load(fh):
                results.append(omath.latex)
        data[name] = {'ok': True, 'latex': results}
    except Exception as e:  # noqa: BLE001
        data[name] = {'ok': False, 'error': '%s: %s' % (type(e).__name__, e)}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with io.open(OUT, 'w', encoding='utf-8', newline='\n') as f:
    f.write(json.dumps(data, ensure_ascii=False, indent=2))
print('wrote', OUT)
