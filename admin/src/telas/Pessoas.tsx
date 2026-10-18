/**
 * PESSOAS › ALUNOS e RESPONSÁVEIS (RA10, RA13): a lista com os filtros
 * cruzados à esquerda (dentro de um critério vale qualquer valor; entre
 * critérios, todos), a frase do filtro com os chips, o filtro total numa
 * gaveta, o filtro salvo e a exportação. A conta é do domínio
 * (`linhasDeAlunos`, `filtrarAlunos`, `exportarAlunos`).
 */

import { useMemo, useState } from 'react';
import { formatarDinheiro } from '@dominio/financeiro/dinheiro.ts';
import { formatarDataBR, lerDataDaPlanilha } from '@dominio/financeiro/datas.ts';
import { exportarAlunos, filtrarAlunos, linhasDeAlunos, type FiltroDeAlunos, type LinhaDeAluno } from '@dominio/financeiro/filtros.ts';
import { situacaoDaCobranca } from '@dominio/financeiro/cobrancas.ts';
import { acharPorNome, normalizar } from '@dominio/financeiro/nomes.ts';
import type { FiltroSalvo, Matricula, MotivoDoDesconto, Pessoa, SituacaoDoAluno } from '@dominio/financeiro/tipos.ts';
import { Campo, Gaveta, Icone, Selo, Vazio } from '../componentes/basicos.tsx';
import { useEnvio } from '../estado/envio.ts';
import { useDados, useLoja } from '../estado/loja.tsx';
import { lerDataDigitada } from '../util/datas-digitadas.ts';
import { href, ir } from '../estado/rota.ts';
import { baixarArquivo } from '../util/baixar.ts';
import { plural, reais } from '../util/formatar.ts';
import { agoraNaAcademia } from '../util/relogio.ts';

const SITUACOES: [SituacaoDoAluno, string][] = [['matriculado', 'Matriculado'], ['trancado', 'Trancado'], ['inativo', 'Inativo']];
const MOTIVOS: [MotivoDoDesconto, string][] = [['familia', 'Família'], ['bolsista', 'Bolsista'], ['atleta', 'Atleta'], ['indicacao', 'Indicação'], ['funcionario', 'Funcionário'], ['outro', 'Outro']];

function filtroDoAtalho(atalho: string | undefined, mes: string): FiltroDeAlunos {
  if (atalho === 'matriculado' || atalho === 'trancado' || atalho === 'inativo') return { situacoes: [atalho] };
  if (atalho === 'novos') return { novosDesde: `${mes}-01` };
  if (atalho === 'atraso') return { inadimplenteHaMaisDeDias: 0 };
  return { situacoes: ['matriculado'] };
}

