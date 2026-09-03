import { describe, it, expect } from '@rstest/core';
import {
  ommlToLatex,
  extractOmmlLatex,
  ommlNodeToLatex,
  escapeLatex,
  unicodeToMathLatex,
} from '../src/index';
import { readFixture } from './fixtures';

// Expected outputs, ported verbatim from reference/tests-base/test_load.py
// (dwml's own committed test expectations). These use the parser-default
// whitespace handling that drops pure-whitespace text nodes.

describe('dwml reference fidelity (test_load.py)', () => {
  it('simple.xml', () => {
    const results = extractOmmlLatex(readFixture('simple.xml'));
    expect(results).toEqual([
      '\\sin(\\sqrt[3]{x})^{x^{11}}/_{b}x_{m}^{n}',
      '\\tilde{a}\\begin{array}{c}a=b+c\\\\d+e=f\\end{array}\\\\\\underline{cdef}',
    ]);
  });

  it('group.xml', () => {
    const results = extractOmmlLatex(readFixture('group.xml'));
    expect(results).toEqual([
      'A\\overbrace{123}\\underbrace{456}=\\left\\{a+b\\right)',
    ]);
  });

  it('m.xml', () => {
    const results = extractOmmlLatex(readFixture('m.xml'));
    expect(results).toEqual([
      'A=\\left(\\begin{matrix}1&2&3\\\\4&5&6\\end{matrix}\\right)\\sum_{1}^{20}x',
    ]);
  });

  it('d.xml', () => {
    const results = extractOmmlLatex(readFixture('d.xml'));
    expect(results).toEqual([
      '\\left\\{\\begin{array}{c}m+1\\leq 2m-1\\\\m+1>5\\end{array}\\right.',
    ]);
  });

  it('d-np.xml', () => {
    const results = extractOmmlLatex(readFixture('d-np.xml'));
    expect(results).toEqual([
      '\\left(\\begin{array}{c}m+1\\leq 2m-1\\\\m+1>5\\end{array}\\right]',
    ]);
  });

  it('nobar.xml', () => {
    const results = extractOmmlLatex(readFixture('nobar.xml'));
    expect(results).toEqual([
      '\\left(x+a\\right)^{n}=\\sum_{k=0}^{n}\\left(\\genfrac{}{}{0pt}{}{n}{k}\\right)x^{k}a^{n-k}',
    ]);
  });

  it('lim.xml', () => {
    const results = extractOmmlLatex(readFixture('lim.xml'));
    // U+2212 (minus) is normalized to ASCII '-' in the clean mapping.
    expect(results).toEqual([
      'A=log_{x}y\\max_{0\\leq x\\leq 1}xe^{-x^{2}}\\lim_{1\\to \\infty }a\\overset{def}{=}x',
    ]);
  });
});

describe('escape_latex', () => {
  it('matches dwml test_escape', () => {
    // reference: omml.escape_latex(r'\\\\\\') == '\\\\\\'
    // Python collapses each '\\\\' -> '\\', so 6 input backslashes -> 3.
    expect(escapeLatex('\\\\\\\\\\\\')).toBe('\\\\\\');
  });

  it('escapes unescaped special chars', () => {
    expect(escapeLatex('a_b')).toBe('a\\_b');
    expect(escapeLatex('100%')).toBe('100\\%');
  });
});

describe('ommlToLatex', () => {
  it('converts a bare oMath fragment without xmlns', () => {
    const xml = '<m:oMath><m:r><m:t>x+1</m:t></m:r></m:oMath>';
    expect(ommlToLatex(xml)).toBe('x+1');
  });

  it('accepts no-namespace fragments', () => {
    const xml = '<oMath><r><t>y</t></r></oMath>';
    expect(ommlToLatex(xml)).toBe('y');
  });

  it('unwraps oMathPara', () => {
    const xml =
      '<m:oMathPara xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">' +
      '<m:oMath><m:r><m:t>z</m:t></m:r></m:oMath></m:oMathPara>';
    expect(ommlToLatex(xml)).toBe('z');
  });

  it('unwraps the a14:m wrapper', () => {
    const xml =
      '<a14:m xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main">' +
      '<m:oMath><m:r><m:t>w</m:t></m:r></m:oMath></a14:m>';
    expect(ommlToLatex(xml)).toBe('w');
  });

  it('returns bare latex with no trailing whitespace', () => {
    const xml = '<m:oMath><m:r><m:t>  x  </m:t></m:r></m:oMath>';
    const out = ommlToLatex(xml);
    expect(out).toBe(out.trim());
    expect(out).not.toMatch(/\s$/);
  });
});

describe('never-throw degradation', () => {
  it('degrades unknown elements to text content', () => {
    const xml = '<m:oMath><m:r><m:t>a</m:t></m:r><m:weird><m:r><m:t>b</m:t></m:r></m:weird></m:oMath>';
    expect(ommlToLatex(xml)).toContain('ab');
  });

  it('degrades unknown function names instead of throwing', () => {
    const xml =
      '<m:oMath><m:func><m:fName><m:r><m:t>frobnicate</m:t></m:r></m:fName>' +
      '<m:e><m:r><m:t>x</m:t></m:r></m:e></m:func></m:oMath>';
    expect(() => ommlToLatex(xml)).not.toThrow();
  });

  it('reports unsupported constructs via onUnsupported', () => {
    const seen: string[] = [];
    const xml = '<m:oMath><m:r><m:t>a</m:t></m:r><m:bogus><m:r><m:t>b</m:t></m:r></m:bogus></m:oMath>';
    ommlToLatex(xml, { onUnsupported: (n) => seen.push(n) });
    expect(seen).toContain('bogus');
  });
});

