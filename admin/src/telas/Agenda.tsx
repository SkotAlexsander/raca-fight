/**
 * AGENDA (RA12): hoje (atrasados, hoje, em breve), o calendário do mês com
 * as repetições abertas (`agendaDeLembretes`) e os vencimentos das despesas
 * fixas, e as tarefas abertas. Concluir faz o que repete andar para a próxima
 * ocorrência; adiar nunca vai para o passado.
 */

import { useState } from 'react';
import { adiarLembrete, agendaDeLembretes, concluirLembrete, concluirTarefa, lembretesDoDia, tarefasAbertas } from '@dominio/financeiro/anotacoes.ts';
import { dataNaCompetencia, diasNoMes, formatarDataBR, periodoDaCompetencia, somarDias } from '@dominio/financeiro/datas.ts';
import { despesaValeNoMes } from '@dominio/financeiro/despesas-fixas.ts';
import { acharPorNome } from '@dominio/financeiro/nomes.ts';
import type { Lembrete, Tarefa } from '@dominio/financeiro/tipos.ts';
import { GavetaLembrete } from '../componentes/anotar.tsx';
import { Campo, Gaveta, Icone, Selo } from '../componentes/basicos.tsx';
import { useEnvio } from '../estado/envio.ts';
import { useDados, useLoja } from '../estado/loja.tsx';
import { diaMes, mesTitulo, plural, reais } from '../util/formatar.ts';
import { lerDataDigitada } from '../util/datas-digitadas.ts';
import { agoraNaAcademia } from '../util/relogio.ts';

const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const SEMANA_LONGA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const diaDaSemana = (iso: string) => new Date(`${iso}T12:00:00Z`).getUTCDay();
const REPETE: Record<Lembrete['repeticao'], string> = { nao_repete: '', semanal: 'toda semana', mensal: 'todo mês', anual: 'uma vez por ano' };

