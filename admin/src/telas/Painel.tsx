/**
 * PAINEL (RA2): a academia numa tela, em 3 colunas que cabem em 2040 × 790
 * sem rolar. O herói é o resultado até hoje, com a previsão do fechamento ao
 * lado (pedido do AR). A comparação é NO MESMO PERÍODO (1 a N × 1 a N), e o
 * mês anterior inteiro vem à parte, sem percentual. Toda conta é do domínio.
 */

import { useMemo } from 'react';
import { lembretesDoDia, tarefasAbertas } from '@dominio/financeiro/anotacoes.ts';
import { listarInadimplentes } from '@dominio/financeiro/cobrancas.ts';
import { nomeDaCompetencia } from '@dominio/financeiro/datas.ts';
import { linhasDeAlunos } from '@dominio/financeiro/filtros.ts';
import { retornosPendentes } from '@dominio/financeiro/funil.ts';
import { resumoDoPainel } from '@dominio/financeiro/painel.ts';
import { Icone, Numero, Selo } from '../componentes/basicos.tsx';
import { Barras } from '../componentes/graficos.tsx';
import { GerarMensalidades } from '../componentes/gerar-mensalidades.tsx';
import { useDados, useLoja } from '../estado/loja.tsx';
import { href, ir } from '../estado/rota.ts';
import { diaMes, nomeDoMes, percentual, plural, reais, reaisComSinal } from '../util/formatar.ts';
import { linkDoWhatsapp, mensagemDeCobranca, numeroDoWhatsapp } from '../util/whatsapp.ts';

const FUNCOES: [string, string][] = [['professor', 'Professores'], ['recepcao', 'Recepção'], ['limpeza', 'Limpeza'], ['administrativo', 'Administrativo'], ['outro', 'Outros']];

