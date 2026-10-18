/**
 * A GRADE "tipo Excel" dos lançamentos (RA4), com o teclado do AK
 * (AK-ADMIN-TELAS.md, seção 2). A tela só desenha e anda; o que cada célula
 * aceita é do domínio (`editarCelula`, `colarNaGrade`, `textoDaCelula`).
 *
 * Teclado (foco único: só a célula ativa tem tabindex 0, o padrão de grade da ARIA):
 * - setas, Home, End, Ctrl+Home, Ctrl+End andam; Shift + setas selecionam um intervalo;
 * - Shift+Espaço marca a linha; Delete arquiva as marcadas;
 * - Enter ou F2 editam; começar a digitar abre a edição com a tecla; duplo clique edita;
 * - na edição: Enter grava e desce, Shift+Enter grava e sobe, Tab e Shift+Tab gravam e andam, Esc cancela;
 * - Ctrl+Z, Ctrl+Y e Ctrl+Shift+Z desfazem e refazem (quem guarda a pilha é a tela);
 * - Ctrl+V: um valor só vira o valor da célula (ou de todas as do intervalo marcado); uma COLUNA de
 *   valores preenche para baixo a partir da célula, como no Excel; várias colunas com tabulação viram
 *   linhas novas, conferidas antes de gravar;
 * - Ctrl+C copia o intervalo como texto com tabulação (cola no Excel; a saída vai com o sinal de menos);
 * - Ctrl+D copia a primeira célula do intervalo para as de baixo; Ctrl+A marca a grade inteira;
 * - Delete limpa categoria, forma e pessoa da célula (ou do intervalo); com linhas marcadas, arquiva;
 *   Backspace abre a célula vazia;
 * - clicar noutra célula durante a edição grava e vai para ela;
 * - Ctrl+Enter: linha nova no topo, com o cursor na descrição.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent, type ReactNode } from 'react';
import { formatarDinheiro } from '@dominio/financeiro/dinheiro.ts';
import { COLUNAS_DA_GRADE, ROTULO_DA_COLUNA, colarNaGrade, editarCelula, textoDaCelula, type ColunaDaGrade, type ContextoDaGrade } from '@dominio/financeiro/grade.ts';
import { lerCSV } from '@dominio/financeiro/importacao.ts';
import { ROTULO_DA_FORMA, ROTULO_DO_TIPO } from '@dominio/financeiro/nomes.ts';
import type { Cobranca, Lancamento } from '@dominio/financeiro/tipos.ts';
import { diaMes } from '../util/formatar.ts';
import { Icone, Selo } from './basicos.tsx';

export type LinhaDaGrade =
  | { tipo: 'lancamento'; l: Lancamento; nova?: boolean }
  | { tipo: 'rascunho'; l: Lancamento }
  | { tipo: 'cobranca'; c: Cobranca; descricao: string; pessoa: string };

type Coluna = ColunaDaGrade | 'origem';
const COLS: { k: Coluna; rot: string; larg?: number; cls?: string }[] = [
  ...COLUNAS_DA_GRADE.map((k) => ({
    k, rot: k === 'forma' ? 'Forma' : ROTULO_DA_COLUNA[k],
    ...(k === 'descricao' ? { cls: 'ad-c-desc' } : k === 'valor' ? { cls: 'ad-c-val', larg: 128 } : {}),
    ...(k === 'tipo' ? { larg: 80 } : k === 'forma' ? { larg: 136 } : k === 'situacao' ? { larg: 112 } : k === 'data' ? { larg: 80 } : {}),
  })),
  { k: 'origem', rot: 'Origem', larg: 168 },
];

export interface Colagem {
  linhas: { lancamento?: Lancamento; erros: string[] }[];
  brutos: string[][];
  inicio: number;
}

export interface PropsDaGrade {
  linhas: LinhaDaGrade[];
  ctx: ContextoDaGrade & { academiaId: string; porId: string; em: () => string; gerarId: () => string };
  travado: boolean;
  rotulo: string;
  /** Grava uma ação (uma ou várias linhas). Devolve se gravou. */
  aoGravar: (mudancas: { antes?: Lancamento; depois: Lancamento }[], descricao: string) => Promise<boolean>;
  aoTravado: () => void;
  aoAvisar: (texto: string) => void;
  aoPagar: (c: Cobranca) => void;
  aoDesfazer: () => void;
  aoRefazer: () => void;
  aoNovaLinha: () => void;
  aoRascunho: (l: Lancamento | null) => void;
  marcadas: ReadonlySet<string>;
  aoMarcar: (ids: ReadonlySet<string>) => void;
  /** Rodapé fixo (os totais). */
  rodape?: ReactNode;
  /** Muda quando a tela quer a edição aberta numa célula (linha nova). */
  pedidoDeEdicao?: { r: number; c: ColunaDaGrade; chave: number; editar?: boolean } | null;
  aoStatus?: (s: { editando: boolean; celula: string; colagem: Colagem | null }) => void;
  colagem: Colagem | null;
  aoColagem: (c: Colagem | null) => void;
}