export function Pessoas({ alvo, filtroAberto = false, atalho }: { alvo: string; filtroAberto?: boolean; atalho?: string }) {
  const d = useDados();
  const { hoje, mes, executar, avisar, sessao } = useLoja();
  const [f, setF] = useState<FiltroDeAlunos>(() => (filtroAberto ? { situacoes: ['matriculado'], inadimplenteHaMaisDeDias: 30 } : filtroDoAtalho(atalho, mes)));
  const [gaveta, setGaveta] = useState<null | 'filtro' | 'salvar' | 'aluno'>(filtroAberto ? 'filtro' : null);
  const todas = useMemo(() => linhasDeAlunos(d, hoje), [d, hoje]);
  const vistas = useMemo(() => filtrarAlunos(todas, f).sort((a, b) => a.pessoa.nome.localeCompare(b.pessoa.nome)), [todas, f]);
  const nome = (id?: string) => d.pessoas.find((p) => p.id === id)?.nome ?? '';
  const modNome = (id: string) => d.modalidades.find((m) => m.id === id)?.nome ?? '';
  const planoNome = (id: string) => d.planos.find((p) => p.id === id)?.nome ?? '';
  const emAtraso = vistas.filter((x) => x.emAtrasoCentavos > 0);

  if (alvo === 'responsaveis') return <Responsaveis />;

  const conta = (extra: FiltroDeAlunos) => filtrarAlunos(todas, { ...f, ...extra }).length;
  const alterna = <T,>(lista: T[] | undefined, v: T) => (lista?.includes(v) ? lista.filter((x) => x !== v) : [...(lista ?? []), v]);

  // a frase do filtro (RA10.4)
  const partes: [string, () => void][] = [];
  if (f.situacoes?.length) partes.push([f.situacoes.map((s) => SITUACOES.find((x) => x[0] === s)![1].toLowerCase() + 's').join(' ou '), () => setF({ ...f, situacoes: [] })]);
  if (f.modalidadeIds?.length) partes.push([f.modalidadeIds.map(modNome).join(' ou '), () => setF({ ...f, modalidadeIds: [] })]);
  if (f.planoIds?.length) partes.push([f.planoIds.map(planoNome).join(' ou '), () => setF({ ...f, planoIds: [] })]);
  if (f.inadimplenteHaMaisDeDias != null) partes.push([f.inadimplenteHaMaisDeDias ? `em atraso há mais de ${f.inadimplenteHaMaisDeDias} dias` : 'em atraso', () => setF({ ...f, inadimplenteHaMaisDeDias: undefined })]);
  if (f.emDia) partes.push(['em dia', () => setF({ ...f, emDia: undefined })]);
  if (f.novosDesde) partes.push([`novos desde ${formatarDataBR(f.novosDesde)}`, () => setF({ ...f, novosDesde: undefined })]);
  if (f.motivosDeDesconto?.length) partes.push([`desconto ${f.motivosDeDesconto.map((m) => MOTIVOS.find((x) => x[0] === m)![1].toLowerCase()).join(' ou ')}`, () => setF({ ...f, motivosDeDesconto: [] })]);
  if (f.texto) partes.push([`"${f.texto}"`, () => setF({ ...f, texto: undefined })]);
  const frase = `Alunos${partes.length ? ` · ${partes.map((p) => p[0]).join(' · ')}` : ''}`;

  function exportar() {
    baixarArquivo('alunos.csv', exportarAlunos(vistas, d));
    avisar(`Exportado: ${plural(vistas.length, 'pessoa', 'pessoas')}.`);
  }

  const vence = (x: LinhaDeAluno) => {
    const m = x.matriculas[0];
    if (!m) return '—';
    const p = d.planos.find((y) => y.id === m.planoId);
    return p?.periodicidade === 'trimestral' ? 'a cada 3 meses' : `dia ${m.diaDeVencimento}`;
  };
  const cobranca = (x: LinhaDeAluno) => {
    if (x.emAtrasoCentavos) return <Selo tom="erro">{x.diasDeAtraso} dias · {formatarDinheiro(x.emAtrasoCentavos)}</Selo>;
    const deste = d.cobrancas.filter((c) => (c.alunoPessoaId ?? c.pessoaId) === x.pessoa.id && c.competencia === mes && c.estado === 'aberta');
    if (deste.length) { const s = situacaoDaCobranca(deste[0]!, hoje).estado; return <Selo tom={s === 'vence_hoje' ? 'pend' : 'neutro'}>{s === 'vence_hoje' ? 'vence hoje' : 'a vencer'}</Selo>; }
    return <span className="sec">em dia</span>;
  };

  return (
    <div className="ad-colunas" style={{ ['--colunas' as string]: '280px minmax(0, 1fr)' }}>
      <aside className="ad-coluna so-pc" aria-label="Filtros">
        <section className="ad-painel">
          <h2 className="ad-h3">Filtros salvos</h2>
          <ul className="ad-lista ad-lista--compacta">
            {d.filtrosSalvos.filter((x) => x.alvo === 'alunos').map((s) => (
              <li key={s.id}><a className="ad-lista__txt" href="#" onClick={(e) => { e.preventDefault(); setF(s.filtro as FiltroDeAlunos); }}><b>{s.nome}</b></a><span className="ad-lista__val">{filtrarAlunos(todas, s.filtro as FiltroDeAlunos).length}</span></li>
            ))}
          </ul>
        </section>
        <section className="ad-painel ad-filtros">
          <label className="campo__caixa"><Icone nome="i-buscar" /><input type="search" placeholder="Nome, telefone ou e-mail" aria-label="Buscar alunos" value={f.texto ?? ''} onChange={(e) => setF({ ...f, texto: e.target.value || undefined })} /></label>
          <fieldset><legend className="ad-h3">Situação</legend>
            {SITUACOES.map(([s, rot]) => <label key={s} className="campo__caixa marcar"><input type="checkbox" checked={!!f.situacoes?.includes(s)} onChange={() => setF({ ...f, situacoes: alterna(f.situacoes, s) })} /><span>{rot}</span><em>{conta({ situacoes: [s] })}</em></label>)}
          </fieldset>
          <fieldset><legend className="ad-h3">Modalidade</legend>
            {d.modalidades.map((m) => <label key={m.id} className="campo__caixa marcar"><input type="checkbox" checked={!!f.modalidadeIds?.includes(m.id)} onChange={() => setF({ ...f, modalidadeIds: alterna(f.modalidadeIds, m.id) })} /><span>{m.nome}</span><em>{conta({ modalidadeIds: [m.id] })}</em></label>)}
          </fieldset>
          <fieldset><legend className="ad-h3">Cobrança</legend>
            <label className="campo__caixa marcar"><input type="checkbox" checked={f.inadimplenteHaMaisDeDias === 30} onChange={() => setF({ ...f, inadimplenteHaMaisDeDias: f.inadimplenteHaMaisDeDias === 30 ? undefined : 30, emDia: undefined })} /><span>Em atraso há mais de 30 dias</span><em>{conta({ inadimplenteHaMaisDeDias: 30, emDia: undefined })}</em></label>
            <label className="campo__caixa marcar"><input type="checkbox" checked={!!f.emDia} onChange={() => setF({ ...f, emDia: f.emDia ? undefined : true, inadimplenteHaMaisDeDias: undefined })} /><span>Em dia</span><em>{conta({ emDia: true, inadimplenteHaMaisDeDias: undefined })}</em></label>
          </fieldset>
          <Campo rotulo="Plano">{(p) => <select {...p} value={f.planoIds?.[0] ?? ''} onChange={(e) => setF({ ...f, planoIds: e.target.value ? [e.target.value] : [] })}><option value="">Todos os planos</option>{d.planos.filter((x) => x.ativo).map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}</select>}</Campo>
          <Campo rotulo="Motivo de desconto">{(p) => <select {...p} value={f.motivosDeDesconto?.[0] ?? ''} onChange={(e) => setF({ ...f, motivosDeDesconto: e.target.value ? [e.target.value as MotivoDoDesconto] : [] })}><option value="">Qualquer um</option>{MOTIVOS.map(([m, rot]) => <option key={m} value={m}>{rot}</option>)}</select>}</Campo>
        </section>
      </aside>

      <section className="ad-painel ad-painel--sem-pad ad-painel--cheio" aria-label="Resultado">
        <div className="ad-painel__topo">
          <div className="ad-abas" aria-label="Pessoas"><a href={href('pessoas', 'alunos')} aria-current="page">Alunos</a><a href={href('pessoas', 'funcionarios')}>Funcionários</a><a href={href('pessoas', 'responsaveis')}>Responsáveis</a></div>
          <div className="ad-acoes">
            <button type="button" className="ad-btn" onClick={() => setGaveta('salvar')}>Salvar este filtro</button>
            <button type="button" className="ad-btn" onClick={exportar}>Exportar CSV</button>
            <button type="button" className="ad-btn ad-btn--primario" onClick={() => setGaveta('aluno')}><Icone nome="i-mais" />Aluno</button>
          </div>
        </div>
        <div className="ad-painel__topo">
          <div className="ad-frase">
            <p><b>{frase}</b> · {plural(vistas.length, 'pessoa', 'pessoas')}{emAtraso.length ? ` · ${emAtraso.length} em atraso (${reais(emAtraso.reduce((s, x) => s + x.emAtrasoCentavos, 0))})` : ''}</p>
            {partes.map(([rot, tirar]) => <span key={rot} className="ad-chip">{rot}<button type="button" aria-label={`Tirar ${rot}`} onClick={tirar}><Icone nome="i-fechar" /></button></span>)}
            <button type="button" className="ad-btn" onClick={() => setGaveta('filtro')}><Icone nome="i-filtro" />Filtro total</button>
          </div>
        </div>
        {vistas.length === 0 ? <Vazio titulo="Ninguém com este filtro" texto="Tire um critério ou limpe o filtro." acao={<button type="button" className="ad-btn" onClick={() => setF({})}>Limpar o filtro</button>} /> : (
          <>
            <div className="lista ad-tabela-rola so-pc">
              <table className="ad-tabela">
                <thead><tr><th scope="col">Nome</th><th scope="col">Telefone</th><th scope="col">Situação</th><th scope="col">Plano</th><th scope="col">Modalidades</th><th scope="col">Responsável</th><th scope="col">Vence</th><th scope="col">Cobrança</th><th scope="col">Desde</th></tr></thead>
                <tbody>
                  {vistas.map((x) => (
                    <tr key={x.pessoa.id} data-abre onClick={() => ir('pessoas', 'ficha', x.pessoa.id)}>
                      <td><b><a className="forte" href={href('pessoas', 'ficha', x.pessoa.id)} onClick={(e) => e.stopPropagation()}>{x.pessoa.nome}</a></b></td>
                      <td>{x.pessoa.telefone ?? '—'}</td>
                      <td>{x.situacao === 'matriculado' ? <Selo tom="ok">Matriculado</Selo> : x.situacao === 'trancado' ? <Selo tom="pend">Trancado</Selo> : <Selo>Inativo</Selo>}</td>
                      <td>{x.planoIds.map(planoNome).join(' + ') || '—'}</td>
                      <td>{x.modalidadeIds.map(modNome).join(' · ') || '—'}</td>
                      <td>{x.pessoa.responsavelPessoaId ? nome(x.pessoa.responsavelPessoaId) : '—'}</td>
                      <td>{vence(x)}</td>
                      <td>{cobranca(x)}</td>
                      <td>{x.desde ? formatarDataBR(x.desde) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="ad-lanc ad-pessoas-cel so-celular">
              {vistas.map((x) => (
                <button type="button" className="linha" key={x.pessoa.id} onClick={() => ir('pessoas', 'ficha', x.pessoa.id)}>
                  <span className="linha__txt"><b>{x.pessoa.nome}</b><span>{x.planoIds.map(planoNome).join(' + ') || 'sem plano'}{x.pessoa.responsavelPessoaId ? ` · resp. ${nome(x.pessoa.responsavelPessoaId)}` : ''}</span></span>
                  <span className="linha__val">{cobranca(x)}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      {gaveta === 'filtro' && <GavetaFiltroTotal inicial={f} todas={todas} aoAplicar={(nf) => { setF(nf); setGaveta(null); }} aoFechar={() => setGaveta(null)} aoSalvar={async (nf, nomeDoFiltro) => {
        const s: FiltroSalvo = { id: crypto.randomUUID(), academiaId: d.academia.id, nome: nomeDoFiltro, alvo: 'alunos', filtro: nf, criadoPor: sessao.usuarioId, criadoEm: agoraNaAcademia() };
        const r = await executar((repo) => repo.salvar('filtros_salvos', s));
        if (r.ok) { setF(nf); setGaveta(null); avisar(`Filtro salvo: "${nomeDoFiltro}".`); }
      }} />}
      {gaveta === 'salvar' && <GavetaSalvarFiltro frase={frase} aoFechar={() => setGaveta(null)} aoSalvar={async (nomeDoFiltro) => {
        const s: FiltroSalvo = { id: crypto.randomUUID(), academiaId: d.academia.id, nome: nomeDoFiltro, alvo: 'alunos', filtro: f, criadoPor: sessao.usuarioId, criadoEm: agoraNaAcademia() };
        const r = await executar((repo) => repo.salvar('filtros_salvos', s));
        if (r.ok) { setGaveta(null); avisar(`Filtro salvo: "${nomeDoFiltro}".`); }
      }} />}
      {gaveta === 'aluno' && <GavetaAluno aoFechar={() => setGaveta(null)} />}
    </div>
  );
}

function GavetaSalvarFiltro({ frase, aoFechar, aoSalvar }: { frase: string; aoFechar: () => void; aoSalvar: (nome: string) => void }) {
  const [nome, setNome] = useState(frase.replace(/^Alunos · /, '').slice(0, 60));
  return (
    <Gaveta titulo="Salvar este filtro" aoFechar={aoFechar} rodape={<>
      <button type="button" className="ad-btn ad-btn--grande" onClick={aoFechar}>Cancelar</button>
      <button type="button" className="ad-btn ad-btn--primario ad-btn--grande" onClick={() => nome.trim() && aoSalvar(nome.trim())}>Salvar</button>
    </>}>
      <p className="t16">{frase}</p>
      <Campo rotulo="Nome do filtro">{(p) => <input {...p} value={nome} maxLength={60} onChange={(e) => setNome(e.target.value)} />}</Campo>
    </Gaveta>
  );
}

function GavetaFiltroTotal({ inicial, todas, aoAplicar, aoFechar, aoSalvar }: {
  inicial: FiltroDeAlunos; todas: LinhaDeAluno[]; aoAplicar: (f: FiltroDeAlunos) => void; aoFechar: () => void; aoSalvar: (f: FiltroDeAlunos, nome: string) => void;
}) {
  const d = useDados();
  const [f, setF] = useState<FiltroDeAlunos>(inicial);
  const [nome, setNome] = useState('');
  const n = filtrarAlunos(todas, f).length;
  return (
    <Gaveta titulo="Filtro total" aoFechar={aoFechar} rodape={<>
      <button type="button" className="ad-btn ad-btn--grande" onClick={() => setF({})}>Limpar</button>
      <button type="button" className="ad-btn ad-btn--grande" onClick={() => nome.trim() && aoSalvar(f, nome.trim())} disabled={!nome.trim()}>Salvar filtro</button>
      <button type="button" className="ad-btn ad-btn--primario ad-btn--grande" onClick={() => aoAplicar(f)}>Ver {plural(n, 'pessoa', 'pessoas')}</button>
    </>}>
      <p className="ad-anotacao">Dentro de um critério vale qualquer valor (ou). Entre critérios valem todos (e).</p>
      <div className="ad-cartao"><b>Modalidade é</b><span className="campo__caixa"><select aria-label="Modalidade" value={f.modalidadeIds?.[0] ?? ''} onChange={(e) => setF({ ...f, modalidadeIds: e.target.value ? [e.target.value] : [] })}><option value="">qualquer uma</option>{d.modalidades.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}</select></span></div>
      <div className="ad-cartao"><b>e Situação é</b><span className="campo__caixa"><select aria-label="Situação" value={f.situacoes?.[0] ?? ''} onChange={(e) => setF({ ...f, situacoes: e.target.value ? [e.target.value as SituacaoDoAluno] : [] })}><option value="">qualquer uma</option>{SITUACOES.map(([s, rot]) => <option key={s} value={s}>{rot}</option>)}</select></span></div>
      <div className="ad-cartao"><b>e Em atraso há mais de (dias)</b><label className="campo__caixa"><input value={f.inadimplenteHaMaisDeDias ?? ''} inputMode="numeric" aria-label="Dias de atraso" onChange={(e) => {
        // "em atraso há mais de N dias" e "em dia" não valem juntos: dava zero pessoa sem dizer por quê (AO)
        const so = e.target.value.replace(/\D/g, '');
        setF({ ...f, inadimplenteHaMaisDeDias: so === '' ? undefined : Number(so), ...(so === '' ? {} : { emDia: undefined }) });
      }} /></label></div>
      <div className="ad-cartao"><b>e Plano é</b><span className="campo__caixa"><select aria-label="Plano" value={f.planoIds?.[0] ?? ''} onChange={(e) => setF({ ...f, planoIds: e.target.value ? [e.target.value] : [] })}><option value="">qualquer um</option>{d.planos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></span></div>
      <div className="ad-cartao"><b>e Desconto é</b><span className="campo__caixa"><select aria-label="Desconto" value={f.motivosDeDesconto?.[0] ?? ''} onChange={(e) => setF({ ...f, motivosDeDesconto: e.target.value ? [e.target.value as MotivoDoDesconto] : [] })}><option value="">qualquer um</option>{MOTIVOS.map(([m, rot]) => <option key={m} value={m}>{rot}</option>)}</select></span></div>
      <div className="ad-cartao"><b>e Novos desde</b><label className="campo__caixa"><input type="date" aria-label="Novos desde" value={f.novosDesde ?? ''} onChange={(e) => setF({ ...f, novosDesde: e.target.value || undefined })} /></label></div>
      <Campo rotulo="Salvar com o nome">{(p) => <input {...p} value={nome} maxLength={60} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Muay Thai devendo há mais de 30 dias" />}</Campo>
    </Gaveta>
  );
}

/** Cadastro de aluno com a matrícula (RA13.1, RA3.2). Avisa pessoa parecida (RA13.6). */
function GavetaAluno({ aoFechar }: { aoFechar: () => void }) {
  const d = useDados();
  const { hoje, executar, avisar } = useLoja();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [planoId, setPlanoId] = useState(d.planos.find((p) => p.ativo && p.periodicidade !== 'gratuito')?.id ?? '');
  const [inicio, setInicio] = useState(formatarDataBR(hoje));
  const [dia, setDia] = useState(hoje.slice(8));
  const [erro, setErro] = useState<string | null>(null);
  const envio = useEnvio();
  const parecida = nome.trim().length > 3 ? d.pessoas.find((p) => normalizar(p.nome) === normalizar(nome) || (!!telefone.replace(/\D/g, '') && p.telefone?.replace(/\D/g, '') === telefone.replace(/\D/g, ''))) : undefined;

  // duplo clique em "Matricular" cadastrava a pessoa duas vezes (AO)
  const gravar = () => envio.enviar(async () => {
    if (!nome.trim()) { setErro('Escreva o nome.'); return; }
    if (!planoId) { setErro('Escolha o plano.'); return; }
    const ini = lerDataDigitada(inicio, hoje);
    if (!ini) { setErro('A data de início não existe.'); return; }
    const nasc = nascimento.trim() ? lerDataDaPlanilha(nascimento) : null;
    if (nascimento.trim() && !nasc) { setErro('A data de nascimento não existe.'); return; }
    const resp = responsavel.trim() ? acharPorNome(d.pessoas, responsavel) : undefined;
    if (responsavel.trim() && !resp) { setErro('Responsável não encontrado: cadastre-o antes.'); return; }
    const n = Number(dia);
    if (!Number.isInteger(n) || n < 1 || n > 31) { setErro('O dia do vencimento vai de 1 a 31.'); return; }
    const em = agoraNaAcademia();
    const p: Pessoa = {
      id: crypto.randomUUID(), academiaId: d.academia.id, nome: nome.trim(), ...(telefone.trim() ? { telefone: telefone.trim() } : {}),
      ...(nasc ? { dataNascimento: nasc } : {}), ...(resp ? { responsavelPessoaId: resp.id } : {}), ehAluno: true, ehFuncionario: false, criadaEm: em, atualizadaEm: em,
    };
    const m: Matricula = {
      id: crypto.randomUUID(), academiaId: d.academia.id, pessoaId: p.id, pagadorPessoaId: resp?.id ?? p.id, planoId, inicio: ini, estado: 'ativa',
      diaDeVencimento: n, descontos: [],
    };
    const r = await executar(async (repo) => { await repo.salvar('pessoas', p); if (resp && !resp.ehResponsavel) await repo.salvar('pessoas', { ...resp, ehResponsavel: true }); return repo.salvar('matriculas', m); });
    if (r.ok) { avisar(`${p.nome} matriculado. A primeira cobrança sai ao gerar as mensalidades do mês.`); aoFechar(); ir('pessoas', 'ficha', p.id); }
  });

  return (
    <Gaveta titulo="Aluno novo" aoFechar={aoFechar} rodape={<>
      <button type="button" className="ad-btn ad-btn--grande" onClick={aoFechar}>Cancelar</button>
      <button type="button" className="ad-btn ad-btn--primario ad-btn--grande" onClick={() => void gravar()} disabled={envio.enviando}>Matricular</button>
    </>}>
      <Campo rotulo="Nome" erro={erro}>{(p) => <input {...p} value={nome} onChange={(e) => { setNome(e.target.value); setErro(null); }} />}</Campo>
      {parecida && <p className="campo__erro" role="status"><Icone nome="i-alerta" />Já existe uma pessoa parecida: <a className="forte" href={href('pessoas', 'ficha', parecida.id)}>{parecida.nome}</a></p>}
      <Campo rotulo="Telefone (WhatsApp)">{(p) => <input {...p} value={telefone} onChange={(e) => setTelefone(e.target.value)} inputMode="tel" placeholder="(51) 9…" />}</Campo>
      <Campo rotulo="Nascimento (opcional)" ajuda="Kids: a idade decide a turma.">{(p) => <input {...p} value={nascimento} onChange={(e) => setNascimento(e.target.value)} placeholder="dd/mm/aaaa" inputMode="numeric" />}</Campo>
      <Campo rotulo="Responsável (só Kids)" ajuda="Quem paga. O começo do nome basta.">{(p) => <input {...p} value={responsavel} onChange={(e) => setResponsavel(e.target.value)} list="lista-pessoas" />}</Campo>
      <Campo rotulo="Plano">{(p) => <select {...p} value={planoId} onChange={(e) => setPlanoId(e.target.value)}>{d.planos.filter((x) => x.ativo).map((x) => <option key={x.id} value={x.id}>{x.nome} · {x.periodicidade === 'gratuito' ? 'grátis' : formatarDinheiro(x.valorCentavos)}</option>)}</select>}</Campo>
      <Campo rotulo="Início">{(p) => <input {...p} value={inicio} onChange={(e) => setInicio(e.target.value)} inputMode="numeric" />}</Campo>
      <Campo rotulo="Dia do vencimento" ajuda={`Primeiro mês: ${d.regras.primeiroMes === 'cheio' ? 'mês cheio' : d.regras.primeiroMes}${d.regras.provisorio ? ' (provisório, A7)' : ''}.`}>{(p) => <input {...p} value={dia} onChange={(e) => setDia(e.target.value.replace(/\D/g, ''))} inputMode="numeric" />}</Campo>
    </Gaveta>
  );
}

function Responsaveis() {
  const d = useDados();
  const { hoje } = useLoja();
  const lista = d.pessoas.filter((p) => p.ehResponsavel).sort((a, b) => a.nome.localeCompare(b.nome));
  return (
    <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(0, 1fr)' }}>
      <section className="ad-painel ad-painel--sem-pad ad-painel--cheio">
        <div className="ad-painel__topo"><div className="ad-abas" aria-label="Pessoas"><a href={href('pessoas', 'alunos')}>Alunos</a><a href={href('pessoas', 'funcionarios')}>Funcionários</a><a href={href('pessoas', 'responsaveis')} aria-current="page">Responsáveis</a></div></div>
        <div className="lista ad-tabela-rola">
          <table className="ad-tabela">
            <thead><tr><th scope="col">Responsável</th><th scope="col">Telefone</th><th scope="col">Dependentes</th><th scope="col" className="dir">Em aberto</th><th scope="col">Atraso</th></tr></thead>
            <tbody>
              {lista.map((p) => {
                const filhos = d.pessoas.filter((x) => x.responsavelPessoaId === p.id);
                const abertas = d.cobrancas.filter((c) => c.pessoaId === p.id && c.estado === 'aberta');
                const atraso = Math.max(0, ...abertas.map((c) => situacaoDaCobranca(c, hoje).diasDeAtraso));
                return (
                  <tr key={p.id} data-abre onClick={() => ir('pessoas', 'ficha', p.id)}>
                    <td><b><a className="forte" href={href('pessoas', 'ficha', p.id)}>{p.nome}</a></b></td>
                    <td>{p.telefone ?? '—'}</td>
                    <td>{filhos.map((x) => x.nome.split(' ')[0]).join(' e ') || '—'}</td>
                    <td className="dir">{abertas.length ? <b>{formatarDinheiro(abertas.reduce((s, c) => s + c.valorCentavos, 0))}</b> : '—'}</td>
                    <td>{atraso ? <Selo tom="erro">{atraso} dias</Selo> : <span className="sec">em dia</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

