/**
 * FINANCEIRO › DESPESAS FIXAS (RA4.8): o que se repete todo mês. Viram linhas
 * PENDENTES na planilha (`gerarDespesasFixasDoMes`, idempotente); a variável
 * vem pela média de 3 meses, marcada "estimado". "Lembrar todo mês" cria o
 * lembrete pronto (`lembreteDaDespesaFixa`, RA12.5).
 */

import { useState } from 'react';
import { lembreteDaDespesaFixa } from '@dominio/financeiro/anotacoes.ts';
import { lerDinheiro } from '@dominio/financeiro/dinheiro.ts';
import { despesaValeNoMes } from '@dominio/financeiro/despesas-fixas.ts';
import { nomeDaCompetencia } from '@dominio/financeiro/datas.ts';
import { ROTULO_DA_FORMA } from '@dominio/financeiro/nomes.ts';
import { FORMAS_DE_PAGAMENTO, type DespesaFixa, type FormaDePagamento, type Lancamento } from '@dominio/financeiro/tipos.ts';
import { Campo, Gaveta, Icone, Selo } from '../componentes/basicos.tsx';
import { useEnvio } from '../estado/envio.ts';
import { useDados, useLoja } from '../estado/loja.tsx';
import { diaMes, nomeDoMes, plural, reais } from '../util/formatar.ts';
import { agoraNaAcademia } from '../util/relogio.ts';

