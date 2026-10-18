/**
 * A moldura de toda tela, igual ao mockup do AK (`admin.html`, função
 * `lateral`, `topo` e `tabbar`): barra lateral preta com o logo e a faixa
 * ADMIN; o topo de uma linha com o título, o mês, a busca global (Ctrl+K),
 * Filtro (/), Anotar (N), Lembrar (L) e "Salvo às 10:42"; no celular, a barra
 * de baixo Painel · Pessoas · Finanças · Agenda · Mais.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { lembretesDoDia } from '@dominio/financeiro/anotacoes.ts';
import { somarMeses } from '@dominio/financeiro/datas.ts';
import { mesFechado } from '@dominio/financeiro/fechamento.ts';
import { retornosPendentes } from '@dominio/financeiro/funil.ts';
import { Icone, Logo, Selo, Simbolos } from '../componentes/basicos.tsx';
import { GavetaLembrete, GavetaNota } from '../componentes/anotar.tsx';
import type { NomeDoIcone } from '../componentes/simbolos.ts';
import { useLoja } from '../estado/loja.tsx';
import { href, ir } from '../estado/rota.ts';
import { iniciais, mesTitulo } from '../util/formatar.ts';
import { BuscaGlobal } from './BuscaGlobal.tsx';
import { useTema } from './tema.ts';

export type Secao = 'painel' | 'pessoas' | 'financeiro' | 'relatorios' | 'funil' | 'agenda' | 'notas' | 'historico' | 'ajustes';

interface ItemDaNav { id: Secao; rot: string; ic: NomeDoIcone; destino: string[]; sub?: [string, string[]][] }

const NAV: ItemDaNav[] = [
  { id: 'painel', rot: 'Painel', ic: 'i-grafico', destino: ['painel'] },
  { id: 'pessoas', rot: 'Pessoas', ic: 'i-alunos', destino: ['pessoas', 'alunos'], sub: [['Alunos', ['pessoas', 'alunos']], ['Funcionários', ['pessoas', 'funcionarios']], ['Responsáveis', ['pessoas', 'responsaveis']]] },
  { id: 'financeiro', rot: 'Financeiro', ic: 'i-lista', destino: ['financeiro', 'lancamentos'], sub: [['Lançamentos', ['financeiro', 'lancamentos']], ['Cobranças', ['financeiro', 'cobrancas']], ['Despesas fixas', ['financeiro', 'despesas-fixas']], ['Fechamento', ['financeiro', 'fechamento']], ['Importar', ['financeiro', 'importar']], ['Exportar', ['financeiro', 'exportar']]] },
  { id: 'relatorios', rot: 'Relatórios', ic: 'i-grafico-linha', destino: ['relatorios'] },
  { id: 'funil', rot: 'Funil', ic: 'i-luva', destino: ['funil'] },
  { id: 'agenda', rot: 'Agenda', ic: 'i-calendario', destino: ['agenda'] },
  { id: 'notas', rot: 'Notas', ic: 'i-conversa', destino: ['notas'] },
  { id: 'historico', rot: 'Histórico', ic: 'i-relogio', destino: ['historico'] },
  { id: 'ajustes', rot: 'Ajustes', ic: 'i-academia', destino: ['ajustes'] },
];

const ABAS: [Secao | 'mais', string, NomeDoIcone, string[]][] = [
  ['painel', 'Painel', 'i-grafico', ['painel']], ['pessoas', 'Pessoas', 'i-alunos', ['pessoas', 'alunos']],
  ['financeiro', 'Finanças', 'i-lista', ['financeiro', 'lancamentos']], ['agenda', 'Agenda', 'i-calendario', ['agenda']], ['mais', 'Mais', 'i-menu', ['mais']],
];

/** Tecla de atalho só vale fora de campo de texto (e fora da planilha em edição). */
export function digitando(alvo: EventTarget | null): boolean {
  const el = alvo as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
}

