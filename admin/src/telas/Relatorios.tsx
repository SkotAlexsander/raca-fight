/**
 * RELATÓRIOS (RA7): onde está o dinheiro. Uma cor para o destaque e o resto
 * em cinza, com a tabela ao lado. Toda conta é do domínio (`totaisDoPeriodo`,
 * `somarPor`, `quantoEntrouPorModalidade`, `evolucaoDoAno`,
 * `resultadoPorEvento`, `listarInadimplentes`, `calcularRemuneracaoDoMes`).
 */

import { useMemo, useState } from 'react';
import { listarInadimplentes, taxaDeInadimplencia } from '@dominio/financeiro/cobrancas.ts';
import { dataNaCompetencia, formatarDataBR, nomeDaCompetencia, periodoDaCompetencia, periodoDoAno, periodoDoTrimestre, somarMeses } from '@dominio/financeiro/datas.ts';
import { gerarCSV, type CelulaCSV } from '@dominio/financeiro/exportacao.ts';
import { mesFechado } from '@dominio/financeiro/fechamento.ts';
import { ROTULO_DA_FORMA } from '@dominio/financeiro/nomes.ts';
import { evolucaoDoAno, quantoEntrouPorModalidade, resultadoPorEvento, somarPor, totaisDoPeriodo } from '@dominio/financeiro/totais.ts';
import type { FormaDePagamento, Periodo } from '@dominio/financeiro/tipos.ts';
import { GavetaLembrete } from '../componentes/anotar.tsx';
import { Icone, Selo, Vazio } from '../componentes/basicos.tsx';
import { BarraHorizontal, Barras } from '../componentes/graficos.tsx';
import { useDados, useLoja } from '../estado/loja.tsx';
import { href } from '../estado/rota.ts';
import { baixarArquivo } from '../util/baixar.ts';
import { mesTitulo, nomeDoMes, plural, reais, reaisComSinal } from '../util/formatar.ts';
import { linkDoWhatsapp, mensagemDeCobranca, numeroDoWhatsapp } from '../util/whatsapp.ts';
import { remuneracaoOuNada, textoDaRemuneracao } from './Funcionarios.tsx';

const ABAS: [string, string][] = [['mes', 'Mês'], ['ano', 'Ano'], ['categoria', 'Por categoria'], ['modalidade', 'Por modalidade'], ['forma', 'Por forma'], ['professor', 'Por professor'], ['evento', 'Por evento'], ['inadimplencia', 'Inadimplência']];
type QualPeriodo = 'mes' | 'trimestre' | 'ano';

const pct = (a: number, total: number) => (total ? `${Math.round((a * 100) / total)} %` : '—');

export function Relatorios({ aba = 'modalidade' }: { aba?: string }) {
  return (
    <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(0, 1fr)' }}>
      <div className="ad-coluna">
        <div className="ad-abas" aria-label="Relatórios">
          {ABAS.map(([id, rot]) => <a key={id} href={href('relatorios', id)} aria-current={aba === id ? 'page' : undefined}>{rot}</a>)}
          <a href={href('funil')}>Funil</a>
        </div>
        {aba === 'ano' ? <Ano /> : aba === 'mes' ? <Mes /> : aba === 'inadimplencia' ? <Inadimplencia /> : aba === 'professor' ? <Professores sozinho /> : aba === 'evento' ? <Eventos sozinho /> : <PorChave chave={aba === 'categoria' ? 'categoria' : aba === 'forma' ? 'forma' : 'modalidade'} />}
      </div>
    </div>
  );
}