export function DespesasFixas() {
  const d = useDados();
  const { mes, hoje, executar, avisar, sessao } = useLoja();
  const [editar, setEditar] = useState<DespesaFixa | 'nova' | null>(null);
  const [conferir, setConferir] = useState<{ despesa: DespesaFixa; linha: Lancamento } | null>(null);
  const envio = useEnvio();
  const ativas = d.despesasFixas.filter((x) => x.ativa);
  const linhaDoMes = (x: DespesaFixa) => d.lancamentos.find((l) => !l.arquivado && l.despesaFixaId === x.id && l.data.startsWith(mes));
  // o valor do MÊS: o da linha, quando ela existe (a luz estimada ou já conferida); senão, o da regra (AO)
  const valorNoMes = (x: DespesaFixa) => linhaDoMes(x)?.valorCentavos ?? x.valorCentavos;
  const totalMes = ativas.filter((x) => despesaValeNoMes(x, mes)).reduce((s, x) => s + valorNoMes(x), 0);
  const nome = (id?: string) => d.pessoas.find((p) => p.id === id)?.nome ?? '—';
  const cat = (id?: string) => d.categorias.find((c) => c.id === id)?.nome ?? '—';
  const jaPago = ativas.map(linhaDoMes).filter((l) => l?.situacao === 'pago').reduce((s, l) => s + l!.valorCentavos, 0);
  const pendente = ativas.map(linhaDoMes).filter((l) => l?.situacao === 'pendente').reduce((s, l) => s + l!.valorCentavos, 0);
  const semLinha = ativas.filter((x) => despesaValeNoMes(x, mes) && !linhaDoMes(x)).length;

  async function lembrar(x: DespesaFixa) {
    if (d.lembretes.some((l) => l.despesaFixaId === x.id && !l.concluidoEm)) { avisar('Já existe lembrete desta despesa.'); return; }
    const l = lembreteDaDespesaFixa(x, { hoje, avisarDiasAntes: 2, gerarId: () => crypto.randomUUID(), porId: sessao.usuarioId, em: agoraNaAcademia() });
    const r = await executar((repo) => repo.salvar('lembretes', l));
    if (r.ok) avisar(`Lembrete criado: "${l.titulo}", todo dia ${x.diaDeVencimento}.`);
  }

  const gerar = () => envio.enviar(async () => {
    const r = await executar((repo) => repo.gerarDespesasFixas(mes));
    if (r.ok) avisar(r.valor.geradas ? `${plural(r.valor.geradas, 'linha pendente criada', 'linhas pendentes criadas')} em ${nomeDoMes(mes)}.` : `As despesas de ${nomeDoMes(mes)} já estavam na planilha.`);
  });

  return (
    <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(0, 2.4fr) minmax(300px, 1fr)' }}>
      <section className="ad-painel ad-painel--sem-pad ad-painel--cheio" aria-labelledby="df-t">
        <div className="ad-painel__topo"><h2 id="df-t">O que se repete todo mês · {plural(ativas.length, 'despesa', 'despesas')} · {reais(totalMes)} por mês</h2><button type="button" className="ad-btn ad-btn--primario" onClick={() => setEditar('nova')}><Icone nome="i-mais" />Despesa fixa</button></div>
        <div className="lista ad-tabela-rola">
          <table className="ad-tabela">
            <thead><tr><th scope="col">Descrição</th><th scope="col">Categoria</th><th scope="col" className="dir">Valor</th><th scope="col">Vence</th><th scope="col">Forma</th><th scope="col">Pessoa</th><th scope="col">Desde</th><th scope="col">{nomeDoMes(mes).replace(/^./, (c) => c.toUpperCase())}</th><th scope="col">Ação</th></tr></thead>
            <tbody>
              {ativas.map((x) => {
                const l = linhaDoMes(x);
                const vale = despesaValeNoMes(x, mes);
                return (
                  <tr key={x.id}>
                    <td><b><a className="forte" href="#" onClick={(e) => { e.preventDefault(); setEditar(x); }}>{x.descricao}</a></b></td>
                    <td>{cat(x.categoriaId)}</td>
                    <td className="dir">{reais(valorNoMes(x))}{x.variavel ? (l?.estimado ? ' · estimado' : l ? '' : ' · média de 3 meses') : ''}</td>
                    <td>dia {x.diaDeVencimento}</td>
                    <td>{x.formaDePagamento ? ROTULO_DA_FORMA[x.formaDePagamento] : '—'}</td>
                    <td>{nome(x.pessoaId)}</td>
                    <td>{nomeDaCompetencia(x.desde, true)}</td>
                    <td>{!vale ? <Selo>fora do período</Selo> : !l ? <Selo>ainda sem linha</Selo> : l.situacao === 'pago' ? <Selo tom="ok">pago {diaMes(l.data)}</Selo> : <Selo tom="pend">pendente{l.estimado ? ' · estimado' : l.data === hoje ? ' · vence hoje' : ''}</Selo>}</td>
                    <td>{l?.estimado ? <button type="button" className="ad-btn" onClick={() => setConferir({ despesa: x, linha: l })}>Conferir a conta</button> : <button type="button" className="ad-btn" onClick={() => void lembrar(x)}>Lembrar todo mês</button>}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="folha-moldura"><tr><td>Total por mês</td><td /><td className="dir"><b>{reais(totalMes)}</b></td><td colSpan={6} /></tr></tfoot>
          </table>
        </div>
      </section>
      <div className="ad-coluna">
        <section className="ad-painel" aria-labelledby="df-c">
          <h2 id="df-c">Como funciona</h2>
          <p className="t13b">Cada despesa vira uma linha <b>pendente</b> na planilha, no dia do vencimento. Rodar de novo não duplica.</p>
          <p className="t13b">Luz e água mudam todo mês: o valor é a média dos 3 últimos, marcado "estimado" até alguém conferir a conta.</p>
          <p className="t13b">Salário é despesa fixa com a pessoa. Comissão não: o Admin calcula e o dono lança (Pessoas › Funcionários).</p>
        </section>
        <section className="ad-painel" aria-labelledby="df-o">
          <h2 id="df-o">{nomeDoMes(mes).replace(/^./, (c) => c.toUpperCase())}</h2>
          <dl className="ad-numeros" style={{ ['--n' as string]: 2 }}>
            <div className="ad-numero"><dt>Já pago</dt><dd>{reais(jaPago)}</dd></div>
            <div className="ad-numero"><dt>Pendente</dt><dd className="ate">{reais(pendente)}</dd></div>
          </dl>
          {semLinha > 0 ? <><p className="ad-anotacao">{plural(semLinha, 'despesa ainda não tem', 'despesas ainda não têm')} linha neste mês.</p><button type="button" className="ad-btn ad-btn--primario" onClick={() => void gerar()} disabled={envio.enviando}>Gerar as despesas de {nomeDoMes(mes)}</button></>
            : <p className="ad-anotacao">Todas as despesas do mês já estão na planilha.</p>}
          {d.regras.gerarSozinhoNoDia1 ? null : <p className="ad-anotacao">Gerar sozinho no dia 1 está desligado (A6).</p>}
        </section>
      </div>
      {editar && <GavetaDespesa despesa={editar === 'nova' ? null : editar} aoFechar={() => setEditar(null)} />}
      {conferir && <GavetaConferirConta despesa={conferir.despesa} linha={conferir.linha} aoFechar={() => setConferir(null)} />}
    </div>
  );
}

/**
 * "Conferir a conta" (RA4.8): a conta de luz chegou. Muda o valor da LINHA do
 * mês e tira o "estimado". Antes (AO) o botão abria a regra da despesa: o
 * valor real ia para a regra (e para os próximos meses) e a linha estimada do
 * mês continuava com o valor errado na planilha.
 */
function GavetaConferirConta({ despesa, linha, aoFechar }: { despesa: DespesaFixa; linha: Lancamento; aoFechar: () => void }) {
  const { mes, executar, avisar } = useLoja();
  const [valor, setValor] = useState(reais(linha.valorCentavos));
  const [erro, setErro] = useState<string | null>(null);
  const envio = useEnvio();
  const gravar = () => envio.enviar(async () => {
    const v = lerDinheiro(valor);
    if (v == null || v <= 0) { setErro('Valor inválido.'); return; }
    const depois: Lancamento = { ...linha, valorCentavos: Math.abs(v) };
    delete depois.estimado;
    const r = await executar((repo) => repo.gravarLancamentos([{ antes: linha, depois }]));
    if (r.ok) { avisar(`${despesa.descricao}: a conta de ${nomeDoMes(mes)} ficou em ${reais(Math.abs(v))}.`); aoFechar(); }
  });
  return (
    <Gaveta titulo={`Conferir a conta · ${despesa.descricao}`} aoFechar={aoFechar} rodape={<>
      <button type="button" className="ad-btn ad-btn--grande" onClick={aoFechar}>Cancelar</button>
      <button type="button" className="ad-btn ad-btn--primario ad-btn--grande" onClick={() => void gravar()} disabled={envio.enviando}>Gravar o valor da conta</button>
    </>}>
      <p className="t16">A planilha tem {reais(linha.valorCentavos)} estimado (média dos 3 últimos meses). Escreva o valor que veio na conta.</p>
      <Campo rotulo={`Valor da conta de ${nomeDoMes(mes)}`} erro={erro}>{(p) => <input {...p} value={valor} onChange={(e) => { setValor(e.target.value); setErro(null); }} inputMode="decimal" />}</Campo>
      <p className="ad-anotacao">Só a linha de {nomeDoMes(mes)} muda. A regra da despesa continua a mesma; o próximo mês tira a média de novo.</p>
    </Gaveta>
  );
}

function GavetaDespesa({ despesa, aoFechar }: { despesa: DespesaFixa | null; aoFechar: () => void }) {
  const d = useDados();
  const { mes, executar, avisar } = useLoja();
  const [descricao, setDescricao] = useState(despesa?.descricao ?? '');
  const [valor, setValor] = useState(despesa ? reais(despesa.valorCentavos) : '');
  const [dia, setDia] = useState(String(despesa?.diaDeVencimento ?? 10));
  const [categoriaId, setCategoriaId] = useState(despesa?.categoriaId ?? d.categorias.find((c) => c.tipo === 'saida')?.id ?? '');
  const [forma, setForma] = useState<FormaDePagamento | ''>(despesa?.formaDePagamento ?? 'pix');
  const [variavel, setVariavel] = useState(despesa?.variavel ?? false);
  const [erro, setErro] = useState<string | null>(null);

  async function gravar(desligar = false) {
    const v = lerDinheiro(valor);
    const n = Number(dia);
    if (!descricao.trim()) { setErro('Escreva a descrição.'); return; }
    if (v == null || v <= 0) { setErro('Valor inválido.'); return; }
    if (!Number.isInteger(n) || n < 1 || n > 31) { setErro('O dia vai de 1 a 31.'); return; }
    const x: DespesaFixa = {
      id: despesa?.id ?? crypto.randomUUID(), academiaId: d.academia.id, descricao: descricao.trim(), ...(categoriaId ? { categoriaId } : {}),
      valorCentavos: Math.abs(v), diaDeVencimento: n, ...(forma ? { formaDePagamento: forma } : {}), ...(despesa?.pessoaId ? { pessoaId: despesa.pessoaId } : {}),
      variavel, desde: despesa?.desde ?? mes, ...(desligar ? { ate: mes } : despesa?.ate ? { ate: despesa.ate } : {}), ativa: !desligar,
    };
    const r = await executar((repo) => repo.salvar('despesas_fixas', x));
    if (r.ok) { avisar(desligar ? 'Despesa desligada: não gera mais linhas.' : 'Despesa fixa guardada.'); aoFechar(); }
  }

  return (
    <Gaveta titulo={despesa ? despesa.descricao : 'Despesa fixa nova'} aoFechar={aoFechar} rodape={<>
      {despesa && <button type="button" className="ad-btn ad-btn--grande ad-btn--perigo" onClick={() => void gravar(true)}>Desligar</button>}
      <button type="button" className="ad-btn ad-btn--grande" onClick={aoFechar}>Cancelar</button>
      <button type="button" className="ad-btn ad-btn--primario ad-btn--grande" onClick={() => void gravar()}>Guardar</button>
    </>}>
      <Campo rotulo="Descrição" erro={erro}>{(p) => <input {...p} value={descricao} onChange={(e) => { setDescricao(e.target.value); setErro(null); }} />}</Campo>
      <Campo rotulo="Valor" ajuda={variavel ? 'Variável: na geração, vale a média dos 3 últimos meses lançados.' : undefined}>{(p) => <input {...p} value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" />}</Campo>
      <Campo rotulo="Dia do vencimento" ajuda="31 vira 30 nos meses curtos.">{(p) => <input {...p} value={dia} onChange={(e) => setDia(e.target.value.replace(/\D/g, ''))} inputMode="numeric" />}</Campo>
      <Campo rotulo="Categoria">{(p) => <select {...p} value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>{d.categorias.filter((c) => c.tipo === 'saida' && !c.arquivada).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>}</Campo>
      <Campo rotulo="Forma">{(p) => <select {...p} value={forma} onChange={(e) => setForma(e.target.value as FormaDePagamento)}>{FORMAS_DE_PAGAMENTO.map((f) => <option key={f} value={f}>{ROTULO_DA_FORMA[f]}</option>)}</select>}</Campo>
      <label className="marcar campo__caixa"><input type="checkbox" checked={variavel} onChange={(e) => setVariavel(e.target.checked)} /><span>Valor muda todo mês (luz, água)</span></label>
    </Gaveta>
  );
}
