/**
 * FUNIL DA AULA EXPERIMENTAL (RA11): interessado → aula marcada → fez a aula
 * → matriculado. A etapa é CALCULADA (`etapaDoInteressado`); os caminhos são
 * os do R19.3 (`mudarExperimental`). "Chamar de volta" usa o prazo da
 * academia (A15); matricular com indicação aplica o desconto para os dois
 * (`descontosDaIndicacao`, A9).
 */

import { useMemo, useState } from 'react';
import { conversaoDoFunil, etapaDoInteressado, experimentalFeitaEm, lembreteDeRetorno, matricularInteressado, mudarExperimental, retornosPendentes, type OrigemNoRelatorio } from '@dominio/financeiro/funil.ts';
import { formatarDinheiro } from '@dominio/financeiro/dinheiro.ts';
import { dataNaCompetencia, formatarDataBR, periodoDaCompetencia, somarDias, somarMeses, competenciaDe } from '@dominio/financeiro/datas.ts';
import { horariosDoDia } from '@dominio/financeiro/grade-de-aulas.ts';
import { descontosDaIndicacao } from '@dominio/financeiro/mensalidades.ts';
import type { AulaExperimental, EstadoDaExperimental, Interessado, Matricula, OrigemDoContato, Pessoa } from '@dominio/financeiro/tipos.ts';
import { Campo, Gaveta, Icone } from '../componentes/basicos.tsx';
import { useEnvio } from '../estado/envio.ts';
import { useDados, useLoja } from '../estado/loja.tsx';
import { lerDataDigitada } from '../util/datas-digitadas.ts';
import { ir } from '../estado/rota.ts';
import { diaMes, nomeDoMes, plural } from '../util/formatar.ts';
import { agoraNaAcademia } from '../util/relogio.ts';
import { linkDoWhatsapp, numeroDoWhatsapp } from '../util/whatsapp.ts';

const ORIGENS: [OrigemNoRelatorio, string][] = [['instagram', 'Instagram'], ['whatsapp', 'WhatsApp'], ['indicacao', 'Indicação'], ['passou_na_porta', 'Passou na porta'], ['outro', 'Outro'], ['nao_informado', 'Não informado']];
const nomeDaOrigem = (o?: OrigemDoContato) => ORIGENS.find((x) => x[0] === (o ?? 'nao_informado'))![1];

