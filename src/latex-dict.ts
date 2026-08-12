/**
 * LaTeX symbol dictionaries for OMML to LaTeX conversion.
 *
 * References:
 * - http://web.ift.uib.no/Teori/KURS/WRK/TeX/symALL.html
 * - http://en.wikibooks.org/wiki/LaTeX/Mathematics
 * - http://www.ctan.org/tex-archive/macros/latex/contrib/unicode-math
 * - https://github.com/wspr/unicode-math/blob/master/unicode-math-table.tex
 * - https://github.com/transpect/mml2tex (texmap.xml, function-names.xsl)
 */

export const CHARS: readonly string[] = ['{', '}', '_', '^', '#', '&', '$', '%', '~'];

export const BLANK = '';
export const BACKSLASH = '\\';
export const ALN = '&';

/** Unicode combining accents -> LaTeX accent commands */
export const CHR: Record<string, string> = {
  // Top accents
  '̀': '\\grave{{{0}}}',
  '́': '\\acute{{{0}}}',
  '̂': '\\hat{{{0}}}',
  '̃': '\\tilde{{{0}}}',
  '̄': '\\bar{{{0}}}',
  '̅': '\\overbar{{{0}}}',
  '̆': '\\breve{{{0}}}',
  '̇': '\\dot{{{0}}}',
  '̈': '\\ddot{{{0}}}',
  '̉': '\\ovhook{{{0}}}',
  '̊': '\\ocirc{{{0}}}}',
  '̌': '\\check{{{0}}}}',
  '̐': '\\candra{{{0}}}',
  '̒': '\\oturnedcomma{{{0}}}',
  '̕': '\\ocommatopright{{{0}}}',
  '̚': '\\droang{{{0}}}',
  '̸': '\\not{{{0}}}',
  '⃝': '\\enclosecircle{{{0}}}',
  '⃞': '\\enclosesquare{{{0}}}',
  '⃟': '\\enclosediamond{{{0}}}',
  '⃤': '\\enclosetriangle{{{0}}}',
  '⃐': '\\leftharpoonup{{{0}}}',
  '⃑': '\\rightharpoonup{{{0}}}',
  '⃒': '\\vertoverlay{{{0}}}',
  '⃖': '\\LVec{{{0}}}',
  '⃗': '\\vec{{{0}}}',
  '⃛': '\\dddot{{{0}}}',
  '⃜': '\\ddddot{{{0}}}',
  '⃡': '\\overleftrightarrow{{{0}}}',
  '⃧': '\\annuity{{{0}}}',
  '⃩': '\\widebridgeabove{{{0}}}',
  '⃰': '\\asteraccent{{{0}}}',
  // Bottom accents
  '̰': '\\wideutilde{{{0}}}',
  '̱': '\\underbar{{{0}}}',
  '⃨': '\\threeunderdot{{{0}}}',
  '⃬': '\\underrightharpoondown{{{0}}}',
  '⃭': '\\underleftharpoondown{{{0}}}',
  '⃮': '\\underleftarrow{{{0}}}',
  '⃯': '\\underrightarrow{{{0}}}',
  // Over | group
  '⎴': '\\overbracket{{{0}}}',
  '⏜': '\\overparen{{{0}}}',
  '⏞': '\\overbrace{{{0}}}',
  // Under | group
  '⎵': '\\underbracket{{{0}}}',
  '⏝': '\\underparen{{{0}}}',
  '⏟': '\\underbrace{{{0}}}',
};

