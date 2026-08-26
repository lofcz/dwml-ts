/**
 * OMML (Office Math Markup Language) -> LaTeX converter.
 *
 * Port of the Python `dwml` library (Apache-2.0, (c) xiilei) to TypeScript,
 * with 100% output fidelity on the reference fixtures. Namespace handling is
 * prefix-agnostic (matches by local name), and unknown constructs degrade to
 * their concatenated text content instead of throwing.
 *
 * The conversion operates directly on txml `TNode`s (see https://github.com/TobiasNickel/tXml),
 * which PPTist already ships, so a caller can pass already-parsed nodes in
 * without a DOM and without re-parsing.
 */

import type { TNode } from 'txml/txml';
import { unicodeToLatex } from './latex-encode';
import {
  CHARS,
  CHR,
  CHR_BO,
  CHR_DEFAULT,
  POS,
  POS_DEFAULT,
  F,
  F_DEFAULT,
  F_SMALL,
  T,
  FUNC,
  D,
  D_DEFAULT,
  BORDER_BOX,
  PHANT,
  RAD,
  RAD_DEFAULT,
  ARR,
  LIM_FUNC,
  LIM_TO,
  LIM_UPP,
  M,
  M_JC,
  BRK,
  BLANK,
  BACKSLASH,
  ALN,
  FUNC_PLACE,
} from './latex-dict';

/** Options accepted by the conversion entry points. */
export interface OmmlToLatexOptions {
  /** Called once per element local-name the converter had to degrade. */
  onUnsupported?: (localName: string) => void;
}

const VAL_SUFFIX = 'val';

/** Local name of a tag: strips any namespace prefix (`m:oMath` -> `oMath`). */
export function localName(tagName: string): string {
  const idx = tagName.indexOf(':');
  return idx === -1 ? tagName : tagName.slice(idx + 1);
}

function isElement(node: TNode | string): node is TNode {
  return typeof node !== 'string';
}

/**
 * Concatenated text content of a node (the "never throw" degradation target).
 */
export function textContent(node: TNode): string {
  let out = '';
  for (const child of node.children) {
    out += typeof child === 'string' ? child : textContent(child);
  }
  return out;
}

/**
 * Python's `str.format`-style substitution for the small set of templates
 * used by dwml's latex_dict: `{0}` positional and `{name}` named, with `{{`
 * and `}}` escaped braces.
 */
