/**
 * Peças pequenas que todas as telas usam, com as classes do mockup do AK:
 * ícone, selo, botão, número, campo, gaveta e estados.
 */

import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { SIMBOLOS, type NomeDoIcone } from './simbolos.ts';

export function Simbolos() {
  return <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: SIMBOLOS }} />;
}

export function Icone({ nome, pequeno = true }: { nome: NomeDoIcone; pequeno?: boolean }) {
  return (
    <svg className={`icone${pequeno ? ' icone--16' : ''}`} aria-hidden="true">
      <use href={`#${nome}`} />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="-54 -24 1078 304" role="img" aria-label="Raça Fight" className={className}>
      <use href="#logo-rf" />
    </svg>
  );
}

export type TomDoSelo = 'ok' | 'pend' | 'erro' | 'marca' | 'neutro';
export function Selo({ tom = 'neutro', children, icone }: { tom?: TomDoSelo; children: ReactNode; icone?: NomeDoIcone }) {
  return (
    <span className={`ad-selo${tom === 'neutro' ? '' : ` ad-selo--${tom}`}`}>
      {icone && <Icone nome={icone} />}
      {children}
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd>{children}</kbd>;
}

/** Rótulo + número (o `dl` do painel). `aoAbrir` faz o número abrir a lista que o forma (RA2.6). */
export function Numero({ rotulo, valor, tom, apoio, apoioTom, aoAbrir }: {
  rotulo: string; valor: ReactNode; tom?: 'pos' | 'neg' | 'ate'; apoio?: ReactNode; apoioTom?: 'pos' | 'neg' | 'sec'; aoAbrir?: () => void;
}) {
  const corpo = (
    <>
      <dt>{rotulo}</dt>
      <dd className={tom}>{valor}{apoio != null && <small className={apoioTom ?? 'sec'}>{apoio}</small>}</dd>
    </>
  );
  if (aoAbrir) {
    return <a className="ad-numero cartao--tocavel" href="#" onClick={(e) => { e.preventDefault(); aoAbrir(); }}>{corpo}</a>;
  }
  return <div className="ad-numero">{corpo}</div>;
}

export function Campo({ rotulo, ajuda, erro, children }: { rotulo: string; ajuda?: ReactNode; erro?: string | null; children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode }) {
  const id = useId();
  const idAjuda = `${id}-ajuda`;
  const idErro = `${id}-erro`;
  const descr = [ajuda ? idAjuda : '', erro ? idErro : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className="campo">
      <label htmlFor={id}>{rotulo}</label>
      <span className="campo__caixa">{children({ id, ...(descr ? { 'aria-describedby': descr } : {}), ...(erro ? { 'aria-invalid': true } : {}) })}</span>
      {ajuda && <p className="campo__ajuda" id={idAjuda}>{ajuda}</p>}
      {erro && <p className="campo__erro" id={idErro} role="alert"><Icone nome="i-alerta" />{erro}</p>}
    </div>
  );
}

/**
 * A gaveta (no PC, do lado) que vira folha no celular. Prende o foco, Esc fecha,
 * e o foco volta para quem abriu.
 */
export function Gaveta({ titulo, aoFechar, children, rodape, rotuloId }: { titulo: ReactNode; aoFechar: () => void; children: ReactNode; rodape?: ReactNode; rotuloId?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const idGerado = useId();
  const tituloId = rotuloId ?? `${idGerado}-titulo`;
  // quem abre passa `() => setX(null)`, uma função nova a cada desenho: guardada
  // num ref, o efeito roda UMA vez. Antes (AO) cada "Salvando…" ou aviso que
  // sumia redesenhava a tela, o efeito rodava de novo e o foco pulava para o
  // primeiro campo no meio da digitação.
  const fechar = useRef(aoFechar);
  useLayoutEffect(() => { fechar.current = aoFechar; });
  useEffect(() => {
    const antes = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const primeiro = el?.querySelector<HTMLElement>('input, select, textarea, button:not([data-fechar])');
    primeiro?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); fechar.current(); }
      if (e.key === 'Tab' && el) {
        const focaveis = [...el.querySelectorAll<HTMLElement>('input, select, textarea, button, a[href]')].filter((x) => !x.hasAttribute('disabled'));
        if (!focaveis.length) return;
        const [p, u] = [focaveis[0]!, focaveis[focaveis.length - 1]!];
        if (e.shiftKey && document.activeElement === p) { e.preventDefault(); u.focus(); }
        else if (!e.shiftKey && document.activeElement === u) { e.preventDefault(); p.focus(); }
      }
    };
    el?.addEventListener('keydown', tecla);
    return () => { el?.removeEventListener('keydown', tecla); antes?.focus?.(); };
  }, []);
  return (
    <>
      <div className="ad-veu" onClick={aoFechar} />
      <div className="ad-gaveta folha-moldura" role="dialog" aria-modal="true" aria-labelledby={tituloId} ref={ref}>
        <h2 id={tituloId}>{titulo}</h2>
        {children}
        {rodape && <div className="ad-gaveta__pe">{rodape}</div>}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Estados (o mesmo padrão do app, decisão de 11/10, AH)
// ---------------------------------------------------------------------------

/** O esqueleto só aparece depois de 300 ms (antes disso, nada pisca). */
export function Carregando({ linhas = 6 }: { linhas?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => { if (ref.current) ref.current.hidden = false; }, 300);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="ad-esq-linhas" ref={ref} hidden role="status" aria-label="Carregando">
      {Array.from({ length: linhas }, (_, i) => (
        <div className="ad-esq-linha" key={i}><span className="ad-esq" /><span className="ad-esq" /><span className="ad-esq" /><span className="ad-esq" /></div>
      ))}
    </div>
  );
}

export function Vazio({ titulo, texto, acao }: { titulo: string; texto?: string; acao?: ReactNode }) {
  return (
    <div className="ad-estado">
      <span className="ad-estado__icone"><Icone nome="i-lista" pequeno={false} /></span>
      <h3>{titulo}</h3>
      {texto && <p>{texto}</p>}
      {acao}
    </div>
  );
}

export function ErroNaTela({ titulo = 'Não deu para carregar', texto, aoTentar }: { titulo?: string; texto?: string; aoTentar?: () => void }) {
  return (
    <div className="ad-estado" role="alert">
      <span className="ad-estado__icone ad-estado__icone--erro"><Icone nome="i-alerta" pequeno={false} /></span>
      <h3>{titulo}</h3>
      <p>{texto ?? 'Confira a internet. O que você digitou continua na tela.'}</p>
      {aoTentar && <button type="button" className="ad-btn" onClick={aoTentar}>Tentar de novo</button>}
    </div>
  );
}

export function SemPermissaoNoPainel() {
  return (
    <div className="ad-estado">
      <span className="ad-estado__icone"><Icone nome="i-cadeado" pequeno={false} /></span>
      <h3>Só o dono vê isto</h3>
      <p>Esta parte mostra dinheiro da academia. Peça ao dono, se precisar.</p>
    </div>
  );
}
