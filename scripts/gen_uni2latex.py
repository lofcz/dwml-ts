# Generates src/uni2latex.generated.ts from pylatexenc's builtin map (MIT).
import json
import io
import os
from pylatexenc.latexencode import get_builtin_uni2latex_dict

d = get_builtin_uni2latex_dict()
out = os.path.join(os.path.dirname(__file__), '..', 'src', 'uni2latex.generated.ts')
items = sorted(d.items())
with io.open(out, 'w', encoding='utf-8', newline='\n') as f:
    f.write('/**\n')
    f.write(' * Generated from pylatexenc 2.10 `latexencode` builtin uni2latex map.\n')
    f.write(' * pylatexenc is Copyright (c) Philippe Faist, MIT License.\n')
    f.write(' * DO NOT EDIT BY HAND - regenerate via scripts/gen_uni2latex.py\n')
    f.write(' */\n')
    f.write('export const UNI2LATEX: Readonly<Record<number, string>> = {\n')
    for cp, latex in items:
        f.write('  %d: %s,\n' % (cp, json.dumps(latex, ensure_ascii=True)))
    f.write('};\n')
print('wrote', out, 'entries:', len(items))
