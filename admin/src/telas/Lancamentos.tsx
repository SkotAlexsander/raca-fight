/**
 * FINANCEIRO › LANÇAMENTOS: a planilha (RA4). No PC, a grade do AK com a
 * barra de filtros, o lote, os totais fixos e a barra de status; no celular,
 * a lista por dia com a edição numa folha. As cobranças abertas do mês
 * aparecem na grade com "Marcar como paga" (não são linhas ainda: viram linha
 * quando pagas, RA4.7).
 */

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { somarMeses, periodoDaCompetencia, formatarDataBR } from '@dominio/financeiro/datas.ts';
import { exportarLancamentos } from '@dominio/financeiro/exportacao.ts';
import { mesFechado } from '@dominio/financeiro/fechamento.ts';
import { cobrancaPassaNoFiltro, filtrarLancamentos, type FiltroDeLancamentos } from '@dominio/financeiro/filtros.ts';
import { lerDinheiro } from '@dominio/financeiro/dinheiro.ts';
import { desfazer, pilhaVazia, refazer, registrarAcao, type ColunaDaGrade, type PilhaDeDesfazer } from '@dominio/financeiro/grade.ts';
import { ROTULO_DA_FORMA, acharPorNome } from '@dominio/financeiro/nomes.ts';
import { totaisDoPeriodo } from '@dominio/financeiro/totais.ts';
import { FORMAS_DE_PAGAMENTO, type Cobranca, type Lancamento, type SituacaoDoLancamento, type TipoDeLancamento } from '@dominio/financeiro/tipos.ts';
import { Campo, Gaveta, Icone, Vazio } from '../componentes/basicos.tsx';
import { GerarMensalidades } from '../componentes/gerar-mensalidades.tsx';
import { Grade, type Colagem, type LinhaDaGrade } from '../componentes/Grade.tsx';
import { GavetaPagar } from '../componentes/pagar.tsx';
import { EdicaoNoCelular, ListaPorDia } from '../componentes/lista-celular.tsx';
import { GavetaReabrir } from './Fechamento.tsx';
import { categoriaDaCobranca } from '../dados/local/repositorio-local.ts';
import { useEnvio } from '../estado/envio.ts';
import { useDados, useLoja } from '../estado/loja.tsx';
import { ir } from '../estado/rota.ts';
import { baixarArquivo, nomeDoArquivo } from '../util/baixar.ts';
import { mesTitulo, nomeDoMes, plural, reais, reaisComSinal } from '../util/formatar.ts';
import { agoraNaAcademia, horaDe } from '../util/relogio.ts';

type Filtro = Omit<FiltroDeLancamentos, 'periodo'>;

/** O filtro tem algum critério de verdade? (`{ tipos: [] }` depois de tirar um chip não conta, AO) */
export function filtroAtivo(f: Filtro): boolean {
  return Object.values(f).some((v) => (Array.isArray(v) ? v.length > 0 : v != null && v !== '' && v !== false));
}

/** No celular, o par dos pendentes em reais inteiros ("R$ 5.437 / 1.294"), como o desenho do AK. */
const reaisInteiros = (c: number) => reais(Math.round(c / 100) * 100).replace(/,00$/, '');