const idDaLinha = (x: LinhaDaGrade) => (x.tipo === 'cobranca' ? `c:${x.c.id}` : x.l.id);

function textoMostrado(x: LinhaDaGrade, k: Coluna, ctx: ContextoDaGrade, travado: boolean): ReactNode {
  if (x.tipo === 'cobranca') {
    const c = x.c;
    switch (k) {
      case 'data': return diaMes(c.vencimento);
      case 'descricao': return x.descricao;
      case 'categoria': return c.tipo === 'matricula' ? 'Taxas de matrícula' : 'Mensalidades';
      case 'tipo': return 'Entrada';
      case 'valor': return <span className="pos">{formatarDinheiro(c.valorCentavos)}</span>;
      case 'forma': return <span className="sec">—</span>;
      case 'pessoa': return x.pessoa;
      case 'situacao': return <Selo tom="pend">Pendente</Selo>;
      case 'origem': return null;
    }
  }
  const l = x.l;
  switch (k) {
    case 'data': return diaMes(l.data);
    case 'valor': return l.valorCentavos ? <span className={l.tipo === 'saida' ? 'neg' : 'pos'}>{l.tipo === 'saida' ? '−' : ''}{formatarDinheiro(l.valorCentavos)}</span> : <span className="sec">—</span>;
    case 'tipo': return ROTULO_DO_TIPO[l.tipo];
    case 'forma': return l.formaDePagamento ? ROTULO_DA_FORMA[l.formaDePagamento] : <span className="sec">—</span>;
    case 'pessoa': return textoDaCelula(l, 'pessoa', ctx) || <span className="sec">—</span>;
    case 'situacao': return l.situacao === 'pago' ? <Selo tom="ok">Pago</Selo> : <Selo tom="pend">Pendente</Selo>;
    case 'origem':
      if (travado) return <span className="ad-origem"><Icone nome="i-cadeado" />mês fechado</span>;
      if (x.tipo === 'rascunho' || (x.tipo === 'lancamento' && x.nova)) return <Selo tom="marca">nova</Selo>;
      return (
        <span className="ad-origem">
          {l.origem === 'mensalidade' ? <Icone nome="i-trocar" /> : l.origem === 'despesa_fixa' ? <Icone nome="i-relogio" /> : null}
          {{ mensalidade: 'gerada da matrícula', despesa_fixa: l.estimado ? 'despesa fixa · estimado' : 'despesa fixa', remuneracao: 'remuneração', importacao: 'importada', manual: l.eventoId ? 'evento' : 'digitada' }[l.origem]}
        </span>
      );
    default: return textoDaCelula(l, k, ctx);
  }
}

