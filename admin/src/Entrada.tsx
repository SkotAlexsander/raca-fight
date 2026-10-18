/**
 * Quem entra no Admin. MODO LOCAL (sem .env.local): entra direto como "Alex,
 * dono", com a academia de exemplo. MODO SUPABASE: e-mail e senha, depois o
 * código do aplicativo autenticador (TOTP), e só abre para o dono (RA1.1).
 *
 * O modo Supabase vem num pedaço à parte, carregado só quando há Supabase
 * configurado (AO, 16/10): antes o supabase-js entrava no pacote principal
 * até no modo local (762 kB).
 */

import { lazy, Suspense, useMemo, type ReactNode } from 'react';
import { Logo, Simbolos } from './componentes/basicos.tsx';
import { armazenamentoDoNavegador } from './dados/local/armazenamento.ts';
import { DONO_ID } from './dados/local/exemplo.ts';
import { criarRepositorioLocal } from './dados/local/repositorio-local.ts';
import { configuracaoDoSupabase } from './dados/supabase/configuracao.ts';
import type { Repositorio, Sessao } from './dados/tipos.ts';
import { useHoje } from './estado/hoje.ts';
import { ACADEMIA } from '@dominio/financeiro/exemplo.ts';
import { agoraNaAcademia, hojeNaAcademia } from './util/relogio.ts';

export { SemPermissao } from './SemPermissao.tsx';

export type FilhosDaEntrada = (r: { repositorio: Repositorio; sessao: Sessao; hoje: string; sair?: () => void }) => ReactNode;

const ModoSupabase = lazy(() => import('./EntradaSupabase.tsx'));

export function Entrada({ children }: { children: FilhosDaEntrada }) {
  const supabase = useMemo(() => new URLSearchParams(location.search).get('modo') !== 'local' && configuracaoDoSupabase() != null, []);
  const hoje = useHoje();

  if (!supabase) return <ModoLocal hoje={hoje}>{children}</ModoLocal>;
  return (
    <Suspense fallback={<Abrindo />}>
      <ModoSupabase hoje={hoje}>{children}</ModoSupabase>
    </Suspense>
  );
}

function Abrindo() {
  return (
    <div className="ad-quadro ad-quadro--bloqueio">
      <Simbolos />
      <div className="ad-bloqueio" role="status"><Logo className="logo" /><p>Abrindo…</p></div>
    </div>
  );
}

function ModoLocal({ hoje, children }: { hoje: string; children: FilhosDaEntrada }) {
  // o repositório nasce uma vez; o dia é lido na hora de gerar o exemplo (o "hoje" vira à meia-noite)
  const repositorio = useMemo(() => criarRepositorioLocal({
    armazenamento: armazenamentoDoNavegador(), hoje: () => hojeNaAcademia(), agora: agoraNaAcademia, latenciaMs: 250,
  }), []);
  const sessao = useMemo<Sessao>(() => ({ usuarioId: DONO_ID, nome: 'Alex', papel: 'dono', academiaId: ACADEMIA, pessoaId: DONO_ID }), []);
  return <>{children({ repositorio, sessao, hoje })}</>;
}
