/**
 * HISTÓRICO (RA9): quem mudou o quê, em frase, da mais nova para a mais
 * velha. Quem grava é o banco (gatilho); ninguém edita nem apaga, nem o dono.
 */

import { useState } from 'react';
import { somarDias } from '@dominio/financeiro/datas.ts';
import { filtrarHistorico } from '@dominio/financeiro/historico.ts';
import { Vazio } from '../componentes/basicos.tsx';
import { useDescritor } from '../componentes/descrever.ts';
import { useDados, useLoja } from '../estado/loja.tsx';
import { diaMes, plural } from '../util/formatar.ts';
import { horaDe } from '../util/relogio.ts';

const GRUPOS: [string, string, string[]][] = [
  ['tudo', 'Tudo', []], ['lancamentos', 'Lançamentos', ['lancamentos']], ['cobrancas', 'Cobranças', ['cobrancas']],
  ['pessoas', 'Pessoas e matrículas', ['pessoas', 'matriculas', 'funcionarios']], ['fechamentos', 'Fechamentos', ['fechamentos']],
  ['importacoes', 'Importações', ['importacoes']], ['ajustes', 'Ajustes', ['regras_de_cobranca', 'categorias', 'planos', 'despesas_fixas', 'modalidades', 'filtros_salvos']],
  ['anotacoes', 'Notas, lembretes e tarefas', ['notas', 'lembretes', 'tarefas']], ['funil', 'Funil', ['interessados', 'aulas_experimentais']],
];

export function Historico() {
  const d = useDados();
  const { hoje, sessao } = useLoja();
  const descrever = useDescritor(d, sessao);
  const [grupo, setGrupo] = useState('tudo');
  const [quem, setQuem] = useState('');
  const [periodo, setPeriodo] = useState<'7' | 'mes' | '90' | 'tudo'>('90');
  const tabelas = GRUPOS.find((g) => g[0] === grupo)![2];
  const de = periodo === '7' ? somarDias(hoje, -7) : periodo === 'mes' ? `${hoje.slice(0, 7)}-01` : periodo === '90' ? somarDias(hoje, -90) : undefined;
  const lista = filtrarHistorico(d.historico.filter((h) => !tabelas.length || tabelas.includes(h.tabela)), { ...(quem ? { porId: quem } : {}), ...(de ? { de } : {}) }).slice(0, 300);
  const autores = [...new Set(d.historico.map((h) => h.porId))];
  const nome = (id: string) => (id === sessao.usuarioId ? sessao.nome : d.pessoas.find((p) => p.id === id)?.nome ?? 'Alguém');

  return (
    <div className="ad-colunas" style={{ ['--colunas' as string]: '280px minmax(0, 1fr)' }}>
      <aside className="ad-coluna" aria-label="Filtros do histórico">
        <section className="ad-painel">
          <label className="campo"><span>O quê</span><span className="campo__caixa"><select value={grupo} onChange={(e) => setGrupo(e.target.value)}>{GRUPOS.map(([id, rot]) => <option key={id} value={id}>{rot}</option>)}</select></span></label>
          <label className="campo"><span>Quem mudou</span><span className="campo__caixa"><select value={quem} onChange={(e) => setQuem(e.target.value)}><option value="">Qualquer um</option>{autores.map((a) => <option key={a} value={a}>{nome(a)}</option>)}</select></span></label>
          <label className="campo"><span>Período</span><span className="campo__caixa"><select value={periodo} onChange={(e) => setPeriodo(e.target.value as typeof periodo)}><option value="7">Últimos 7 dias</option><option value="mes">Este mês</option><option value="90">Últimos 90 dias</option><option value="tudo">Tudo</option></select></span></label>
          <p className="ad-anotacao">Quem grava é o banco. Ninguém edita nem apaga o histórico, nem o dono. Guardar para sempre ou por alguns anos é a pergunta A14.</p>
        </section>
      </aside>
      <section className="ad-painel ad-painel--sem-pad ad-painel--cheio" aria-label="Mudanças">
        {!lista.length ? <Vazio titulo="Nenhuma mudança neste filtro" /> : (
          <div className="lista ad-tabela-rola">
            <table className="ad-tabela">
              <thead><tr><th scope="col" style={{ width: 120 }}>Quando</th><th scope="col" style={{ width: 160 }}>Quem</th><th scope="col">O que mudou</th></tr></thead>
              <tbody>
                {lista.map((h) => {
                  const [titulo, ...resto] = descrever(h);
                  const oQue = titulo!.replace(/ em \d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}$/, '').replace(new RegExp(`^${nome(h.porId).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} `), '');
                  return (
                    <tr key={h.id}>
                      <td>{diaMes(h.em.slice(0, 10))} {horaDe(h.em)}</td>
                      <td>{nome(h.porId)}</td>
                      <td>{oQue}{resto.length ? <> · {resto.map((r, i) => <span key={i}>{i ? ' · ' : ''}{r.includes(' → ') ? <>{r.split(' → ')[0]} → <b>{r.split(' → ')[1]}</b></> : r}</span>)}</> : null}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {lista.length === 300 && <p className="ad-anotacao" style={{ padding: 12 }}>Mostrando as 300 mais novas. Estreite o período para ver as outras.</p>}
        {lista.length > 0 && lista.length < 300 && <p className="ad-anotacao" style={{ padding: 12 }}>{plural(lista.length, 'mudança', 'mudanças')}.</p>}
      </section>
    </div>
  );
}
