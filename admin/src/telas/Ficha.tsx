/**
 * A FICHA da pessoa (RA13.2): tudo de uma pessoa num lugar, no desenho do AK.
 * Três jeitos, pelo que a pessoa é: ALUNO (matrícula, cobranças, notas e
 * histórico), RESPONSÁVEL KIDS (dependentes e as cobranças da família) e
 * FUNCIONÁRIO (remuneração do mês calculada e "Lançar como saída").
 * Nada de saúde aqui: peso, altura e restrições ficam só no app do aluno.
 */

import { useState, type ReactNode } from 'react';
import { notasLigadas } from '@dominio/financeiro/anotacoes.ts';
import { situacaoDaCobranca } from '@dominio/financeiro/cobrancas.ts';
import { formatarDinheiro, formatarPontosBase } from '@dominio/financeiro/dinheiro.ts';
import { formatarDataBR, lerDataDaPlanilha, nomeDaCompetencia } from '@dominio/financeiro/datas.ts';
import { filtrarHistorico } from '@dominio/financeiro/historico.ts';
import { sugerirDescontoFamilia } from '@dominio/financeiro/mensalidades.ts';
import type { Cobranca, Matricula, Pessoa } from '@dominio/financeiro/tipos.ts';
import { GavetaLembrete, GavetaNota } from '../componentes/anotar.tsx';
import { Campo, Gaveta, Icone, Selo, Vazio } from '../componentes/basicos.tsx';
import { useDescritor } from '../componentes/descrever.ts';
import { GavetaPagar } from '../componentes/pagar.tsx';
import { useDados, useLoja } from '../estado/loja.tsx';
import { href } from '../estado/rota.ts';
import { diaMes, iniciais, nomeDoMes, plural, reais } from '../util/formatar.ts';
import { agoraNaAcademia, horaDe } from '../util/relogio.ts';
import { linkDoWhatsapp, mensagemDeCobranca, numeroDoWhatsapp } from '../util/whatsapp.ts';
import { SeloDaCobranca } from './Cobrancas.tsx';
import { FichaDoFuncionario } from './Funcionarios.tsx';

export function Ficha({ pessoaId }: { pessoaId: string }) {
  const d = useDados();
  const p = d.pessoas.find((x) => x.id === pessoaId);
  if (!p) return <Vazio titulo="Pessoa não encontrada" texto="Ela pode ter sido apagada do exemplo. Volte à lista." acao={<a className="ad-btn" href={href('pessoas', 'alunos')}>Ver a lista</a>} />;
  const filhos = d.pessoas.filter((x) => x.responsavelPessoaId === p.id);
  if (p.ehResponsavel && filhos.length) return <FichaDoResponsavel p={p} filhos={filhos} />;
  const f = d.funcionarios.find((x) => x.pessoaId === p.id);
  if (f && !p.ehAluno) return <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(0, 1fr) minmax(0, 1fr)' }}><FichaDoFuncionario funcionario={f} /><ColunaNotasHistorico p={p} /></div>;
  return <FichaDoAluno p={p} />;
}

function Cabeca({ p, apoio, selos, acoes }: { p: Pessoa; apoio: string; selos: ReactNode; acoes?: ReactNode }) {
  return (
    <>
      <div className="ad-ficha-cabeca">
        <span className="ad-avatar" aria-hidden="true">{iniciais(p.nome)}</span>
        <div><h2>{p.nome}</h2><p className="ad-anotacao">{apoio}</p></div>
      </div>
      <div className="ad-acoes">{selos}</div>
      {acoes}
    </>
  );
}

