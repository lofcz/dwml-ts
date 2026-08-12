/**
 * dwml-ts — MS Office OMML (Office Math Markup Language) -> LaTeX converter.
 *
 * TypeScript port of the Python `dwml` library (Apache-2.0), with 100%
 * output fidelity on the reference fixtures. Pure, synchronous, DOM-free —
 * runs identically in the browser and in Node. Parsing uses txml.
 *
 * Consumer contract:
 *   - ommlToLatex(xml)         -> convert one OMML fragment string to bare LaTeX
 *   - ommlNodeToLatex(node)    -> convert an already-parsed txml node
 *   - extractOmmlLatex(xml)    -> find & convert every m:oMath in any fragment
 *
 * All output is bare LaTeX with no $/$$ delimiters and no trailing whitespace.
 * Unknown constructs degrade per-node to concatenated text (never throws).
 */

// Import the parser-only entry: txml's main entry re-exports the Node
// transform-stream helper, which drags `node:stream` into browser bundles.
import { parse, type TNode } from 'txml/txml';
import {
  ommlNodeToLatex,
  localName,
  type OmmlToLatexOptions,
} from './omml';

export { ommlNodeToLatex, localName, escapeLatex, textContent } from './omml';
export { unicodeToLatex } from './latex-encode';
export type { OmmlToLatexOptions } from './omml';
export type { TNode };

/**
 * Find all element nodes whose local name matches `name`, depth-first.
 */
function findAll(nodes: (TNode | string)[], name: string, acc: TNode[] = []): TNode[] {
  for (const node of nodes) {
    if (typeof node === 'string') continue;
    if (localName(node.tagName) === name) acc.push(node);
    findAll(node.children, name, acc);
  }
  return acc;
}

function elementChildren(node: TNode): TNode[] {
  return node.children.filter((c): c is TNode => typeof c !== 'string');
}

/**
 * Normalize an OMML fragment into the list of oMath nodes to convert.
 *
 * Accepts (prefix-agnostic):
 *   - a bare `<oMath>` element
 *   - an `<oMathPara>` wrapper
 *   - an `<a14:m>` / `m` wrapper (PowerPoint's math container)
 *   - a whole document/fragment containing oMath elements
 */
function collectOMathNodes(nodes: (TNode | string)[]): TNode[] {
  const elements = nodes.filter((n): n is TNode => typeof n !== 'string');

  // Single-root cases.
  if (elements.length === 1) {
    const root = elements[0]!;
    const name = localName(root.tagName);
    if (name === 'oMath') return [root];
    if (name === 'oMathPara' || name === 'm') {
      // unwrap; fall through to a scoped search below.
      const found = findAll(root.children, 'oMath');
      if (found.length > 0) return found;
      // The wrapper itself may contain oMath deeper; already searched.
      return [];
    }
  }

  // General case: search the whole forest.
  return findAll(nodes, 'oMath');
}

/**
 * Convert one OMML fragment to bare LaTeX.
 *
 * Accepts `<m:oMath>`, `<m:oMathPara>` or the `<a14:m>` wrapper as an XML
 * string. Tolerates missing xmlns declarations (fragments sliced out of
 * slide XML). Returns bare LaTeX — no $/$$ delimiters, no trailing
 * whitespace. If the fragment contains multiple oMath elements, their LaTeX
 * is concatenated.
 */
export function ommlToLatex(xml: string, options: OmmlToLatexOptions = {}): string {
  const nodes = parse(xml, { decodeEntities: true });
  const omaths = collectOMathNodes(nodes);
  let out = '';
  for (const omath of omaths) {
    out += ommlNodeToLatex(omath, options);
  }
  return out.trim();
}

/**
 * Find and convert every `oMath` element in any OOXML document or fragment,
 * returning one bare LaTeX string per formula (in document order).
 */
export function extractOmmlLatex(xml: string, options: OmmlToLatexOptions = {}): string[] {
  const nodes = parse(xml, { decodeEntities: true });
  return findAll(nodes, 'oMath').map((omath) => ommlNodeToLatex(omath, options).trim());
}

// Re-export elementChildren for potential node-walking consumers.
export { elementChildren };