export function Lancamentos() {
  const d = useDados();
  const { mes, hoje, executar, avisar, sessao } = useLoja();
  const [filtro, setFiltro] = useState<Filtro>({});
  const [verFiltro, setVerFiltro] = useState(false);
  const [pilha, setPilha] = useState<PilhaDeDesfazer>(pilhaVazia);
  // a pilha e os dados mais novos, para o Desfazer do aviso (que nasce numa renderização antiga)
  const pilhaRef = useRef(pilha);
  const dadosRef = useRef(d);
  useLayoutEffect(() => { pilhaRef.current = pilha; dadosRef.current = d; });
  const [marcadas, setMarcadas] = useState<ReadonlySet<string>>(new Set());
  const [rascunho, setRascunho] = useState<Lancamento | null>(null);
  const [pedido, setPedido] = useState<{ r: number; c: ColunaDaGrade; chave: number; editar?: boolean } | null>(null);
  const [colagem, setColagem] = useState<Colagem | null>(null);
  const [status, setStatus] = useState({ editando: false, celula: 'Valor, linha 1' });
  const [pagar, setPagar] = useState<Cobranca | null>(null);
  const [lote, setLote] = useState<null | 'categoria' | 'forma'>(null);
  const [reabrir, setReabrir] = useState(false);
  const [editarCel, setEditarCel] = useState<Lancamento | null>(null);
  const envio = useEnvio();

  // trocou o mês: as marcadas, a colagem e o rascunho eram do mês de antes (AO: o lote dizia
  // "3 linhas selecionadas" com a soma de zero, e o Delete arquivava linhas que não estavam na tela)
  const [mesVisto, setMesVisto] = useState(mes);
  if (mesVisto !== mes) {
    setMesVisto(mes);
    setMarcadas(new Set());
    setColagem(null);
    setRascunho(null);
  }

  const periodo = periodoDaCompetencia(mes);
  const travado = mesFechado(mes, d.fechamentos);
  const fechamento = d.fechamentos.find((f) => f.competencia === mes && !f.reabertoEm);
  const nome = (id?: string) => d.pessoas.find((p) => p.id === id)?.nome ?? '';
  const dataPadrao = hoje.startsWith(mes) ? hoje : `${mes}-01`;

  const ctx = useMemo(() => ({
    categorias: d.categorias, pessoas: d.pessoas, hoje: dataPadrao, academiaId: d.academia.id, porId: sessao.usuarioId,
    em: agoraNaAcademia, gerarId: () => crypto.randomUUID(),
  }), [d.categorias, d.pessoas, dataPadrao, d.academia.id, sessao.usuarioId]);

  const { linhas, reaisDoFiltro, virtuais } = useMemo(() => {
    const reaisDoFiltro = filtrarLancamentos(d.lancamentos, { ...filtro, periodo });
    // a cobrança aberta segue o MESMO filtro das linhas (AO): texto sem acento, categoria, pessoa, valor…
    const virtuais = d.cobrancas.filter((c) => c.competencia === mes
      && cobrancaPassaNoFiltro(c, filtro, { nomeDaPessoa: nome, categoriaId: categoriaDaCobranca(c, d.categorias) }));
    const todas: (LinhaDaGrade & { chave: string })[] = [
      ...reaisDoFiltro.map((l) => ({ tipo: 'lancamento' as const, l, chave: `${l.data}|${l.criadoEm}` })),
      ...virtuais.map((c) => ({ tipo: 'cobranca' as const, c, descricao: `${c.descricao}${c.alunoPessoaId ? ` (${nome(c.alunoPessoaId)})` : ''}`, pessoa: nome(c.pessoaId), chave: `${c.vencimento}|` })),
    ].sort((a, b) => b.chave.localeCompare(a.chave));
    return { linhas: rascunho ? [{ tipo: 'rascunho' as const, l: rascunho }, ...todas] : todas, reaisDoFiltro, virtuais };
  }, [d.lancamentos, d.cobrancas, d.categorias, filtro, mes, rascunho]); // eslint-disable-line react-hooks/exhaustive-deps

  const t = totaisDoPeriodo(reaisDoFiltro, periodo);
  const aReceber = t.entradasPendentes + virtuais.reduce((s, c) => s + c.valorCentavos, 0);

  // ----- gravar, desfazer e refazer (uma ação = uma transação) -----
  const andarRef = useRef<(sentido: 'desfazer' | 'refazer') => Promise<void>>(async () => {});

  /** Anda na pilha (desfazer ou refazer): passa pelo mesmo caminho de gravar, obedece ao mês fechado e vai ao histórico (RA4.5). */
  const andarNaPilha = useCallback(async (sentido: 'desfazer' | 'refazer'): Promise<void> => {
    const atual = (id: string) => dadosRef.current.lancamentos.find((l) => l.id === id);
    const pilhaAgora = pilhaRef.current;
    const acao = sentido === 'desfazer' ? pilhaAgora.feitos.at(-1) : pilhaAgora.desfeitos.at(-1);
    const r = sentido === 'desfazer' ? desfazer(pilhaAgora) : refazer(pilhaAgora);
    if (!r || !acao) { avisar(sentido === 'desfazer' ? 'Nada para desfazer.' : 'Nada para refazer.'); return; }
    // desfazer uma linha criada = arquivá-la (nada se apaga, RA4.11)
    const mudancas = r.aplicar.map((m) => (m.depois
      ? { antes: atual(m.depois.id), depois: m.depois }
      : { antes: atual(m.antes!.id), depois: { ...(atual(m.antes!.id) ?? m.antes!), arquivado: true } }));
    const g = await executar((repo) => repo.gravarLancamentos(mudancas));
    if (!g.ok) return;
    pilhaRef.current = r.pilha;
    setPilha(r.pilha);
    if (sentido === 'desfazer') avisar(`Desfeito: ${acao.descricao}`, { acao: { rotulo: 'Refazer (Ctrl Y)', fazer: () => void andarRef.current('refazer') } });
    else avisar(`Refeito: ${acao.descricao}`);
  }, [executar, avisar]);
  useLayoutEffect(() => { andarRef.current = andarNaPilha; });
  const desfazerAgora = useCallback(() => andarRef.current('desfazer'), []);
  const refazerAgora = useCallback(() => andarRef.current('refazer'), []);

  const gravar = useCallback(async (mudancas: { antes?: Lancamento; depois: Lancamento }[], descricao: string) => {
    const r = await executar((repo) => repo.gravarLancamentos(mudancas));
    if (!r.ok) return false;
    const nova = registrarAcao(pilhaRef.current, { descricao, mudancas: mudancas.map((m) => ({ ...(m.antes ? { antes: m.antes } : {}), depois: m.depois })) });
    pilhaRef.current = nova;
    setPilha(nova);
    avisar(descricao, { desfazer: () => void desfazerAgora() });
    return true;
  }, [executar, avisar, desfazerAgora]);

  const travou = useCallback(() => {
    avisar(`${mesTitulo(mes).split(' de ')[0]} está fechado: nada foi mudado.`, { tom: 'trava', acao: { rotulo: 'Reabrir com motivo', fazer: () => setReabrir(true) } });
  }, [avisar, mes]);

  function novaLinha() {
    if (travado) { travou(); return; }
    setRascunho({ id: crypto.randomUUID(), academiaId: d.academia.id, data: dataPadrao, descricao: '', tipo: 'entrada', valorCentavos: 0, situacao: 'pago', origem: 'manual', criadoPor: sessao.usuarioId, criadoEm: '', atualizadoEm: '' });
    setPedido({ r: 0, c: 'descricao', chave: Date.now() });
  }

  // duplo clique em "Gravar as 8 linhas" gravava duas vezes (AO): um envio por vez
  const gravarColagem = () => envio.enviar(async () => {
    if (!colagem) return;
    const prontas = colagem.linhas.filter((x) => x.lancamento && !x.erros.length).map((x) => ({ depois: { ...x.lancamento!, criadoEm: agoraNaAcademia(), atualizadoEm: agoraNaAcademia() } }));
    if (!prontas.length) { avisar('Nenhuma linha pronta para gravar.'); return; }
    const ok = await gravar(prontas, `Colar ${plural(prontas.length, 'linha', 'linhas')} do Excel`);
    if (ok) setColagem(null);
  });

  // ----- lote -----
  const linhasMarcadas = reaisDoFiltro.filter((l) => marcadas.has(l.id));
  const somaMarcadas = linhasMarcadas.reduce((s, l) => s + (l.tipo === 'saida' ? -l.valorCentavos : l.valorCentavos), 0);
  const aplicarLote = (mudar: (l: Lancamento) => Lancamento, descricao: string) => envio.enviar(async () => {
    if (travado) { travou(); return; }
    const mudancas = linhasMarcadas.map((l) => ({ antes: l, depois: mudar(l) })).filter((m) => JSON.stringify(m.antes) !== JSON.stringify(m.depois));
    if (!mudancas.length) { avisar('Nada mudou.'); return; }
    const ok = await gravar(mudancas, descricao);
    if (ok) setMarcadas(new Set());
  });

  function exportar() {
    baixarArquivo(nomeDoArquivo('lancamentos', mes), exportarLancamentos(reaisDoFiltro, d));
    avisar(`Exportado: ${plural(reaisDoFiltro.length, 'linha', 'linhas')} em CSV para o Excel.`);
  }

  const mensalidadesGeradas = d.cobrancas.some((c) => c.tipo === 'mensalidade' && c.competencia === mes);
  const compGerar = mensalidadesGeradas ? somarMeses(mes, 1) : mes;
  // a frase do filtro mostra TUDO o que está valendo (AO): antes a forma, o texto e as
  // arquivadas ficavam escondidos, e o total "errado" era só um filtro esquecido
  const nomeCat = (id: string) => (id === 'sem_categoria' ? 'sem categoria' : d.categorias.find((c) => c.id === id)?.nome ?? '');
  const chips: [string, () => void][] = [
    [`Tipo: ${filtro.tipos?.length ? filtro.tipos.map((x) => (x === 'entrada' ? 'entradas' : 'saídas')).join(' e ') : 'todos'}`, () => setFiltro({ ...filtro, tipos: [] })],
    [`Situação: ${filtro.situacoes?.length ? filtro.situacoes.join(' e ') : 'todas'}`, () => setFiltro({ ...filtro, situacoes: [] })],
    ...(filtro.categoriaIds?.length ? [[`Categoria: ${filtro.categoriaIds.map(nomeCat).join(' ou ')}`, () => setFiltro({ ...filtro, categoriaIds: [] })] as [string, () => void]] : []),
    ...(filtro.formas?.length ? [[`Forma: ${filtro.formas.map((f) => ROTULO_DA_FORMA[f]).join(' ou ')}`, () => setFiltro({ ...filtro, formas: [] })] as [string, () => void]] : []),
    ...(filtro.pessoaIds?.length ? [[`Pessoa: ${filtro.pessoaIds.map(nome).join(' ou ')}`, () => setFiltro({ ...filtro, pessoaIds: [] })] as [string, () => void]] : []),
    ...(filtro.valorMin != null || filtro.valorMax != null ? [[`Valor ${filtro.valorMin != null ? `de ${reais(filtro.valorMin)} ` : ''}${filtro.valorMax != null ? `até ${reais(filtro.valorMax)}` : 'para cima'}`.trim(), () => setFiltro({ ...filtro, valorMin: undefined, valorMax: undefined })] as [string, () => void]] : []),
    ...(filtro.texto ? [[`"${filtro.texto}"`, () => setFiltro({ ...filtro, texto: undefined })] as [string, () => void]] : []),
    ...(filtro.incluirArquivados ? [['Com as arquivadas', () => setFiltro({ ...filtro, incluirArquivados: false })] as [string, () => void]] : []),
  ];
  const nColadas = colagem?.linhas.length ?? 0;
  const nErros = colagem?.linhas.filter((x) => x.erros.length).length ?? 0;

  const rodape = (
    <tfoot className="folha-moldura">
      <tr>
        <td className="ad-c-num" />
        <td colSpan={3}>Totais do filtro<span>{plural(reaisDoFiltro.length, 'linha', 'linhas')}{travado ? ' · congelados no fechamento' : ' · as pagas contam no resultado'}</span></td>
        <td>Resultado<span>caixa</span></td>
        <td className="ad-c-val">{reais(t.resultado)}<span>entrou − saiu</span></td>
        <td colSpan={2}>Entrou <b className="pos">{reaisComSinal(t.entradas)}</b><span>Saiu <b className="neg">{reais(-t.saidas)}</b></span></td>
        <td colSpan={2}>Pendentes<span>a receber {reais(aReceber)} · a pagar {reais(t.saidasPendentes)}</span></td>
      </tr>
    </tfoot>
  );

  return (
    <>
      <div className="ad-grade-moldura so-pc">
        {travado && fechamento ? (
          <div className="ad-faixa-aviso ad-faixa-aviso--fechado">
            <Icone nome="i-cadeado" pequeno={false} />
            <p><b>{mesTitulo(mes).split(' de ')[0]} está fechado desde {formatarDataBR(fechamento.fechadoEm.slice(0, 10))}, {horaDe(fechamento.fechadoEm)}, por {nome(fechamento.fechadoPor) || sessao.nome}.</b>Os números estão congelados como foram para o contador. Para mudar uma linha, reabra o mês: o motivo fica no histórico.</p>
            <div className="ad-acoes"><button type="button" className="ad-btn" onClick={() => ir('financeiro', 'fechamento')}>Ver o fechamento</button><button type="button" className="ad-btn" onClick={() => setReabrir(true)}>Reabrir {nomeDoMes(mes)}</button></div>
          </div>
        ) : colagem ? (
          <div className="ad-faixa-aviso" role="status">
            <Icone nome="i-alerta" pequeno={false} />
            <p><b>Você colou {plural(nColadas, 'linha', 'linhas')} do Excel: {nColadas - nErros} {nColadas - nErros === 1 ? 'pronta' : 'prontas'} e {nErros} com erro.</b>Nada foi gravado ainda. As linhas novas estão em vermelho-claro; as células com erro dizem o motivo. Gravar é uma ação só: Ctrl+Z desfaz as {nColadas - nErros}.</p>
            <div className="ad-acoes">
              <button type="button" className="ad-btn ad-btn--primario" onClick={() => void gravarColagem()} disabled={nColadas - nErros === 0 || envio.enviando}>{envio.enviando ? 'Gravando…' : `Gravar as ${nColadas - nErros} linhas`}</button>
              {nErros > 0 && <button type="button" className="ad-btn" onClick={() => setPedido({ r: colagem.linhas.findIndex((x) => x.erros.length), c: 'data', chave: Date.now(), editar: false })}>Ir para a 1ª com erro</button>}
              <button type="button" className="ad-btn" onClick={() => setColagem(null)}>Cancelar <kbd>Esc</kbd></button>
            </div>
          </div>
        ) : (
          <div className="ad-grade-barra">
            <div className="ad-frase">
              <p className="forte">{mesTitulo(mes)} · {filtro.categoriaIds?.length ? plural(filtro.categoriaIds.length, 'categoria', 'categorias') : 'todas as categorias'} · {plural(linhas.length, 'linha', 'linhas')}</p>
              {chips.map(([rot, tirar]) => <span className="ad-chip" key={rot}>{rot}<button type="button" aria-label={`Tirar o filtro: ${rot}`} onClick={tirar}><Icone nome="i-fechar" /></button></span>)}
              <button type="button" className="ad-btn" onClick={() => setVerFiltro(true)}><Icone nome="i-filtro" />Filtrar</button>
            </div>
            <div className="ad-acoes">
              <button type="button" className="ad-btn" onClick={() => void desfazerAgora()} disabled={!pilha.feitos.length}><Icone nome="i-desfazer" />Desfazer <kbd>Ctrl Z</kbd></button>
              <button type="button" className="ad-btn" onClick={exportar}>Exportar CSV</button>
              <GerarMensalidades competencia={compGerar} />
              <button type="button" className="ad-btn ad-btn--primario" onClick={novaLinha}><Icone nome="i-mais" />Linha <kbd>Ctrl Enter</kbd></button>
            </div>
          </div>
        )}
        {linhasMarcadas.length > 0 && !colagem && (
          <div className="ad-lote">
            <p>{plural(linhasMarcadas.length, 'linha selecionada', 'linhas selecionadas')} · soma {reais(somaMarcadas)}</p>
            <button type="button" className="ad-btn" onClick={() => setLote('categoria')}>Mudar categoria</button>
            <button type="button" className="ad-btn" onClick={() => setLote('forma')}>Mudar forma</button>
            <button type="button" className="ad-btn" disabled={envio.enviando} onClick={() => void aplicarLote((l) => ({ ...l, situacao: 'pago' }), `${plural(linhasMarcadas.length, 'linha marcada', 'linhas marcadas')} como pago`)}>Marcar como pago</button>
            <button type="button" className="ad-btn" disabled={envio.enviando} onClick={() => void aplicarLote((l) => ({ ...l, situacao: 'pendente' }), `${plural(linhasMarcadas.length, 'linha marcada', 'linhas marcadas')} como pendente`)}>Marcar como pendente</button>
            <button type="button" className="ad-btn ad-btn--perigo" disabled={envio.enviando} onClick={() => void aplicarLote((l) => ({ ...l, arquivado: true }), plural(linhasMarcadas.length, 'linha arquivada', 'linhas arquivadas'))}>Arquivar</button>
            <button type="button" className="ad-btn ad-btn--plano" onClick={() => setMarcadas(new Set())}>Limpar</button>
          </div>
        )}
        {linhas.length === 0 && !colagem ? (
          <Vazio titulo={filtroAtivo(filtro) ? 'Nenhum lançamento com este filtro' : `Nenhum lançamento em ${nomeDoMes(mes)}`} texto={filtroAtivo(filtro) ? 'O filtro escondeu tudo. Tire um critério.' : 'Comece com uma linha, cole do Excel ou importe a planilha.'}
            acao={<div className="ad-acoes">{filtroAtivo(filtro) && <button type="button" className="ad-btn" onClick={() => setFiltro({})}>Limpar o filtro</button>}<button type="button" className="ad-btn ad-btn--primario" onClick={novaLinha}><Icone nome="i-mais" />Linha</button>{!mensalidadesGeradas && <GerarMensalidades competencia={mes} />}<button type="button" className="ad-btn" onClick={() => ir('financeiro', 'importar')}>Importar planilha</button></div>} />
        ) : (
          <Grade
            linhas={linhas} ctx={ctx} travado={travado} rotulo={`Lançamentos de ${nomeDoMes(mes)}${travado ? ', só leitura' : ''}`}
            aoGravar={gravar} aoTravado={travou} aoAvisar={(x) => avisar(x)} aoPagar={setPagar}
            aoDesfazer={() => void desfazerAgora()} aoRefazer={() => void refazerAgora()} aoNovaLinha={novaLinha} aoRascunho={setRascunho}
            marcadas={marcadas} aoMarcar={setMarcadas} rodape={rodape} pedidoDeEdicao={pedido}
            aoStatus={(s) => setStatus({ editando: s.editando, celula: s.celula })} colagem={colagem} aoColagem={setColagem}
          />
        )}
        <div className="ad-grade-status">
          <span className="ad-gravado">
            {travado ? <><Icone nome="i-cadeado" />Só leitura · {plural(reaisDoFiltro.length, 'linha', 'linhas')}</>
              : colagem ? <><Icone nome="i-alerta" />{plural(nColadas, 'linha', 'linhas')} na prévia · {nColadas - nErros} prontas · {nErros} com erro</>
              : status.editando ? <><Icone nome="i-nuvem" />Editando · Enter grava e desce · Esc cancela</> : <><Icone nome="i-marcar" />Pronto</>}
          </span>
          <span>Célula <b>{status.celula}</b></span>
          <span className="ad-atalhos">
            <span><kbd className="ad-kbd">↑ ↓ ← →</kbd> andar</span><span><kbd className="ad-kbd">Enter</kbd> editar</span><span><kbd className="ad-kbd">Tab</kbd> próxima</span>
            <span><kbd className="ad-kbd">Shift ↑ ↓</kbd> selecionar</span><span><kbd className="ad-kbd">Ctrl V</kbd> colar do Excel</span>
            <span><kbd className="ad-kbd">Ctrl Z</kbd> desfazer</span><span><kbd className="ad-kbd">Ctrl Y</kbd> refazer</span>
          </span>
        </div>
      </div>

      <div className="so-celular">
        <div className="ad-pilha">
          <section className="ad-painel" aria-label={`Totais de ${nomeDoMes(mes)}`}>
            <dl className="ad-numeros" style={{ ['--n' as string]: 2 }}>
              <div className="ad-numero"><dt>Entrou</dt><dd className="pos">{reaisComSinal(t.entradas)}</dd></div>
              <div className="ad-numero"><dt>Saiu</dt><dd className="neg">{reais(-t.saidas)}</dd></div>
              <div className="ad-numero"><dt>Resultado</dt><dd>{reais(t.resultado)}</dd></div>
              <div className="ad-numero"><dt>Pendentes</dt><dd className="ate">{reaisInteiros(aReceber)} / {reaisInteiros(t.saidasPendentes).replace(/^R\$ /, '')}</dd></div>
            </dl>
          </section>
          <div className="ad-acoes">
            <button type="button" className="ad-btn" onClick={() => setVerFiltro(true)}><Icone nome="i-filtro" />Filtrar</button>
            <button type="button" className="ad-btn ad-btn--primario" onClick={() => {
              if (travado) { travou(); return; }
              setEditarCel({ id: crypto.randomUUID(), academiaId: d.academia.id, data: dataPadrao, descricao: '', tipo: 'entrada', valorCentavos: 0, situacao: 'pago', origem: 'manual', criadoPor: sessao.usuarioId, criadoEm: '', atualizadoEm: '' });
            }}><Icone nome="i-mais" />Lançamento</button>
          </div>
          <ListaPorDia linhas={linhas.filter((x) => x.tipo !== 'rascunho')} aoAbrir={(x) => { if (x.tipo === 'cobranca') setPagar(x.c); else if (travado) travou(); else setEditarCel(x.l); }} />
        </div>
      </div>

      {pagar && <GavetaPagar cobranca={pagar} aoFechar={() => setPagar(null)} />}
      {editarCel && <EdicaoNoCelular lancamento={editarCel} ctx={ctx} aoFechar={() => setEditarCel(null)} aoGravar={gravar} novo={!d.lancamentos.some((l) => l.id === editarCel.id)} />}
      {reabrir && <GavetaReabrir competencia={mes} aoFechar={() => setReabrir(false)} />}
      {verFiltro && <GavetaFiltroDeLancamentos filtro={filtro} aoAplicar={(f) => { setFiltro(f); setVerFiltro(false); }} aoFechar={() => setVerFiltro(false)} />}
      {lote && (
        <GavetaLote tipo={lote} aoFechar={() => setLote(null)} aoAplicar={(v) => {
          setLote(null);
          if (lote === 'categoria') {
            const c = d.categorias.find((x) => x.id === v)!;
            void aplicarLote((l) => ({ ...l, categoriaId: c.id, tipo: c.tipo }), `Categoria de ${plural(linhasMarcadas.length, 'linha', 'linhas')} mudou para ${c.nome}`);
          } else void aplicarLote((l) => ({ ...l, formaDePagamento: v as Lancamento['formaDePagamento'] }), `Forma de ${plural(linhasMarcadas.length, 'linha', 'linhas')} mudou para ${ROTULO_DA_FORMA[v as keyof typeof ROTULO_DA_FORMA]}`);
        }} />
      )}
    </>
  );
}