describe('ommlNodeToLatex', () => {
  it('converts an already-parsed node', async () => {
    const { parse } = await import('txml');
    const nodes = parse('<m:oMath><m:r><m:t>x</m:t></m:r></m:oMath>');
    const omath = nodes.find((n): n is import('txml').TNode => typeof n !== 'string')!;
    expect(ommlNodeToLatex(omath)).toBe('x');
  });

  it('unwraps oMathPara display fractions instead of concatenating digits', async () => {
    const { parse } = await import('txml');
    const xml =
      '<m:oMathPara>' +
      '<m:oMathParaPr><m:jc m:val="centerGroup"/></m:oMathParaPr>' +
      '<m:oMath><m:f><m:fPr><m:type m:val="bar"/></m:fPr>' +
      '<m:num><m:r><m:t>3</m:t></m:r></m:num>' +
      '<m:den><m:r><m:t>8</m:t></m:r></m:den>' +
      '</m:f></m:oMath></m:oMathPara>';
    const node = parse(xml).find((n): n is import('txml').TNode => typeof n !== 'string')!;
    expect(ommlNodeToLatex(node)).toBe('\\frac{3}{8}');
  });

  it('decodes XML entities in m:t when the caller did not ask txml to', async () => {
    const { parse } = await import('txml');
    const xml =
      '<m:oMath>' +
      '<m:f><m:fPr><m:type m:val="bar"/></m:fPr>' +
      '<m:num><m:r><m:t>3</m:t></m:r></m:num>' +
      '<m:den><m:r><m:t>8</m:t></m:r></m:den></m:f>' +
      '<m:r><m:t>&lt;</m:t></m:r>' +
      '<m:f><m:fPr><m:type m:val="bar"/></m:fPr>' +
      '<m:num><m:r><m:t>5</m:t></m:r></m:num>' +
      '<m:den><m:r><m:t>8</m:t></m:r></m:den></m:f>' +
      '</m:oMath>';
    const node = parse(xml, { keepWhitespace: true }).find(
      (n): n is import('txml').TNode => typeof n !== 'string'
    )!;
    expect(ommlNodeToLatex(node)).toBe('\\frac{3}{8}<\\frac{5}{8}');
  });
});

describe('unicode mapping', () => {
  it('maps math symbols in runs', () => {
    expect(ommlToLatex('<m:oMath><m:r><m:t>≤</m:t></m:r></m:oMath>')).toBe('\\leq');
    expect(ommlToLatex('<m:oMath><m:r><m:t>π</m:t></m:r></m:oMath>')).toBe('\\pi');
    expect(ommlToLatex('<m:oMath><m:r><m:t>·</m:t></m:r></m:oMath>')).toBe('\\cdot');
  });

  it('maps Mathematical Alphanumeric Symbols to ASCII', () => {
    expect(ommlToLatex('<m:oMath><m:r><m:t>𝐴</m:t></m:r></m:oMath>')).toBe('A');
    expect(ommlToLatex('<m:oMath><m:r><m:t>𝑥</m:t></m:r></m:oMath>')).toBe('x');
  });

  it('escapes latex-special chars in runs', () => {
    expect(ommlToLatex('<m:oMath><m:r><m:t>a%</m:t></m:r></m:oMath>')).toBe('a\\%');
  });

  it('keeps accented letters verbatim instead of emitting text-mode accents', () => {
    // `\v{e}` / `\'e` / `\ss` are text-mode macros: invalid inside an equation
    // and lossy on the way back to OMML. Unicode letters are valid math-mode
    // identifiers for every downstream renderer.
    const run = (t: string) => ommlToLatex(`<m:oMath><m:r><m:t>${t}</m:t></m:r></m:oMath>`);
    expect(run('světlo')).toBe('světlo');
    expect(run('Größe')).toBe('Größe');
    expect(run('naïve café')).toBe('naïve café');
    expect(run('ø æ ß Ł đ')).toBe('ø æ ß Ł đ');
  });

  it('keeps non-ASCII symbols outside the T table verbatim', () => {
    const run = (t: string) => ommlToLatex(`<m:oMath><m:r><m:t>${t}</m:t></m:r></m:oMath>`);
    expect(run('a – b — c')).toBe('a – b — c');
    expect(run('5 €')).toBe('5 €');
    expect(run('ℓ')).toBe('ℓ');
    expect(run('"x"')).toBe('"x"');
    expect(run('A•B')).toBe('A\\bullet B');
  });

  it('emits \\backslash for a literal backslash in run text', () => {
    expect(ommlToLatex('<m:oMath><m:r><m:t>a\\b</m:t></m:r></m:oMath>')).toBe('a{\\backslash}b');
  });

  it('keeps the limit text of a labelled arrow renderable', () => {
    const xml =
      '<m:oMath><m:limUpp><m:e><m:r><m:t>→</m:t></m:r></m:e>' +
      '<m:lim><m:r><m:t>světlo,chlorofyl</m:t></m:r></m:lim></m:limUpp></m:oMath>';
    expect(ommlToLatex(xml)).toBe('\\overset{světlo,chlorofyl}{\\rightarrow }');
  });
});

describe('unicodeToMathLatex', () => {
  it('is the identity for everything but the backslash', () => {
    expect(unicodeToMathLatex('světlo ∀x ≤ 5 €')).toBe('světlo ∀x ≤ 5 €');
    expect(unicodeToMathLatex('a\\b')).toBe('a{\\backslash}b');
  });

  it('normalizes to NFC', () => {
    expect(unicodeToMathLatex('e\u030C')).toBe('ě');
  });
});
