/**
 * EXPORTAR (RA8.6): o CSV para o Excel em português — UTF-8 COM BOM, `;`,
 * CRLF, valor com vírgula decimal e sem "R$", a coluna "Valor (±)" para a
 * SOMA dar o resultado, e o apóstrofo contra fórmula (OWASP). O que sai volta
 * igual pela importação. Quem gera é o domínio (`exportarLancamentos`).
 */

import { useState } from 'react';
import { periodoDaCompetencia, periodoDoAno } from '@dominio/financeiro/datas.ts';
import { exportarLancamentos } from '@dominio/financeiro/exportacao.ts';
import { filtrarLancamentos } from '@dominio/financeiro/filtros.ts';
import { lerCSV } from '@dominio/financeiro/importacao.ts';
import { useDados, useLoja } from '../estado/loja.tsx';
import { baixarArquivo, nomeDoArquivo } from '../util/baixar.ts';
import { nomeDoMes, plural } from '../util/formatar.ts';

const BOM = String.fromCharCode(0xfeff);

export function Exportar() {
  const d = useDados();
  const { mes, avisar } = useLoja();
  const [oQue, setOQue] = useState<'mes' | 'ano'>('mes');
  const [separador, setSeparador] = useState<';' | ','>(';');
  const ano = mes.slice(0, 4);
  const doMes = filtrarLancamentos(d.lancamentos, { periodo: periodoDaCompetencia(mes) });
  const doAno = filtrarLancamentos(d.lancamentos, { periodo: periodoDoAno(`${mes}-01`) });
  const linhas = oQue === 'mes' ? doMes : doAno;

  function gerar(): string {
    const csv = exportarLancamentos(linhas, d);
    if (separador === ';') return csv;
    // CSV padrão: troca o separador e põe o decimal com ponto, para programas fora do Excel em português
    const grade = lerCSV(csv, ';');
    const cel = (c: string) => (/[",\r\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c);
    return `${BOM}${grade.map((l) => l.map((c, i) => cel(i === 4 || i === 5 ? c.replace(',', '.') : c)).join(',')).join('\r\n')}\r\n`;
  }

  function baixar() {
    const nome = oQue === 'mes' ? nomeDoArquivo('lancamentos', mes) : `lancamentos-${ano}.csv`;
    baixarArquivo(nome, gerar());
    avisar(`Baixado: ${nome} (${plural(linhas.length, 'linha', 'linhas')}).`);
  }

  const previa = lerCSV(exportarLancamentos(linhas.slice().sort((a, b) => a.data.localeCompare(b.data)).slice(0, 5), d), ';');

  return (
    <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(320px, 1fr) minmax(0, 2fr)' }}>
      <section className="ad-painel" aria-labelledby="ex-t">
        <h2 id="ex-t">Exportar para o Excel</h2>
        <div className="ad-pilha" role="radiogroup" aria-label="O que exportar">
          <h3 className="ad-h3">O quê</h3>
          <label className="campo__caixa marcar"><input type="radio" name="ex-o" checked={oQue === 'mes'} onChange={() => setOQue('mes')} /><span>{nomeDoMes(mes).replace(/^./, (c) => c.toUpperCase())}, todas as categorias</span><em>{doMes.length}</em></label>
          <label className="campo__caixa marcar"><input type="radio" name="ex-o" checked={oQue === 'ano'} onChange={() => setOQue('ano')} /><span>O ano de {ano} inteiro</span><em>{doAno.length}</em></label>
        </div>
        <label className="campo"><span>Formato</span><span className="campo__caixa"><select value={separador} onChange={(e) => setSeparador(e.target.value as ';' | ',')}><option value=";">CSV para o Excel em português (;)</option><option value=",">CSV padrão (,)</option></select></span></label>
        <p className="campo__ajuda">Acentos certos, valor como número (vírgula decimal, sem "R$") e a coluna "Valor (±)" com a saída negativa, para a SOMA dar o resultado. A planilha filtrada também exporta pelo botão da tela Lançamentos. XLSX fica para a v2 (RA8.7).</p>
        <div className="ad-acoes"><button type="button" className="ad-btn ad-btn--primario ad-btn--grande" onClick={baixar} disabled={!linhas.length}>Baixar o CSV {oQue === 'mes' ? `de ${nomeDoMes(mes)}` : `de ${ano}`}</button></div>
      </section>
      <section className="ad-painel ad-painel--sem-pad" aria-labelledby="ex-p">
        <div className="ad-painel__topo"><h2 id="ex-p">Como o Excel vai abrir ({Math.min(5, linhas.length)} primeiras linhas)</h2></div>
        <div className="lista ad-tabela-rola">
          <table className="ad-tabela">
            <thead><tr>{previa[0]?.slice(0, 9).map((c, i) => <th key={c} scope="col" className={i === 4 || i === 5 ? 'dir' : undefined}>{c}</th>)}</tr></thead>
            <tbody>{previa.slice(1).map((l, k) => <tr key={k}>{l.slice(0, 9).map((c, i) => <td key={i} className={i === 4 || i === 5 ? 'dir' : undefined}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <p className="ad-anotacao" style={{ padding: '12px 16px' }}>O que sai volta igual pela importação. Texto que começa com =, +, − ou @ ganha um apóstrofo, para o Excel não rodar como fórmula.</p>
      </section>
    </div>
  );
}