function GavetaLote({ tipo, aoFechar, aoAplicar }: { tipo: 'categoria' | 'forma'; aoFechar: () => void; aoAplicar: (v: string) => void }) {
  const d = useDados();
  const opcoes = tipo === 'categoria'
    ? d.categorias.filter((c) => !c.arquivada).sort((a, b) => a.ordem - b.ordem).map((c) => [c.id, `${c.nome} (${c.tipo === 'entrada' ? 'entrada' : 'saída'})`] as const)
    : FORMAS_DE_PAGAMENTO.map((f) => [f, ROTULO_DA_FORMA[f]] as const);
  const [v, setV] = useState<string>(opcoes[0]![0]);
  return (
    <Gaveta titulo={tipo === 'categoria' ? 'Mudar a categoria' : 'Mudar a forma de pagamento'} aoFechar={aoFechar} rodape={<>
      <button type="button" className="ad-btn ad-btn--grande" onClick={aoFechar}>Cancelar</button>
      <button type="button" className="ad-btn ad-btn--primario ad-btn--grande" onClick={() => aoAplicar(v)}>Aplicar</button>
    </>}>
      <Campo rotulo={tipo === 'categoria' ? 'Categoria' : 'Forma'} ajuda={tipo === 'categoria' ? 'A categoria puxa o tipo (entrada ou saída).' : undefined}>
        {(p) => <select {...p} value={v} onChange={(e) => setV(e.target.value)}>{opcoes.map(([id, rot]) => <option key={id} value={id}>{rot}</option>)}</select>}
      </Campo>
      <p className="ad-anotacao">É uma ação só: Ctrl+Z desfaz todas.</p>
    </Gaveta>
  );
}