function usePeriodo(inicial: QualPeriodo = 'trimestre'): [QualPeriodo, (p: QualPeriodo) => void, Periodo, string] {
  const { mes, hoje } = useLoja();
  const [qual, setQual] = useState<QualPeriodo>(inicial);
  const base = hoje.startsWith(mes) ? hoje : `${mes}-15`;
  const p = qual === 'mes' ? periodoDaCompetencia(mes) : qual === 'ano' ? periodoDoAno(base) : periodoDoTrimestre(base);
  const tri = Math.floor((Number(p.de.slice(5, 7)) - 1) / 3) + 1;
  const nome = qual === 'mes' ? nomeDoMes(mes) : qual === 'ano' ? p.de.slice(0, 4) : `${tri}º trimestre (${nomeDaCompetencia(p.de.slice(0, 7)).slice(0, 3)} a ${nomeDaCompetencia(p.ate.slice(0, 7)).slice(0, 3)})`;
  return [qual, setQual, p, nome];
}

function SeletorDePeriodo({ qual, setQual }: { qual: QualPeriodo; setQual: (p: QualPeriodo) => void }) {
  return (
    <span className="campo__caixa"><select aria-label="Período" value={qual} onChange={(e) => setQual(e.target.value as QualPeriodo)}><option value="mes">Este mês</option><option value="trimestre">Este trimestre</option><option value="ano">Este ano</option></select></span>
  );
}

function exportarTabela(nome: string, cab: string[], linhas: CelulaCSV[][]) {
  baixarArquivo(`${nome}.csv`, gerarCSV(cab, linhas));
}