export function Moldura({ secao, sub, titulo, comMes, children, acoesDoTopo }: {
  secao: Secao; sub?: string; titulo: string; comMes?: boolean; children: ReactNode; acoesDoTopo?: ReactNode;
}) {
  const { dados, mes, setMes, salvamento, aviso, fecharAviso, segurarAviso, sessao, hoje, repositorio } = useLoja();
  const { escuro, alternar } = useTema();
  const [camada, setCamada] = useState<null | 'nota' | 'lembrete'>(null);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const busca = useRef<HTMLInputElement>(null);

  const contas = useMemo(() => {
    if (!dados) return {} as Partial<Record<Secao, number>>;
    const dia = lembretesDoDia(dados.lembretes, hoje);
    const retornos = retornosPendentes(dados.interessados, dados.experimentais, hoje, { diasDepois: dados.regras.diasParaRetornoDaExperimental });
    return { funil: retornos.length, agenda: dia.atrasados.length + dia.hoje.length } as Partial<Record<Secao, number>>;
  }, [dados, hoje]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setBuscaAberta(true); busca.current?.focus(); return; }
      // com uma gaveta aberta (pagar, filtrar…), N e L não abrem outra por cima (AO)
      if (e.ctrlKey || e.metaKey || e.altKey || digitando(e.target) || camada || document.querySelector('[role="dialog"]')) return;
      if ((e.target as HTMLElement | null)?.closest?.('[role="grid"]') && e.key !== '/') return;
      if (e.key === '/') { e.preventDefault(); ir('pessoas', 'filtro'); }
      else if (e.key.toLowerCase() === 'n') { e.preventDefault(); setCamada('nota'); }
      else if (e.key.toLowerCase() === 'l') { e.preventDefault(); setCamada('lembrete'); }
    };
    addEventListener('keydown', tecla);
    return () => removeEventListener('keydown', tecla);
  }, [camada]);

  const fechado = !!dados && comMes && mesFechado(mes, dados.fechamentos);

  return (
    <div className={`ad-quadro ad-app${buscaAberta ? ' ad-quadro--busca' : ''}`}>
      <Simbolos />
      <aside className="ad-lateral" aria-label="Navegação">
        <div className="ad-marca">
          <Logo />
          <span className="ad-faixa"><Icone nome="i-luva" /><span>Admin</span></span>
        </div>
        <nav className="ad-nav" aria-label="Seções">
          {NAV.map((n) => (
            <div key={n.id} style={{ display: 'contents' }}>
              <a className="ad-nav__item" href={href(...n.destino)} aria-current={n.id === secao ? 'page' : undefined}>
                <Icone nome={n.ic} pequeno={false} />{n.rot}
                {!!contas[n.id] && <span className="ad-nav__conta" aria-label={`${contas[n.id]} pendentes`}>{contas[n.id]}</span>}
              </a>
              {n.id === secao && n.sub && (
                <div className="ad-nav__sub">
                  {n.sub.map(([rot, destino]) => <a key={rot} href={href(...destino)} aria-current={rot === sub ? 'page' : undefined}>{rot}</a>)}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="ad-lateral__pe">
          {repositorio.modo === 'local' && <p className="ad-modo-local" title="Os dados são de exemplo e ficam só neste navegador">Modo local · dados de exemplo</p>}
          <button type="button" onClick={alternar}><Icone nome="i-olho" /><span>{escuro ? 'Tema claro' : 'Tema escuro'}</span></button>
          <div className="ad-quem">
            <span className="ad-quem__avatar" aria-hidden="true">{iniciais(sessao.nome)}</span>
            <p>{sessao.nome}<span>dono · {dados?.academia.nome ?? 'Raça Fight'}</span></p>
          </div>
        </div>
      </aside>

      <div className="ad-principal">
        <header className="ad-topo">
          <h1>{titulo}</h1>
          {comMes && (
            <div className="ad-topo__contexto">
              <span className="ad-mes">
                <button type="button" className="ad-btn ad-btn--icone ad-btn--plano" aria-label="Mês anterior" onClick={() => setMes(somarMeses(mes, -1))}><Icone nome="i-voltar" pequeno={false} /></button>
                <span aria-live="polite">{mesTitulo(mes)}</span>
                <button type="button" className="ad-btn ad-btn--icone ad-btn--plano" aria-label="Próximo mês" onClick={() => setMes(somarMeses(mes, 1))}><Icone nome="i-avancar" pequeno={false} /></button>
              </span>
              {fechado && <Selo icone="i-cadeado">Fechado</Selo>}
            </div>
          )}
          <BuscaGlobal entrada={busca} aberta={buscaAberta} setAberta={setBuscaAberta} />
          <div className="ad-topo__acoes">
            {acoesDoTopo}
            <button type="button" className="ad-btn so-pc-acao" onClick={() => ir('pessoas', 'filtro')}><Icone nome="i-filtro" />Filtro <kbd>/</kbd></button>
            <button type="button" className="ad-btn so-pc-acao" onClick={() => setCamada('nota')}>Anotar <kbd>N</kbd></button>
            <button type="button" className="ad-btn so-pc-acao" onClick={() => setCamada('lembrete')}>Lembrar <kbd>L</kbd></button>
            <span className="ad-gravado so-pc-acao" aria-live="polite">
              {salvamento.estado === 'salvando' ? <><span className="ad-girando" aria-hidden="true" />Salvando…</>
                : salvamento.estado === 'erro' ? <><Icone nome="i-alerta" /><span className="neg">Não gravou</span></>
                : salvamento.hora ? <><Icone nome="i-marcar" />Salvo às {salvamento.hora}</> : <><Icone nome="i-marcar" />Tudo salvo</>}
            </span>
            <button type="button" className="ad-btn ad-btn--icone so-celular" aria-label="Buscar" onClick={() => { setBuscaAberta(true); setTimeout(() => busca.current?.focus(), 0); }}><Icone nome="i-buscar" pequeno={false} /></button>
            <button type="button" className="ad-btn ad-btn--icone so-celular" aria-label="Anotar" onClick={() => setCamada('nota')}><Icone nome="i-mais" pequeno={false} /></button>
          </div>
        </header>
        <main className="ad-conteudo" id="conteudo">{children}</main>
        <nav className="ad-tabbar" aria-label="Seções">
          {ABAS.map(([id, rot, ic, destino]) => {
            const atual = id === secao || (id === 'mais' && !['painel', 'pessoas', 'financeiro', 'agenda'].includes(secao));
            return <a key={id} className="aba" href={href(...destino)} aria-current={atual ? 'page' : undefined}><Icone nome={ic} pequeno={false} /><span className="aba__rotulo">{rot}</span></a>;
          })}
        </nav>
      </div>

      {camada === 'nota' && <GavetaNota aoFechar={() => setCamada(null)} />}
      {camada === 'lembrete' && <GavetaLembrete aoFechar={() => setCamada(null)} />}
      {aviso && (
        <div key={aviso.chave} className="ad-aviso folha-moldura" role={aviso.tom === 'info' ? 'status' : 'alert'}
          onMouseEnter={() => segurarAviso(true)} onMouseLeave={() => segurarAviso(false)} onFocus={() => segurarAviso(true)} onBlur={() => segurarAviso(false)}>
          {aviso.tom !== 'info' && <Icone nome={aviso.tom === 'trava' ? 'i-cadeado' : 'i-alerta'} />}
          <span>{aviso.texto}</span>
          {aviso.desfazer && <button type="button" className="ad-btn" onClick={() => { aviso.desfazer!(); fecharAviso(); }}>Desfazer <kbd>Ctrl Z</kbd></button>}
          {aviso.acao && <button type="button" className="ad-btn" onClick={() => { aviso.acao!.fazer(); fecharAviso(); }}>{aviso.acao.rotulo}</button>}
          <button type="button" className="ad-btn ad-btn--icone ad-btn--plano" aria-label="Fechar o aviso" onClick={fecharAviso}><Icone nome="i-fechar" /></button>
        </div>
      )}
      <datalist id="lista-pessoas">{dados?.pessoas.map((p) => <option key={p.id} value={p.nome} />)}</datalist>
    </div>
  );
}
