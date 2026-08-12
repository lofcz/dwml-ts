import sys
sys.stdout.reconfigure(encoding='utf-8')
from pylatexenc.latexencode import UnicodeToLatexEncoder

u = UnicodeToLatexEncoder(
    replacement_latex_protection='braces-all',
    unknown_char_policy='keep',
    unknown_char_warning=False,
)

s = '\U0001D434'  # italic A
out = u.unicode_to_latex(s)
print('raw', repr(out))

# replicate dwml process_unicode post-processing
if (not s.startswith('{') and out.startswith('{')
        and not s.endswith('}') and out.endswith('}')):
    out = ' ' + out[1:-1] + ' '
print('after-brace-strip', repr(out))

if 'ensuremath' in out:
    out = out.replace('\\ensuremath{', ' ')
    out = out.replace('}', ' ')
print('after-ensuremath-strip', repr(out))

if out.strip().startswith('\\text'):
    out = ' \\text{%s} ' % out
print('final', repr(out))
