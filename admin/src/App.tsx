/**
 * As telas do Admin, pela rota. A moldura mostra os estados que valem para
 * todas: carregando, erro (com "Tentar de novo") e sem permissão.
 */

import { lazy, Suspense, type ReactNode } from 'react';
import { Carregando, ErroNaTela, Icone } from './componentes/basicos.tsx';
import { Entrada, SemPermissao } from './Entrada.tsx';
import { ProvedorDaLoja, useLoja } from './estado/loja.tsx';
import { href, useRota, type Rota } from './estado/rota.ts';
import { Moldura, type Secao } from './moldura/Moldura.tsx';
import { Cobrancas } from './telas/Cobrancas.tsx';
import { Fechamento } from './telas/Fechamento.tsx';
import { Lancamentos } from './telas/Lancamentos.tsx';
import { Painel } from './telas/Painel.tsx';
import { Pessoas } from './telas/Pessoas.tsx';

// As telas do dia a dia (painel, planilha, cobranças, fechamento, pessoas) vêm
// no pacote principal; as outras descem quando a pessoa abre (AO, 16/10: o JS
// principal tinha 762 kB). Cada uma tem o mesmo esqueleto de "carregando".
const Agenda = lazy(() => import('./telas/Agenda.tsx').then((m) => ({ default: m.Agenda })));
const Ajustes = lazy(() => import('./telas/Ajustes.tsx').then((m) => ({ default: m.Ajustes })));
const DespesasFixas = lazy(() => import('./telas/DespesasFixas.tsx').then((m) => ({ default: m.DespesasFixas })));
const Exportar = lazy(() => import('./telas/Exportar.tsx').then((m) => ({ default: m.Exportar })));
const Ficha = lazy(() => import('./telas/Ficha.tsx').then((m) => ({ default: m.Ficha })));
const Funcionarios = lazy(() => import('./telas/Funcionarios.tsx').then((m) => ({ default: m.Funcionarios })));
const Funil = lazy(() => import('./telas/Funil.tsx').then((m) => ({ default: m.Funil })));
const Historico = lazy(() => import('./telas/Historico.tsx').then((m) => ({ default: m.Historico })));
const Importar = lazy(() => import('./telas/Importar.tsx').then((m) => ({ default: m.Importar })));
const Notas = lazy(() => import('./telas/Notas.tsx').then((m) => ({ default: m.Notas })));
const Relatorios = lazy(() => import('./telas/Relatorios.tsx').then((m) => ({ default: m.Relatorios })));

interface Tela { secao: Secao; sub?: string; titulo: string; comMes?: boolean; corpo: ReactNode }

function telaDa(rota: Rota): Tela {
  const [a, b, c] = rota;
  switch (a) {
    case 'pessoas':
      if (b === 'funcionarios') return { secao: 'pessoas', sub: 'Funcionários', titulo: 'Funcionários', comMes: true, corpo: <Funcionarios /> };
      if (b === 'responsaveis') return { secao: 'pessoas', sub: 'Responsáveis', titulo: 'Responsáveis', corpo: <Pessoas alvo="responsaveis" /> };
      if (b === 'ficha' && c) return { secao: 'pessoas', sub: 'Alunos', titulo: 'Ficha', comMes: true, corpo: <Ficha pessoaId={c} key={c} /> };
      if (b === 'filtro') return { secao: 'pessoas', sub: 'Alunos', titulo: 'Alunos', corpo: <Pessoas alvo="alunos" filtroAberto /> };
      return { secao: 'pessoas', sub: 'Alunos', titulo: 'Alunos', corpo: <Pessoas alvo="alunos" atalho={c} key={c ?? 'todos'} /> };
    case 'financeiro':
      if (b === 'cobrancas') return { secao: 'financeiro', sub: 'Cobranças', titulo: 'Cobranças', comMes: true, corpo: <Cobrancas /> };
      if (b === 'despesas-fixas') return { secao: 'financeiro', sub: 'Despesas fixas', titulo: 'Despesas fixas', comMes: true, corpo: <DespesasFixas /> };
      if (b === 'fechamento') return { secao: 'financeiro', sub: 'Fechamento', titulo: 'Fechamento', corpo: <Fechamento /> };
      if (b === 'importar') return { secao: 'financeiro', sub: 'Importar', titulo: 'Importar planilha', corpo: <Importar /> };
      if (b === 'exportar') return { secao: 'financeiro', sub: 'Exportar', titulo: 'Exportar', comMes: true, corpo: <Exportar /> };
      return { secao: 'financeiro', sub: 'Lançamentos', titulo: 'Lançamentos', comMes: true, corpo: <Lancamentos /> };
    case 'relatorios':
      return { secao: 'relatorios', titulo: b === 'inadimplencia' ? 'Inadimplência' : 'Relatórios', comMes: true, corpo: <Relatorios aba={b} /> };
    case 'funil': return { secao: 'funil', titulo: 'Funil da aula experimental', comMes: true, corpo: <Funil /> };
    case 'agenda': return { secao: 'agenda', titulo: 'Agenda', comMes: true, corpo: <Agenda /> };
    case 'notas': return { secao: 'notas', titulo: 'Notas', corpo: <Notas /> };
    case 'historico': return { secao: 'historico', titulo: 'Histórico', corpo: <Historico /> };
    case 'ajustes': return { secao: 'ajustes', titulo: 'Ajustes', corpo: <Ajustes aba={b} /> };
    case 'mais': return { secao: 'ajustes', titulo: 'Mais', corpo: <Mais /> };
    default: return { secao: 'painel', titulo: 'Painel', comMes: true, corpo: <Painel /> };
  }
}

function Mais() {
  const itens: [string, string[]][] = [['Relatórios', ['relatorios']], ['Inadimplência', ['relatorios', 'inadimplencia']], ['Funil', ['funil']], ['Notas', ['notas']],
    ['Histórico', ['historico']], ['Fechamento', ['financeiro', 'fechamento']], ['Cobranças', ['financeiro', 'cobrancas']], ['Despesas fixas', ['financeiro', 'despesas-fixas']],
    ['Importar planilha', ['financeiro', 'importar']], ['Exportar', ['financeiro', 'exportar']], ['Turmas e horários', ['ajustes', 'turmas']], ['Ajustes', ['ajustes']]];
  return (
    <section className="ad-painel">
      <ul className="ad-lista">
        {itens.map(([rot, destino]) => <li key={rot}><a className="ad-lista__txt" href={href(...destino)}><b>{rot}</b></a><Icone nome="i-avancar" /></li>)}
      </ul>
    </section>
  );
}

export function Telas() {
  const rota = useRota();
  const { carga, recarregar } = useLoja();
  const t = telaDa(rota);
  if (carga === 'sem_permissao') return <SemPermissao />;
  return (
    <Moldura secao={t.secao} sub={t.sub} titulo={t.titulo} comMes={t.comMes}>
      {carga === 'carregando' ? <Carregando /> : carga === 'erro' ? <ErroNaTela aoTentar={recarregar} /> : <Suspense fallback={<Carregando />}>{t.corpo}</Suspense>}
    </Moldura>
  );
}

export function App() {
  return (
    <Entrada>
      {({ repositorio, sessao, hoje }) => (
        <ProvedorDaLoja repositorio={repositorio} sessao={sessao} hoje={hoje}>
          <Telas />
        </ProvedorDaLoja>
      )}
    </Entrada>
  );
}
