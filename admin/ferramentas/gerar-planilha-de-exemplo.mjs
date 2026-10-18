// Gera e2e/planilha-de-exemplo.xlsx: uma planilha "de dono" para os testes da importação
// (agente AM1). Feita à mão (o .xlsx é um zip de XML), sem biblioteca de escrita de terceiro:
// cabeçalho, datas como número de série com formato de data, entrada e saída em colunas,
// uma categoria nova, uma data que não existe (31/09) e a linha de TOTAL.
// Uso: node ferramentas/gerar-planilha-de-exemplo.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { zipSync, strToU8 } from 'fflate';

const serie = (a, m, d) => (Date.UTC(a, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000;
const linhas = [
  ['Data', 'Histórico', 'Entrada', 'Saída', 'Categoria'],
  [{ d: serie(2026, 10, 1) }, 'Mensal Bruno', 150, null, 'Mensalidades'],
  [{ d: serie(2026, 10, 2) }, 'Kimono A2', 320, null, 'Kimono'],
  [{ d: serie(2026, 10, 5) }, 'Salário Igor', null, 1600, 'Salários'],
  [{ d: serie(2026, 10, 8) }, 'Gasolina viagem', null, 180.5, 'Gasolina viagem'],
  ['31/09/2026', 'Mensal Tati', 405, null, 'Mensalidades'],
  [null, 'TOTAL', 875, 1780.5, null],
];
const col = (i) => String.fromCharCode(65 + i);
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const celula = (v, i, r) => {
  const ref = `${col(i)}${r}`;
  if (v == null) return '';
  if (typeof v === 'number') return `<c r="${ref}"><v>${v}</v></c>`;
  if (typeof v === 'object') return `<c r="${ref}" s="1"><v>${v.d}</v></c>`;
  return `<c r="${ref}" t="inlineStr"><is><t>${esc(v)}</t></is></c>`;
};
const folha = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${linhas.map((l, j) => `<row r="${j + 1}">${l.map((v, i) => celula(v, i, j + 1)).join('')}</row>`).join('')}</sheetData></worksheet>`;
const arquivos = {
  '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
  '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
  'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Outubro" sheetId="1" r:id="rId1"/></sheets></workbook>`,
  'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
  'xl/styles.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs></styleSheet>`,
  'xl/worksheets/sheet1.xml': folha,
};
const zip = zipSync(Object.fromEntries(Object.entries(arquivos).map(([k, v]) => [k, strToU8(v)])));
writeFileSync(fileURLToPath(new URL('../e2e/planilha-de-exemplo.xlsx', import.meta.url)), zip);
console.log('e2e/planilha-de-exemplo.xlsx gerada');