/** Big operators */
export const CHR_BO: Record<string, string> = {
  '⅀': '\\Bbbsum',
  '∏': '\\prod',
  '∐': '\\coprod',
  '∑': '\\sum',
  '∫': '\\int',
  '∬': '\\iint',
  '∭': '\\iiint',
  '⨌': '\\iiiint',
  '∮': '\\oint',
  '∯': '\\oiint',
  '∰': '\\oiiint',
  '⨍': '\\fint',
  '⨖': '\\sqint',
  '⋀': '\\bigwedge',
  '⋁': '\\bigvee',
  '⋂': '\\bigcap',
  '⋃': '\\bigcup',
  '⨀': '\\bigodot',
  '⨁': '\\bigoplus',
  '⨂': '\\bigotimes',
  '⨄': '\\biguplus',
  '⨅': '\\bigsqcap',
  '⨆': '\\bigsqcup',
  '⨉': '\\varprod',
};

/** Unicode math symbols -> LaTeX */
export const T: Record<string, string> = {
  '→': '\\rightarrow ',
  // Greek letters (bold italic math, U+1D6FC..)
  '𝛼': '\\alpha ',
  '𝛽': '\\beta ',
  '𝛾': '\\gamma ',
  '𝛿': '\\delta ',
  '𝜀': '\\epsilon ',
  '𝜁': '\\zeta ',
  '𝜂': '\\eta ',
  '𝜃': '\\theta ',
  '𝜄': '\\iota ',
  '𝜅': '\\kappa ',
  '𝜆': '\\lambda ',
  '𝜇': '\\mu ',
  '𝜈': '\\nu ',
  '𝜉': '\\xi ',
  '𝜊': '\\omicron ',
  '𝜋': '\\pi ',
  '𝜌': '\\rho ',
  '𝜍': '\\varsigma ',
  '𝜎': '\\sigma ',
  '𝜏': '\\tau ',
  '𝜐': '\\upsilon ',
  '𝜑': '\\phi ',
  '𝜒': '\\chi ',
  '𝜓': '\\psi ',
  '𝜔': '\\omega ',
  '𝜕': '\\partial ',
  '𝜖': '\\varepsilon ',
  '𝜗': '\\vartheta ',
  '𝜘': '\\varkappa ',
  '𝜙': '\\varphi ',
  '𝜚': '\\varrho ',
  '𝜛': '\\varpi ',
  // Relation symbols
  '←': '\\leftarrow ',
  '↑': '\\uparrow ',
  '↓': '\\downarrow ',
  '↔': '\\leftrightarrow ',
  '↕': '\\updownarrow ',
  '↖': '\\nwarrow ',
  '↗': '\\nearrow ',
  '↘': '\\searrow ',
  '↙': '\\swarrow ',
  '⋮': '\\vdots ',
  '⋯': '\\cdots ',
  '⋰': '\\adots ',
  '⋱': '\\ddots ',
  '⇐': '\\Leftarrow ',
  '⇒': '\\Rightarrow ',
  '⇔': '\\Leftrightarrow ',
  '⇑': '\\Uparrow ',
  '⇓': '\\Downarrow ',
  '⇕': '\\Updownarrow ',
  '↦': '\\mapsto ',
  // Delimiter symbols (used by doD for begChr/endChr)
  '⟨': '\\langle ',
  '⟩': '\\rangle ',
  '⌈': '\\lceil ',
  '⌉': '\\rceil ',
  '⌊': '\\lfloor ',
  '⌋': '\\rfloor ',
  '‖': '\\Vert ',
  '∥': '\\parallel ',
  '≠': '\\ne ',
  '≤': '\\leq ',
  '≥': '\\geq ',
  '≦': '\\leqq ',
  '≧': '\\geqq ',
  '≨': '\\lneqq ',
  '≩': '\\gneqq ',
  '≪': '\\ll ',
  '≫': '\\gg ',
  '∈': '\\in ',
  '∉': '\\notin ',
  '∋': '\\ni ',
  '∌': '\\nni ',
  // Ordinary symbols
  '∞': '\\infty ',
  // Binary relations / operators
  '±': '\\pm ',
  '∓': '\\mp ',
  '·': '\\cdot ',
  '⋅': '\\cdot ',
  '×': '\\times ',
  '÷': '\\div ',
  '∗': '\\ast ',
  '∘': '\\circ ',
  '∙': '\\bullet ',
  '−': '-',
  '<': '<',
  '>': '>',
  '=': '=',
  '≈': '\\approx ',
  '≡': '\\equiv ',
  '≅': '\\cong ',
  '∼': '\\sim ',
  '≃': '\\simeq ',
  '≐': '\\doteq ',
  '∝': '\\propto ',
  '∴': '\\therefore ',
  '∵': '\\because ',
  '∀': '\\forall ',
  '∃': '\\exists ',
  '∄': '\\nexists ',
  '∅': '\\emptyset ',
  '∇': '\\nabla ',
  '∧': '\\wedge ',
  '∨': '\\vee ',
  '¬': '\\neg ',
  '∩': '\\cap ',
  '∪': '\\cup ',
  '⊂': '\\subset ',
  '⊃': '\\supset ',
  '⊆': '\\subseteq ',
  '⊇': '\\supseteq ',
  '⊕': '\\oplus ',
  '⊗': '\\otimes ',
  '⊥': '\\perp ',
  '°': '\\degree ',
  '′': '\\prime ',
  '″': '\\prime\\prime ',
  '…': '\\ldots ',
  // Greek letters (plain, U+03B1..) — for run text
  'α': '\\alpha ',
  'β': '\\beta ',
  'γ': '\\gamma ',
  'δ': '\\delta ',
  'ε': '\\epsilon ',
  'ζ': '\\zeta ',
  'η': '\\eta ',
  'θ': '\\theta ',
  'ι': '\\iota ',
  'κ': '\\kappa ',
  'λ': '\\lambda ',
  'μ': '\\mu ',
  'ν': '\\nu ',
  'ξ': '\\xi ',
  'ο': '\\omicron ',
  'π': '\\pi ',
  'ρ': '\\rho ',
  'ς': '\\varsigma ',
  'σ': '\\sigma ',
  'τ': '\\tau ',
  'υ': '\\upsilon ',
  'φ': '\\phi ',
  'χ': '\\chi ',
  'ψ': '\\psi ',
  'ω': '\\omega ',
  '∂': '\\partial ',
  'ϵ': '\\epsilon ',
  'ϑ': '\\vartheta ',
  'ϰ': '\\varkappa ',
  'ϕ': '\\phi ',
  'ϱ': '\\varrho ',
  'ϖ': '\\varpi ',
  // Italic, Latin, uppercase (U+1D434..)
  '𝐴': 'A',
  '𝐵': 'B',
  '𝐶': 'C',
  '𝐷': 'D',
  '𝐸': 'E',
  '𝐹': 'F',
  '𝐺': 'G',
  '𝐻': 'H',
  '𝐼': 'I',
  '𝐽': 'J',
  '𝐾': 'K',
  '𝐿': 'L',
  '𝑀': 'M',
  '𝑁': 'N',
  '𝑂': 'O',
  '𝑃': 'P',
  '𝑄': 'Q',
  '𝑅': 'R',
  '𝑆': 'S',
  '𝑇': 'T',
  '𝑈': 'U',
  '𝑉': 'V',
  '𝑊': 'W',
  '𝑋': 'X',
  '𝑌': 'Y',
  '𝑍': 'Z',
  // Italic, Latin, lowercase (U+1D44E..)
  '𝑎': 'a',
  '𝑏': 'b',
  '𝑐': 'c',
  '𝑑': 'd',
  '𝑒': 'e',
  '𝑓': 'f',
  '𝑔': 'g',
  '𝑖': 'i',
  '𝑗': 'j',
  '𝑘': 'k',
  '𝑙': 'l',
  '𝑚': 'm',
  '𝑛': 'n',
  '𝑜': 'o',
  '𝑝': 'p',
  '𝑞': 'q',
  '𝑟': 'r',
  '𝑠': 's',
  '𝑡': 't',
  '𝑢': 'u',
  '𝑣': 'v',
  '𝑤': 'w',
  '𝑥': 'x',
  '𝑦': 'y',
  '𝑧': 'z',
};