function AcoesDaPessoa({ p, devendo }: { p: Pessoa; devendo?: { centavos: number; vencimento: string; competencia: string; quantas: number } }) {
  const [camada, setCamada] = useState<null | 'editar' | 'nota' | 'lembrete'>(null);
  const numero = numeroDoWhatsapp(p.telefone);
  const texto = devendo ? mensagemDeCobranca({ nome: p.nome, mes: nomeDoMes(devendo.competencia), vencimento: devendo.vencimento, centavos: devendo.centavos, academia: 'Raça Fight', quantas: devendo.quantas }) : `Olá, ${p.nome.split(' ')[0]}!`;
  return (
    <>
      <div className="ad-acoes">
        <button type="button" className="ad-btn" onClick={() => setCamada('editar')}>Editar</button>
        {numero ? <a className="ad-btn" href={linkDoWhatsapp(numero, texto)} target="_blank" rel="noopener noreferrer"><Icone nome="i-conversa" />{devendo ? 'Cobrar no WhatsApp' : 'WhatsApp'}</a> : <span className="ad-btn" aria-disabled="true" title="Sem telefone"><Icone nome="i-conversa" />Sem telefone</span>}
        <button type="button" className="ad-btn" onClick={() => setCamada('nota')}>Anotar</button>
        <button type="button" className="ad-btn" onClick={() => setCamada('lembrete')}>Lembrar</button>
      </div>
      {camada === 'editar' && <GavetaPessoa p={p} aoFechar={() => setCamada(null)} />}
      {camada === 'nota' && <GavetaNota pessoaId={p.id} aoFechar={() => setCamada(null)} />}
      {camada === 'lembrete' && <GavetaLembrete pessoaId={p.id} tituloInicial={devendo ? `Cobrar ${p.nome}` : ''} aoFechar={() => setCamada(null)} />}
    </>
  );
}