function PorChave({ chave }: { chave: 'modalidade' | 'categoria' | 'forma' }) {
  const d = useDados();
  const { avisar } = useLoja();
  const [qual, setQual, periodo, nomeDoPeriodo] = usePeriodo();
  const linhas = useMemo(() => {
    if (chave === 'modalidade') {
      const m = quantoEntrouPorModalidade(d.lancamentos, periodo);
      const semMod = totaisDoPeriodo(d.lancamentos.filter((l) => l.tipo === 'entrada' && !(l.reparticao ?? []).length), periodo).entradas;
      return [...d.modalidades.map((x) => ({ id: x.id, nome: x.nome, valor: m.get(x.id) ?? 0, saidas: 0 })), { id: 'sem', nome: 'Sem modalidade', valor: semMod, saidas: 0 }].sort((a, b) => b.valor - a.valor);
    }
    const mapa = somarPor(d.lancamentos, periodo, chave === 'categoria' ? (l) => l.categoriaId ?? 'sem_categoria' : (l) => l.formaDePagamento ?? 'sem_forma');
    return [...mapa.entries()].map(([id, v]) => ({
      id, nome: chave === 'categoria' ? d.categorias.find((c) => c.id === id)?.nome ?? 'Sem categoria' : ROTULO_DA_FORMA[id as FormaDePagamento] ?? 'Sem forma',
      valor: v.entradas, saidas: v.saidas,
    })).sort((a, b) => (b.valor + (b.saidas ?? 0)) - (a.valor + (a.saidas ?? 0)));
  }, [d, periodo, chave]);
  const total = linhas.reduce((s, x) => s + x.valor, 0);
  const max = Math.max(1, ...linhas.map((x) => Math.max(x.valor, x.saidas)));
  const primeiro = linhas[0];
  // o MESMO trecho do período anterior (como no painel, achado do AR): até hoje contra até o mesmo dia
  const { hoje } = useLoja();
  const anterior = useMemo(() => {
    if (chave !== 'modalidade') return null;
    const n = qual === 'mes' ? 1 : qual === 'trimestre' ? 3 : 12;
    const ate = periodo.ate < hoje ? periodo.ate : hoje;
    const voltar = (iso: string, fimDoMes: boolean) => dataNaCompetencia(somarMeses(iso.slice(0, 7), -n), fimDoMes ? 31 : Number(iso.slice(8)));
    const fimDoMes = ate === dataNaCompetencia(ate.slice(0, 7), 31);
    return quantoEntrouPorModalidade(d.lancamentos, { de: voltar(periodo.de, false), ate: voltar(ate, fimDoMes) });
  }, [d, periodo, chave, qual, hoje]);
  const matriculados = (id: string) => d.matriculas.filter((m) => m.estado === 'ativa' && d.planos.find((p) => p.id === m.planoId)?.modalidadeIds.includes(id)).length;
  const titulo = chave === 'modalidade' ? 'Quanto entrou por modalidade' : chave === 'categoria' ? 'Por categoria' : 'Por forma de pagamento';

  function exportar() {
    exportarTabela(`relatorio-${chave}`, [chave === 'modalidade' ? 'Modalidade' : chave === 'categoria' ? 'Categoria' : 'Forma', 'Entrou', 'Saiu'], linhas.map((x) => [x.nome, { centavos: x.valor }, { centavos: x.saidas }]));
    avisar('Relatório exportado em CSV.');
  }

  return (
    <>
      <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(0, 1.2fr) minmax(0, 1fr)', height: 'auto' }}>
        <section className="ad-painel" aria-labelledby="rl-mod">
          <div className="ad-painel__topo"><h2 id="rl-mod">{titulo} · {nomeDoPeriodo}</h2><div className="ad-acoes"><SeletorDePeriodo qual={qual} setQual={setQual} /><button type="button" className="ad-btn" onClick={exportar}>Exportar CSV</button></div></div>
          {primeiro && primeiro.valor > 0 ? (
            <p className="t16">Entrou <b>{reais(primeiro.valor)} de {primeiro.nome}</b> no período: {pct(primeiro.valor, total)} do total. {chave === 'modalidade' ? 'O combo conta a parte de cada modalidade.' : ''}</p>
          ) : <p className="t16">Nada entrou neste período.</p>}
          <div className="ad-pilha">
            {linhas.map((x, i) => <BarraHorizontal key={x.id} rotulo={x.nome} valor={x.valor || (x.saidas)} maximo={max} destaque={i === 0} texto={x.valor || !x.saidas ? reais(x.valor) : `−${reais(x.saidas)}`} />)}
          </div>
        </section>
        <section className="ad-painel ad-painel--sem-pad" aria-labelledby="rl-tab">
          <div className="ad-painel__topo"><h2 id="rl-tab">Em números</h2></div>
          <div className="lista ad-tabela-rola">
            <table className="ad-tabela">
              <thead><tr><th scope="col">{chave === 'modalidade' ? 'Modalidade' : chave === 'categoria' ? 'Categoria' : 'Forma'}</th><th scope="col" className="dir">Entrou</th>{chave !== 'modalidade' && <th scope="col" className="dir">Saiu</th>}<th scope="col" className="dir">Do total</th>{chave === 'modalidade' && <><th scope="col" className="dir">Matriculados</th><th scope="col" className="dir">Por aluno</th><th scope="col" className="dir">vs mesmo trecho anterior</th></>}</tr></thead>
              <tbody>
                {linhas.map((x) => {
                  const ant = anterior?.get(x.id) ?? 0;
                  const n = x.id === 'sem' ? 0 : matriculados(x.id);
                  const v = ant ? Math.round(((x.valor - ant) * 100) / ant) : null;
                  return (
                    <tr key={x.id}>
                      <td><b>{x.nome}</b></td>
                      <td className="dir">{reais(x.valor)}</td>
                      {chave !== 'modalidade' && <td className="dir">{x.saidas ? reais(-x.saidas) : '—'}</td>}
                      <td className="dir">{pct(x.valor, total)}</td>
                      {chave === 'modalidade' && <><td className="dir">{n || '—'}</td><td className="dir">{n ? reais(Math.round(x.valor / n)) : '—'}</td><td className={`dir ${v == null ? '' : v >= 0 ? 'pos' : 'neg'}`}>{v == null ? '—' : `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)} %`}</td></>}
                    </tr>
                  );
                })}
              </tbody>
              {/* a coluna "Saiu" também soma: antes o "100 %" caía embaixo dela (AO) */}
              <tfoot className="folha-moldura"><tr><td>Total</td><td className="dir"><b>{reais(total)}</b></td>{chave !== 'modalidade' && <td className="dir"><b>{reais(-linhas.reduce((s, x) => s + x.saidas, 0))}</b></td>}<td className="dir">100 %</td>{chave === 'modalidade' && <td colSpan={3} />}</tr></tfoot>
            </table>
          </div>
        </section>
      </div>
      {chave === 'modalidade' && (
        <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(0, 1fr) minmax(0, 1fr)', height: 'auto' }}>
          <Professores />
          <Eventos />
        </div>
      )}
    </>
  );
}