export function Agenda() {
  const d = useDados();
  const { mes, hoje, executar, avisar } = useLoja();
  const [camada, setCamada] = useState<null | 'lembrete' | 'tarefa' | { adiar: Lembrete }>(null);
  const dia = lembretesDoDia(d.lembretes, hoje);
  const tarefas = tarefasAbertas(d.tarefas, hoje);
  const nome = (id?: string) => d.pessoas.find((p) => p.id === id)?.nome.split(' ')[0];
  // concluir duas vezes o lembrete mensal pulava DOIS meses (AO): um por vez
  const envio = useEnvio();

  const periodo = periodoDaCompetencia(mes);
  const ocorrencias = agendaDeLembretes(d.lembretes, periodo);
  const vencimentos = d.despesasFixas.filter((x) => despesaValeNoMes(x, mes)).map((x) => ({ data: dataNaCompetencia(mes, x.diaDeVencimento), titulo: x.descricao.split(' — ')[0]!.toLowerCase() }));
  const geradas = d.cobrancas.some((c) => c.competencia === mes && c.tipo === 'mensalidade');

  const concluir = (l: Lembrete) => envio.enviar(async () => {
    const novo = concluirLembrete(l, agoraNaAcademia());
    const r = await executar((repo) => repo.salvar('lembretes', novo));
    if (r.ok) avisar(novo.concluidoEm ? `Concluído: ${l.titulo}.` : `Feito. O próximo é em ${formatarDataBR(novo.data)}.`);
  });
  const concluirT = (t: Tarefa) => envio.enviar(async () => {
    const r = await executar((repo) => repo.salvar('tarefas', concluirTarefa(t, agoraNaAcademia())));
    if (r.ok) avisar(`Tarefa feita: ${t.titulo}.`);
  });

  const linha = (l: Lembrete, acao: 'concluir' | 'adiar' = 'concluir') => (
    <li key={l.id}>
      <span className="ad-lista__txt"><b>{l.titulo}</b><span>{[l.data < hoje ? `era ${diaMes(l.data)}` : '', l.hora ?? '', REPETE[l.repeticao], l.valorCentavos ? reais(l.valorCentavos) : '', l.pessoaId ? 'ligado à pessoa' : ''].filter(Boolean).join(' · ') || 'o dia todo'}</span></span>
      <button type="button" className="ad-btn" onClick={() => void concluir(l)} disabled={envio.enviando}>Concluir</button>
      {acao === 'adiar' || l.data < hoje ? <button type="button" className="ad-btn ad-btn--plano" onClick={() => setCamada({ adiar: l })}>Adiar</button> : null}
    </li>
  );

  // o calendário começa no domingo da semana do dia 1
  const primeiro = diaDaSemana(periodo.de);
  const celulas: { data: string; fora: boolean }[] = [];
  for (let i = primeiro; i > 0; i--) celulas.push({ data: somarDias(periodo.de, -i), fora: true });
  for (let i = 1; i <= diasNoMes(mes); i++) celulas.push({ data: dataNaCompetencia(mes, i), fora: false });
  while (celulas.length % 7) celulas.push({ data: somarDias(celulas.at(-1)!.data, 1), fora: true });

  return (
    <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(300px, 1fr) minmax(0, 2fr) minmax(300px, 1fr)' }}>
      <div className="ad-coluna ad-primeiro">
        <section className="ad-painel" aria-labelledby="ag-hoje">
          <div className="ad-painel__topo"><h2 id="ag-hoje">Hoje, {SEMANA_LONGA[diaDaSemana(hoje)]} {diaMes(hoje)}</h2><button type="button" className="ad-btn ad-btn--primario" onClick={() => setCamada('lembrete')}><Icone nome="i-mais" />Lembrete <kbd>L</kbd></button></div>
          {dia.atrasados.length > 0 && <><h3 className="ad-h3">Atrasados · {dia.atrasados.length}</h3><ul className="ad-lista">{dia.atrasados.map((l) => linha(l))}</ul></>}
          <h3 className="ad-h3">Hoje · {dia.hoje.length}</h3>
          {dia.hoje.length ? <ul className="ad-lista">{dia.hoje.map((l) => linha(l, l.hora ? 'adiar' : 'concluir'))}</ul> : <p className="ad-anotacao">Nada marcado para hoje.</p>}
          <h3 className="ad-h3">Em breve</h3>
          {dia.emBreve.length ? (
            <ul className="ad-lista ad-lista--compacta">{dia.emBreve.map((l) => <li key={l.id}><span className="ad-lista__txt"><b>{l.titulo}</b><span>{SEMANA[diaDaSemana(l.data)]} {diaMes(l.data)}{l.repeticao !== 'nao_repete' ? ` · ${REPETE[l.repeticao]}` : ''} · avisa {plural(l.avisarDiasAntes, 'dia', 'dias')} antes</span></span></li>)}</ul>
          ) : <p className="ad-anotacao">Nenhum aviso adiantado.</p>}
          <p className="ad-anotacao">O resumo das 08:00 no celular diz só "Você tem {plural(dia.atrasados.length + dia.hoje.length, 'lembrete', 'lembretes')} hoje", sem o texto.</p>
        </section>
      </div>
      <section className="ad-painel" aria-labelledby="ag-cal">
        <div className="ad-painel__topo"><h2 id="ag-cal">{mesTitulo(mes).split(' de ')[0]}</h2><span className="ad-legenda"><span><i className="viva" />vencimento</span><span><i />lembrete</span></span></div>
        <div className="ad-cal">
          {SEMANA.map((s) => <span key={s} className="ad-cal__sem">{s}</span>)}
          {celulas.map((c) => {
            const venc = c.fora ? [] : vencimentos.filter((v) => v.data === c.data);
            const lemb = c.fora ? [] : ocorrencias.filter((o) => o.data === c.data);
            const mens = !c.fora && geradas && c.data.endsWith('-01');
            const rotulo = mens ? 'mensalidades' : venc[0]?.titulo ?? lemb[0]?.titulo.replace(/^Vence: /, '').toLowerCase();
            return (
              <div key={c.data} className={`ad-cal__dia${c.fora ? ' ad-cal__dia--fora' : ''}${c.data === hoje ? ' ad-cal__dia--hoje' : ''}`} title={[...venc.map((v) => `Vence: ${v.titulo}`), ...lemb.map((l) => l.titulo)].join('\n') || undefined}>
                <b>{Number(c.data.slice(8))}</b>
                {(venc.length > 0 || mens) && <i className="ad-cal__marca ad-cal__marca--viva" />}
                {lemb.length > 0 && !venc.length && !mens && <i className="ad-cal__marca" />}
                {rotulo && <span>{rotulo.length > 14 ? `${rotulo.slice(0, 13)}…` : rotulo}{venc.length + lemb.length > 1 ? ` +${venc.length + lemb.length - 1}` : ''}</span>}
              </div>
            );
          })}
        </div>
      </section>
      <div className="ad-coluna">
        <section className="ad-painel" aria-labelledby="ag-tar">
          <div className="ad-painel__topo"><h2 id="ag-tar">Tarefas abertas · {tarefas.length}</h2><button type="button" className="ad-btn" onClick={() => setCamada('tarefa')}><Icone nome="i-mais" />Tarefa</button></div>
          {!tarefas.length ? <p className="ad-anotacao">Nenhuma tarefa aberta.</p> : (
            <ul className="ad-lista">
              {tarefas.map(({ tarefa: t, atrasada }) => (
                <li key={t.id}>
                  {atrasada ? <Selo tom="erro">Atrasada</Selo> : t.prazo ? <Selo tom={t.prazo <= somarDias(hoje, 3) ? 'pend' : 'neutro'}>{diaMes(t.prazo)}</Selo> : <Selo>sem prazo</Selo>}
                  <span className="ad-lista__txt"><b>{t.titulo}</b><span>{[nome(t.responsavelPessoaId) ?? 'Alex', atrasada && t.prazo ? `era ${diaMes(t.prazo)}` : ''].filter(Boolean).join(' · ')}</span></span>
                  <button type="button" className="ad-btn" onClick={() => void concluirT(t)} disabled={envio.enviando} aria-label={`Concluir ${t.titulo}`}><Icone nome="i-marcar" /></button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      {camada === 'lembrete' && <GavetaLembrete aoFechar={() => setCamada(null)} />}
      {camada === 'tarefa' && <GavetaTarefa aoFechar={() => setCamada(null)} />}
      {camada && typeof camada === 'object' && <GavetaAdiar l={camada.adiar} aoFechar={() => setCamada(null)} />}
    </div>
  );
}

function GavetaAdiar({ l, aoFechar }: { l: Lembrete; aoFechar: () => void }) {
  const { hoje, executar, avisar } = useLoja();
  const [data, setData] = useState(formatarDataBR(somarDias(hoje, 1)));
  const [erro, setErro] = useState<string | null>(null);
  async function gravar() {
    const iso = lerDataDigitada(data, hoje, { futuro: true });
    if (!iso) { setErro('A data não existe. Use dd/mm/aaaa, "amanhã" ou "20/10".'); return; }
    let novo: Lembrete;
    try { novo = adiarLembrete(l, iso, hoje); } catch { setErro('Não dá para adiar para o passado.'); return; }
    const r = await executar((repo) => repo.salvar('lembretes', novo));
    if (r.ok) { avisar(`Adiado para ${formatarDataBR(iso)}.`); aoFechar(); }
  }
  return (
    <Gaveta titulo={`Adiar · ${l.titulo}`} aoFechar={aoFechar} rodape={<><button type="button" className="ad-btn ad-btn--grande" onClick={aoFechar}>Cancelar</button><button type="button" className="ad-btn ad-btn--primario ad-btn--grande" onClick={() => void gravar()}>Adiar</button></>}>
      <Campo rotulo="Para o dia" erro={erro}>{(p) => <input {...p} value={data} onChange={(e) => { setData(e.target.value); setErro(null); }} />}</Campo>
    </Gaveta>
  );
}

function GavetaTarefa({ aoFechar }: { aoFechar: () => void }) {
  const d = useDados();
  const { executar, avisar, sessao, hoje } = useLoja();
  const [titulo, setTitulo] = useState('');
  const [prazo, setPrazo] = useState('');
  const [resp, setResp] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  async function gravar() {
    if (!titulo.trim()) { setErro('Escreva a tarefa.'); return; }
    const p = prazo.trim() ? lerDataDigitada(prazo, hoje, { futuro: true }) : null;
    if (prazo.trim() && !p) { setErro('O prazo não existe. Use dd/mm/aaaa, "amanhã" ou "20/10".'); return; }
    const r1 = resp.trim() ? acharPorNome(d.pessoas.filter((x) => x.ehFuncionario), resp) : undefined;
    if (resp.trim() && !r1) { setErro('Responsável não encontrado na equipe.'); return; }
    const t: Tarefa = { id: crypto.randomUUID(), academiaId: d.academia.id, titulo: titulo.trim().slice(0, 120), ...(p ? { prazo: p } : {}), ...(r1 ? { responsavelPessoaId: r1.id } : {}), criadaPor: sessao.usuarioId, criadaEm: agoraNaAcademia() };
    const r = await executar((repo) => repo.salvar('tarefas', t));
    if (r.ok) { avisar('Tarefa criada.'); aoFechar(); }
  }
  return (
    <Gaveta titulo="Tarefa nova" aoFechar={aoFechar} rodape={<><button type="button" className="ad-btn ad-btn--grande" onClick={aoFechar}>Cancelar</button><button type="button" className="ad-btn ad-btn--primario ad-btn--grande" onClick={() => void gravar()}>Criar</button></>}>
      <Campo rotulo="O que fazer" erro={erro}>{(p) => <input {...p} value={titulo} maxLength={120} onChange={(e) => { setTitulo(e.target.value); setErro(null); }} />}</Campo>
      <Campo rotulo="Prazo (opcional)">{(p) => <input {...p} value={prazo} onChange={(e) => setPrazo(e.target.value)} placeholder="dd/mm, amanhã…" />}</Campo>
      <Campo rotulo="Responsável (opcional)" ajuda="Alguém da equipe. Só o dono vê as tarefas (A1).">{(p) => <input {...p} value={resp} onChange={(e) => setResp(e.target.value)} list="lista-pessoas" />}</Campo>
    </Gaveta>
  );
}