function FichaDoAluno({ p }: { p: Pessoa }) {
  const d = useDados();
  const { hoje } = useLoja();
  const [pagar, setPagar] = useState<Cobranca | null>(null);
  const [mexer, setMexer] = useState<null | { m: Matricula; acao: 'trancar' | 'encerrar' }>(null);
  const matriculas = d.matriculas.filter((m) => m.pessoaId === p.id).sort((a, b) => b.inicio.localeCompare(a.inicio));
  const cobs = d.cobrancas.filter((c) => (c.alunoPessoaId ?? c.pessoaId) === p.id).sort((a, b) => b.vencimento.localeCompare(a.vencimento));
  const atrasadas = cobs.filter((c) => situacaoDaCobranca(c, hoje).estado === 'atrasada');
  const plano = (id: string) => d.planos.find((x) => x.id === id);
  const viva = matriculas.find((m) => m.estado !== 'encerrada');
  const modalidades = viva ? (plano(viva.planoId)?.modalidadeIds ?? []).map((id) => d.modalidades.find((m) => m.id === id)?.nome).filter(Boolean) : [];
  const pagoNoAno = cobs.filter((c) => c.estado === 'paga' && c.pagaEm?.startsWith(hoje.slice(0, 4))).reduce((s, c) => s + (c.valorPagoCentavos ?? 0), 0);
  const desde = matriculas.at(-1)?.inicio;
  const devendo = atrasadas.length ? { centavos: atrasadas.reduce((s, c) => s + c.valorCentavos, 0), vencimento: atrasadas.at(-1)!.vencimento, competencia: atrasadas.at(-1)!.competencia, quantas: atrasadas.length } : undefined;

  return (
    <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 1fr)' }}>
      <div className="ad-coluna">
        <section className="ad-painel">
          <Cabeca p={p} apoio={`Aluno${desde ? ` desde ${formatarDataBR(desde)}` : ''}${p.usuarioId ? ' · conta do app ligada' : ' · sem conta no app'}`} selos={<>
            {viva ? (viva.estado === 'trancada' ? <Selo tom="pend">Trancado</Selo> : <Selo tom="ok">Matriculado</Selo>) : <Selo>Inativo</Selo>}
            {modalidades.map((m) => <Selo key={m}>{m}</Selo>)}
            {atrasadas.length ? <Selo tom="erro">Atrasado {situacaoDaCobranca(atrasadas.at(-1)!, hoje).diasDeAtraso} dias</Selo> : <Selo tom="ok">Em dia</Selo>}
          </>} acoes={<AcoesDaPessoa p={p} devendo={devendo} />} />
          <dl className="ad-dados">
            <dt>Telefone</dt><dd>{p.telefone ?? '—'}</dd>
            <dt>E-mail</dt><dd>{p.email ?? '—'}</dd>
            <dt>Nascimento</dt><dd>{p.dataNascimento ? formatarDataBR(p.dataNascimento) : '—'}</dd>
            {p.responsavelPessoaId && <><dt>Responsável</dt><dd><a className="forte" href={href('pessoas', 'ficha', p.responsavelPessoaId)}>{d.pessoas.find((x) => x.id === p.responsavelPessoaId)?.nome}</a></dd></>}
            <dt>No tatame</dt><dd className="sec">presença e faixa chegam com o app da equipe (AJ)</dd>
          </dl>
          <p className="ad-anotacao">Sem dado de saúde aqui: peso, altura e restrições ficam só no app do aluno.</p>
        </section>
        {matriculas.map((m) => {
          const pl = plano(m.planoId);
          const taxa = d.cobrancas.find((c) => c.matriculaId === m.id && c.tipo === 'matricula');
          return (
            <section className="ad-painel" key={m.id}>
              <div className="ad-painel__topo"><h2>Matrícula{m.estado !== 'ativa' ? ` · ${m.estado}` : ''}</h2>
                {m.estado === 'ativa' && <><button type="button" className="ad-btn" onClick={() => setMexer({ m, acao: 'trancar' })}>Trancar</button><button type="button" className="ad-btn ad-btn--perigo" onClick={() => setMexer({ m, acao: 'encerrar' })}>Encerrar</button></>}
              </div>
              <dl className="ad-dados">
                <dt>Plano</dt><dd>{pl?.nome} · {pl ? `${formatarDinheiro(pl.valorCentavos)} ${pl.periodicidade === 'mensal' ? 'por mês' : pl.periodicidade === 'trimestral' ? 'por trimestre' : ''}` : ''}</dd>
                <dt>Início</dt><dd>{formatarDataBR(m.inicio)}{m.fim ? ` · fim ${formatarDataBR(m.fim)}` : ''}</dd>
                <dt>Vencimento</dt><dd>todo dia {m.diaDeVencimento}</dd>
                <dt>Desconto</dt><dd>{m.descontos.length ? m.descontos.map((x) => `${{ familia: 'família', bolsista: 'bolsista', atleta: 'atleta', indicacao: 'indicação', funcionario: 'funcionário', outro: 'outro' }[x.motivo]} ${x.tipo === 'percentual' ? `−${formatarPontosBase(x.pontosBase)}` : `−${formatarDinheiro(x.centavos)}`}${x.ate ? ` até ${formatarDataBR(x.ate)}` : ''}`).join('; ') : 'nenhum'}</dd>
                {m.trancadaDe && <><dt>Trancada</dt><dd>{formatarDataBR(m.trancadaDe)} a {m.trancadaAte ? formatarDataBR(m.trancadaAte) : 'sem fim'}</dd></>}
                {pl?.taxaDeMatriculaCentavos ? <><dt>Taxa de matrícula</dt><dd>{formatarDinheiro(pl.taxaDeMatriculaCentavos)}{taxa?.pagaEm ? ` · paga em ${formatarDataBR(taxa.pagaEm)}` : taxa ? ' · em aberto' : ''}</dd></> : null}
                {m.pagadorPessoaId !== m.pessoaId && <><dt>Quem paga</dt><dd>{d.pessoas.find((x) => x.id === m.pagadorPessoaId)?.nome}</dd></>}
              </dl>
            </section>
          );
        })}
      </div>
      <section className="ad-painel ad-painel--sem-pad ad-painel--cheio" aria-labelledby="fa-cob">
        <div className="ad-painel__topo"><h2 id="fa-cob">Cobranças e pagamentos</h2></div>
        {cobs.length === 0 ? <Vazio titulo="Nenhuma cobrança ainda" texto="Ela nasce quando as mensalidades do mês são geradas." /> : (
          <div className="lista ad-tabela-rola">
            <table className="ad-tabela">
              <thead><tr><th scope="col">Mês</th><th scope="col">Vencimento</th><th scope="col" className="dir">Valor</th><th scope="col">Situação</th><th scope="col">Ação</th></tr></thead>
              <tbody>
                {cobs.map((c) => (
                  <tr key={c.id}>
                    <td>{c.tipo === 'matricula' ? 'Matrícula' : nomeDaCompetencia(c.competencia).replace(/^./, (x) => x.toUpperCase())}</td>
                    <td>{formatarDataBR(c.vencimento)}</td>
                    <td className="dir">{formatarDinheiro(c.valorCentavos)}</td>
                    <td><SeloDaCobranca c={c} hoje={hoje} /></td>
                    <td>{c.estado === 'aberta' ? <button type="button" className="ad-btn" onClick={() => setPagar(c)}>Marcar como paga</button> : '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="folha-moldura"><tr><td>Total pago em {hoje.slice(0, 4)}</td><td /><td className="dir"><b>{reais(pagoNoAno)}</b></td><td colSpan={2} /></tr></tfoot>
            </table>
          </div>
        )}
      </section>
      <ColunaNotasHistorico p={p} />
      {pagar && <GavetaPagar cobranca={pagar} aoFechar={() => setPagar(null)} />}
      {mexer && <GavetaMatricula m={mexer.m} acao={mexer.acao} aoFechar={() => setMexer(null)} />}
    </div>
  );
}

function ColunaNotasHistorico({ p }: { p: Pessoa }) {
  const d = useDados();
  const { sessao } = useLoja();
  const [nota, setNota] = useState(false);
  const descrever = useDescritor(d, sessao);
  const notas = notasLigadas(d.notas, { pessoaId: p.id });
  const lembretes = d.lembretes.filter((l) => l.pessoaId === p.id && !l.concluidoEm);
  const ids = new Set([p.id, ...d.matriculas.filter((m) => m.pessoaId === p.id || m.pagadorPessoaId === p.id).map((m) => m.id), ...d.cobrancas.filter((c) => c.pessoaId === p.id || c.alunoPessoaId === p.id).map((c) => c.id), ...d.funcionarios.filter((f) => f.pessoaId === p.id).map((f) => f.id)]);
  const hist = filtrarHistorico(d.historico.filter((h) => ids.has(h.registroId)), {}).slice(0, 6);
  return (
    <div className="ad-coluna">
      <section className="ad-painel">
        <div className="ad-painel__topo"><h2>Notas e lembretes</h2><button type="button" className="ad-btn" onClick={() => setNota(true)}>Anotar</button></div>
        {!notas.length && !lembretes.length && <p className="ad-anotacao">Nada anotado sobre {p.nome.split(' ')[0]}.</p>}
        {notas.map((n) => <div key={n.id} className={`ad-nota${n.fixada ? ' ad-nota--fixa' : ''}`}><p>{n.texto}</p><span>{n.fixada ? 'Fixada · ' : ''}{diaMes(n.criadaEm.slice(0, 10))}</span></div>)}
        {lembretes.map((l) => <div key={l.id} className="ad-nota"><p>{l.titulo}</p><span>Lembrete · {diaMes(l.data)}</span></div>)}
      </section>
      <section className="ad-painel">
        <div className="ad-painel__topo"><h2>Histórico</h2><a className="ad-btn ad-btn--plano" href={href('historico')}>Tudo</a></div>
        {!hist.length ? <p className="ad-anotacao">Nenhuma mudança registrada ainda.</p> : (
          <ul className="ad-lista ad-lista--compacta">
            {hist.map((h) => { const [tit, ...resto] = descrever(h); return <li key={h.id}><span className="ad-lista__txt"><b>{tit.replace(/ em \d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}$/, '')}</b><span>{formatarDataBR(h.em.slice(0, 10))} às {horaDe(h.em)}{resto.length ? ` · ${resto.join(' · ')}` : ''}</span></span></li>; })}
          </ul>
        )}
      </section>
      {nota && <GavetaNota pessoaId={p.id} aoFechar={() => setNota(false)} />}
    </div>
  );
}

function FichaDoResponsavel({ p, filhos }: { p: Pessoa; filhos: Pessoa[] }) {
  const d = useDados();
  const { hoje, executar, avisar } = useLoja();
  const [pagar, setPagar] = useState<Cobranca | null>(null);
  const cobs = d.cobrancas.filter((c) => c.pessoaId === p.id).sort((a, b) => b.vencimento.localeCompare(a.vencimento) || (a.alunoPessoaId ?? '').localeCompare(b.alunoPessoaId ?? ''));
  const abertas = cobs.filter((c) => c.estado === 'aberta');
  const atrasadas = abertas.filter((c) => situacaoDaCobranca(c, hoje).estado === 'atrasada');
  const nome = (id?: string) => d.pessoas.find((x) => x.id === id)?.nome ?? '—';
  const familia = sugerirDescontoFamilia(d.matriculas).find((x) => x.pagadorPessoaId === p.id);
  const idade = (n?: string) => (n ? Math.floor((Number(hoje.slice(0, 4)) * 12 + Number(hoje.slice(5, 7)) - (Number(n.slice(0, 4)) * 12 + Number(n.slice(5, 7)))) / 12) : null);
  const devendo = atrasadas.length ? { centavos: atrasadas.reduce((s, c) => s + c.valorCentavos, 0), vencimento: atrasadas.at(-1)!.vencimento, competencia: atrasadas.at(-1)!.competencia, quantas: atrasadas.length } : undefined;

  async function pagarTodas() {
    // todas ou nenhuma (AU: `marcar_como_pagas`; antes uma por uma, e a do meio que falhava deixava metade paga)
    const r = await executar((repo) => repo.marcarComoPagas(abertas.map((c) => c.id), { data: hoje, forma: 'pix' }));
    if (r.ok) avisar(`${plural(abertas.length, 'cobrança marcada como paga', 'cobranças marcadas como pagas')} (Pix, hoje).`);
  }

  async function aplicarFamilia() {
    const regra = d.regras.descontoFamilia;
    if (!regra || !familia) return;
    const alvo = d.matriculas.filter((m) => familia.semDescontoDeFamilia.includes(m.id)).slice(1);
    const r = await executar(async (repo) => {
      let ultimo = null as Awaited<ReturnType<typeof repo.salvar>> | null;
      for (const m of alvo) ultimo = await repo.salvar('matriculas', { ...m, descontos: [...m.descontos, { ...regra, motivo: 'familia' }] });
      return ultimo ?? repo.carregar();
    });
    if (r.ok) avisar(`Desconto de família aplicado em ${plural(alvo.length, 'matrícula', 'matrículas')}. Vale das próximas mensalidades em diante.`);
  }

  return (
    <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 1fr)' }}>
      <div className="ad-coluna">
        <section className="ad-painel">
          <Cabeca p={p} apoio={`Responsável${p.ehAluno ? '' : ' · não treina'} · paga ${plural(d.matriculas.filter((m) => m.pagadorPessoaId === p.id && m.estado !== 'encerrada').length, 'matrícula', 'matrículas')}`}
            selos={<><Selo>Responsável</Selo>{atrasadas.length ? <Selo tom="erro">Atrasada há {situacaoDaCobranca(atrasadas.at(-1)!, hoje).diasDeAtraso} dias</Selo> : <Selo tom="ok">Em dia</Selo>}</>}
            acoes={<AcoesDaPessoa p={p} devendo={devendo} />} />
          <dl className="ad-dados"><dt>Telefone</dt><dd>{p.telefone ?? '—'}</dd><dt>E-mail</dt><dd>{p.email ?? '—'}</dd></dl>
        </section>
        <section className="ad-painel">
          <div className="ad-painel__topo"><h2>Dependentes · {filhos.length}</h2></div>
          {filhos.map((f) => {
            const m = d.matriculas.find((x) => x.pessoaId === f.id && x.estado !== 'encerrada');
            const pl = d.planos.find((x) => x.id === m?.planoId);
            const fam = m?.descontos.find((x) => x.motivo === 'familia');
            return (
              <a key={f.id} className="ad-cartao" href={href('pessoas', 'ficha', f.id)}>
                <b>{f.nome}{idade(f.dataNascimento) != null ? ` · ${idade(f.dataNascimento)} anos` : ''}</b>
                <span>{pl ? `${pl.nome} · vence dia ${m!.diaDeVencimento} · ${formatarDinheiro(pl.valorCentavos)}` : 'sem matrícula'}</span>
                {fam && <span className="pos">Desconto família {fam.tipo === 'percentual' ? `−${formatarPontosBase(fam.pontosBase)}` : `−${formatarDinheiro(fam.centavos)}`}</span>}
              </a>
            );
          })}
          {familia && familia.semDescontoDeFamilia.length > 1 && d.regras.descontoFamilia && (
            <>
              <p className="ad-anotacao">O mesmo pagador com {plural(familia.matriculaIds.length, 'matrícula', 'matrículas')}: o Admin sugere o desconto de família. O percentual é da academia (A8{d.regras.provisorio ? ', provisório' : ''}); ninguém aplica sozinho.</p>
              <button type="button" className="ad-btn" onClick={() => void aplicarFamilia()}>Aplicar desconto família</button>
            </>
          )}
        </section>
      </div>
      <section className="ad-painel ad-painel--sem-pad ad-painel--cheio" aria-labelledby="fk-cob">
        <div className="ad-painel__topo"><h2 id="fk-cob">Cobranças da família</h2>{abertas.length > 1 && <button type="button" className="ad-btn ad-btn--primario" onClick={() => void pagarTodas()}>Marcar as {abertas.length} como pagas</button>}</div>
        <div className="lista ad-tabela-rola">
          <table className="ad-tabela">
            <thead><tr><th scope="col">Aluno</th><th scope="col">Mês</th><th scope="col">Vencimento</th><th scope="col" className="dir">Valor</th><th scope="col">Situação</th><th scope="col">Ação</th></tr></thead>
            <tbody>
              {cobs.map((c) => (
                <tr key={c.id}>
                  <td><b>{nome(c.alunoPessoaId)}</b></td>
                  <td>{c.tipo === 'matricula' ? 'Matrícula' : nomeDaCompetencia(c.competencia).replace(/^./, (x) => x.toUpperCase())}</td>
                  <td>{formatarDataBR(c.vencimento)}</td>
                  <td className="dir">{formatarDinheiro(c.valorCentavos)}</td>
                  <td><SeloDaCobranca c={c} hoje={hoje} /></td>
                  <td>{c.estado === 'aberta' ? <button type="button" className="ad-btn" onClick={() => setPagar(c)}>Marcar como paga</button> : '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="folha-moldura"><tr><td>Em aberto</td><td /><td /><td className="dir"><b className={abertas.length ? 'neg' : ''}>{reais(abertas.reduce((s, c) => s + c.valorCentavos, 0))}</b></td><td colSpan={2} /></tr></tfoot>
          </table>
        </div>
      </section>
      <ColunaNotasHistorico p={p} />
      {pagar && <GavetaPagar cobranca={pagar} aoFechar={() => setPagar(null)} />}
    </div>
  );
}

export function GavetaPessoa({ p, aoFechar }: { p: Pessoa; aoFechar: () => void }) {
  const { executar, avisar } = useLoja();
  const [nome, setNome] = useState(p.nome);
  const [telefone, setTelefone] = useState(p.telefone ?? '');
  const [email, setEmail] = useState(p.email ?? '');
  const [nascimento, setNascimento] = useState(p.dataNascimento ? formatarDataBR(p.dataNascimento) : '');
  const [obs, setObs] = useState(p.observacao ?? '');
  const [erro, setErro] = useState<string | null>(null);
  async function gravar() {
    if (!nome.trim()) { setErro('Escreva o nome.'); return; }
    const nasc = nascimento.trim() ? lerDataDaPlanilha(nascimento) : null;
    if (nascimento.trim() && !nasc) { setErro('A data de nascimento não existe.'); return; }
    const novo: Pessoa = { ...p, nome: nome.trim(), atualizadaEm: agoraNaAcademia() };
    for (const [k, v] of [['telefone', telefone], ['email', email], ['observacao', obs]] as const) { if (v.trim()) novo[k] = v.trim(); else delete novo[k]; }
    if (nasc) novo.dataNascimento = nasc; else delete novo.dataNascimento;
    const r = await executar((repo) => repo.salvar('pessoas', novo));
    if (r.ok) { avisar('Cadastro atualizado.'); aoFechar(); }
  }
  return (
    <Gaveta titulo="Editar cadastro" aoFechar={aoFechar} rodape={<>
      <button type="button" className="ad-btn ad-btn--grande" onClick={aoFechar}>Cancelar</button>
      <button type="button" className="ad-btn ad-btn--primario ad-btn--grande" onClick={() => void gravar()}>Guardar</button>
    </>}>
      <Campo rotulo="Nome" erro={erro}>{(x) => <input {...x} value={nome} onChange={(e) => { setNome(e.target.value); setErro(null); }} />}</Campo>
      <Campo rotulo="Telefone (WhatsApp)">{(x) => <input {...x} value={telefone} onChange={(e) => setTelefone(e.target.value)} inputMode="tel" />}</Campo>
      <Campo rotulo="E-mail">{(x) => <input {...x} value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" />}</Campo>
      <Campo rotulo="Nascimento">{(x) => <input {...x} value={nascimento} onChange={(e) => setNascimento(e.target.value)} placeholder="dd/mm/aaaa" />}</Campo>
      <Campo rotulo="Observação" ajuda="Até 500 caracteres. Nada de saúde aqui.">{(x) => <textarea {...x} rows={3} maxLength={500} value={obs} onChange={(e) => setObs(e.target.value)} />}</Campo>
      <p className="ad-anotacao">Documento (CPF) não é pedido: é a pergunta A17.</p>
    </Gaveta>
  );
}

function GavetaMatricula({ m, acao, aoFechar }: { m: Matricula; acao: 'trancar' | 'encerrar'; aoFechar: () => void }) {
  const { hoje, executar, avisar } = useLoja();
  const [de, setDe] = useState(formatarDataBR(hoje));
  const [ate, setAte] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  async function gravar() {
    const d1 = lerDataDaPlanilha(de);
    if (!d1) { setErro('A data não existe.'); return; }
    let novo: Matricula;
    if (acao === 'trancar') {
      const d2 = ate.trim() ? lerDataDaPlanilha(ate) : null;
      if (ate.trim() && (!d2 || d2 < d1)) { setErro('A volta precisa ser depois do começo.'); return; }
      novo = { ...m, estado: 'trancada', trancadaDe: d1, ...(d2 ? { trancadaAte: d2 } : {}) };
    } else novo = { ...m, estado: 'encerrada', fim: d1 };
    const r = await executar((repo) => repo.salvar('matriculas', novo));
    if (r.ok) { avisar(acao === 'trancar' ? 'Matrícula trancada: sem cobrança no período.' : 'Matrícula encerrada.'); aoFechar(); }
  }
  return (
    <Gaveta titulo={acao === 'trancar' ? 'Trancar a matrícula' : 'Encerrar a matrícula'} aoFechar={aoFechar} rodape={<>
      <button type="button" className="ad-btn ad-btn--grande" onClick={aoFechar}>Cancelar</button>
      <button type="button" className={`ad-btn ad-btn--grande ${acao === 'encerrar' ? 'ad-btn--perigo' : 'ad-btn--primario'}`} onClick={() => void gravar()}>{acao === 'trancar' ? 'Trancar' : 'Encerrar'}</button>
    </>}>
      <Campo rotulo={acao === 'trancar' ? 'A partir de' : 'Último dia'} erro={erro}>{(x) => <input {...x} value={de} onChange={(e) => { setDe(e.target.value); setErro(null); }} />}</Campo>
      {acao === 'trancar' && <Campo rotulo="Volta em (opcional)">{(x) => <input {...x} value={ate} onChange={(e) => setAte(e.target.value)} placeholder="dd/mm/aaaa" />}</Campo>}
      <p className="ad-anotacao">{acao === 'trancar' ? 'Viagem, lesão: a mensalidade que vence dentro do período não é gerada (RA3.4).' : 'A matrícula não some: fica no histórico, e a pessoa vira inativa.'}</p>
    </Gaveta>
  );
}