function pyFormat(template: string, positional: string[] = [], named: Record<string, string> = {}): string {
  let out = '';
  let i = 0;
  const n = template.length;
  while (i < n) {
    const ch = template[i]!;
    if (ch === '{') {
      if (template[i + 1] === '{') {
        out += '{';
        i += 2;
        continue;
      }
      const close = template.indexOf('}', i + 1);
      if (close === -1) {
        out += ch;
        i += 1;
        continue;
      }
      const field = template.slice(i + 1, close);
      if (/^\d+$/.test(field)) {
        out += positional[Number(field)] ?? '';
      } else {
        out += named[field] ?? '';
      }
      i = close + 1;
      continue;
    }
    if (ch === '}' && template[i + 1] === '}') {
      out += '}';
      i += 2;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

/**
 * Escape LaTeX-special characters, matching dwml's `escape_latex`:
 * `\\` is first collapsed to `\`, then any CHARS member not preceded by a
 * backslash is prefixed with a backslash.
 */
export function escapeLatex(strs: string): string {
  const collapsed = strs.split('\\\\').join('\\');
  let out = '';
  let last: string | null = null;
  for (const c of collapsed) {
    if (CHARS.includes(c) && last !== BACKSLASH) {
      out += BACKSLASH + c;
    } else {
      out += c;
    }
    last = c;
  }
  return out;
}

/**
 * Lookup a key in a symbol store. `null`/`undefined` key returns `default`;
 * otherwise returns the store value if present, else the key itself
 * (mirrors dwml's `get_val`). An empty `store` means "no store" -> key.
 */
function getVal(
  key: string | undefined,
  def?: string,
  store?: Record<string, string>,
): string | undefined {
  if (key !== undefined) {
    if (!store) return key;
    return store[key] !== undefined ? store[key] : key;
  }
  return def;
}

type ProcessedChild = { stag: string; value: unknown; node: TNode };

/**
 * Interpret an ST_OnOff value (§7.1.3.9). OMML emits `on`/`off` or `1`/`0`.
 * `undefined` means "not specified" and returns `def`.
 */
function isOn(val: string | undefined, def = false): boolean {
  if (val === undefined) return def;
  const v = val.toLowerCase();
  return v === 'on' || v === '1' || v === 'true';
}

/** Value tags that contribute to a `*Pr` element's attribute dictionary. */
const PR_VAL_TAGS = new Set([
  'chr',
  'pos',
  'begChr',
  'endChr',
  'sepChr',
  'type',
  'show',
  'smallFrac',
  'limLoc',
  'intLim',
  'naryLim',
  'mcJc',
  'degHide',
]);

/** Property element (`accPr`, `dPr`, `barPr`, ...) — attributes + inner text. */
class Pr {
  text = '';
  private attrs: Record<string, string | undefined> = {};

  constructor(elm: TNode, conv: Converter) {
    for (const child of elm.children) {
      if (!isElement(child)) continue;
      const stag = localName(child.tagName);
      if (stag === 'brk') {
        this.attrs['brk'] = BRK;
        this.text += BRK;
      } else if (PR_VAL_TAGS.has(stag)) {
        this.attrs[stag] = getAttr(child, VAL_SUFFIX);
      }
    }
    void conv;
  }

  get(name: string): string | undefined {
    return this.attrs[name];
  }
}

/** Get an attribute by local name (`m:val` / `val` / any re-prefix). */
function getAttr(node: TNode, attrLocal: string): string | undefined {
  for (const key of Object.keys(node.attributes)) {
    if (localName(key) === attrLocal) {
      const v = node.attributes[key];
      return v === null || v === undefined ? undefined : v;
    }
  }
  return undefined;
}

/**
 * Depth-first search for the first descendant element with the given local
 * name, returning its `attrLocal` attribute value. Used for nested property
 * paths like mPr>mcs>mc>mcPr>mcJc that `Pr` (direct children only) can't reach.
 */
function findDescendantAttr(node: TNode, elemLocal: string, attrLocal: string): string | undefined {
  for (const child of node.children) {
    if (!isElement(child)) continue;
    if (localName(child.tagName) === elemLocal) {
      const v = getAttr(child, attrLocal);
      if (v !== undefined) return v;
    }
    const deep = findDescendantAttr(child, elemLocal, attrLocal);
    if (deep !== undefined) return deep;
  }
  return undefined;
}

const DIRECT_TAGS = new Set(['box', 'sSub', 'sSup', 'sSubSup', 'num', 'den', 'deg', 'e', 'oMath', 'oMathPara']);
class Converter {
  private unsupported = new Set<string>();

  constructor(private options: OmmlToLatexOptions = {}) {}

  convert(node: TNode): string {
    const out = this.oMath(node);
    for (const name of this.unsupported) {
      this.options.onUnsupported?.(name);
    }
    return out;
  }

  private noteUnsupported(stag: string): void {
    this.unsupported.add(stag);
  }

  /** Convert an `oMath` (or oMath-like) element's children to LaTeX. */
  oMath(elm: TNode): string {
    return this.processChildren(elm);
  }

  private processChildrenList(elm: TNode, include?: Set<string>): ProcessedChild[] {
    const out: ProcessedChild[] = [];
    for (const child of elm.children) {
      if (!isElement(child)) continue;
      const stag = localName(child.tagName);
      if (include && !include.has(stag)) continue;
      let value = this.dispatch(stag, child);
      if (value === null || value === undefined) {
        value = this.processUnknown(stag, child);
        if (value === null || value === undefined) continue;
      }
      out.push({ stag, value, node: child });
    }
    return out;
  }

  private processChildrenDict(elm: TNode, include?: Set<string>): Record<string, unknown> {
    const dict: Record<string, unknown> = {};
    for (const { stag, value } of this.processChildrenList(elm, include)) {
      dict[stag] = value;
    }
    return dict;
  }

  private processChildren(elm: TNode, include?: Set<string>): string {
    let out = '';
    for (const { value } of this.processChildrenList(elm, include)) {
      out += value instanceof Pr ? value.text : String(value);
    }
    return out;
  }

  /** Dispatch on local name; returns null when no handler exists. */
  private dispatch(stag: string, elm: TNode): unknown {
    switch (stag) {
      case 'acc': return this.doAcc(elm);
      case 'r': return this.doR(elm);
      case 'bar': return this.doBar(elm);
      case 'sub': return this.doSub(elm);
      case 'sup': return this.doSup(elm);
      case 'f': return this.doF(elm);
      case 'func': return this.doFunc(elm);
      case 'fName': return this.doFName(elm);
      case 'groupChr': return this.doGroupChr(elm);
      case 'd': return this.doD(elm);
      case 'rad': return this.doRad(elm);
      case 'eqArr': return this.doEqArr(elm);
      case 'limLow': return this.doLimLow(elm);
      case 'limUpp': return this.doLimUpp(elm);
      case 'lim': return this.doLim(elm);
      case 'm': return this.doM(elm);
      case 'mr': return this.doMr(elm);
      case 'nary': return this.doNary(elm);
      case 'borderBox': return this.doBorderBox(elm);
      case 'phant': return this.doPhant(elm);
      case 'sPre': return this.doSPre(elm);
      default: return null;
    }
  }

  /**
   * Fallback for unhandled tags. Mirrors dwml's `process_unknow` (direct
   * passthrough tags, `*Pr` -> Pr), but degrades anything else to text
   * content instead of dropping it, so conversion never throws.
   */
  private processUnknown(stag: string, elm: TNode): unknown {
    if (DIRECT_TAGS.has(stag)) {
      return this.processChildren(elm);
    }
    if (stag.endsWith('Pr')) {
      return new Pr(elm, this);
    }
    this.noteUnsupported(stag);
    return textContent(elm);
  }

  private doAcc(elm: TNode): string {
    const c = this.processChildrenDict(elm);
    const pr = c['accPr'] as Pr | undefined;
    const latexS = getVal(pr?.get('chr'), CHR_DEFAULT['ACC_VAL'], CHR) ?? '';
    const e = (c['e'] as string | undefined) ?? '';
    return pyFormat(latexS, [e]);
  }

  private doBar(elm: TNode): string {
    const c = this.processChildrenDict(elm);
    const pr = c['barPr'] as Pr | undefined;
    const latexS = getVal(pr?.get('pos'), POS_DEFAULT['BAR_VAL'], POS) ?? '';
    const e = (c['e'] as string | undefined) ?? '';
    return (pr?.text ?? '') + pyFormat(latexS, [e]);
  }

  private doD(elm: TNode): string {
    const c = this.processChildrenDict(elm);
    const pr = c['dPr'] as Pr | undefined;
    const nullChar = D_DEFAULT['null']!;
    const sVal = getVal(pr?.get('begChr'), D_DEFAULT['left'], T);
    const eVal = getVal(pr?.get('endChr'), D_DEFAULT['right'], T);
    const sepVal = getVal(pr?.get('sepChr'), D_DEFAULT['sep'], T);
    // A delimiter may wrap several base arguments (m:e), joined by sepChr.
    const bases = this.processChildrenList(elm, new Set(['e'])).map((x) => String(x.value));
    const sep = sepVal ? escapeLatex(sepVal) : '';
    const text = bases.join(sep);
    return (
      (pr?.text ?? '') +
      pyFormat(D, [], {
        left: !sVal ? nullChar : escapeLatex(sVal),
        text,
        right: !eVal ? nullChar : escapeLatex(eVal),
      })
    );
  }

  private doSub(elm: TNode): string {
    return pyFormat(SUB_TEMPLATE, [this.processChildren(elm)]);
  }

  private doSup(elm: TNode): string {
    return pyFormat(SUP_TEMPLATE, [this.processChildren(elm)]);
  }

  private doF(elm: TNode): string {
    const c = this.processChildrenDict(elm);
    const pr = c['fPr'] as Pr | undefined;
    let latexS = getVal(pr?.get('type'), F_DEFAULT, F) ?? '';
    // smallFrac renders the (bar) fraction in inline/text style.
    if (latexS === F_DEFAULT && isOn(pr?.get('smallFrac'))) {
      latexS = F_SMALL;
    }
    const num = (c['num'] as string | undefined) ?? '';
    const den = (c['den'] as string | undefined) ?? '';
    return (pr?.text ?? '') + pyFormat(latexS, [], { num, den });
  }

  private doFunc(elm: TNode): string {
    const c = this.processChildrenDict(elm);
    const fName = (c['fName'] as string | undefined) ?? '';
    const e = (c['e'] as string | undefined) ?? '';
    return fName.split(FUNC_PLACE).join(e);
  }

  private doFName(elm: TNode): string {
    const parts: string[] = [];
    for (const { stag, value } of this.processChildrenList(elm)) {
      if (stag === 'r') {
        const key = String(value).trim();
        if (FUNC[key] !== undefined) {
          parts.push(FUNC[key]!);
        } else {
          // degrade: keep raw text (dwml would raise NotSupport)
          this.noteUnsupported('fName:' + key);
          parts.push(String(value));
        }
      } else {
        parts.push(String(value));
      }
    }
    const joined = parts.join(BLANK);
    return joined.includes(FUNC_PLACE) ? joined : joined + FUNC_PLACE;
  }

  private doGroupChr(elm: TNode): string {
    const c = this.processChildrenDict(elm);
    const pr = c['groupChrPr'] as Pr | undefined;
    const latexS = getVal(pr?.get('chr'), undefined, CHR) ?? '';
    const e = (c['e'] as string | undefined) ?? '';
    return (pr?.text ?? '') + pyFormat(latexS, [e]);
  }

  private doRad(elm: TNode): string {
    const c = this.processChildrenDict(elm);
    const text = (c['e'] as string | undefined) ?? '';
    const deg = c['deg'] as string | undefined;
    if (deg) {
      return pyFormat(RAD, [], { deg, text });
    }
    return pyFormat(RAD_DEFAULT, [], { text });
  }

  private doEqArr(elm: TNode): string {
    const rows = this.processChildrenList(elm, new Set(['e'])).map((c) => String(c.value));
    return pyFormat(ARR, [], { text: rows.join(BRK) });
  }

  private doLimLow(elm: TNode): string {
    const c = this.processChildrenDict(elm, new Set(['e', 'lim']));
    const e = (c['e'] as string | undefined) ?? '';
    const lim = (c['lim'] as string | undefined) ?? '';
    const latexS = LIM_FUNC[e];
    if (!latexS) {
      // degrade (dwml would raise NotSupport)
      this.noteUnsupported('limLow:' + e);
      return e + lim;
    }
    return pyFormat(latexS, [], { lim });
  }

  private doLimUpp(elm: TNode): string {
    const c = this.processChildrenDict(elm, new Set(['e', 'lim']));
    const lim = (c['lim'] as string | undefined) ?? '';
    const text = (c['e'] as string | undefined) ?? '';
    return pyFormat(LIM_UPP, [], { lim, text });
  }

  private doLim(elm: TNode): string {
    return this.processChildren(elm).split(LIM_TO[0]).join(LIM_TO[1]);
  }

  private doM(elm: TNode): string {
    const rows: string[] = [];
    let template = M;
    for (const { stag, value, node } of this.processChildrenList(elm)) {
      if (stag === 'mPr') {
        // Column justification lives at mPr>mcs>mc>mcPr>mcJc (per column).
        // All columns sharing a justification collapse to one array spec.
        const jc = findDescendantAttr(node, 'mcJc', VAL_SUFFIX);
        if (jc && M_JC[jc]) template = M_JC[jc]!;
        continue;
      }
      if (stag === 'mr') rows.push(String(value));
    }
    return pyFormat(template, [], { text: rows.join(BRK) });
  }

  private doMr(elm: TNode): string {
    return this.processChildrenList(elm, new Set(['e'])).map((c) => String(c.value)).join(ALN);
  }

  private doNary(elm: TNode): string {
    const res: string[] = [];
    let bo = '';
    let limLoc = '';
    for (const { stag, value } of this.processChildrenList(elm)) {
      if (stag === 'naryPr') {
        const pr = value as Pr;
        bo = getVal(pr.get('chr'), undefined, CHR_BO) ?? '';
        // naryLim (per-object) wins; intLim applies to integrals.
        limLoc = pr.get('naryLim') ?? pr.get('limLoc') ?? pr.get('intLim') ?? '';
      } else {
        res.push(String(value));
      }
    }
    // undOvr -> limits above/below the operator; subSup is the default side
    // placement already produced by the dispatched _{...}^{...} children.
    const limits = limLoc === 'undOvr' ? '\\limits' : '';
    return bo + limits + res.join(BLANK);
  }

  private doBorderBox(elm: TNode): string {
    const c = this.processChildrenDict(elm);
    const e = (c['e'] as string | undefined) ?? '';
    return pyFormat(BORDER_BOX, [e]);
  }

  private doPhant(elm: TNode): string {
    const c = this.processChildrenDict(elm);
    const pr = c['phantPr'] as Pr | undefined;
    const e = (c['e'] as string | undefined) ?? '';
    // Default (show omitted) renders the base visibly; show=off hides it.
    if (isOn(pr?.get('show'), true)) {
      return e;
    }
    return pyFormat(PHANT, [e]);
  }

  private doSPre(elm: TNode): string {
    const c = this.processChildrenDict(elm);
    const e = (c['e'] as string | undefined) ?? '';
    // sub/sup arrive already wrapped as _{...} / ^{...} by doSub/doSup;
    // the prescript form places them against an empty base to the left.
    const sub = (c['sub'] as string | undefined) ?? '';
    const sup = (c['sup'] as string | undefined) ?? '';
    return `{}${sub}${sup}{${e}}`;
  }

  /**
   * Map a run's text to LaTeX. dwml's `T` dictionary is consulted first
   * (per Unicode code point) so Mathematical Alphanumeric Symbols and math
   * operators map to their clean ASCII / command forms; anything not in `T`
   * falls back to the pylatexenc-derived encoder.
   */
  private processUnicode(s: string): string {
    let out = '';
    for (const ch of s.normalize('NFC')) {
      const mapped = T[ch];
      if (mapped !== undefined) {
        out += mapped;
      } else if (CHARS.includes(ch)) {
        // LaTeX-special char: pass through raw; escape_latex (in do_r)
        // will prefix it with a backslash.
        out += ch;
      } else {
        out += unicodeToLatex(ch);
      }
    }
    return out;
  }

  private doR(elm: TNode): string {
    const strs: string[] = [];
    const baseStrs: string[] = [];
    for (const child of elm.children) {
      if (!isElement(child)) continue;
      if (localName(child.tagName) !== 't') continue;
      const s = textContent(child);
      strs.push(this.processUnicode(s));
      baseStrs.push(s);
    }
    let procStr = escapeLatex(strs.join(BLANK));
    const baseProcStr = baseStrs.join(BLANK);

    if (!baseProcStr.includes('{') && procStr.includes('\\{')) {
      procStr = procStr.split('\\{').join('{');
    }
    if (!baseProcStr.includes('}') && procStr.includes('\\}')) {
      procStr = procStr.split('\\}').join('}');
    }
    return procStr;
  }
}

const SUB_TEMPLATE = '_{{{0}}}';
const SUP_TEMPLATE = '^{{{0}}}';

function findLocal(node: TNode, name: string, acc: TNode[] = []): TNode[] {
  if (localName(node.tagName) === name) acc.push(node);
  for (const child of node.children) {
    if (typeof child !== 'string') findLocal(child, name, acc);
  }
  return acc;
}

/**
 * Convert an already-parsed `oMath` (or oMath-like) node to bare LaTeX.
 * Unwraps `oMathPara` / `a14:m` so display math is not flattened to concatenated
 * `m:t` text (`3/8` → `38`). Never throws on unknown constructs.
 */
export function ommlNodeToLatex(node: TNode, options: OmmlToLatexOptions = {}): string {
  const name = localName(node.tagName);
  if (name === 'oMathPara' || name === 'm') {
    const found = findLocal(node, 'oMath');
    if (found.length) {
      return found.map((omath) => new Converter(options).convert(omath)).join('').trim();
    }
  }
  return new Converter(options).convert(node);
}