/** Function names (sin, cos, ...) -> LaTeX templates */
export const FUNC: Record<string, string> = {
  sin: '\\sin({fe})',
  cos: '\\cos({fe})',
  tan: '\\tan({fe})',
  cot: '\\cot({fe})',
  sec: '\\sec({fe})',
  csc: '\\csc({fe})',
  arcsin: '\\arcsin({fe})',
  arccos: '\\arccos({fe})',
  arctan: '\\arctan({fe})',
  arccot: '\\arccot({fe})',
  arcsec: '\\arcsec({fe})',
  arccsc: '\\arccsc({fe})',
  sinh: '\\sinh({fe})',
  cosh: '\\cosh({fe})',
  tanh: '\\tanh({fe})',
  coth: '\\coth({fe})',
  sech: '\\sech({fe})',
  csch: '\\csch({fe})',
  arcsinh: '\\arcsinh({fe})',
  arccosh: '\\arccosh({fe})',
  arctanh: '\\arctanh({fe})',
  arccoth: '\\arccoth({fe})',
  arcsech: '\\arcsech({fe})',
  arccsch: '\\arccsch({fe})',
  log: '\\log{{fe}}',
  ln: '\\ln{{fe}}',
  lg: '\\lg{{fe}}',
  exp: '\\exp({fe})',
  arg: '\\arg({fe})',
  deg: '\\deg({fe})',
  det: '\\det({fe})',
  dim: '\\dim({fe})',
  gcd: '\\gcd({fe})',
  hom: '\\hom({fe})',
  ker: '\\ker({fe})',
  mod: '\\bmod({fe})',
  Pr: '\\Pr({fe})',
};

