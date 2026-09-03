# dwml-ts

Convert **MS Office OMML** (Office Math Markup Language, the `<m:oMath>` markup used
in `.docx` / `.pptx` / `.xlsx`) to **LaTeX** — in TypeScript.

A faithful port of the Python [`dwml`](https://github.com/xiilei/dwml) library with
**100% output fidelity** on its reference fixtures, hardened for real-world OOXML
import pipelines (PowerPoint, Word).

- **Pure, synchronous, deterministic** — no async, no config singletons.
- **DOM-free** — runs identically in the browser bundle and in Node. No
  `DOMParser` / `XMLSerializer` / `xmldom`.
- **One tiny runtime dep**: [`txml`](https://github.com/TobiasNickel/tXml) for parsing
  (which [PPTist](https://github.com/pipipi-pikachu/PPTist) already ships — zero new bytes).
- **Never throws on unknown constructs** — degrades per-node to concatenated text
  content, so one odd `<m:oMath>` can't kill a whole paragraph import.

## Install

```bash
npm install dwml-ts
```

## API

All output is **bare LaTeX** — no `$`/`$$` delimiters, no trailing whitespace. The
caller decides inline vs. display math (e.g. PPTist wraps it in its own
`span.pptist-math[data-latex]` element).

### `ommlToLatex(xml, options?): string`

Convert one OMML fragment to bare LaTeX. Accepts `<m:oMath>`, `<m:oMathPara>` or the
`<a14:m>` wrapper as an XML string, and tolerates **missing `xmlns` declarations**
(fragments sliced out of slide XML where the namespace lives on a root you don't have).

```ts
import { ommlToLatex } from 'dwml-ts';

ommlToLatex('<m:oMath><m:r><m:t>x+1</m:t></m:r></m:oMath>');
// => 'x+1'

ommlToLatex('<m:oMath><m:rad><m:radPr><m:degHide m:val="1"/></m:radPr><m:deg/><m:e><m:r><m:t>5</m:t></m:r></m:e></m:rad></m:oMath>');
// => '\\sqrt{5}'
```

### `ommlNodeToLatex(node, options?): string`

Node-level entry: convert an **already-parsed txml `TNode`**. This is the important one
for import pipelines — walk each `<a:p>` of the slide XML yourself to preserve run order
(text run → math → text run), and pass math nodes straight in. One parse per slide, no
re-parsing fragments.

```ts
import { parse } from 'txml';
import { ommlNodeToLatex } from 'dwml-ts';

const nodes = parse(slideXml);
// ... find the <m:oMath> node(s) you care about, then:
const latex = ommlNodeToLatex(omathNode);
```

### `extractOmmlLatex(xml, options?): string[]`

Batch: find and convert every `<m:oMath>` in any OOXML document/fragment, returning one
bare LaTeX string per formula, in document order.

```ts
import { extractOmmlLatex } from 'dwml-ts';

const [first, second] = extractOmmlLatex(documentXml);
```

### `OmmlToLatexOptions`

```ts
export interface OmmlToLatexOptions {
  /** Called once per element local-name the converter had to degrade. */
  onUnsupported?: (localName: string) => void;
}
```

## Behavior guarantees

| Guarantee | Notes |
| --- | --- |
| **Bare LaTeX out** | No delimiters, no trailing whitespace. |
| **Never throws** | Unknown constructs degrade per-node to concatenated text (`m:borderBox`, `m:phant`, unknown `m:fName`, unknown `m:limLow` base, …). A dropped `\frac` bar is recoverable; an exception is not. |
| **Namespace by local name** | Matches `oMath` / `f` / `r` / … regardless of prefix (`m:`, none, or re-prefixed). Real-world producers vary. |
| **Namespace-agnostic attributes** | `m:val` / `val` / re-prefixed attributes resolve by local name. |

## Supported OMML constructs

`m:oMath` / `m:oMathPara` / `<a14:m>` wrappers, and:

- **Runs** — `m:r` / `m:t` with Unicode→LaTeX symbol mapping (see below)
- **Fractions** — `m:f` with `m:fPr` types `bar` (default, `\frac`), `skw` (`^{n}/_{d}`),
  `noBar` (`\genfrac`, binomial), `lin` (`{n}/{d}`)
- **Scripts** — `m:sSub`, `m:sSup`, `m:sSubSup` (and `m:sPre`, degraded)
- **Radicals** — `m:rad` with `m:deg` and `degHide` (`\sqrt`, `\sqrt[n]`)
- **N-ary** — `m:nary` (`\sum`, `\int`, `\prod`, … via `CHR_BO`)
- **Delimiters** — `m:d` with `begChr` / `endChr` / `sepChr` (`\left…\right`)
- **Functions** — `m:func` / `m:fName` (`\sin`, `\cos`, `\log`, `\ln`, …)
- **Accents** — `m:acc` (`\hat`, `\tilde`, `\vec`, … via `CHR`)
- **Bars** — `m:bar` (`\overline` / `\underline`)
- **Limits** — `m:limLow` (`\lim_{…}`), `m:limUpp` (`\overset`)
- **Matrix** — `m:m` / `m:mr` (`\begin{matrix}…\end{matrix}`)
- **Equation array** — `m:eqArr` (`\begin{array}{c}…\end{array}`)
- **Group char** — `m:groupChr` (`\overbrace`, `\underbrace`, …)
- **Box** — `m:box` (passthrough)

## Unicode → LaTeX mapping

Run text is mapped to LaTeX with a two-tier lookup (per Unicode code point, so
astral-plane Mathematical Alphanumeric Symbols are handled correctly):

1. **dwml's symbol table** (`src/latex-dict.ts`) — Mathematical Alphanumeric Symbols
   `U+1D400–U+1D7FF` → ASCII (`𝐴→A`, `𝑥→x`), Greek (`π→\pi`, both plain `U+03B1..` and
   math-italic `U+1D6FC..`), relation/operator symbols (`≤→\leq`, `≥→\geq`, `≠→\ne`,
   `·→\cdot`, `×→\times`, `∞→\infty`, `→→\rightarrow`, …).
2. **Verbatim Unicode** — everything else is kept as-is (`světlo` → `světlo`,
   `€` → `€`). OMML is Unicode-native and math renderers (MathLive, KaTeX,
   unicode-math) accept Unicode identifiers/symbols in math mode, whereas
   text-mode escapes (`\v{e}`, `\ss`, `\textendash`, `\ensuremath{…}`) are invalid
   inside an equation and lossy on the way back to OMML. A literal `\` becomes
   `{\backslash}`.

LaTeX-special characters in runs (`%`, `&`, `_`, `{`, `}`, `#`, `$`, `~`, `^`) are escaped
via dwml's `escape_latex` (`a%` → `a\%`).

`unicodeToLatex()` (the pylatexenc-derived *text-mode* encoder,
`src/uni2latex.generated.ts`) is still exported for consumers that need it, but is
no longer used for run text.

## Examples

| OMML input | LaTeX output |
| --- | --- |
| `\sin(\sqrt[3]{x})^{x^{11}}/_{b}x_{m}^{n}` fixture | `\sin(\sqrt[3]{x})^{x^{11}}/_{b}x_{m}^{n}` |
| group fixture | `A\overbrace{123}\underbrace{456}=\left\{a+b\right)` |
| matrix fixture | `A=\left(\begin{matrix}1&2&3\\4&5&6\end{matrix}\right)\sum_{1}^{20}x` |
| no-bar fraction (binomial) | `\left(x+a\right)^{n}=\sum_{k=0}^{n}\left(\genfrac{}{}{0pt}{}{n}{k}\right)x^{k}a^{n-k}` |

## Project layout

```
src/
  index.ts                 public API (ommlToLatex / ommlNodeToLatex / extractOmmlLatex)
  omml.ts                  the converter (never-throw, namespace-agnostic)
  latex-dict.ts            dwml symbol dictionaries
  latex-encode.ts          pylatexenc-derived unicode->latex encoder
  uni2latex.generated.ts   generated pylatexenc map (do not edit by hand)
tests/
  api.test.ts              consumer contract + dwml reference fidelity
  constructs.test.ts       per-construct coverage
  ground-truth.json        Python dwml reference outputs
reference/                 original Python sources (base + two forks + canonical merge)
scripts/
  gen_uni2latex.py         regenerate the unicode map from pylatexenc
  gen_ground_truth.py      regenerate tests/ground-truth.json from Python dwml
```

## Development

```bash
npm install
npm test          # rstest
npm run build     # rslib -> dist/{index.js,index.d.ts} (ESM only)

# regenerate the unicode map / ground truth (requires Python + pylatexenc)
npm run gen:unicode
npm run gen:groundtruth
```

## Attribution

- Port of [`dwml`](https://github.com/xiilei/dwml) (Apache-2.0), incorporating fixes from
  the [`xavier-bw/dwml`](https://github.com/xavier-bw/dwml) fork (log/ln functions) and
  [`bazingarj/OMML-to-Latex-py`](https://github.com/bazingarj/OMML-to-Latex-py) fork
  (whitespace-tolerant function names). Test fixtures under `reference/tests-base/` are
  Apache-2.0, from the original project.
- The Unicode→LaTeX map is derived from [`pylatexenc`](https://github.com/phfaist/pylatexenc)
  (MIT, © Philippe Faist).

## License

Apache-2.0
