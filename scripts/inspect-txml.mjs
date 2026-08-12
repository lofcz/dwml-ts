import { parse } from 'txml';

const xml = '<m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><m:acc><m:accPr><m:chr m:val="&#771;"/></m:accPr><m:e><m:r><m:t>a</m:t></m:r></m:e></m:acc><m:r><m:t>1&gt;5</m:t></m:r></m:oMath>';
console.log('default:', JSON.stringify(parse(xml), null, 1));
console.log('decodeEntities:', JSON.stringify(parse(xml, { decodeEntities: true }), null, 1));