export const FUNC_PLACE = '{fe}';

export const BRK = '\\\\';

export const CHR_DEFAULT: Record<string, string> = {
  ACC_VAL: '\\hat{{{0}}}',
};

/** Bar positions */
export const POS: Record<string, string> = {
  top: '\\overline{{{0}}}',
  bot: '\\underline{{{0}}}',
};

export const POS_DEFAULT: Record<string, string> = {
  BAR_VAL: '\\overline{{{0}}}',
};

export const SUB = '_{{{0}}}';
export const SUP = '^{{{0}}}';

/** Fraction types */
export const F: Record<string, string> = {
  bar: '\\frac{{{num}}}{{{den}}}',
  skw: '^{{{num}}}/_{{{den}}}',
  noBar: '\\genfrac{{}}{{}}{{0pt}}{{}}{{{num}}}{{{den}}}',
  lin: '{{{num}}}/{{{den}}}',
};
export const F_DEFAULT = '\\frac{{{num}}}{{{den}}}';

export const D = '\\left{left}{text}\\right{right}';

export const D_DEFAULT: Record<string, string> = {
  left: '(',
  right: ')',
  null: '.',
};

export const RAD = '\\sqrt[{deg}]{{{text}}}';
export const RAD_DEFAULT = '\\sqrt{{{text}}}';

export const ARR = '\\begin{{array}}{{c}}{text}\\end{{array}}';

export const LIM_FUNC: Record<string, string> = {
  lim: '\\lim_{{{lim}}}',
  max: '\\max_{{{lim}}}',
  min: '\\min_{{{lim}}}',
  sup: '\\sup_{{{lim}}}',
  inf: '\\inf_{{{lim}}}',
  limsup: '\\limsup_{{{lim}}}',
  liminf: '\\liminf_{{{lim}}}',
  injlim: '\\injlim_{{{lim}}}',
  projlim: '\\projlim_{{{lim}}}',
};

export const LIM_TO: readonly [string, string] = ['\\rightarrow', '\\to'];

export const LIM_UPP = '\\overset{{{lim}}}{{{text}}}';

export const M = '\\begin{{matrix}}{text}\\end{{matrix}}';
