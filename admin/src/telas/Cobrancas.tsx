/**
 * FINANCEIRO › COBRANÇAS (RA3, RA5): o que se tem a receber no mês, com a
 * situação CALCULADA (a vencer, vence hoje, atrasada, paga, cancelada).
 * "Marcar como paga" abre a gaveta; "Desfazer pagamento" arquiva a linha.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { situacaoDaCobranca, type EstadoCalculado } from '@dominio/financeiro/cobrancas.ts';
import { formatarDinheiro } from '@dominio/financeiro/dinheiro.ts';
import { gerarCSV } from '@dominio/financeiro/exportacao.ts';
import { ROTULO_DA_FORMA } from '@dominio/financeiro/nomes.ts';
import type { Cobranca } from '@dominio/financeiro/tipos.ts';
import { Selo, Vazio } from '../componentes/basicos.tsx';
import { GerarMensalidades } from '../componentes/gerar-mensalidades.tsx';
import { GavetaPagar } from '../componentes/pagar.tsx';
import { useEnvio } from '../estado/envio.ts';
import { useDados, useLoja } from '../estado/loja.tsx';
import { ir } from '../estado/rota.ts';
import { baixarArquivo, nomeDoArquivo } from '../util/baixar.ts';
import { diaMes, nomeDoMes, plural } from '../util/formatar.ts';

type Grupo = 'todas' | 'a_vencer' | 'vence_hoje' | 'atrasada' | 'paga';
const GRUPOS: [Grupo, string][] = [['todas', 'Todas'], ['a_vencer', 'A vencer'], ['vence_hoje', 'Vence hoje'], ['atrasada', 'Atrasadas'], ['paga', 'Pagas']];

export function SeloDaCobranca({ c, hoje }: { c: Cobranca; hoje: string }) {
  const s = situacaoDaCobranca(c, hoje);
  const t: Record<EstadoCalculado, ReactNode> = {
    paga: <Selo tom="ok">paga {c.pagaEm ? diaMes(c.pagaEm) : ''}{c.formaDePagamento ? ` · ${ROTULO_DA_FORMA[c.formaDePagamento]}` : ''}</Selo>,
    cancelada: <Selo>cancelada</Selo>,
    a_vencer: <Selo>a vencer</Selo>,
    vence_hoje: <Selo tom="pend">vence hoje</Selo>,
    atrasada: <Selo tom="erro">atrasada {plural(s.diasDeAtraso, 'dia', 'dias')}</Selo>,
  };
  return <>{t[s.estado]}</>;
}

export function Cobrancas() {
  const d = useDados();
  const { mes, hoje, executar, avisar } = useLoja();
  const [grupo, setGrupo] = useState<Grupo>('todas');
  const [pagar, setPagar] = useState<Cobranca | null>(null);
  const envio = useEnvio();
  const nome = (id?: string) => d.pessoas.find((p) => p.id === id)?.nome ?? '—';
  const plano = (c: Cobranca) => d.planos.find((p) => p.id === d.matriculas.find((m) => m.id === c.matriculaId)?.planoId)?.nome;

  const doMes = useMemo(() => d.cobrancas.filter((c) => c.competencia === mes).sort((a, b) => {
    const ordem = (x: Cobranca) => ({ atrasada: 0, vence_hoje: 1, a_vencer: 2, paga: 3, cancelada: 4 })[situacaoDaCobranca(x, hoje).estado];
    return ordem(a) - ordem(b) || a.vencimento.localeCompare(b.vencimento) || nome(a.alunoPessoaId ?? a.pessoaId).localeCompare(nome(b.alunoPessoaId ?? b.pessoaId));
  }), [d.cobrancas, mes, hoje]); // eslint-disable-line react-hooks/exhaustive-deps
  const conta = (g: Grupo) => (g === 'todas' ? doMes.length : doMes.filter((c) => situacaoDaCobranca(c, hoje).estado === g).length);
  const vistas = grupo === 'todas' ? doMes : doMes.filter((c) => situacaoDaCobranca(c, hoje).estado === grupo);

  function exportar() {
    const csv = gerarCSV(['Aluno', 'Quem paga', 'Cobrança', 'Vencimento', 'Valor', 'Desconto', 'Situação'], vistas.map((c) => [
      nome(c.alunoPessoaId ?? c.pessoaId), nome(c.pessoaId), c.descricao, c.vencimento.split('-').reverse().join('/'),
      { centavos: c.valorCentavos }, { centavos: c.descontoCentavos }, situacaoDaCobranca(c, hoje).estado.replace('_', ' '),
    ]));
    baixarArquivo(nomeDoArquivo('cobrancas', mes), csv);
    avisar(`Exportado: ${plural(vistas.length, 'cobrança', 'cobranças')}.`);
  }

  if (!doMes.length) {
    return (
      <section className="ad-painel ad-painel--sem-pad">
        <div className="ad-estado">
          <h2 className="t20">Nenhuma cobrança em {nomeDoMes(mes)}</h2>
          <p>As mensalidades de {nomeDoMes(mes)} ainda não foram geradas. {plural(d.matriculas.filter((m) => m.estado === 'ativa').length, 'matrícula ativa está pronta', 'matrículas ativas estão prontas')}.</p>
          <GerarMensalidades competencia={mes} />
        </div>
      </section>
    );
  }

  return (
    <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(0, 1fr)' }}>
      <section className="ad-painel ad-painel--sem-pad ad-painel--cheio">
        <div className="ad-painel__topo">
          <div className="ad-grupos" role="group" aria-label="Situação">
            {GRUPOS.map(([g, rot]) => <a key={g} href="#" aria-current={grupo === g ? 'true' : undefined} onClick={(e) => { e.preventDefault(); setGrupo(g); }}>{rot} <b>{conta(g)}</b></a>)}
          </div>
          <div className="ad-acoes">
            <button type="button" className="ad-btn" onClick={() => ir('financeiro', 'lancamentos')}>Ver na planilha</button>
            <button type="button" className="ad-btn" onClick={exportar}>Exportar CSV</button>
          </div>
        </div>
        {vistas.length === 0 ? <Vazio titulo="Nenhuma nesta situação" /> : (
          <div className="lista ad-tabela-rola">
            <table className="ad-tabela">
              <thead><tr><th scope="col">Aluno</th><th scope="col">Quem paga</th><th scope="col">Cobrança</th><th scope="col">Vencimento</th><th scope="col" className="dir">Valor</th><th scope="col" className="dir">Desconto</th><th scope="col">Situação</th><th scope="col">Ação</th></tr></thead>
              <tbody>
                {vistas.map((c, i) => {
                  const s = situacaoDaCobranca(c, hoje).estado;
                  return (
                    <tr key={c.id}>
                      <td><b><a className="forte" href={`#/pessoas/ficha/${c.alunoPessoaId ?? c.pessoaId}`}>{nome(c.alunoPessoaId ?? c.pessoaId)}</a></b></td>
                      <td>{nome(c.pessoaId)}</td>
                      <td>{c.tipo === 'matricula' ? 'Taxa de matrícula' : `${c.tipo === 'mensalidade' ? 'Mensalidade' : c.descricao.split(' — ')[0]} · ${plano(c) ?? c.descricao}`}</td>
                      <td>{diaMes(c.vencimento)}</td>
                      <td className="dir"><b>{formatarDinheiro(c.valorCentavos)}</b></td>
                      <td className="dir">{c.descontoCentavos ? `−${formatarDinheiro(c.descontoCentavos)}` : '—'}</td>
                      <td><SeloDaCobranca c={c} hoje={hoje} /></td>
                      <td>
                        {s === 'paga' ? <button type="button" className="ad-btn ad-btn--plano" disabled={envio.enviando} onClick={() => void envio.enviar(() => executar((r) => r.desfazerPagamento(c.id)).then((x) => { if (x.ok) avisar('Pagamento desfeito: a linha foi arquivada e a cobrança reabriu.'); }))}>Desfazer pagamento</button>
                          : s === 'cancelada' ? '—'
                          : <button type="button" className={`ad-btn${i === 0 && s === 'atrasada' ? ' ad-btn--primario' : ''}`} onClick={() => setPagar(c)}>Marcar como paga</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {pagar && <GavetaPagar cobranca={pagar} aoFechar={() => setPagar(null)} />}
    </div>
  );
}