export function Grade(p: PropsDaGrade) {
  const { linhas, ctx, travado, colagem } = p;
  const tabela = useRef<HTMLTableElement>(null);
  const [ativa, setAtiva] = useState({ r: 0, c: 4 });
  const [ancora, setAncora] = useState<{ r: number; c: number } | null>(null);
  const [edicao, setEdicao] = useState<{ r: number; c: number; texto: string; erro?: string } | null>(null);
  // a edição que já foi gravada: o blur que chega DEPOIS do Enter (o campo some da tela) não grava de novo (AO)
  const jaGravadas = useRef(new WeakSet<object>());

  // as linhas da colagem vêm por cima, marcadas como novas
  const vistas = useMemo(() => {
    if (!colagem) return linhas.map((x) => ({ x, colada: null as null | { erros: string[]; bruto: string[]; semLinha: boolean } }));
    const coladas = colagem.linhas.map((cl, i) => {
      const base: Lancamento = cl.lancamento ?? { id: `colada-${i}`, academiaId: ctx.academiaId, data: ctx.hoje, descricao: '', tipo: 'entrada', valorCentavos: 0, situacao: 'pago', origem: 'manual', criadoPor: ctx.porId, criadoEm: '', atualizadoEm: '' };
      return { x: { tipo: 'lancamento' as const, l: base, nova: true }, colada: { erros: cl.erros, bruto: colagem.brutos[i] ?? [], semLinha: !cl.lancamento } };
    });
    return [...coladas, ...linhas.map((x) => ({ x, colada: null }))];
  }, [linhas, colagem, ctx]);

  const nLinhas = vistas.length;
  const r = Math.min(ativa.r, Math.max(0, nLinhas - 1));

  useEffect(() => {
    p.aoStatus?.({ editando: !!edicao, celula: `${COLS[ativa.c]!.rot}, linha ${r + 1}`, colagem });
  }, [edicao, ativa.c, r, colagem]); // eslint-disable-line react-hooks/exhaustive-deps

  // a linha nova (Ctrl+Enter) abre editando a descrição (ajuste de estado na renderização, sem efeito)
  const [ultimoPedido, setUltimoPedido] = useState<number | null>(null);
  if (p.pedidoDeEdicao && p.pedidoDeEdicao.chave !== ultimoPedido) {
    const c = COLS.findIndex((x) => x.k === p.pedidoDeEdicao!.c);
    setUltimoPedido(p.pedidoDeEdicao.chave);
    setAtiva({ r: p.pedidoDeEdicao.r, c });
    setAncora(null);
    if (p.pedidoDeEdicao.editar !== false) setEdicao({ r: p.pedidoDeEdicao.r, c, texto: '' });
  }
  useLayoutEffect(() => { if (p.pedidoDeEdicao && tabela.current) tabela.current.dataset.focar = '1'; }, [p.pedidoDeEdicao]);

  // o foco segue a célula ativa (e o input, na edição)
  useLayoutEffect(() => {
    const t = tabela.current;
    if (!t || !t.contains(document.activeElement) && document.activeElement !== document.body && !t.dataset.focar) return;
    delete t.dataset.focar;
    const alvo = edicao ? t.querySelector<HTMLInputElement>('td.ad-editando input') : t.querySelector<HTMLElement>(`td[data-r="${r}"][data-c="${ativa.c}"]`);
    if (alvo && document.activeElement !== alvo) {
      alvo.focus({ preventScroll: false });
      alvo.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
      if (alvo instanceof HTMLInputElement) alvo.setSelectionRange(alvo.value.length, alvo.value.length);
    }
  }, [r, ativa.c, edicao, nLinhas]);

  const linhaEm = (i: number) => vistas[i]?.x;
  const mover = (nr: number, nc: number, estender = false) => {
    const rr = Math.max(0, Math.min(nLinhas - 1, nr));
    const cc = Math.max(0, Math.min(COLS.length - 1, nc));
    if (estender) setAncora((a) => a ?? { r, c: ativa.c });
    else setAncora(null);
    if (tabela.current) tabela.current.dataset.focar = '1';
    setAtiva({ r: rr, c: cc });
  };

  function abrirEdicao(inicial?: string) {
    const x = linhaEm(r);
    const col = COLS[ativa.c]!;
    if (!x || col.k === 'origem') return;
    if (travado) { p.aoTravado(); return; }
    if (colagem && vistas[r]?.colada) { p.aoAvisar('A linha colada ainda não foi gravada: grave ou cancele a colagem.'); return; }
    if (x.tipo === 'cobranca') { p.aoAvisar('Esta linha é uma cobrança em aberto: use "Marcar como paga".'); return; }
    const texto = inicial ?? (col.k === 'valor' && !x.l.valorCentavos ? '' : textoDaCelula(x.l, col.k, ctx));
    if (tabela.current) tabela.current.dataset.focar = '1';
    setEdicao({ r, c: ativa.c, texto });
  }

  /**
   * Grava a edição. Devolve NA HORA se pode sair da célula (a conferência é
   * do domínio e não espera o servidor): o cursor anda já, como no Excel, e a
   * gravação segue por trás. Antes (AO) o cursor esperava o "Salvando…" e as
   * setas apertadas nesse meio-tempo andavam a partir da célula velha.
   */
  function gravarEdicao(): boolean {
    if (!edicao || jaGravadas.current.has(edicao)) return true;
    const x = linhaEm(edicao.r);
    const col = COLS[edicao.c]!.k as ColunaDaGrade;
    if (!x || x.tipo === 'cobranca') { setEdicao(null); return true; }
    const res = editarCelula(x.l, col, edicao.texto, ctx);
    if (!res.ok) { setEdicao({ ...edicao, erro: res.erro }); return false; }
    jaGravadas.current.add(edicao);
    const depois = res.lancamento;
    if (x.tipo === 'rascunho') {
      setEdicao(null);
      p.aoRascunho(depois);
      if (depois.descricao && depois.valorCentavos) {
        void p.aoGravar([{ depois: { ...depois, criadoEm: ctx.em(), atualizadoEm: ctx.em() } }], `Linha nova "${depois.descricao}"`)
          .then((ok) => { if (ok) p.aoRascunho(null); });
      }
      return true;
    }
    setEdicao(null);
    if (JSON.stringify(depois) === JSON.stringify(x.l)) return true;
    const rot = ROTULO_DA_COLUNA[col];
    const { r: er, c: ec } = edicao;
    void p.aoGravar([{ antes: x.l, depois }], `${rot} de "${x.l.descricao}" mudou para ${textoDaCelula(depois, col, ctx) || 'vazio'}`).then((ok) => {
      if (!ok) return;
      const td = tabela.current?.querySelector(`td[data-r="${er}"][data-c="${ec}"]`);
      td?.classList.remove('ad-gravou'); void (td as HTMLElement | undefined)?.offsetWidth; td?.classList.add('ad-gravou');
    });
    return true;
  }

  function teclaNaEdicao(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setEdicao(null); if (tabela.current) tabela.current.dataset.focar = '1'; if (linhaEm(r)?.tipo === 'rascunho' && !(linhaEm(r) as { l: Lancamento }).l.descricao) p.aoRascunho(null); return; }
    const anda = e.key === 'Enter' ? [e.shiftKey ? -1 : 1, 0] : e.key === 'Tab' ? [0, e.shiftKey ? -1 : 1] : null;
    if (!anda) return;
    e.preventDefault();
    e.stopPropagation();
    const { r: er, c: ec } = edicao!;
    if (gravarEdicao()) mover(er + anda[0]!, ec + anda[1]!);
  }

  function copiar(): string {
    const a = ancora ?? { r, c: ativa.c };
    const [r1, r2] = [Math.min(a.r, r), Math.max(a.r, r)];
    const [c1, c2] = [Math.min(a.c, ativa.c), Math.max(a.c, ativa.c)];
    const out: string[] = [];
    for (let i = r1; i <= r2; i++) {
      const x = linhaEm(i);
      if (!x || x.tipo === 'cobranca') continue;
      const cel: string[] = [];
      for (let j = c1; j <= c2; j++) {
        const k = COLS[j]!.k;
        // a saída vai negativa: somar a coluna no Excel dá o resultado (AO)
        cel.push(k === 'origem' ? '' : k === 'valor' && x.l.tipo === 'saida' ? `-${textoDaCelula(x.l, k, ctx)}` : textoDaCelula(x.l, k, ctx));
      }
      out.push(cel.join('\t'));
    }
    return out.join('\r\n');
  }

  function tecla(e: KeyboardEvent<HTMLTableElement>) {
    if (edicao) return;
    const ctrl = e.ctrlKey || e.metaKey;
    const k = e.key;
    if (ctrl && (k === 'z' || k === 'Z')) { e.preventDefault(); if (e.shiftKey) p.aoRefazer(); else p.aoDesfazer(); return; }
    if (ctrl && (k === 'y' || k === 'Y')) { e.preventDefault(); p.aoRefazer(); return; }
    if (ctrl && k === 'Enter') { e.preventDefault(); if (travado) p.aoTravado(); else p.aoNovaLinha(); return; }
    if (ctrl && (k === 'a' || k === 'A')) { e.preventDefault(); setAncora({ r: 0, c: 0 }); setAtiva({ r: nLinhas - 1, c: COLS.length - 1 }); if (tabela.current) tabela.current.dataset.focar = '1'; return; }
    if (ctrl && (k === 'd' || k === 'D')) { e.preventDefault(); preencherParaBaixo(); return; }
    if (ctrl && (k === 'c' || k === 'C')) { const t = copiar(); if (t && navigator.clipboard) { e.preventDefault(); void navigator.clipboard.writeText(t).then(() => p.aoAvisar('Copiado. Cole no Excel com Ctrl+V.')); } return; }
    if (k === 'Escape' && colagem) { e.preventDefault(); p.aoColagem(null); return; }
    const mapa: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (mapa[k]) { e.preventDefault(); const [dr, dc] = mapa[k]!; mover(r + dr, ativa.c + dc, e.shiftKey); return; }
    if (k === 'Home') { e.preventDefault(); mover(ctrl ? 0 : r, 0); return; }
    if (k === 'End') { e.preventDefault(); mover(ctrl ? nLinhas - 1 : r, COLS.length - 1); return; }
    if (k === 'PageDown' || k === 'PageUp') { e.preventDefault(); mover(r + (k === 'PageDown' ? 10 : -10), ativa.c); return; }
    if (k === 'Tab') { e.preventDefault(); mover(r, ativa.c + (e.shiftKey ? -1 : 1)); return; }
    if (k === ' ' && e.shiftKey) { e.preventDefault(); marcar(r); return; }
    if (k === 'Enter' || k === 'F2') { e.preventDefault(); if (COLS[ativa.c]!.k === 'origem') { const x = linhaEm(r); if (x?.tipo === 'cobranca') p.aoPagar(x.c); return; } abrirEdicao(); return; }
    if (k === 'Delete' && p.marcadas.size) { e.preventDefault(); arquivarMarcadas(); return; }
    if (k === 'Delete') { e.preventDefault(); limparIntervalo(); return; }
    if (k === 'Backspace' && !ctrl) { e.preventDefault(); abrirEdicao(''); return; }
    if (k.length === 1 && !ctrl && !e.altKey) { e.preventDefault(); abrirEdicao(k); }
  }

  /** O intervalo marcado (ou só a célula ativa), em linhas e colunas da tela. */
  function intervalo() {
    const a = ancora ?? { r, c: ativa.c };
    return { r1: Math.min(a.r, r), r2: Math.max(a.r, r), c1: Math.min(a.c, ativa.c), c2: Math.max(a.c, ativa.c) };
  }

  /**
   * Aplica um texto por célula (linha, coluna) como UMA ação (um Ctrl+Z
   * desfaz tudo). Se uma célula não aceita, nada é gravado e a primeira que
   * recusou é dita. Só linhas de lançamento já gravadas; a cobrança, a linha
   * colada ainda sem gravar e a coluna Origem ficam de fora.
   */
  function aplicarEmVarias(celulas: { i: number; k: ColunaDaGrade; texto: string }[], descricao: string): void {
    if (travado) { p.aoTravado(); return; }
    const porLinha = new Map<number, Lancamento>();
    for (const { i, k, texto } of celulas) {
      const x = linhaEm(i);
      if (!x || x.tipo !== 'lancamento' || vistas[i]?.colada) continue;
      const atual = porLinha.get(i) ?? x.l;
      const res = editarCelula(atual, k, texto, ctx);
      if (!res.ok) { p.aoAvisar(`Linha ${i + 1}, ${ROTULO_DA_COLUNA[k]}: ${res.erro} Nada foi mudado.`); return; }
      porLinha.set(i, res.lancamento);
    }
    const mudancas = [...porLinha.entries()]
      .map(([i, depois]) => ({ antes: (linhaEm(i) as { l: Lancamento }).l, depois }))
      .filter((m) => JSON.stringify(m.antes) !== JSON.stringify(m.depois));
    if (!mudancas.length) { p.aoAvisar('Nada mudou.'); return; }
    void p.aoGravar(mudancas, `${descricao} (${mudancas.length} ${mudancas.length === 1 ? 'linha' : 'linhas'})`);
  }

  const editaveis = (c1: number, c2: number) => COLS.slice(c1, c2 + 1).map((x) => x.k).filter((k): k is ColunaDaGrade => k !== 'origem');

  /** Delete: limpa o que pode ficar vazio (categoria, forma, pessoa). */
  function limparIntervalo() {
    const { r1, r2, c1, c2 } = intervalo();
    const ks = editaveis(c1, c2).filter((k) => k === 'categoria' || k === 'forma' || k === 'pessoa');
    if (!ks.length) { p.aoAvisar('Esta coluna não fica vazia. Para arquivar a linha, marque com Shift+Espaço e aperte Delete.'); return; }
    const celulas = [];
    for (let i = r1; i <= r2; i++) for (const k of ks) celulas.push({ i, k, texto: '' });
    aplicarEmVarias(celulas, `Apagado: ${ks.map((k) => ROTULO_DA_COLUNA[k].toLowerCase()).join(', ')}`);
  }

  /** Ctrl+D: a primeira célula do intervalo desce para as outras. */
  function preencherParaBaixo() {
    const { r1, r2, c1, c2 } = intervalo();
    const topo = linhaEm(r1);
    if (r2 === r1 || !topo || topo.tipo === 'cobranca') { p.aoAvisar('Marque com Shift+↓ as células de baixo e aperte Ctrl+D.'); return; }
    const celulas = [];
    for (const k of editaveis(c1, c2)) {
      const texto = textoDaCelula(topo.l, k, ctx);
      const comSinal = k === 'valor' && topo.l.tipo === 'saida' ? `-${texto}` : texto;
      for (let i = r1 + 1; i <= r2; i++) celulas.push({ i, k, texto: comSinal });
    }
    aplicarEmVarias(celulas, 'Preenchido para baixo');
  }

  function marcar(i: number) {
    const x = linhaEm(i);
    if (!x || x.tipo !== 'lancamento' || vistas[i]?.colada) return;
    const novo = new Set(p.marcadas);
    if (novo.has(x.l.id)) novo.delete(x.l.id); else novo.add(x.l.id);
    p.aoMarcar(novo);
  }

  function arquivarMarcadas() {
    if (travado) { p.aoTravado(); return; }
    const ls = linhas.filter((x): x is { tipo: 'lancamento'; l: Lancamento } => x.tipo === 'lancamento' && p.marcadas.has(x.l.id)).map((x) => x.l);
    if (!ls.length) return;
    void p.aoGravar(ls.map((l) => ({ antes: l, depois: { ...l, arquivado: true } })), `${ls.length} ${ls.length === 1 ? 'linha arquivada' : 'linhas arquivadas'}`).then((ok) => { if (ok) p.aoMarcar(new Set()); });
  }

  function colar(e: ClipboardEvent<HTMLTableElement>) {
    if (edicao) return;
    const texto = e.clipboardData.getData('text/plain');
    if (!texto) return;
    e.preventDefault();
    if (travado) { p.aoTravado(); return; }
    const limpo = texto.replace(/\r?\n$/, '');
    const col = COLS[ativa.c]!.k;
    if (!/[\t\r\n]/.test(limpo)) {
      const x = linhaEm(r);
      if (!x || x.tipo === 'cobranca' || col === 'origem') { p.aoAvisar('Cole numa célula de lançamento.'); return; }
      const iv = intervalo();
      if (ancora && (iv.r1 !== iv.r2 || iv.c1 !== iv.c2)) {
        // um valor com várias células marcadas: vai para todas, como no Excel (AO)
        const celulas = [];
        for (let i = iv.r1; i <= iv.r2; i++) for (const k of editaveis(iv.c1, iv.c2)) celulas.push({ i, k, texto: limpo });
        aplicarEmVarias(celulas, `Colado "${limpo}"`);
        return;
      }
      // um valor só: vira o valor da célula
      const res = editarCelula(x.l, col, limpo, ctx);
      if (!res.ok) { setEdicao({ r, c: ativa.c, texto: limpo, erro: res.erro }); return; }
      if (x.tipo === 'rascunho') { p.aoRascunho(res.lancamento); return; }
      void p.aoGravar([{ antes: x.l, depois: res.lancamento }], `Colado em ${ROTULO_DA_COLUNA[col]} de "${x.l.descricao}"`);
      return;
    }
    if (!limpo.includes('\t') && col !== 'origem') {
      // uma COLUNA de valores (sem tabulação): preenche para baixo a partir da célula, como no
      // Excel. Antes (AO) cada valor virava uma linha nova sem descrição, toda com erro.
      const valores = lerCSV(limpo, '\t').map((l) => l[0] ?? '');
      const cabe = valores.every((_, j) => { const x = linhaEm(r + j); return !!x && x.tipo === 'lancamento' && !vistas[r + j]?.colada; });
      if (!cabe) {
        p.aoAvisar(`São ${valores.length} valores e não há ${valores.length} linhas de lançamento seguidas a partir desta. Nada foi mudado.`);
        return;
      }
      aplicarEmVarias(valores.map((texto, j) => ({ i: r + j, k: col, texto })), `Colada a coluna ${ROTULO_DA_COLUNA[col]}`);
      return;
    }
    const inicio = col === 'origem' ? 0 : COLUNAS_DA_GRADE.indexOf(col);
    const res = colarNaGrade(limpo, COLUNAS_DA_GRADE[inicio]!, { ...ctx, em: ctx.em(), gerarId: ctx.gerarId });
    p.aoColagem({ linhas: res.linhas, brutos: lerCSV(limpo, '\t'), inicio });
    setAncora(null);
    setAtiva({ r: Math.max(0, res.linhas.findIndex((x) => x.erros.length)), c: inicio });
  }

  const dentro = (i: number, j: number) => {
    if (!ancora) return false;
    return i >= Math.min(ancora.r, r) && i <= Math.max(ancora.r, r) && j >= Math.min(ancora.c, ativa.c) && j <= Math.max(ancora.c, ativa.c) && !(i === r && j === ativa.c);
  };

  /** A coluna de cada erro da linha colada ("Coluna Data: …" → data). */
  const colunaDoErro = (erro: string): ColunaDaGrade | undefined => COLUNAS_DA_GRADE.find((k) => erro.startsWith(`Coluna ${ROTULO_DA_COLUNA[k]}:`));

  return (
    <div className="lista ad-grade-rola">
      <table className="ad-grade" role="grid" aria-label={p.rotulo} aria-readonly={travado || undefined} aria-rowcount={nLinhas + 1} ref={tabela} onKeyDown={tecla} onPaste={colar}>
        <thead>
          <tr>
            <th scope="col" className="ad-c-num">#</th>
            {COLS.map((c) => <th scope="col" key={c.k} style={c.larg ? { width: c.larg } : undefined} className={c.k === 'valor' ? 'dir' : undefined}>{c.rot}</th>)}
          </tr>
        </thead>
        <tbody>
          {vistas.map(({ x, colada }, i) => {
            const id = idDaLinha(x);
            const marcada = x.tipo === 'lancamento' && p.marcadas.has(x.l.id);
            const cls = [colada || x.tipo === 'rascunho' ? 'ad-linha-nova' : '', travado ? 'ad-linha-travada' : '', x.tipo === 'cobranca' ? 'ad-linha-virtual' : ''].filter(Boolean).join(' ');
            return (
              <tr key={colada ? `colada-${i}` : id} aria-selected={marcada || undefined} className={cls || undefined} aria-rowindex={i + 2}>
                <td className="ad-c-num" role="rowheader" onClick={() => marcar(i)} title="Marcar a linha (Shift+Espaço)">{i + 1}</td>
                {COLS.map((c, j) => {
                  const at = i === r && j === ativa.c;
                  const editando = !!edicao && edicao.r === i && edicao.c === j;
                  const erroColado = colada?.erros.find((er) => colunaDoErro(er) === c.k) ?? (colada && c.k === 'descricao' ? colada.erros.find((er) => !colunaDoErro(er)) : undefined);
                  const classes = [c.cls ?? '', at ? 'ad-ativa' : '', editando ? 'ad-editando campo__caixa' : '', erroColado || (editando && edicao!.erro) ? 'ad-erro-cel' : '', dentro(i, j) ? 'ad-intervalo' : ''].filter(Boolean).join(' ');
                  const idErro = `erro-${i}-${j}`;
                  return (
                    <td
                      key={c.k} role="gridcell" data-r={i} data-c={j} tabIndex={editando ? undefined : at ? 0 : -1} className={classes || undefined}
                      aria-readonly={travado || x.tipo === 'cobranca' || c.k === 'origem' || undefined}
                      aria-invalid={erroColado || (editando && edicao!.erro) ? true : undefined}
                      aria-describedby={erroColado || (editando && edicao!.erro) ? idErro : undefined}
                      onMouseDown={(e) => {
                        if (editando) return;
                        // clicar noutra célula com a edição aberta grava e vai para ela, como no Excel (AO)
                        if (edicao) { e.preventDefault(); if (!gravarEdicao()) return; }
                        if (e.shiftKey) { setAncora((a) => a ?? { r, c: ativa.c }); } else setAncora(null);
                        if (tabela.current) tabela.current.dataset.focar = '1';
                        setAtiva({ r: i, c: j });
                      }}
                      onDoubleClick={() => { if (!editando) abrirEdicao(); }}
                    >
                      {editando ? (
                        <>
                          <input
                            aria-label={`${c.rot}, linha ${i + 1}`} value={edicao!.texto} onKeyDown={teclaNaEdicao}
                            onChange={(e) => setEdicao({ ...edicao!, texto: e.target.value, erro: undefined })}
                            onBlur={(e) => { if (!tabela.current?.contains(e.relatedTarget as Node)) gravarEdicao(); }}
                            inputMode={c.k === 'valor' ? 'decimal' : undefined}
                          />
                          {edicao!.erro && <span className="ad-celmsg ad-cel-erro" id={idErro} role="alert"><Icone nome="i-alerta" />{edicao!.erro}</span>}
                        </>
                      ) : erroColado ? (
                        <span className="ad-celmsg" id={idErro}><Icone nome="i-alerta" />{(colada!.bruto[j - colagem!.inicio] ?? '').trim() || '—'} · {erroColado.replace(/^Coluna [^:]+: /, '').replace(/\.$/, '')}</span>
                      ) : c.k === 'origem' && x.tipo === 'cobranca' ? (
                        <button type="button" className="ad-btn" tabIndex={-1} onClick={() => p.aoPagar(x.c)}>Marcar como paga</button>
                      ) : colada?.semLinha && c.k !== 'origem' ? (
                        <span className={c.k === 'valor' ? 'pos' : undefined}>{(colada.bruto[j - colagem!.inicio] ?? '').trim() || <span className="sec">—</span>}</span>
                      ) : colada && c.k === 'origem' ? (
                        colada.erros.length ? <Selo tom="erro">com erro</Selo> : <Selo tom="marca">nova</Selo>
                      ) : textoMostrado(x, c.k, ctx, travado)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        {p.rodape}
      </table>
    </div>
  );
}

export { COLS as COLUNAS_DA_TELA };
