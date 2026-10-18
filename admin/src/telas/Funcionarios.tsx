/**
 * PESSOAS › FUNCIONÁRIOS (RA6, RA13.4): a equipe e a folha do mês CALCULADA
 * (`calcularRemuneracaoDoMes`: fixo, comissão sobre a parte da modalidade,
 * por aula). O Admin calcula; o dono confere e lança (RA6.5). A remuneração é
 * o dado mais restrito do Admin.
 */

import { useState } from 'react';
import { formatarDinheiro, formatarPontosBase, lerDinheiro, lerPontosBase } from '@dominio/financeiro/dinheiro.ts';
import { dataNaCompetencia, formatarDataBR, lerDataDaPlanilha } from '@dominio/financeiro/datas.ts';
import { filtrarFuncionarios } from '@dominio/financeiro/filtros.ts';
import { acharPorNome } from '@dominio/financeiro/nomes.ts';
import { calcularRemuneracaoDoMes, type RemuneracaoDoMes } from '@dominio/financeiro/remuneracao.ts';
import type { FuncaoDoFuncionario, Funcionario, Lancamento, Pessoa, TipoDeRemuneracao } from '@dominio/financeiro/tipos.ts';
import { Campo, Gaveta, Icone, Selo } from '../componentes/basicos.tsx';
import { useDados, useLoja } from '../estado/loja.tsx';
import { href } from '../estado/rota.ts';
import { iniciais, nomeDoMes, plural, reais } from '../util/formatar.ts';
import { agoraNaAcademia } from '../util/relogio.ts';

export const ROTULO_DA_FUNCAO: Record<FuncaoDoFuncionario, string> = { professor: 'Professor', recepcao: 'Recepção', limpeza: 'Limpeza', administrativo: 'Administrativo', outro: 'Outro' };

export function textoDaRemuneracao(f: Funcionario): string {
  const r = f.remuneracao;
  switch (r.tipo) {
    case 'fixo': return `fixo ${formatarDinheiro(r.fixoCentavos ?? 0)}`;
    case 'comissao': return `comissão ${formatarPontosBase(r.comissaoPontosBase ?? 0)}`;
    case 'fixo_mais_comissao': return `fixo ${formatarDinheiro(r.fixoCentavos ?? 0)} + ${formatarPontosBase(r.comissaoPontosBase ?? 0)}`;
    case 'por_aula': return `por aula · ${formatarDinheiro(r.valorPorAulaCentavos ?? 0)}`;
    case 'sem_remuneracao': return 'sem remuneração';
  }
}

/** A remuneração do mês, ou null quando falta o número de aulas (o domínio não chuta). */
export function remuneracaoOuNada(f: Funcionario, lancamentos: readonly Lancamento[], mes: string): RemuneracaoDoMes | null {
  try { return calcularRemuneracaoDoMes(f, lancamentos, mes); } catch { return null; }
}