function Whats({ i }: { i: Interessado }) {
  const n = numeroDoWhatsapp(i.whatsapp?.replace(/^55/, ''));
  if (!n) return null;
  return <a className="ad-btn ad-btn--icone" href={linkDoWhatsapp(n, `Olá, ${i.nome.split(' ')[0]}! Aqui é da Raça Fight.`)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp de ${i.nome}`}><Icone nome="i-conversa" /></a>;
}

export function Funil() {
  const d = useDados();
  const { mes, hoje, executar, avisar, sessao } = useLoja();
  const [camada, setCamada] = useState<null | { tipo: 'marcar' | 'matricular'; i: Interessado } | { tipo: 'novo' }>(null);
  const modNome = (ids: string[]) => ids.map((id) => d.modalidades.find((m) => m.id === id)?.nome).filter(Boolean).join(' · ');
  const expsDe = (i: Interessado) => d.experimentais.filter((e) => e.interessadoId === i.id);
  const periodo = periodoDaCompetencia(mes);

  const colunas = useMemo(() => {
    const vivos = d.interessados.filter((i) => i.contatoEm >= somarDias(hoje, -120));
    const por = (et: string) => vivos.filter((i) => etapaDoInteressado(i, d.experimentais) === et);
    const matric = d.interessados.filter((i) => i.matriculadoEm && i.matriculadoEm >= periodo.de && i.matriculadoEm <= periodo.ate);
    return {
      interessado: por('interessado').sort((a, b) => b.contatoEm.localeCompare(a.contatoEm)),
      marcada: por('experimental_agendada').sort((a, b) => (expsDe(a).at(-1)?.data ?? '').localeCompare(expsDe(b).at(-1)?.data ?? '')),
      feita: por('experimental_feita').sort((a, b) => (experimentalFeitaEm(b, d.experimentais) ?? '').localeCompare(experimentalFeitaEm(a, d.experimentais) ?? '')),
      matriculado: matric,
    };
  }, [d, hoje, periodo.de, periodo.ate]); // eslint-disable-line react-hooks/exhaustive-deps
  const retornos = retornosPendentes(d.interessados, d.experimentais, hoje, { diasDepois: d.regras.diasParaRetornoDaExperimental });
  const conv = conversaoDoFunil(d.interessados, d.experimentais, periodo);

  async function mudar(e: AulaExperimental, para: EstadoDaExperimental, frase: string) {
    let novo: AulaExperimental;
    try { novo = mudarExperimental(e, para); } catch { avisar('Esse caminho não existe para a aula experimental.'); return; }
    const r = await executar((repo) => repo.salvar('aulas_experimentais', novo));
    if (r.ok) avisar(frase);
  }

  async function lembrar(i: Interessado, compareceuEm: string) {
    const l = lembreteDeRetorno(i, compareceuEm, { diasDepois: d.regras.diasParaRetornoDaExperimental, gerarId: () => crypto.randomUUID(), porId: sessao.usuarioId, em: agoraNaAcademia() });
    const data = l.data < hoje ? hoje : l.data;
    const r = await executar((repo) => repo.salvar('lembretes', { ...l, data }));
    if (r.ok) avisar(`Lembrete para ${formatarDataBR(data)}: ligar para ${i.nome}.`);
  }

  const cartao = (i: Interessado, etapa: keyof typeof colunas) => {
    const e = expsDe(i).at(-1);
    const apoio = etapa === 'interessado' ? `${modNome(i.modalidadeIds)} · ${nomeDaOrigem(i.origem)} · ${diaMes(i.contatoEm)}`
      : etapa === 'marcada' ? `${modNome(i.modalidadeIds)} · ${e ? diaMes(e.data) : ''}`
      : etapa === 'feita' ? `${modNome(i.modalidadeIds)} · fez ${diaMes(experimentalFeitaEm(i, d.experimentais) ?? '')}${i.origem === 'indicacao' ? ' · indicação' : ''}`
      : `${modNome(i.modalidadeIds)} · ${diaMes(i.matriculadoEm ?? '')}`;
    return (
      <div key={i.id} className={`ad-cartao${etapa === 'feita' ? ' ad-cartao--quente' : ''}`}>
        <b>{i.crianca ? `${i.crianca.nome} (resp. ${i.nome})` : i.nome}</b><span>{apoio}</span>
        {etapa !== 'matriculado' && (
          <div className="ad-acoes">
            {etapa === 'interessado' && <button type="button" className="ad-btn" onClick={() => setCamada({ tipo: 'marcar', i })}>Marcar aula</button>}
            {etapa === 'marcada' && e && <><button type="button" className="ad-btn" onClick={() => void mudar(e, 'compareceu', `${i.nome} fez a aula.`)}>Compareceu</button><button type="button" className="ad-btn" onClick={() => void mudar(e, 'faltou', `${i.nome} faltou: volta a interessado.`)}>Faltou</button></>}
            {etapa === 'feita' && <><button type="button" className="ad-btn ad-btn--primario" onClick={() => setCamada({ tipo: 'matricular', i })}>Matricular</button>{e && e.estado === 'compareceu' && <button type="button" className="ad-btn" onClick={() => void mudar(e, 'nao_seguiu', `${i.nome} não seguiu.`)}>Não seguiu</button>}</>}
            <Whats i={i} />
          </div>
        )}
      </div>
    );
  };

  const col = (titulo: string, apoio: string, etapa: keyof typeof colunas) => (
    <section className="ad-funil__col" aria-label={titulo}>
      <header><h2 className="ad-h2">{titulo}</h2><b>{colunas[etapa].length}</b><span>{apoio}</span></header>
      {colunas[etapa].slice(0, 12).map((i) => cartao(i, etapa))}
      {colunas[etapa].length > 12 && <p className="ad-anotacao">e mais {colunas[etapa].length - 12}</p>}
    </section>
  );

  return (
    <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(0, 3fr) minmax(320px, 1fr)' }}>
      <div className="ad-funil">
        {col('Interessados', 'chegaram e não marcaram', 'interessado')}
        {col('Aula marcada', 'com data', 'marcada')}
        {col('Fez a aula', 'falta decidir', 'feita')}
        {col('Matriculados', `em ${nomeDoMes(mes)}`, 'matriculado')}
      </div>
      <div className="ad-coluna ad-primeiro">
        <div className="ad-acoes"><button type="button" className="ad-btn ad-btn--primario" onClick={() => setCamada({ tipo: 'novo' })}><Icone nome="i-mais" />Interessado</button></div>
        <section className="ad-painel ad-painel--heroi" aria-labelledby="fu-volta">
          <div className="ad-painel__topo"><h2 id="fu-volta">Chamar de volta · {retornos.length}</h2></div>
          <p className="ad-anotacao">Fizeram a aula há {plural(d.regras.diasParaRetornoDaExperimental, 'dia', 'dias')} ou mais e ainda não decidiram. O prazo é {d.regras.provisorio ? 'proposta (A15)' : 'da academia'}.</p>
          {!retornos.length ? <p className="ad-anotacao">Ninguém esperando retorno.</p> : (
            <ul className="ad-lista">
              {retornos.slice(0, 8).map(({ interessado: i, compareceuEm }) => (
                <li key={i.id}><span className="ad-lista__txt"><b>{i.nome}</b><span>fez {diaMes(compareceuEm)} · {modNome(i.modalidadeIds)} · {nomeDaOrigem(i.origem)}</span></span><Whats i={i} /><button type="button" className="ad-btn" onClick={() => void lembrar(i, compareceuEm)}>Lembrar</button></li>
              ))}
            </ul>
          )}
        </section>
        <section className="ad-painel ad-painel--sem-pad" aria-labelledby="fu-orig">
          <div className="ad-painel__topo"><h2 id="fu-orig">De onde vem aluno · {nomeDoMes(mes)}</h2></div>
          <div className="lista ad-tabela-rola">
            <table className="ad-tabela">
              <thead><tr><th scope="col">Origem</th><th scope="col" className="dir">Contatos</th><th scope="col" className="dir">Fizeram</th><th scope="col" className="dir">Matrículas</th><th scope="col" className="dir">Conversão</th></tr></thead>
              <tbody>
                {ORIGENS.filter(([o]) => conv.porOrigem[o].contatos).map(([o, rot]) => {
                  const n = conv.porOrigem[o];
                  return <tr key={o}><td><b>{rot}</b></td><td className="dir">{n.contatos}</td><td className="dir">{n.fizeramExperimental}</td><td className="dir">{n.matricularam}</td><td className="dir">{n.contatos ? `${Math.round(n.contatoParaMatriculaPontosBase / 100)} %` : '—'}</td></tr>;
                })}
              </tbody>
              <tfoot className="folha-moldura"><tr><td>Total</td><td className="dir"><b>{conv.total.contatos}</b></td><td className="dir"><b>{conv.total.fizeramExperimental}</b></td><td className="dir"><b>{conv.total.matricularam}</b></td><td className="dir"><b>{conv.total.contatos ? `${Math.round(conv.total.contatoParaMatriculaPontosBase / 100)} %` : '—'}</b></td></tr></tfoot>
            </table>
          </div>
        </section>
      </div>
      {camada?.tipo === 'marcar' && <GavetaMarcar i={camada.i} aoFechar={() => setCamada(null)} />}
      {camada?.tipo === 'matricular' && <GavetaMatricularDoFunil i={camada.i} aoFechar={() => setCamada(null)} />}
      {camada?.tipo === 'novo' && <GavetaInteressado aoFechar={() => setCamada(null)} />}
    </div>
  );
}

function GavetaMarcar({ i, aoFechar }: { i: Interessado; aoFechar: () => void }) {
  const d = useDados();
  const { hoje, executar, avisar, sessao } = useLoja();
  const [data, setData] = useState(formatarDataBR(somarDias(hoje, 1)));
  const [horarioId, setHorarioId] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const envio = useEnvio();
  // a aula experimental vai num HORÁRIO da grade: sem ele, não aparece na chamada do professor (AU)
  const iso = lerDataDigitada(data, hoje, { futuro: true });
  const doDia = iso ? horariosDoDia(d.turmas, iso, i.modalidadeIds[0]) : [];
  const opcoes = doDia.length || !iso ? doDia : horariosDoDia(d.turmas, iso);
  const escolhido = opcoes.find((x) => x.horario.id === horarioId) ?? opcoes[0];
  const gravar = () => envio.enviar(async () => {
    if (!iso) { setErro('A data não existe.'); return; }
    if (iso < hoje) { setErro('O dia já passou.'); return; }
    if (!escolhido) { setErro('Não há aula neste dia na grade. Escolha outro dia (ou monte a grade em Ajustes › Turmas e horários).'); return; }
    const modalidadeId = i.modalidadeIds.find((m) => escolhido.turma.modalidadeIds.includes(m)) ?? escolhido.turma.modalidadeIds[0];
    const e: AulaExperimental = {
      id: crypto.randomUUID(), academiaId: d.academia.id, interessadoId: i.id, data: iso, turmaId: escolhido.turma.id, horarioId: escolhido.horario.id,
      ...(modalidadeId ? { modalidadeId } : {}), estado: 'agendada', marcadaPor: sessao.usuarioId,
    };
    const r = await executar((repo) => repo.salvar('aulas_experimentais', e));
    if (r.ok) { avisar(`Aula experimental de ${i.nome} marcada: ${escolhido.turma.nome}, ${formatarDataBR(iso)} às ${escolhido.horario.inicio}.`); aoFechar(); }
  });
  return (
    <Gaveta titulo={`Marcar aula · ${i.nome}`} aoFechar={aoFechar} rodape={<><button type="button" className="ad-btn ad-btn--grande" onClick={aoFechar}>Cancelar</button><button type="button" className="ad-btn ad-btn--primario ad-btn--grande" onClick={() => void gravar()} disabled={envio.enviando}>Marcar</button></>}>
      <Campo rotulo="Dia da aula" erro={erro} ajuda='"amanhã", "20" e "20/10" valem.'>{(p) => <input {...p} value={data} onChange={(e) => { setData(e.target.value); setErro(null); setHorarioId(''); }} />}</Campo>
      <Campo rotulo="Aula">{(p) => (
        <select {...p} value={escolhido?.horario.id ?? ''} onChange={(e) => setHorarioId(e.target.value)} disabled={!opcoes.length}>
          {!opcoes.length && <option value="">{iso ? 'Nenhuma aula neste dia' : 'Escreva o dia'}</option>}
          {opcoes.map((x) => <option key={x.horario.id} value={x.horario.id}>{x.horario.inicio} · {x.turma.nome}</option>)}
        </select>
      )}</Campo>
      <p className="ad-anotacao">A aula vem da grade (Ajustes › Turmas e horários) e aparece na chamada do professor. Na v1, a experimental é combinada pelo WhatsApp (R19.2).</p>
    </Gaveta>
  );
}

function GavetaMatricularDoFunil({ i, aoFechar }: { i: Interessado; aoFechar: () => void }) {
  const d = useDados();
  const { hoje, executar, avisar } = useLoja();
  const planos = d.planos.filter((p) => p.ativo && p.periodicidade !== 'gratuito');
  const [planoId, setPlanoId] = useState(planos.find((p) => i.modalidadeIds.every((m) => p.modalidadeIds.includes(m)))?.id ?? planos[0]?.id ?? '');
  const [dia, setDia] = useState(String(Number(hoje.slice(8))));
  const indicador = i.indicadoPorPessoaId ? d.matriculas.find((m) => m.pessoaId === i.indicadoPorPessoaId && m.estado === 'ativa') : undefined;
  const regra = d.regras.descontoIndicacao;

  async function gravar() {
    const em = agoraNaAcademia();
    const pessoa: Pessoa = { id: crypto.randomUUID(), academiaId: d.academia.id, nome: i.crianca?.nome ?? i.nome, ...(i.whatsapp ? { telefone: i.whatsapp } : {}), ehAluno: true, ehFuncionario: false, criadaEm: em, atualizadaEm: em };
    let m: Matricula = { id: crypto.randomUUID(), academiaId: d.academia.id, pessoaId: pessoa.id, pagadorPessoaId: pessoa.id, planoId, inicio: hoje, estado: 'ativa', diaDeVencimento: Math.min(31, Math.max(1, Number(dia) || 1)), descontos: [] };
    let ind: Matricula | undefined;
    if (indicador && regra) {
      const { mesesDeDuracao, ...desconto } = regra;
      const ate = dataNaCompetencia(somarMeses(competenciaDe(hoje), mesesDeDuracao), 31);
      const r = descontosDaIndicacao({ indicador, novo: m, desconto, ate, interessadoId: i.id });
      m = r.novo; ind = r.indicador;
    }
    const mudado = matricularInteressado(i, d.experimentais, pessoa.id, hoje);
    // uma transação só (AU: `matricular_interessado`; no modo local, uma "mudança" só)
    const r = await executar((repo) => repo.matricularInteressado({
      interessado: mudado.interessado, experimentais: mudado.experimentais, pessoa, matricula: m, ...(ind ? { indicador: ind } : {}),
    }));
    if (r.ok) { avisar(`${pessoa.nome} matriculado${ind ? ', com o desconto da indicação para os dois' : ''}.`); aoFechar(); ir('pessoas', 'ficha', pessoa.id); }
  }

  return (
    <Gaveta titulo={`Matricular ${i.nome}`} aoFechar={aoFechar} rodape={<><button type="button" className="ad-btn ad-btn--grande" onClick={aoFechar}>Cancelar</button><button type="button" className="ad-btn ad-btn--primario ad-btn--grande" onClick={() => void gravar()}>Matricular</button></>}>
      <Campo rotulo="Plano">{(p) => <select {...p} value={planoId} onChange={(e) => setPlanoId(e.target.value)}>{planos.map((x) => <option key={x.id} value={x.id}>{x.nome} · {formatarDinheiro(x.valorCentavos)}</option>)}</select>}</Campo>
      <Campo rotulo="Dia do vencimento">{(p) => <input {...p} value={dia} onChange={(e) => setDia(e.target.value.replace(/\D/g, ''))} inputMode="numeric" />}</Campo>
      {indicador && regra && <p className="t13b pos">"Traga um amiguinho": quem indicou ({d.pessoas.find((p) => p.id === indicador.pessoaId)?.nome}) e quem chegou ganham {regra.tipo === 'valor' ? formatarDinheiro(regra.centavos) : `${regra.pontosBase / 100} %`} por {plural(regra.mesesDeDuracao, 'mês', 'meses')}{d.regras.provisorio ? ' (valor provisório, A9)' : ''}.</p>}
      <p className="ad-anotacao">Cria a pessoa e a matrícula; a aula experimental vira "matriculou". A cobrança sai ao gerar as mensalidades.</p>
    </Gaveta>
  );
}

function GavetaInteressado({ aoFechar }: { aoFechar: () => void }) {
  const d = useDados();
  const { hoje, executar, avisar } = useLoja();
  const [nome, setNome] = useState('');
  const [whats, setWhats] = useState('');
  const [modalidade, setModalidade] = useState(d.modalidades[0]?.id ?? '');
  const [origem, setOrigem] = useState<OrigemDoContato | ''>('instagram');
  const [erro, setErro] = useState<string | null>(null);
  async function gravar() {
    if (!nome.trim()) { setErro('Escreva o nome.'); return; }
    const i: Interessado = { id: crypto.randomUUID(), academiaId: d.academia.id, nome: nome.trim(), ...(whats.trim() ? { whatsapp: whats.replace(/\D/g, '') } : {}), modalidadeIds: modalidade ? [modalidade] : [], ...(origem ? { origem } : {}), contatoEm: hoje };
    const r = await executar((repo) => repo.salvar('interessados', i));
    if (r.ok) { avisar(`${i.nome} entrou no funil.`); aoFechar(); }
  }
  return (
    <Gaveta titulo="Interessado novo" aoFechar={aoFechar} rodape={<><button type="button" className="ad-btn ad-btn--grande" onClick={aoFechar}>Cancelar</button><button type="button" className="ad-btn ad-btn--primario ad-btn--grande" onClick={() => void gravar()}>Guardar</button></>}>
      <Campo rotulo="Nome" erro={erro}>{(p) => <input {...p} value={nome} onChange={(e) => { setNome(e.target.value); setErro(null); }} />}</Campo>
      <Campo rotulo="WhatsApp">{(p) => <input {...p} value={whats} onChange={(e) => setWhats(e.target.value)} inputMode="tel" />}</Campo>
      <Campo rotulo="Modalidade">{(p) => <select {...p} value={modalidade} onChange={(e) => setModalidade(e.target.value)}>{d.modalidades.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}</select>}</Campo>
      <Campo rotulo="Como conheceu (opcional)">{(p) => <select {...p} value={origem} onChange={(e) => setOrigem(e.target.value as OrigemDoContato)}><option value="">Não informado</option>{ORIGENS.filter(([o]) => o !== 'nao_informado').map(([o, rot]) => <option key={o} value={o}>{rot}</option>)}</select>}</Campo>
      <p className="ad-anotacao">Quem não vira aluno sai do cadastro depois de {d.regras.diasParaApagarInteressado} dias sem movimento (L23).</p>
    </Gaveta>
  );
}