function Professores({ sozinho = false }: { sozinho?: boolean }) {
  const d = useDados();
  const { mes, hoje } = useLoja();
  const profs = d.funcionarios.filter((f) => f.funcao === 'professor' && (!f.ate || f.ate >= hoje));
  const nome = (id: string) => d.pessoas.find((p) => p.id === id)?.nome ?? '';
  const mod = (ids: string[]) => ids.map((id) => d.modalidades.find((m) => m.id === id)?.nome).filter(Boolean).join(' e ');
  const corpo = (
    <section className="ad-painel ad-painel--sem-pad" aria-labelledby="rl-prof">
      <div className="ad-painel__topo"><h2 id="rl-prof">Por professor · {nomeDoMes(mes)}</h2></div>
      <div className="lista ad-tabela-rola">
        <table className="ad-tabela">
          <thead><tr><th scope="col">Professor</th><th scope="col">Tipo</th><th scope="col" className="dir">Base</th><th scope="col" className="dir">A pagar</th></tr></thead>
          <tbody>
            {profs.map((f) => {
              const r = remuneracaoOuNada(f, d.lancamentos, mes);
              return (
                <tr key={f.id}>
                  <td><b>{nome(f.pessoaId)}</b></td>
                  <td>{textoDaRemuneracao(f)}{f.modalidadeIds.length ? ` · ${mod(f.modalidadeIds)}` : ''}</td>
                  <td className="dir">{r ? (r.baseDaComissaoCentavos ? reais(r.baseDaComissaoCentavos) : '—') : 'falta o nº de aulas'}</td>
                  <td className="dir">{r ? reais(r.totalCentavos) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
  return sozinho ? <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(0, 1fr)', height: 'auto' }}>{corpo}</div> : corpo;
}

function Eventos({ sozinho = false }: { sozinho?: boolean }) {
  const d = useDados();
  const { hoje } = useLoja();
  const r = resultadoPorEvento(d.lancamentos);
  const lista = d.eventos.filter((e) => !e.arquivado).sort((a, b) => a.data.localeCompare(b.data));
  const corpo = (
    <section className="ad-painel ad-painel--sem-pad" aria-labelledby="rl-ev">
      <div className="ad-painel__topo"><h2 id="rl-ev">Por evento · {hoje.slice(0, 4)}</h2></div>
      {!lista.length ? <Vazio titulo="Nenhum evento" texto="Os eventos vêm do app da equipe (AJ). Uma linha da planilha pode levar o evento." /> : (
        <div className="lista ad-tabela-rola">
          <table className="ad-tabela">
            <thead><tr><th scope="col">Evento</th><th scope="col">Data</th><th scope="col" className="dir">Entrou</th><th scope="col" className="dir">Saiu</th><th scope="col" className="dir">Resultado</th></tr></thead>
            <tbody>
              {lista.map((e) => {
                const v = r.get(e.id) ?? { entradas: 0, saidas: 0, resultado: 0 };
                return <tr key={e.id}><td><b>{e.nome}</b></td><td>{formatarDataBR(e.data).slice(0, 5)}</td><td className="dir">{reais(v.entradas)}</td><td className="dir">{reais(v.saidas)}</td><td className={`dir ${v.resultado < 0 ? 'neg' : v.resultado > 0 ? 'pos' : ''}`}>{reaisComSinal(v.resultado)}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
  return sozinho ? <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(0, 1fr)', height: 'auto' }}>{corpo}</div> : corpo;
}

function Ano() {
  const d = useDados();
  const { mes, hoje, avisar } = useLoja();
  const ev = evolucaoDoAno(d.lancamentos, mes);
  const total = ev.reduce((s, e) => ({ entradas: s.entradas + e.entradas, saidas: s.saidas + e.saidas, resultado: s.resultado + e.resultado }), { entradas: 0, saidas: 0, resultado: 0 });
  const fechados = ev.filter((e) => mesFechado(e.competencia, d.fechamentos));
  const melhor = [...fechados].sort((a, b) => b.resultado - a.resultado)[0];
  const vermelhos = fechados.filter((e) => e.resultado < 0);
  const matriculados = (comp: string) => {
    const fim = periodoDaCompetencia(comp).ate;
    return d.matriculas.filter((m) => m.inicio <= fim && (!m.fim || m.fim >= fim) && !(m.estado === 'encerrada' && !m.fim)).length;
  };
  const curto = (c: string) => nomeDaCompetencia(c, true);
  function exportar() {
    exportarTabela('relatorio-12-meses', ['Mês', 'Entrou', 'Saiu', 'Resultado', 'Fechamento'], ev.map((e) => [curto(e.competencia), { centavos: e.entradas }, { centavos: e.saidas }, { centavos: e.resultado }, mesFechado(e.competencia, d.fechamentos) ? 'fechado' : 'aberto']));
    avisar('Os 12 meses foram exportados em CSV.');
  }
  return (
    <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(0, 1fr) minmax(0, 1.4fr)', height: 'auto' }}>
      <section className="ad-painel" aria-labelledby="ra-g">
        <div className="ad-painel__topo"><h2 id="ra-g">Resultado mês a mês · {curto(ev[0]!.competencia)} a {curto(mes)}</h2><button type="button" className="ad-btn" onClick={exportar}>Exportar CSV</button></div>
        <p className="t16">Nos 12 meses ficaram <b>{reais(total.resultado)}</b>.{melhor ? <> O melhor mês fechado foi {nomeDoMes(melhor.competencia)} ({reais(melhor.resultado)})</> : null}{vermelhos.length ? <>; {vermelhos.map((e) => nomeDoMes(e.competencia)).join(' e ')} {vermelhos.length === 1 ? 'fechou' : 'fecharam'} no vermelho.</> : '.'}</p>
        <div style={{ minHeight: 240, display: 'flex' }}><Barras meses={ev.map((e) => ({ competencia: e.competencia, valor: e.resultado }))} atual={mes} /></div>
        <p className="ad-legenda"><span><i className="viva" />{mesTitulo(mes).split(' de ')[0]}{hoje.startsWith(mes) ? ` (até o dia ${Number(hoje.slice(8))})` : ''}</span><span><i />Outros meses</span><span><i className="neg" />Mês no vermelho</span></p>
      </section>
      <section className="ad-painel ad-painel--sem-pad" aria-labelledby="ra-t">
        <div className="ad-painel__topo"><h2 id="ra-t">Em números</h2></div>
        <div className="lista ad-tabela-rola">
          <table className="ad-tabela">
            <thead><tr><th scope="col">Mês</th><th scope="col" className="dir">Entrou</th><th scope="col" className="dir">Saiu</th><th scope="col" className="dir">Resultado</th><th scope="col" className="dir">Matriculados</th><th scope="col">Fechamento</th></tr></thead>
            <tbody>
              {ev.map((e) => (
                <tr key={e.competencia}>
                  <td>{nomeDaCompetencia(e.competencia, true).replace(/\/(\d\d)$/, '/20$1')}</td>
                  <td className="dir">{reais(e.entradas)}</td><td className="dir">{reais(e.saidas)}</td>
                  <td className={`dir ${e.resultado < 0 ? 'neg' : ''}`}>{reais(e.resultado)}</td>
                  <td className="dir">{matriculados(e.competencia)}</td>
                  <td>{mesFechado(e.competencia, d.fechamentos) ? <Selo tom="ok">fechado</Selo> : <Selo tom="pend">aberto{hoje.startsWith(e.competencia) ? ` · até ${hoje.slice(8)}/${hoje.slice(5, 7)}` : ''}</Selo>}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="folha-moldura"><tr><td>12 meses</td><td className="dir"><b>{reais(total.entradas)}</b></td><td className="dir"><b>{reais(total.saidas)}</b></td><td className="dir"><b>{reais(total.resultado)}</b></td><td colSpan={2} /></tr></tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}

function Mes() {
  const d = useDados();
  const { mes, avisar } = useLoja();
  const p = periodoDaCompetencia(mes);
  const t = totaisDoPeriodo(d.lancamentos, p);
  const cat = somarPor(d.lancamentos, p, (l) => l.categoriaId ?? 'sem_categoria');
  const linhas = [...cat.entries()].map(([id, v]) => ({ nome: d.categorias.find((c) => c.id === id)?.nome ?? 'Sem categoria', ...v })).sort((a, b) => b.entradas - a.entradas || b.saidas - a.saidas);
  return (
    <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(0, 1fr) minmax(0, 1.4fr)', height: 'auto' }}>
      <section className="ad-painel ad-painel--heroi">
        <div className="ad-painel__topo"><h2>{mesTitulo(mes)}</h2>{mesFechado(mes, d.fechamentos) && <Selo icone="i-cadeado">Fechado</Selo>}</div>
        <dl className="ad-heroi"><dt>Resultado (entrou − saiu)</dt><dd className={t.resultado < 0 ? 'neg' : undefined}>{reais(t.resultado)}</dd></dl>
        <dl className="ad-numeros" style={{ ['--n' as string]: 2 }}>
          <div className="ad-numero"><dt>Entrou</dt><dd className="pos">{reaisComSinal(t.entradas)}</dd></div>
          <div className="ad-numero"><dt>Saiu</dt><dd className="neg">{reais(-t.saidas)}</dd></div>
          <div className="ad-numero"><dt>A receber (pendente)</dt><dd>{reais(t.entradasPendentes)}</dd></div>
          <div className="ad-numero"><dt>A pagar (pendente)</dt><dd>{reais(t.saidasPendentes)}</dd></div>
        </dl>
        <p className="ad-anotacao">Regime de caixa (proposta, A4): conta o que entrou e saiu de fato; o pendente fica ao lado.</p>
      </section>
      <section className="ad-painel ad-painel--sem-pad">
        {/* o relatório do mês também exporta (RA7.1) e soma no pé, como os outros (AO) */}
        <div className="ad-painel__topo"><h2>Por categoria</h2><button type="button" className="ad-btn" onClick={() => {
          exportarTabela(`relatorio-${mes}`, ['Categoria', 'Entrou', 'Saiu'], [...linhas.map((x) => [x.nome, { centavos: x.entradas }, { centavos: x.saidas }]), ['Total', { centavos: t.entradas }, { centavos: t.saidas }]]);
          avisar('Relatório do mês exportado em CSV.');
        }}>Exportar CSV</button></div>
        <div className="lista ad-tabela-rola">
          <table className="ad-tabela">
            <thead><tr><th scope="col">Categoria</th><th scope="col" className="dir">Entrou</th><th scope="col" className="dir">Saiu</th></tr></thead>
            <tbody>{linhas.map((x) => <tr key={x.nome}><td><b>{x.nome}</b></td><td className="dir">{x.entradas ? reais(x.entradas) : '—'}</td><td className="dir">{x.saidas ? reais(-x.saidas) : '—'}</td></tr>)}</tbody>
            <tfoot className="folha-moldura"><tr><td>Total</td><td className="dir"><b>{reais(t.entradas)}</b></td><td className="dir"><b>{reais(-t.saidas)}</b></td></tr></tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}

function Inadimplencia() {
  const d = useDados();
  const { mes, hoje, avisar } = useLoja();
  const [minimo, setMinimo] = useState(0);
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [lembrar, setLembrar] = useState<string | null>(null);
  const lista = listarInadimplentes(d.cobrancas, hoje, { haMaisDeDias: minimo });
  const total = lista.reduce((s, i) => s + i.totalCentavos, 0);
  const nome = (id?: string) => d.pessoas.find((p) => p.id === id)?.nome ?? '';
  const alvo = lista.find((i) => i.pessoaId === escolhido) ?? lista[0];
  const taxa = taxaDeInadimplencia(d.cobrancas, mes, hoje);
  const anterior = taxaDeInadimplencia(d.cobrancas, somarMeses(mes, -1), hoje);
  const descr = (ids: string[]) => {
    const cs = d.cobrancas.filter((c) => ids.includes(c.id));
    const meses = [...new Set(cs.map((c) => (c.tipo === 'matricula' ? 'taxa de matrícula' : nomeDoMes(c.competencia))))];
    return `${meses.join(' e ')}${cs.length > meses.length ? ` (${cs.length})` : ''}`;
  };
  const alunosDe = (ids: string[]) => {
    const cs = d.cobrancas.filter((c) => ids.includes(c.id));
    const filhos = [...new Set(cs.map((c) => c.alunoPessoaId).filter(Boolean))].map((x) => nome(x!).split(' ')[0]);
    return filhos.length ? `${filhos.join(' e ')} (Kids)` : nome(cs[0]?.pessoaId).split(' ')[0];
  };
  const texto = alvo ? (() => {
    const cs = d.cobrancas.filter((c) => alvo.cobrancaIds.includes(c.id)).sort((a, b) => a.vencimento.localeCompare(b.vencimento));
    return mensagemDeCobranca({ nome: nome(alvo.pessoaId), mes: nomeDoMes(cs[0]!.competencia), vencimento: cs[0]!.vencimento, centavos: alvo.totalCentavos, academia: 'Raça Fight', quantas: cs.length });
  })() : '';
  const tel = alvo ? d.pessoas.find((p) => p.id === alvo.pessoaId)?.telefone : undefined;
  const numero = numeroDoWhatsapp(tel);

  function exportar() {
    exportarTabela('inadimplentes', ['Quem paga', 'Telefone', 'Deve', 'Dias do atraso mais antigo', 'Cobranças'], lista.map((i) => [nome(i.pessoaId), d.pessoas.find((p) => p.id === i.pessoaId)?.telefone ?? '', { centavos: i.totalCentavos }, i.diasDoAtrasoMaisAntigo, descr(i.cobrancaIds)]));
    avisar('Lista de quem deve exportada em CSV.');
  }

  return (
    <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(0, 2fr) minmax(320px, 1fr)' }}>
      <section className="ad-painel ad-painel--sem-pad ad-painel--cheio" aria-labelledby="in-t">
        <div className="ad-painel__topo"><h2 id="in-t">Quem deve · {plural(lista.length, 'pessoa', 'pessoas')} · {reais(total)} · do maior atraso para o menor</h2>
          <div className="ad-acoes"><span className="campo__caixa"><select aria-label="Atraso" value={minimo} onChange={(e) => setMinimo(Number(e.target.value))}><option value={0}>Qualquer atraso</option><option value={15}>Há mais de 15 dias</option><option value={30}>Há mais de 30 dias</option></select></span><button type="button" className="ad-btn" onClick={exportar}>Exportar CSV</button></div>
        </div>
        {!lista.length ? <Vazio titulo="Ninguém em atraso" texto="Todas as cobranças vencidas estão pagas." /> : (
          <div className="lista ad-tabela-rola">
            <table className="ad-tabela">
              <thead><tr><th scope="col">Quem paga</th><th scope="col">Alunos</th><th scope="col" className="dir">Deve</th><th scope="col">Atraso mais antigo</th><th scope="col">Cobranças</th><th scope="col">Ação</th></tr></thead>
              <tbody>
                {lista.map((i, k) => (
                  <tr key={i.pessoaId} aria-selected={alvo?.pessoaId === i.pessoaId || undefined}>
                    <td><b><a className="forte" href={href('pessoas', 'ficha', i.pessoaId)}>{nome(i.pessoaId)}</a></b></td>
                    <td>{alunosDe(i.cobrancaIds)}</td>
                    <td className="dir"><b className="neg">{reais(i.totalCentavos)}</b></td>
                    <td><Selo tom={i.diasDoAtrasoMaisAntigo > 15 ? 'erro' : 'pend'}>{plural(i.diasDoAtrasoMaisAntigo, 'dia', 'dias')}</Selo></td>
                    <td>{descr(i.cobrancaIds)}</td>
                    <td><button type="button" className={`ad-btn${k === 0 ? ' ad-btn--primario' : ''}`} onClick={() => setEscolhido(i.pessoaId)}>Cobrar</button></td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="folha-moldura"><tr><td>{plural(lista.length, 'pessoa', 'pessoas')}</td><td /><td className="dir"><b>{reais(total)}</b></td><td colSpan={3} /></tr></tfoot>
            </table>
          </div>
        )}
      </section>
      <div className="ad-coluna ad-primeiro">
        {alvo && (
          <section className="ad-painel ad-painel--heroi" aria-labelledby="in-w">
            <h2 id="in-w">Cobrar {nome(alvo.pessoaId)} no WhatsApp</h2>
            <p className="ad-anotacao">A mensagem vai pronta, sem dado de saúde. O Admin abre a conversa; quem manda é você.</p>
            <div className="ad-nota"><p>{texto}</p><span>{tel ? `para ${tel}` : 'sem telefone no cadastro'}</span></div>
            <div className="ad-acoes">
              {numero ? <a className="ad-btn ad-btn--primario" href={linkDoWhatsapp(numero, texto)} target="_blank" rel="noopener noreferrer"><Icone nome="i-conversa" />Abrir no WhatsApp</a> : <span className="ad-btn" aria-disabled="true">Sem telefone</span>}
              <button type="button" className="ad-btn" onClick={() => setLembrar(alvo.pessoaId)}>Lembrar de cobrar</button>
            </div>
          </section>
        )}
        <section className="ad-painel" aria-labelledby="in-x">
          <h2 id="in-x">Taxa do mês</h2>
          <dl className="ad-numeros" style={{ ['--n' as string]: 2 }}>
            <div className="ad-numero"><dt>Venceu e não foi pago</dt><dd>{(taxa.pontosBase / 100).toFixed(1).replace('.', ',')} %</dd></div>
            <div className="ad-numero"><dt>{mesTitulo(somarMeses(mes, -1)).split(' de ')[0]}{mesFechado(somarMeses(mes, -1), d.fechamentos) ? ' (fechado)' : ''}</dt><dd>{(anterior.pontosBase / 100).toFixed(1).replace('.', ',')} %</dd></div>
          </dl>
          <p className="ad-anotacao">Atraso não bloqueia o treino (R14.6a). Multa e juros: {d.regras.atraso ? 'a academia cobra (Ajustes › Regras de cobrança)' : 'a academia não usa (A3)'}.</p>
        </section>
      </div>
      {lembrar && <GavetaLembrete pessoaId={lembrar} tituloInicial={`Cobrar ${nome(lembrar)}`} aoFechar={() => setLembrar(null)} />}
    </div>
  );
}

