/**
 * Unicode -> LaTeX encoder.
 *
 * Internalized port of pylatexenc 2.x `latexencode.UnicodeToLatexEncoder`
 * (MIT, (c) Philippe Faist), restricted to the configuration dwml uses:
 *   replacement_latex_protection = 'braces-all'
 *   unknown_char_policy          = 'keep'
 *   unknown_char_warning         = false
 *   non_ascii_only               = false
 *   conversion_rules             = ['defaults']
 *
 * The `braces-all` scheme wraps every rule replacement in curly braces.
 * Unknown characters (no mapping) are kept verbatim.
 */

import { UNI2LATEX } from './uni2latex.generated';

/**
 * Convert a unicode string to a LaTeX snippet using the default
 * uni2latex map with `braces-all` protection, NFC normalization, and
 * `keep` policy for unknown characters.
 *
 * Iteration is by Unicode code point (matching Python's str indexing),
 * so astral-plane characters (e.g. Mathematical Alphanumeric Symbols
 * U+1D400–U+1D7FF) are treated as single characters.
 */
export function unicodeToLatex(input: string): string {
  const s = String(input).normalize('NFC');
  let out = '';
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    const repl = UNI2LATEX[cp];
    if (repl !== undefined) {
      out += '{' + repl + '}'; // braces-all protection
    } else if ((cp >= 32 && cp <= 127) || ch === '\n' || ch === '\r' || ch === '\t') {
      out += ch;
    } else {
      out += ch; // unknown_char_policy = 'keep'
    }
  }
  return out;
}