function GavetaFiltroDeLancamentos({ filtro, aoAplicar, aoFechar }: { filtro: Filtro; aoAplicar: (f: Filtro) => void; aoFechar: () => void }) {
  const d = useDados();
  const [f, setF] = useState<Filtro>(filtro);
  // pessoa e valor, que a planilha do dono filtra o tempo todo (AO)
  const [pessoa, setPessoa] = useState(filtro.pessoaIds?.length ? d.pessoas.find((p) => p.id === filtro.pessoaIds![0])?.nome ?? '' : '');
  const [de, setDe] = useState(filtro.valorMin != null ? String(filtro.valorMin / 100).replace('.', ',') : '');
  const [ate, setAte] = useState(filtro.valorMax != null ? String(filtro.valorMax / 100).replace('.', ',') : '');
  const [erro, setErro] = useState<string | null>(null);
  function aplicar() {
    const p = pessoa.trim() ? acharPorNome(d.pessoas, pessoa) : undefined;
    if (pessoa.trim() && !p) { setErro('Pessoa não encontrada (ou mais de uma com esse começo).'); return; }
    const vMin = de.trim() ? lerDinheiro(de) : null;
    const vMax = ate.trim() ? lerDinheiro(ate) : null;
    if ((de.trim() && vMin == null) || (ate.trim() && vMax == null)) { setErro('Valor inválido.'); return; }
    if (vMin != null && vMax != null && vMin > vMax) { setErro('O "de" é maior que o "até".'); return; }
    aoAplicar({
      ...f, pessoaIds: p ? [p.id] : [],
      valorMin: vMin != null ? Math.abs(vMin) : undefined, valorMax: vMax != null ? Math.abs(vMax) : undefined,
    });
  }
  const alterna = <T,>(lista: T[] | undefined, v: T) => (lista?.includes(v) ? lista.filter((x) => x !== v) : [...(lista ?? []), v]);
  const caixa = (marcado: boolean, rot: string, mudar: () => void) => (
    <label className="marcar campo__caixa" key={rot}><input type="checkbox" checked={marcado} onChange={mudar} /><span>{rot}</span></label>
  );
  return (
    <Gaveta titulo="Filtrar lançamentos" aoFechar={aoFechar} rodape={<>
      <button type="button" className="ad-btn ad-btn--grande" onClick={() => aoAplicar({})}>Limpar</button>
      <button type="button" className="ad-btn ad-btn--primario ad-btn--grande" onClick={aplicar}>Aplicar</button>
    </>}>
      <Campo rotulo="Texto na descrição">{(p) => <input {...p} value={f.texto ?? ''} onChange={(e) => setF({ ...f, texto: e.target.value })} />}</Campo>
      <Campo rotulo="Pessoa" erro={erro} ajuda="O começo do nome basta. Vale o aluno e quem paga.">{(p) => <input {...p} value={pessoa} onChange={(e) => { setPessoa(e.target.value); setErro(null); }} list="lista-pessoas" autoComplete="off" />}</Campo>
      <div className="ad-par-campos">
        <Campo rotulo="Valor de">{(p) => <input {...p} value={de} onChange={(e) => { setDe(e.target.value); setErro(null); }} inputMode="decimal" placeholder="R$ 0,00" />}</Campo>
        <Campo rotulo="até">{(p) => <input {...p} value={ate} onChange={(e) => { setAte(e.target.value); setErro(null); }} inputMode="decimal" placeholder="sem limite" />}</Campo>
      </div>
      <h3 className="ad-h3">Tipo</h3>
      {(['entrada', 'saida'] as TipoDeLancamento[]).map((x) => caixa(!!f.tipos?.includes(x), x === 'entrada' ? 'Entradas' : 'Saídas', () => setF({ ...f, tipos: alterna(f.tipos, x) })))}
      <h3 className="ad-h3">Situação</h3>
      {(['pago', 'pendente'] as SituacaoDoLancamento[]).map((x) => caixa(!!f.situacoes?.includes(x), x === 'pago' ? 'Pago' : 'Pendente', () => setF({ ...f, situacoes: alterna(f.situacoes, x) })))}
      <h3 className="ad-h3">Categoria</h3>
      {d.categorias.filter((c) => !c.arquivada).sort((a, b) => a.ordem - b.ordem).map((c) => caixa(!!f.categoriaIds?.includes(c.id), c.nome, () => setF({ ...f, categoriaIds: alterna(f.categoriaIds, c.id) })))}
      {caixa(!!f.categoriaIds?.includes('sem_categoria'), 'Sem categoria', () => setF({ ...f, categoriaIds: alterna(f.categoriaIds, 'sem_categoria') }))}
      <h3 className="ad-h3">Forma</h3>
      {FORMAS_DE_PAGAMENTO.map((x) => caixa(!!f.formas?.includes(x), ROTULO_DA_FORMA[x], () => setF({ ...f, formas: alterna(f.formas, x) })))}
      <h3 className="ad-h3">Outros</h3>
      {caixa(!!f.incluirArquivados, 'Mostrar as arquivadas', () => setF({ ...f, incluirArquivados: !f.incluirArquivados }))}
    </Gaveta>
  );
}
