import { describe, it, expect } from '@rstest/core';
import { ommlToLatex } from '../src/index';

const M = 'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"';
const wrap = (inner: string) => `<m:oMath ${M}>${inner}</m:oMath>`;
const r = (t: string) => `<m:r><m:t>${t}</m:t></m:r>`;

describe('OMML construct coverage', () => {
  it('m:f fraction (bar default)', () => {
    const xml = wrap(`<m:f><m:num>${r('a')}</m:num><m:den>${r('b')}</m:den></m:f>`);
    expect(ommlToLatex(xml)).toBe('\\frac{a}{b}');
  });

  it('m:f fraction type=noBar', () => {
    const xml = wrap(
      `<m:f><m:fPr><m:type m:val="noBar"/></m:fPr><m:num>${r('n')}</m:num><m:den>${r('k')}</m:den></m:f>`,
    );
    expect(ommlToLatex(xml)).toBe('\\genfrac{}{}{0pt}{}{n}{k}');
  });

  it('m:f fraction type=skw', () => {
    const xml = wrap(
      `<m:f><m:fPr><m:type m:val="skw"/></m:fPr><m:num>${r('a')}</m:num><m:den>${r('b')}</m:den></m:f>`,
    );
    expect(ommlToLatex(xml)).toBe('^{a}/_{b}');
  });

  it('m:f fraction type=lin', () => {
    const xml = wrap(
      `<m:f><m:fPr><m:type m:val="lin"/></m:fPr><m:num>${r('a')}</m:num><m:den>${r('b')}</m:den></m:f>`,
    );
    expect(ommlToLatex(xml)).toBe('{a}/{b}');
  });

  it('m:sSup superscript', () => {
    const xml = wrap(`<m:sSup><m:e>${r('x')}</m:e><m:sup>${r('2')}</m:sup></m:sSup>`);
    expect(ommlToLatex(xml)).toBe('x^{2}');
  });

  it('m:sSub subscript', () => {
    const xml = wrap(`<m:sSub><m:e>${r('x')}</m:e><m:sub>${r('i')}</m:sub></m:sSub>`);
    expect(ommlToLatex(xml)).toBe('x_{i}');
  });

  it('m:sSubSup sub+superscript', () => {
    const xml = wrap(
      `<m:sSubSup><m:e>${r('x')}</m:e><m:sub>${r('i')}</m:sub><m:sup>${r('2')}</m:sup></m:sSubSup>`,
    );
    expect(ommlToLatex(xml)).toBe('x_{i}^{2}');
  });

  it('m:sPre pre-sub-superscript renders prescripts left of base', () => {
    const xml = wrap(
      `<m:sPre><m:e>${r('C')}</m:e><m:sub>${r('6')}</m:sub><m:sup>${r('14')}</m:sup></m:sPre>`,
    );
    expect(ommlToLatex(xml)).toBe('{}_{6}^{14}{C}');
  });

  it('m:rad radical with deg', () => {
    const xml = wrap(`<m:rad><m:deg>${r('3')}</m:deg><m:e>${r('x')}</m:e></m:rad>`);
    expect(ommlToLatex(xml)).toBe('\\sqrt[3]{x}');
  });

  it('m:rad radical with degHide', () => {
    const xml = wrap(
      `<m:rad><m:radPr><m:degHide m:val="1"/></m:radPr><m:deg/><m:e>${r('5')}</m:e></m:rad>`,
    );
    expect(ommlToLatex(xml)).toBe('\\sqrt{5}');
  });

  it('m:nary n-ary sum with limits', () => {
    const xml = wrap(
      `<m:nary><m:naryPr><m:chr m:val="∑"/></m:naryPr><m:sub>${r('i=1')}</m:sub><m:sup>${r('n')}</m:sup><m:e>${r('x')}</m:e></m:nary>`,
    );
    expect(ommlToLatex(xml)).toBe('\\sum_{i=1}^{n}x');
  });

  it('m:d delimiter with default parens', () => {
    const xml = wrap(`<m:d><m:e>${r('a+b')}</m:e></m:d>`);
    expect(ommlToLatex(xml)).toBe('\\left(a+b\\right)');
  });

  it('m:d delimiter with begChr/endChr', () => {
    const xml = wrap(
      `<m:d><m:dPr><m:begChr m:val="["/><m:endChr m:val="]"/></m:dPr><m:e>${r('x')}</m:e></m:d>`,
    );
    expect(ommlToLatex(xml)).toBe('\\left[x\\right]');
  });

  it('m:func function-apply', () => {
    const xml = wrap(
      `<m:func><m:fName>${r('sin')}</m:fName><m:e>${r('x')}</m:e></m:func>`,
    );
    expect(ommlToLatex(xml)).toBe('\\sin(x)');
  });

  it('m:func log (xavier fork addition)', () => {
    const xml = wrap(
      `<m:func><m:fName>${r('log')}</m:fName><m:e>${r('x')}</m:e></m:func>`,
    );
    expect(ommlToLatex(xml)).toBe('\\log{x}');
  });

  it('m:acc accent (tilde)', () => {
    const xml = wrap(
      `<m:acc><m:accPr><m:chr m:val="̃"/></m:accPr><m:e>${r('a')}</m:e></m:acc>`,
    );
    expect(ommlToLatex(xml)).toBe('\\tilde{a}');
  });

  it('m:acc default accent is hat', () => {
    const xml = wrap(`<m:acc><m:accPr></m:accPr><m:e>${r('a')}</m:e></m:acc>`);
    expect(ommlToLatex(xml)).toBe('\\hat{a}');
  });

  it('m:bar overline (top)', () => {
    const xml = wrap(
      `<m:bar><m:barPr><m:pos m:val="top"/></m:barPr><m:e>${r('AB')}</m:e></m:bar>`,
    );
    expect(ommlToLatex(xml)).toBe('\\overline{AB}');
  });

  it('m:bar underline (bot)', () => {
    const xml = wrap(
      `<m:bar><m:barPr><m:pos m:val="bot"/></m:barPr><m:e>${r('c')}</m:e></m:bar>`,
    );
    expect(ommlToLatex(xml)).toBe('\\underline{c}');
  });

  it('m:limLow lower limit', () => {
    const xml = wrap(
      `<m:limLow><m:e>${r('lim')}</m:e><m:lim>${r('n→∞')}</m:lim></m:limLow>`,
    );
    expect(ommlToLatex(xml)).toBe('\\lim_{n\\to \\infty }');
  });

  it('m:limUpp upper limit', () => {
    const xml = wrap(
      `<m:limUpp><m:e>${r('=')}</m:e><m:lim>${r('def')}</m:lim></m:limUpp>`,
    );
    expect(ommlToLatex(xml)).toBe('\\overset{def}{=}');
  });

  it('m:m matrix', () => {
    const xml = wrap(
      `<m:m><m:mr><m:e>${r('1')}</m:e><m:e>${r('2')}</m:e></m:mr><m:mr><m:e>${r('3')}</m:e><m:e>${r('4')}</m:e></m:mr></m:m>`,
    );
    expect(ommlToLatex(xml)).toBe('\\begin{matrix}1&2\\\\3&4\\end{matrix}');
  });

  it('m:eqArr equation array', () => {
    const xml = wrap(`<m:eqArr><m:e>${r('a=b')}</m:e><m:e>${r('c=d')}</m:e></m:eqArr>`);
    expect(ommlToLatex(xml)).toBe('\\begin{array}{c}a=b\\\\c=d\\end{array}');
  });

  it('m:groupChr overbrace', () => {
    const xml = wrap(
      `<m:groupChr><m:groupChrPr><m:chr m:val="⏞"/></m:groupChrPr><m:e>${r('123')}</m:e></m:groupChr>`,
    );
    expect(ommlToLatex(xml)).toBe('\\overbrace{123}');
  });

  it('m:box passthrough', () => {
    const xml = wrap(`<m:box><m:e>${r('x')}</m:e></m:box>`);
    expect(ommlToLatex(xml)).toBe('x');
  });

  it('m:borderBox renders a \\boxed border', () => {
    const xml = wrap(`<m:borderBox><m:e>${r('x')}</m:e></m:borderBox>`);
    expect(ommlToLatex(xml)).toBe('\\boxed{x}');
  });

  it('m:phant hides the base (show=off) via \\phantom', () => {
    const xml = wrap(
      `<m:phant><m:phantPr><m:show m:val="off"/></m:phantPr><m:e>${r('x')}</m:e></m:phant>`,
    );
    expect(ommlToLatex(xml)).toBe('\\phantom{x}');
  });

  it('m:phant default (show omitted) renders the base visibly', () => {
    const xml = wrap(`<m:phant><m:e>${r('x')}</m:e></m:phant>`);
    expect(ommlToLatex(xml)).toBe('x');
  });

  it('m:d multi-base delimiter joins with default sepChr |', () => {
    const xml = wrap(`<m:d><m:e>${r('a')}</m:e><m:e>${r('b')}</m:e><m:e>${r('c')}</m:e></m:d>`);
    expect(ommlToLatex(xml)).toBe('\\left(a|b|c\\right)');
  });

  it('m:d multi-base delimiter honors a custom sepChr', () => {
    const xml = wrap(
      `<m:d><m:dPr><m:sepChr m:val=";"/></m:dPr><m:e>${r('a')}</m:e><m:e>${r('b')}</m:e></m:d>`,
    );
    expect(ommlToLatex(xml)).toBe('\\left(a;b\\right)');
  });

  it('m:f smallFrac renders inline/text style fraction', () => {
    const xml = wrap(
      `<m:f><m:fPr><m:smallFrac m:val="on"/></m:fPr><m:num>${r('a')}</m:num><m:den>${r('b')}</m:den></m:f>`,
    );
    expect(ommlToLatex(xml)).toBe('\\tfrac{a}{b}');
  });

  it('m:nary limLoc=undOvr places limits above/below the operator', () => {
    const xml = wrap(
      `<m:nary><m:naryPr><m:chr m:val="∑"/><m:naryLim m:val="undOvr"/></m:naryPr>` +
        `<m:sub>${r('i=1')}</m:sub><m:sup>${r('n')}</m:sup><m:e>${r('x')}</m:e></m:nary>`,
    );
    expect(ommlToLatex(xml)).toBe('\\sum\\limits_{i=1}^{n}x');
  });

  it('m:nary default (subSup) keeps side-placed limits', () => {
    const xml = wrap(
      `<m:nary><m:naryPr><m:chr m:val="∑"/><m:naryLim m:val="subSup"/></m:naryPr>` +
        `<m:sub>${r('i=1')}</m:sub><m:sup>${r('n')}</m:sup><m:e>${r('x')}</m:e></m:nary>`,
    );
    expect(ommlToLatex(xml)).toBe('\\sum_{i=1}^{n}x');
  });

  it('m:m matrix column justification mcJc=left', () => {
    const xml = wrap(
      `<m:m><m:mPr><m:mcs><m:mc><m:mcPr><m:mcJc m:val="left"/><m:count m:val="2"/></m:mcPr></m:mc></m:mcs></m:mPr>` +
        `<m:mr><m:e>${r('1')}</m:e><m:e>${r('2')}</m:e></m:mr><m:mr><m:e>${r('3')}</m:e><m:e>${r('4')}</m:e></m:mr></m:m>`,
    );
    expect(ommlToLatex(xml)).toBe('\\begin{array}{l}1&2\\\\3&4\\end{array}');
  });

  it('m:m matrix without justification stays centered', () => {
    const xml = wrap(
      `<m:m><m:mr><m:e>${r('1')}</m:e><m:e>${r('2')}</m:e></m:mr></m:m>`,
    );
    expect(ommlToLatex(xml)).toBe('\\begin{matrix}1&2\\end{matrix}');
  });
});