export function Funcionarios() {
  const d = useDados();
  const { hoje, mes } = useLoja();
  const lista = filtrarFuncionarios(d.funcionarios, d.pessoas, {}, hoje);
  const [sel, setSel] = useState<string | null>(lista.find((x) => x.funcionario.remuneracao.tipo === 'fixo_mais_comissao')?.funcionario.id ?? lista[0]?.funcionario.id ?? null);
  const [novo, setNovo] = useState(false);
  const folha = lista.reduce((s, x) => s + (remuneracaoOuNada(x.funcionario, d.lancamentos, mes)?.totalCentavos ?? 0), 0);
  const escolhido = d.funcionarios.find((f) => f.id === sel);
  const mod = (ids: string[]) => ids.map((id) => d.modalidades.find((m) => m.id === id)?.nome).filter(Boolean).join(' · ') || '—';

  return (
    <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(0, 1.5fr) minmax(0, 1fr)' }}>
      <section className="ad-painel ad-painel--sem-pad ad-painel--cheio" aria-labelledby="ff-eq">
        <div className="ad-painel__topo"><h2 id="ff-eq">Equipe · {plural(lista.length, 'pessoa', 'pessoas')} · folha de {nomeDoMes(mes)} {reais(folha)} (calculada)</h2><button type="button" className="ad-btn ad-btn--primario" onClick={() => setNovo(true)}><Icone nome="i-mais" />Funcionário</button></div>
        <div className="lista ad-tabela-rola">
          <table className="ad-tabela">
            <thead><tr><th scope="col">Nome</th><th scope="col">Função</th><th scope="col">Modalidades</th><th scope="col">Remuneração</th><th scope="col">Desde</th><th scope="col" className="dir">Do mês (calculada)</th></tr></thead>
            <tbody>
              {lista.map(({ funcionario: f, pessoa: p }) => {
                const r = remuneracaoOuNada(f, d.lancamentos, mes);
                return (
                  <tr key={f.id} data-abre onClick={() => setSel(f.id)} aria-selected={f.id === sel || undefined} style={f.id === sel ? { background: 'var(--ad-selecao)' } : undefined}>
                    <td><b><a className="forte" href="#" onClick={(e) => { e.preventDefault(); setSel(f.id); }}>{p?.nome}</a></b></td>
                    <td>{ROTULO_DA_FUNCAO[f.funcao]}</td>
                    <td>{mod(f.modalidadeIds)}</td>
                    <td>{textoDaRemuneracao(f)}</td>
                    <td>{formatarDataBR(f.desde)}</td>
                    <td className="dir">{r ? (r.totalCentavos ? reais(r.totalCentavos) : '—') : <span className="ate">falta o nº de aulas</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      {escolhido ? <FichaDoFuncionario funcionario={escolhido} /> : <div />}
      {novo && <GavetaFuncionario aoFechar={() => setNovo(false)} />}
    </div>
  );
}

export function FichaDoFuncionario({ funcionario: f }: { funcionario: Funcionario }) {
  const d = useDados();
  const { mes, hoje, executar, avisar, sessao } = useLoja();
  const [aulas, setAulas] = useState('');
  const p = d.pessoas.find((x) => x.id === f.pessoaId);
  const vinculos = d.funcionarios.filter((x) => x.pessoaId === f.pessoaId);
  let r: RemuneracaoDoMes | null = null;
  try { r = calcularRemuneracaoDoMes(f, d.lancamentos, mes, f.remuneracao.tipo === 'por_aula' ? { aulasDadas: aulas ? Number(aulas) : undefined } : {}); } catch { r = null; }
  const fixoJaEhDespesa = d.despesasFixas.some((x) => x.ativa && x.pessoaId === f.pessoaId);
  const aLancar = r ? r.comissaoCentavos + r.porAulaCentavos + (fixoJaEhDespesa ? 0 : r.fixoCentavos) : 0;
  const mod = f.modalidadeIds.map((id) => d.modalidades.find((m) => m.id === id)?.nome).filter(Boolean);
  const jaLancou = d.lancamentos.some((l) => !l.arquivado && l.origem === 'remuneracao' && l.pessoaId === f.pessoaId && l.descricao.includes(`${mes.slice(5)}/${mes.slice(0, 4)}`));

  async function lancar() {
    if (!p || !aLancar) return;
    const categoria = acharPorNome(d.categorias.filter((c) => c.tipo === 'saida'), r!.comissaoCentavos ? 'Comissão de professores' : 'Salários');
    const data = hoje.startsWith(mes) ? hoje : dataNaCompetencia(mes, 31) < hoje ? hoje : dataNaCompetencia(mes, 31);
    const l: Lancamento = {
      id: crypto.randomUUID(), academiaId: d.academia.id, data, descricao: `${r!.comissaoCentavos ? 'Comissão' : 'Remuneração'} ${mes.slice(5)}/${mes.slice(0, 4)} — ${p.nome}`,
      ...(categoria ? { categoriaId: categoria.id } : {}), tipo: 'saida', valorCentavos: aLancar, formaDePagamento: 'pix', pessoaId: p.id,
      situacao: 'pendente', origem: 'remuneracao', criadoPor: sessao.usuarioId, criadoEm: agoraNaAcademia(), atualizadoEm: agoraNaAcademia(),
    };
    const x = await executar((repo) => repo.gravarLancamentos([{ depois: l }]));
    if (x.ok) avisar(`Lançado como saída pendente: ${reais(aLancar)}. Marque como pago na planilha quando pagar.`);
  }

  async function desligar() {
    const x = await executar((repo) => repo.salvar('funcionarios', { ...f, ate: hoje }));
    if (x.ok) avisar(`${p?.nome} desligado em ${formatarDataBR(hoje)}. O papel no app, se houver, se encerra em Ajustes.`);
  }

  return (
    <div className="ad-coluna">
      <section className="ad-painel">
        <div className="ad-ficha-cabeca">
          <span className="ad-avatar" aria-hidden="true">{iniciais(p?.nome ?? '?')}</span>
          <div><h2>{p?.nome}</h2><p className="ad-anotacao">{ROTULO_DA_FUNCAO[f.funcao]}{mod.length ? ` de ${mod.join(' e ')}` : ''} · desde {formatarDataBR(f.desde)}{p?.ehAluno ? ' · também é aluno' : ''}</p></div>
        </div>
        <div className="ad-acoes"><Selo>{ROTULO_DA_FUNCAO[f.funcao]}</Selo>{mod.map((m) => <Selo key={m}>{m}</Selo>)}{p?.usuarioId ? <Selo tom="ok">conta do app ligada</Selo> : <Selo>sem conta no app</Selo>}{vinculos.length > 1 && <Selo>{vinculos.length} funções</Selo>}</div>
        <dl className="ad-dados">
          <dt>Remuneração</dt><dd>{textoDaRemuneracao(f)}</dd>
          <dt>Telefone</dt><dd>{p?.telefone ?? '—'}</dd>
          {f.ate && <><dt>Desligado em</dt><dd>{formatarDataBR(f.ate)}</dd></>}
        </dl>
        {p && <a className="ad-btn ad-btn--plano" href={href('pessoas', 'ficha', p.id)}>Abrir a ficha</a>}
      </section>
      <section className="ad-painel ad-painel--heroi">
        <div className="ad-painel__topo"><h2>Remuneração de {nomeDoMes(mes)} (calculada)</h2></div>
        {f.remuneracao.tipo === 'por_aula' && <Campo rotulo="Aulas dadas no mês" ajuda="Vem da chamada do app da equipe quando ela existir (AJ); por enquanto, digite.">{(x) => <input {...x} value={aulas} onChange={(e) => setAulas(e.target.value.replace(/\D/g, ''))} inputMode="numeric" />}</Campo>}
        {!r ? <p className="ad-anotacao">Falta o número de aulas para calcular.</p> : (
          <ul className="ad-lista ad-lista--compacta">
            {(f.remuneracao.tipo === 'comissao' || f.remuneracao.tipo === 'fixo_mais_comissao') && <>
              <li><span className="ad-lista__txt"><span>Entrou de {mod.join(' e ') || 'as modalidades dele'} no mês (o combo conta a metade)</span></span><span className="ad-lista__val">{reais(r.baseDaComissaoCentavos)}</span></li>
              <li><span className="ad-lista__txt"><span>Comissão de {formatarPontosBase(f.remuneracao.comissaoPontosBase ?? 0)}</span></span><span className="ad-lista__val">{reais(r.comissaoCentavos)}</span></li>
            </>}
            {r.fixoCentavos > 0 && <li><span className="ad-lista__txt"><span>Fixo{fixoJaEhDespesa ? ' (já é despesa fixa)' : ''}</span></span><span className="ad-lista__val">{reais(r.fixoCentavos)}</span></li>}
            {r.porAulaCentavos > 0 && <li><span className="ad-lista__txt"><span>{aulas} aulas</span></span><span className="ad-lista__val">{reais(r.porAulaCentavos)}</span></li>}
            <li><span className="ad-lista__txt"><b>Total</b></span><span className="ad-lista__val">{reais(r.totalCentavos)}</span></li>
          </ul>
        )}
        <p className="ad-anotacao">O Admin calcula; o dono confere e lança. A remuneração não vira linha sozinha. Dois professores na mesma modalidade recebem cada um sobre a base inteira (A12).</p>
        <div className="ad-acoes">
          {aLancar > 0 && !f.ate && <button type="button" className="ad-btn ad-btn--primario" onClick={() => void lancar()} disabled={jaLancou}>{jaLancou ? 'Já lançado neste mês' : `Lançar ${reais(aLancar)} como saída`}</button>}
          {!f.ate && <button type="button" className="ad-btn" onClick={() => void desligar()}>Desligar</button>}
        </div>
      </section>
    </div>
  );
}

const TIPOS: [TipoDeRemuneracao, string][] = [['fixo', 'Fixo'], ['comissao', 'Comissão'], ['fixo_mais_comissao', 'Fixo + comissão'], ['por_aula', 'Por aula'], ['sem_remuneracao', 'Sem remuneração']];

function GavetaFuncionario({ aoFechar }: { aoFechar: () => void }) {
  const d = useDados();
  const { hoje, executar, avisar } = useLoja();
  const [nome, setNome] = useState('');
  const [funcao, setFuncao] = useState<FuncaoDoFuncionario>('professor');
  const [modalidades, setModalidades] = useState<string[]>([]);
  const [tipo, setTipo] = useState<TipoDeRemuneracao>('comissao');
  const [fixo, setFixo] = useState('');
  const [comissao, setComissao] = useState('');
  const [porAula, setPorAula] = useState('');
  const [desde, setDesde] = useState(formatarDataBR(hoje));
  const [erro, setErro] = useState<string | null>(null);

  async function gravar() {
    if (!nome.trim()) { setErro('Escreva o nome.'); return; }
    const dataDesde = lerDataDaPlanilha(desde);
    if (!dataDesde) { setErro('A data não existe.'); return; }
    const remuneracao: Funcionario['remuneracao'] = { tipo };
    if (tipo === 'fixo' || tipo === 'fixo_mais_comissao') { const v = lerDinheiro(fixo); if (v == null || v < 0) { setErro('Fixo inválido.'); return; } remuneracao.fixoCentavos = v; }
    if (tipo === 'comissao' || tipo === 'fixo_mais_comissao') { const v = lerPontosBase(comissao); if (v == null || v > 10000) { setErro('Comissão inválida (0 a 100 %).'); return; } remuneracao.comissaoPontosBase = v; }
    if (tipo === 'por_aula') { const v = lerDinheiro(porAula); if (v == null || v < 0) { setErro('Valor por aula inválido.'); return; } remuneracao.valorPorAulaCentavos = v; }
    const existente = acharPorNome(d.pessoas, nome);
    const em = agoraNaAcademia();
    const pessoa: Pessoa = existente ? { ...existente, ehFuncionario: true, atualizadaEm: em } : { id: crypto.randomUUID(), academiaId: d.academia.id, nome: nome.trim(), ehAluno: false, ehFuncionario: true, criadaEm: em, atualizadaEm: em };
    const f: Funcionario = { id: crypto.randomUUID(), academiaId: d.academia.id, pessoaId: pessoa.id, funcao, modalidadeIds: funcao === 'professor' ? modalidades : [], remuneracao, desde: dataDesde };
    const r = await executar(async (repo) => { await repo.salvar('pessoas', pessoa); return repo.salvar('funcionarios', f); });
    if (r.ok) { avisar(`${pessoa.nome} entrou na equipe.`); aoFechar(); }
  }

  return (
    <Gaveta titulo="Funcionário novo" aoFechar={aoFechar} rodape={<>
      <button type="button" className="ad-btn ad-btn--grande" onClick={aoFechar}>Cancelar</button>
      <button type="button" className="ad-btn ad-btn--primario ad-btn--grande" onClick={() => void gravar()}>Guardar</button>
    </>}>
      <Campo rotulo="Nome" erro={erro} ajuda="Se a pessoa já está no cadastro (um aluno que vira professor), use o mesmo nome.">{(x) => <input {...x} value={nome} onChange={(e) => { setNome(e.target.value); setErro(null); }} list="lista-pessoas" />}</Campo>
      <Campo rotulo="Função">{(x) => <select {...x} value={funcao} onChange={(e) => setFuncao(e.target.value as FuncaoDoFuncionario)}>{Object.entries(ROTULO_DA_FUNCAO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>}</Campo>
      {funcao === 'professor' && <fieldset className="ad-filtros"><legend className="ad-h3">Modalidades (base da comissão)</legend>{d.modalidades.map((m) => <label key={m.id} className="marcar campo__caixa"><input type="checkbox" checked={modalidades.includes(m.id)} onChange={() => setModalidades(modalidades.includes(m.id) ? modalidades.filter((x) => x !== m.id) : [...modalidades, m.id])} /><span>{m.nome}</span></label>)}</fieldset>}
      <Campo rotulo="Remuneração">{(x) => <select {...x} value={tipo} onChange={(e) => setTipo(e.target.value as TipoDeRemuneracao)}>{TIPOS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>}</Campo>
      {(tipo === 'fixo' || tipo === 'fixo_mais_comissao') && <Campo rotulo="Fixo por mês">{(x) => <input {...x} value={fixo} onChange={(e) => setFixo(e.target.value)} inputMode="decimal" />}</Campo>}
      {(tipo === 'comissao' || tipo === 'fixo_mais_comissao') && <Campo rotulo="Comissão (%)" ajuda="Sobre o que ENTROU das modalidades dele no mês.">{(x) => <input {...x} value={comissao} onChange={(e) => setComissao(e.target.value)} inputMode="decimal" />}</Campo>}
      {tipo === 'por_aula' && <Campo rotulo="Valor por aula">{(x) => <input {...x} value={porAula} onChange={(e) => setPorAula(e.target.value)} inputMode="decimal" />}</Campo>}
      <Campo rotulo="Desde">{(x) => <input {...x} value={desde} onChange={(e) => setDesde(e.target.value)} />}</Campo>
    </Gaveta>
  );
}