export function Painel() {
  const d = useDados();
  const { mes, hoje } = useLoja();

  const v = useMemo(() => {
    const p = resumoDoPainel({ ...d, despesasFixas: d.despesasFixas, competencia: mes, hoje });
    const alunos = linhasDeAlunos(d, hoje).filter((a) => a.situacao === 'matriculado');
    const kids = new Set(d.planos.filter((x) => /kids/i.test(x.nome)).map((x) => x.id));
    const porModalidade = d.modalidades.map((m) => ({ nome: m.nome, n: alunos.filter((a) => a.modalidadeIds.includes(m.id) && !a.planoIds.every((id) => kids.has(id))).length }));
    const nKids = alunos.filter((a) => a.planoIds.some((id) => kids.has(id)));
    const kidsPorModalidade = d.modalidades.map((m) => ({ nome: m.nome, n: nKids.filter((a) => a.modalidadeIds.includes(m.id)).length })).filter((x) => x.n);
    const inad = listarInadimplentes(d.cobrancas, hoje);
    const abertasDoMes = d.cobrancas.filter((c) => c.estado === 'aberta' && c.competencia === mes).length;
    const pendentesAPagar = d.lancamentos.filter((l) => !l.arquivado && l.tipo === 'saida' && l.situacao === 'pendente' && l.data.startsWith(mes)).length;
    const geradas = d.cobrancas.filter((c) => c.tipo === 'mensalidade' && c.competencia === mes).map((c) => c.criadaEm).sort()[0];
    const dia = lembretesDoDia(d.lembretes, hoje);
    const tarefas = tarefasAbertas(d.tarefas, hoje);
    const retornos = retornosPendentes(d.interessados, d.experimentais, hoje, { diasDepois: d.regras.diasParaRetornoDaExperimental });
    return { p, porModalidade, kidsPorModalidade, nKids: nKids.length, inad, abertasDoMes, pendentesAPagar, geradas, dia, tarefas, retornos };
  }, [d, mes, hoje]);

  const { p } = v;
  const atual = hoje.startsWith(mes);
  const mesAnt = nomeDoMes(p.mesAnterior.competencia);
  const ate = p.comparacao.periodoAtual.ate;
  const intervalo = (x: { de: string; ate: string }) => `1 a ${diaMes(x.ate)}`;
  const nome = (id: string) => d.pessoas.find((x) => x.id === id);
  const tituloDoMes = atual ? `${nomeDoMes(mes).replace(/^./, (c) => c.toUpperCase())} até hoje (${diaMes(hoje)})` : `${nomeDaCompetencia(mes).replace(/^./, (c) => c.toUpperCase())}`;
  const negativos = p.evolucao.filter((e) => e.resultado < 0 && e.competencia !== mes);

  return (
    <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(300px, 1fr) minmax(0, 1.9fr) minmax(0, 2.1fr)' }}>
      <div className="ad-coluna">
        <section className="ad-painel" aria-labelledby="pn-alunos">
          <div className="ad-painel__topo"><h2 id="pn-alunos">Alunos</h2><a className="ad-btn ad-btn--plano" href={href('pessoas', 'alunos')}>Ver lista</a></div>
          <dl className="ad-numeros" style={{ ['--n' as string]: 3 }}>
            <Numero rotulo="Matriculados" valor={p.alunos.matriculados} aoAbrir={() => ir('pessoas', 'alunos', 'matriculado')} />
            <Numero rotulo="Treinaram" valor="—" />
            <Numero rotulo="Novos no mês" valor={`+${p.alunos.novosNoMes}`} tom={p.alunos.novosNoMes ? 'pos' : undefined} aoAbrir={() => ir('pessoas', 'alunos', 'novos')} />
            <Numero rotulo="Trancados" valor={p.alunos.trancados} aoAbrir={() => ir('pessoas', 'alunos', 'trancado')} />
            <Numero rotulo="Inativos" valor={p.alunos.inativos} aoAbrir={() => ir('pessoas', 'alunos', 'inativo')} />
            <Numero rotulo="No cadastro" valor={d.pessoas.length} />
          </dl>
          <p className="ad-anotacao">Treinaram = presença nos últimos 30 dias: chega quando a chamada do app da equipe estiver no ar (AJ, R15).</p>
          <div className="ad-sep" />
          <h3 className="ad-h3">Por modalidade</h3>
          <ul className="ad-lista ad-lista--compacta ad-lista--2col">
            {v.porModalidade.map((m) => <li key={m.nome}><span className="ad-lista__txt"><b>{m.nome}</b></span><span className="ad-lista__val">{m.n}</span></li>)}
            <li><span className="ad-lista__txt"><b>Kids</b></span><span className="ad-lista__val">{v.nKids}</span></li>
          </ul>
          <p className="ad-anotacao">Kids: {v.kidsPorModalidade.map((k) => `${k.nome} ${k.n}`).join(' · ') || 'nenhum'}. Quem faz combo conta nas duas.</p>
        </section>
        <section className="ad-painel" aria-labelledby="pn-equipe">
          <div className="ad-painel__topo"><h2 id="pn-equipe">Equipe · {p.funcionarios.total}</h2><a className="ad-btn ad-btn--plano" href={href('pessoas', 'funcionarios')}>Ver</a></div>
          <ul className="ad-lista ad-lista--compacta">
            {FUNCOES.filter(([f]) => p.funcionarios.porFuncao[f as keyof typeof p.funcionarios.porFuncao]).map(([f, rot]) => (
              <li key={f}><span className="ad-lista__txt"><b>{rot}</b></span><span className="ad-lista__val">{p.funcionarios.porFuncao[f as keyof typeof p.funcionarios.porFuncao]}</span></li>
            ))}
          </ul>
        </section>
      </div>

      <div className="ad-coluna ad-primeiro">
        <section className="ad-painel ad-painel--heroi" aria-labelledby="pn-mes">
          <div className="ad-painel__topo">
            <h2 id="pn-mes">{tituloDoMes}</h2>
            {v.geradas ? <Selo tom="ok" icone="i-marcar">Mensalidades geradas em {diaMes(v.geradas.slice(0, 10))}</Selo> : <GerarMensalidades competencia={mes} compacto />}
          </div>
          <div className="ad-heroi-par">
            <dl className="ad-heroi">
              <dt>{atual ? 'Resultado até hoje (entrou − saiu)' : 'Resultado do mês (entrou − saiu)'}</dt>
              <dd className={p.mes.resultado < 0 ? 'neg' : undefined}>{reais(p.mes.resultado)}</dd>
              <p className={`ad-heroi__var ${p.comparacao.resultado.diferenca >= 0 ? 'pos' : 'neg'}`}>
                {p.comparacao.resultado.diferenca >= 0 ? '▲' : '▼'} {reais(Math.abs(p.comparacao.resultado.diferenca))} ({percentual(p.comparacao.resultado)}) sobre {atual ? `1 a ${Number(ate.slice(8))} de ${mesAnt}` : mesAnt}
              </p>
            </dl>
            <dl className="ad-heroi ad-heroi--par">
              <dt>Previsão do fechamento</dt>
              <dd className={p.previsao.resultadoPrevisto < 0 ? 'neg' : undefined}>{reais(p.previsao.resultadoPrevisto)}</dd>
              <p className="ad-heroi__var sec">{mesAnt.replace(/^./, (c) => c.toUpperCase())} fechou em {reais(p.mesAnterior.totais.resultado)}</p>
            </dl>
          </div>
          <dl className="ad-numeros" style={{ ['--n' as string]: 4 }}>
            <Numero rotulo="Entrou" valor={reais(p.mes.entradas)} apoio={`${percentual(p.comparacao.entradas)} (${intervalo(p.comparacao.periodoAtual)})`} apoioTom={p.comparacao.entradas.diferenca >= 0 ? 'pos' : 'neg'} aoAbrir={() => ir('financeiro', 'lancamentos')} />
            <Numero rotulo="Saiu" valor={reais(p.mes.saidas)} apoio={`${percentual(p.comparacao.saidas)} (${intervalo(p.comparacao.periodoAtual)})`} aoAbrir={() => ir('financeiro', 'lancamentos')} />
            <Numero rotulo="A receber" valor={reais(p.previsao.aReceberNoMes)} apoio={plural(v.abertasDoMes, 'cobrança', 'cobranças')} aoAbrir={() => ir('financeiro', 'cobrancas')} />
            <Numero rotulo="A pagar" valor={reais(p.previsao.aPagarNoMes)} apoio={plural(v.pendentesAPagar, 'linha', 'linhas')} aoAbrir={() => ir('financeiro', 'lancamentos')} />
          </dl>
        </section>

        <section className="ad-painel so-pc" aria-labelledby="pn-comp">
          <div className="ad-painel__topo"><h2 id="pn-comp">Comparação no mesmo período</h2></div>
          <div className="lista ad-tabela-rola">
            <table className="ad-tabela">
              <thead><tr><th scope="col" /><th scope="col" className="dir">{intervalo(p.comparacao.periodoAnterior)}</th><th scope="col" className="dir">{intervalo(p.comparacao.periodoAtual)}</th><th scope="col" className="dir">Diferença</th><th scope="col" className="dir">{mesAnt.replace(/^./, (c) => c.toUpperCase())} inteiro</th></tr></thead>
              <tbody>
                {([['Entrou', p.comparacao.entradas, p.mesAnterior.totais.entradas, false], ['Saiu', p.comparacao.saidas, p.mesAnterior.totais.saidas, true], ['Resultado', p.comparacao.resultado, p.mesAnterior.totais.resultado, false]] as const).map(([rot, x, inteiro, saida]) => {
                  const bom = saida ? x.diferenca <= 0 : x.diferenca >= 0;
                  return (
                    <tr key={rot}>
                      <th scope="row" className="t13b">{rot}</th>
                      <td className="dir">{reais(x.anterior)}</td>
                      <td className="dir"><b>{reais(x.atual)}</b></td>
                      <td className={`dir ${bom ? 'pos' : 'neg'}`}>{reaisComSinal(x.diferenca)} ({percentual(x)})</td>
                      <td className="dir sec">{reais(inteiro)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="ad-painel ad-painel--cheio" aria-labelledby="pn-12">
          <div className="ad-painel__topo"><h2 id="pn-12">Resultado dos últimos 12 meses</h2><a className="ad-btn ad-btn--plano" href={href('relatorios', 'ano')}>Relatório do ano</a></div>
          <Barras meses={p.evolucao.map((e) => ({ competencia: e.competencia, valor: e.resultado }))} atual={mes} />
          <p className="ad-legenda">
            <span><i className="viva" />{nomeDoMes(mes).replace(/^./, (c) => c.toUpperCase())}: {reais(p.mes.resultado)}{atual ? ' (até hoje)' : ''}</span>
            <span><i />Outros meses</span>
            {negativos.slice(0, 2).map((e) => <span key={e.competencia}><i className="neg" />{nomeDoMes(e.competencia).replace(/^./, (c) => c.toUpperCase())}: {reais(e.resultado)}</span>)}
          </p>
        </section>
      </div>

      <div className="ad-coluna">
        <div className="ad-sub2">
          <div className="ad-pilha">
            <section className="ad-painel" aria-labelledby="pn-prev">
              <div className="ad-painel__topo"><h2 id="pn-prev">Previsão de {nomeDoMes(mes)}, por partes</h2></div>
              <p className="ad-anotacao">Como a conta chega em {reais(p.previsao.resultadoPrevisto)}:</p>
              <ul className="ad-lista ad-lista--compacta">
                <li><span className="ad-lista__txt"><span>Já entrou</span></span><span className="ad-lista__val">{reais(p.previsao.jaEntrou)}</span></li>
                <li><span className="ad-lista__txt"><span>+ cobranças abertas do mês</span></span><span className="ad-lista__val pos">{reaisComSinal(p.previsao.aReceberNoMes)}</span></li>
                <li><span className="ad-lista__txt"><span>− já saiu</span></span><span className="ad-lista__val neg">{reais(-p.previsao.jaSaiu)}</span></li>
                <li><span className="ad-lista__txt"><span>− a pagar no mês</span></span><span className="ad-lista__val neg">{reais(-p.previsao.aPagarNoMes)}</span></li>
                <li><span className="ad-lista__txt"><b>= deve fechar em</b></span><span className="ad-lista__val">{reais(p.previsao.resultadoPrevisto)}</span></li>
              </ul>
              <p className="ad-anotacao">Fora da conta: {reais(p.previsao.atrasadoDeMesesAnteriores)} atrasados de meses anteriores que ainda podem entrar.</p>
            </section>
            <section className="ad-painel" aria-labelledby="pn-inad">
              <div className="ad-painel__topo"><h2 id="pn-inad">Devendo · {p.inadimplentes.pessoas} · {reais(p.inadimplentes.centavos)}</h2><a className="ad-btn ad-btn--plano" href={href('relatorios', 'inadimplencia')}>Ver</a></div>
              {v.inad.length === 0 ? <p className="ad-anotacao">Ninguém em atraso hoje.</p> : (
                <ul className="ad-lista">
                  {v.inad.slice(0, 4).map((i) => {
                    const pessoa = nome(i.pessoaId);
                    const cobs = d.cobrancas.filter((c) => i.cobrancaIds.includes(c.id));
                    const filhos = [...new Set(cobs.map((c) => c.alunoPessoaId).filter(Boolean))].map((id) => nome(id!)?.nome.split(' ')[0]);
                    const numero = numeroDoWhatsapp(pessoa?.telefone);
                    const texto = mensagemDeCobranca({ nome: pessoa?.nome ?? '', mes: nomeDoMes(cobs[0]!.competencia), vencimento: i.vencimentoMaisAntigo, centavos: i.totalCentavos, academia: 'Raça Fight', quantas: cobs.length });
                    return (
                      <li key={i.pessoaId}>
                        <span className="ad-lista__txt"><b>{pessoa?.nome}</b><span>{i.diasDoAtrasoMaisAntigo} dias · {filhos.length ? `${filhos.join(' e ')} (Kids)` : cobs.length > 1 ? `${cobs.length} mensalidades` : nomeDoMes(cobs[0]!.competencia)}</span></span>
                        <span className="ad-lista__val neg">{reais(i.totalCentavos)}</span>
                        {numero
                          ? <a className="ad-btn ad-btn--icone" href={linkDoWhatsapp(numero, texto)} target="_blank" rel="noopener noreferrer" aria-label={`Cobrar ${pessoa?.nome} no WhatsApp`}><Icone nome="i-conversa" /></a>
                          : <span className="ad-btn ad-btn--icone" aria-label="Sem telefone" title="Sem telefone no cadastro"><Icone nome="i-conversa" /></span>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
          <div className="ad-pilha">
            <section className="ad-painel" aria-labelledby="pn-funil">
              <div className="ad-painel__topo"><h2 id="pn-funil">Funil de {nomeDoMes(mes)}</h2><a className="ad-btn ad-btn--plano" href={href('funil')}>Abrir</a></div>
              <dl className="ad-numeros" style={{ ['--n' as string]: 4 }}>
                <Numero rotulo="Contatos" valor={p.funil.contatos} />
                <Numero rotulo="Marcaram" valor={p.funil.agendaram} />
                <Numero rotulo="Fizeram" valor={p.funil.fizeramExperimental} />
                <Numero rotulo="Matrículas" valor={p.funil.matricularam} />
              </dl>
              <p className="ad-anotacao">Da aula à matrícula: {Math.round(p.funil.experimentalParaMatriculaPontosBase / 100)} %. {v.retornos.length > 0 && <a className="marca forte" href={href('funil')}>{plural(v.retornos.length, 'para chamar de volta', 'para chamar de volta')}</a>}</p>
            </section>
            <section className="ad-painel" aria-labelledby="pn-hoje">
              <div className="ad-painel__topo"><h2 id="pn-hoje">Hoje</h2><a className="ad-btn ad-btn--plano" href={href('agenda')}>Agenda</a></div>
              <ListaDeHoje dia={v.dia} tarefas={v.tarefas} />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ListaDeHoje({ dia, tarefas, limite = 4 }: { dia: ReturnType<typeof lembretesDoDia>; tarefas: ReturnType<typeof tarefasAbertas>; limite?: number }) {
  const d = useDados();
  const nome = (id?: string) => d.pessoas.find((p) => p.id === id)?.nome.split(' ')[0];
  const itens = [
    ...dia.atrasados.map((l) => ({ id: l.id, selo: <Selo tom="erro">Atrasado</Selo>, tit: l.titulo, apoio: `desde ${diaMes(l.data)}` })),
    ...dia.hoje.map((l) => ({ id: l.id, selo: <Selo tom="pend">Hoje</Selo>, tit: l.titulo, apoio: l.valorCentavos ? reais(l.valorCentavos) : l.hora ? `às ${l.hora}` : l.detalhe ?? '' })),
    ...tarefas.map((t) => ({ id: t.tarefa.id, selo: <Selo tom={t.atrasada ? 'erro' : 'neutro'}>Tarefa</Selo>, tit: t.tarefa.titulo, apoio: [nome(t.tarefa.responsavelPessoaId), t.tarefa.prazo ? `até ${diaMes(t.tarefa.prazo)}` : 'sem prazo'].filter(Boolean).join(' · ') })),
    ...dia.emBreve.map((l) => ({ id: l.id, selo: <Selo>Em breve</Selo>, tit: l.titulo, apoio: diaMes(l.data) })),
  ];
  if (!itens.length) return <p className="ad-anotacao">Nada para hoje.</p>;
  return (
    <ul className="ad-lista">
      {itens.slice(0, limite).map((i) => <li key={i.id}>{i.selo}<span className="ad-lista__txt"><b>{i.tit}</b><span>{i.apoio}</span></span></li>)}
    </ul>
  );
}

