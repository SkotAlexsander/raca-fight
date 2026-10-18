/**
 * AJUSTES: as REGRAS DE COBRANÇA (os [decidir] da academia, guardados como
 * configuração, seção 34 do modelo), as categorias, os planos, as modalidades
 * e a academia. Toda mudança vai ao histórico.
 */

import { useState } from 'react';
import { JUROS_MAXIMO_AO_MES_PONTOS_BASE, MULTA_MAXIMA_PONTOS_BASE, validarRegraDeAtraso } from '@dominio/financeiro/cobrancas.ts';
import { formatarDinheiro, formatarPontosBase, lerDinheiro, lerPontosBase } from '@dominio/financeiro/dinheiro.ts';
import type { Categoria, Plano, RegraDoPrimeiroMes, RegrasDeCobranca, TipoDeLancamento } from '@dominio/financeiro/tipos.ts';
import { Campo, Icone, Selo } from '../componentes/basicos.tsx';
import { useDados, useLoja } from '../estado/loja.tsx';
import { href } from '../estado/rota.ts';
import { plural } from '../util/formatar.ts';
import { Turmas } from './Turmas.tsx';

const ABAS: [string, string][] = [['regras', 'Regras de cobrança'], ['categorias', 'Categorias'], ['planos', 'Planos'], ['modalidades', 'Modalidades'], ['turmas', 'Turmas e horários'], ['academia', 'Academia']];

export function Ajustes({ aba = 'regras' }: { aba?: string }) {
  return (
    <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(0, 1fr)' }}>
      <div className="ad-coluna">
        <div className="ad-abas" aria-label="Ajustes">{ABAS.map(([id, rot]) => <a key={id} href={href('ajustes', id)} aria-current={aba === id ? 'page' : undefined}>{rot}</a>)}</div>
        {aba === 'categorias' ? <Categorias /> : aba === 'planos' ? <Planos /> : aba === 'modalidades' ? <Modalidades /> : aba === 'turmas' ? <Turmas /> : aba === 'academia' ? <AcademiaEModo /> : <Regras />}
      </div>
    </div>
  );
}

function Regras() {
  const d = useDados();
  const { executar, avisar } = useLoja();
  const r = d.regras;
  const [primeiroMes, setPrimeiroMes] = useState<RegraDoPrimeiroMes>(r.primeiroMes);
  const [cobra, setCobra] = useState(!!r.atraso);
  const [multa, setMulta] = useState(r.atraso ? formatarPontosBase(r.atraso.multaPontosBase).replace(' %', '') : '2');
  const [juros, setJuros] = useState(r.atraso ? formatarPontosBase(r.atraso.jurosAoMesPontosBase).replace(' %', '') : '1');
  const [tolerancia, setTolerancia] = useState(String(r.atraso?.diasDeTolerancia ?? 5));
  const [dia1, setDia1] = useState(r.gerarSozinhoNoDia1);
  const [retorno, setRetorno] = useState(String(r.diasParaRetornoDaExperimental));
  const [familia, setFamilia] = useState(r.descontoFamilia?.tipo === 'percentual' ? formatarPontosBase(r.descontoFamilia.pontosBase).replace(' %', '') : '');
  const [indicacao, setIndicacao] = useState(r.descontoIndicacao?.tipo === 'valor' ? formatarDinheiro(r.descontoIndicacao.centavos) : '');
  const [meses, setMeses] = useState(String(r.descontoIndicacao?.mesesDeDuracao ?? 1));
  const [whats, setWhats] = useState(r.whatsappDaAcademia);
  const [reais, setReais] = useState(!r.provisorio);
  const [erro, setErro] = useState<string | null>(null);

  async function gravar() {
    setErro(null);
    let atraso: RegrasDeCobranca['atraso'] = null;
    if (cobra) {
      const m = lerPontosBase(multa), j = lerPontosBase(juros), t = Number(tolerancia);
      if (m == null || j == null || !Number.isInteger(t)) { setErro('Confira a multa, os juros e a tolerância.'); return; }
      atraso = { multaPontosBase: m, jurosAoMesPontosBase: j, diasDeTolerancia: t };
      const erros = validarRegraDeAtraso(atraso);
      if (erros.length) { setErro(erros[0]!); return; }
    }
    const fam = familia.trim() ? lerPontosBase(familia) : null;
    if (familia.trim() && (fam == null || fam > 10000)) { setErro('O desconto de família vai de 0 a 100 %.'); return; }
    const ind = indicacao.trim() ? lerDinheiro(indicacao) : null;
    if (indicacao.trim() && (ind == null || ind < 0)) { setErro('O valor da indicação é inválido.'); return; }
    if (!/^\d{10,15}$/.test(whats.replace(/\D/g, ''))) { setErro('O WhatsApp precisa do DDI e DDD (ex.: 5551981962077).'); return; }
    const novo: RegrasDeCobranca = {
      ...r, primeiroMes, atraso, gerarSozinhoNoDia1: dia1, diasParaRetornoDaExperimental: Number(retorno),
      ...(fam != null ? { descontoFamilia: { tipo: 'percentual', pontosBase: fam } } : { descontoFamilia: undefined }),
      ...(ind != null ? { descontoIndicacao: { tipo: 'valor', centavos: ind, mesesDeDuracao: Math.max(1, Number(meses) || 1) } } : { descontoIndicacao: undefined }),
      whatsappDaAcademia: whats.replace(/\D/g, ''), provisorio: !reais,
    };
    const x = await executar((repo) => repo.salvarRegras(novo));
    if (x.ok) avisar('Regras de cobrança guardadas. A mudança ficou no histórico.');
  }

  return (
    <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(0, 1.4fr) minmax(300px, 1fr)', height: 'auto' }}>
      <section className="ad-painel">
        {r.provisorio && (
          <div className="ad-faixa-aviso" role="note">
            <Icone nome="i-alerta" pequeno={false} />
            <p><b>Valores PROVISÓRIOS.</b>A academia ainda não respondeu (A3, A6, A7, A8, A9, A15). Até lá vale a recomendação de cada pergunta. Troque aqui quando as respostas chegarem.</p>
          </div>
        )}
        <Campo rotulo="Quem começa no meio do mês paga (A7)">{(p) => <select {...p} value={primeiroMes} onChange={(e) => setPrimeiroMes(e.target.value as RegraDoPrimeiroMes)}><option value="cheio">O mês cheio, vencendo no dia da matrícula (recomendado)</option><option value="proporcional">Só os dias que faltam (proporcional)</option><option value="a_partir_do_proximo">Só a partir do mês seguinte</option></select>}</Campo>
        <label className="marcar campo__caixa"><input type="checkbox" checked={cobra} onChange={(e) => setCobra(e.target.checked)} /><span>A academia cobra multa e juros por atraso (A3)</span></label>
        {cobra && <div className="ad-numeros" style={{ ['--n' as string]: 3 }}>
          <Campo rotulo="Multa (%)" ajuda={`Até ${formatarPontosBase(MULTA_MAXIMA_PONTOS_BASE)} (CDC, art. 52, § 1º).`}>{(p) => <input {...p} value={multa} onChange={(e) => setMulta(e.target.value)} inputMode="decimal" />}</Campo>
          <Campo rotulo="Juros ao mês (%)" ajuda={`Até ${formatarPontosBase(JUROS_MAXIMO_AO_MES_PONTOS_BASE)}, pró-rata por dia.`}>{(p) => <input {...p} value={juros} onChange={(e) => setJuros(e.target.value)} inputMode="decimal" />}</Campo>
          <Campo rotulo="Tolerância (dias)">{(p) => <input {...p} value={tolerancia} onChange={(e) => setTolerancia(e.target.value.replace(/\D/g, ''))} inputMode="numeric" />}</Campo>
        </div>}
        {cobra && <p className="campo__ajuda">Confirme com o contador antes de ligar. Os limites são validados: valor acima é recusado.</p>}
        <label className="marcar campo__caixa"><input type="checkbox" checked={dia1} onChange={(e) => setDia1(e.target.checked)} /><span>Gerar as mensalidades sozinho no dia 1 (A6)</span></label>
        <Campo rotulo="Dias para chamar de volta quem fez a aula experimental (A15)">{(p) => <input {...p} value={retorno} onChange={(e) => setRetorno(e.target.value.replace(/\D/g, ''))} inputMode="numeric" />}</Campo>
        <Campo rotulo="Desconto de família (%) (A8)" ajuda="O Admin só sugere; ninguém aplica sozinho. Vazio = não há.">{(p) => <input {...p} value={familia} onChange={(e) => setFamilia(e.target.value)} inputMode="decimal" />}</Campo>
        <div className="ad-numeros" style={{ ['--n' as string]: 2 }}>
          <Campo rotulo='"Traga um amiguinho": valor (A9)' ajuda="Para quem indicou e para quem chegou.">{(p) => <input {...p} value={indicacao} onChange={(e) => setIndicacao(e.target.value)} inputMode="decimal" />}</Campo>
          <Campo rotulo="Por quantos meses">{(p) => <input {...p} value={meses} onChange={(e) => setMeses(e.target.value.replace(/\D/g, ''))} inputMode="numeric" />}</Campo>
        </div>
        <Campo rotulo="WhatsApp da academia" ajuda="Com DDI e DDD, só números.">{(p) => <input {...p} value={whats} onChange={(e) => setWhats(e.target.value)} inputMode="tel" />}</Campo>
        <label className="marcar campo__caixa"><input type="checkbox" checked={reais} onChange={(e) => setReais(e.target.checked)} /><span>Estes são os valores reais da academia (tira o aviso de provisório)</span></label>
        {erro && <p className="campo__erro" role="alert"><Icone nome="i-alerta" />{erro}</p>}
        <div className="ad-acoes"><button type="button" className="ad-btn ad-btn--primario ad-btn--grande" onClick={() => void gravar()}>Guardar as regras</button></div>
      </section>
      <section className="ad-painel">
        <h2>Onde cada regra entra</h2>
        <ul className="ad-lista ad-lista--compacta">
          <li><span className="ad-lista__txt"><b>Primeiro mês</b><span>na geração das mensalidades (RA3.5)</span></span></li>
          <li><span className="ad-lista__txt"><b>Multa e juros</b><span>na gaveta "Marcar como paga" (RA5.3)</span></span></li>
          <li><span className="ad-lista__txt"><b>Família</b><span>na ficha do responsável, como sugestão (RA3.7)</span></span></li>
          <li><span className="ad-lista__txt"><b>Indicação</b><span>ao matricular pelo funil (RA3.8)</span></span></li>
          <li><span className="ad-lista__txt"><b>Chamar de volta</b><span>no funil e no painel (RA11.4)</span></span></li>
        </ul>
        <p className="ad-anotacao">As funções do domínio recebem cada regra pronta: nenhuma tem valor padrão no código. No Supabase, isto é a linha de regras_de_cobranca da academia.</p>
      </section>
    </div>
  );
}

function Categorias() {
  const d = useDados();
  const { executar, avisar } = useLoja();
  const [nova, setNova] = useState<{ nome: string; tipo: TipoDeLancamento }>({ nome: '', tipo: 'saida' });
  const uso = (id: string) => d.lancamentos.filter((l) => l.categoriaId === id && !l.arquivado).length;
  async function salvar(c: Categoria, frase: string) {
    const r = await executar((repo) => repo.salvar('categorias', c));
    if (r.ok) avisar(frase);
  }
  const lista = (tipo: TipoDeLancamento) => d.categorias.filter((c) => c.tipo === tipo).sort((a, b) => a.ordem - b.ordem);
  const bloco = (tipo: TipoDeLancamento) => (
    <section className="ad-painel ad-painel--sem-pad">
      <div className="ad-painel__topo"><h2>{tipo === 'entrada' ? 'Entradas' : 'Saídas'}</h2></div>
      <div className="lista ad-tabela-rola">
        <table className="ad-tabela">
          <thead><tr><th scope="col">Nome</th><th scope="col" className="dir">Linhas</th><th scope="col">Estado</th><th scope="col" /></tr></thead>
          <tbody>
            {lista(tipo).map((c, i, xs) => (
              <tr key={c.id}>
                <td><input className="campo__caixa" style={{ width: '100%' }} aria-label={`Nome da categoria ${c.nome}`} defaultValue={c.nome} maxLength={60} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== c.nome) void salvar({ ...c, nome: v }, `Categoria renomeada para "${v}".`); }} /></td>
                <td className="dir">{uso(c.id)}</td>
                <td>{c.arquivada ? <Selo>arquivada</Selo> : <Selo tom="ok">em uso</Selo>}</td>
                <td className="dir">
                  <button type="button" className="ad-btn ad-btn--icone ad-btn--plano" aria-label="Subir" disabled={i === 0} onClick={() => { const o = xs[i - 1]!; void salvar({ ...c, ordem: o.ordem }, 'Ordem mudada.').then(() => salvar({ ...o, ordem: c.ordem }, 'Ordem mudada.')); }}>↑</button>
                  <button type="button" className="ad-btn ad-btn--plano" onClick={() => void salvar({ ...c, arquivada: !c.arquivada }, c.arquivada ? 'Categoria de volta.' : 'Categoria arquivada: as linhas dela continuam.')}>{c.arquivada ? 'Voltar' : 'Arquivar'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
  return (
    <>
      <div className="ad-acoes">
        <span className="campo__caixa" style={{ flex: '0 1 320px' }}><input aria-label="Nome da categoria nova" placeholder="Categoria nova" value={nova.nome} maxLength={60} onChange={(e) => setNova({ ...nova, nome: e.target.value })} /></span>
        <span className="campo__caixa"><select aria-label="Tipo" value={nova.tipo} onChange={(e) => setNova({ ...nova, tipo: e.target.value as TipoDeLancamento })}><option value="entrada">Entrada</option><option value="saida">Saída</option></select></span>
        <button type="button" className="ad-btn ad-btn--primario" disabled={!nova.nome.trim()} onClick={() => {
          const c: Categoria = { id: crypto.randomUUID(), academiaId: d.academia.id, nome: nova.nome.trim(), tipo: nova.tipo, ordem: Math.max(0, ...d.categorias.map((x) => x.ordem)) + 1, arquivada: false };
          void salvar(c, `Categoria "${c.nome}" criada.`).then(() => setNova({ ...nova, nome: '' }));
        }}><Icone nome="i-mais" />Categoria</button>
        <p className="ad-anotacao">Categoria com linha não se apaga: arquiva-se (RA4.6). A lista inicial é proposta.</p>
      </div>
      <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(0, 1fr) minmax(0, 1fr)', height: 'auto' }}>{bloco('entrada')}{bloco('saida')}</div>
    </>
  );
}

function Planos() {
  const d = useDados();
  const { executar, avisar } = useLoja();
  const mod = (ids: string[]) => ids.map((id) => d.modalidades.find((m) => m.id === id)?.nome).filter(Boolean).join(' + ');
  const alunos = (id: string) => d.matriculas.filter((m) => m.planoId === id && m.estado !== 'encerrada').length;
  async function valor(p: Plano, texto: string) {
    const v = lerDinheiro(texto);
    if (v == null || v < 0) { avisar('Valor inválido.', { tom: 'erro' }); return; }
    if (v === p.valorCentavos) return;
    const r = await executar((repo) => repo.salvar('planos', { ...p, valorCentavos: v }));
    if (r.ok) avisar(`${p.nome}: ${formatarDinheiro(v)}. Vale das próximas cobranças; as geradas não mudam (A5).`);
  }
  return (
    <section className="ad-painel ad-painel--sem-pad">
      <div className="ad-painel__topo"><h2>Planos · valores de EXEMPLO (A18)</h2></div>
      <div className="lista ad-tabela-rola">
        <table className="ad-tabela">
          <thead><tr><th scope="col">Plano</th><th scope="col">Modalidades</th><th scope="col">Vezes por semana</th><th scope="col">Periodicidade</th><th scope="col" className="dir">Valor</th><th scope="col" className="dir">Taxa de matrícula</th><th scope="col" className="dir">Alunos</th></tr></thead>
          <tbody>
            {d.planos.map((p) => (
              <tr key={p.id}>
                <td><b>{p.nome}</b></td><td>{mod(p.modalidadeIds)}</td><td>{p.aulasPorSemana ?? 'livre'}</td><td>{p.periodicidade}</td>
                <td className="dir">{p.periodicidade === 'gratuito' ? 'grátis' : <input className="campo__caixa" style={{ width: 120, textAlign: 'right' }} aria-label={`Valor de ${p.nome}`} defaultValue={formatarDinheiro(p.valorCentavos)} onBlur={(e) => void valor(p, e.target.value)} />}</td>
                <td className="dir">{p.taxaDeMatriculaCentavos ? formatarDinheiro(p.taxaDeMatriculaCentavos) : '—'}</td>
                <td className="dir">{alunos(p.id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="ad-anotacao" style={{ padding: 12 }}>O combo é repartido em partes iguais entre as modalidades (proposta, A10). Mudar o valor não mexe na cobrança já gerada.</p>
    </section>
  );
}

function Modalidades() {
  const d = useDados();
  return (
    <section className="ad-painel">
      <h2>Modalidades da Raça Fight</h2>
      <ul className="ad-lista ad-lista--compacta">{d.modalidades.map((m) => <li key={m.id}><span className="ad-lista__txt"><b>{m.nome}</b></span>{m.ativa ? <Selo tom="ok">ativa</Selo> : <Selo>arquivada</Selo>}</li>)}</ul>
      <p className="ad-anotacao">Kids é público da turma, não modalidade. Turmas e horários são do app da equipe (AJ, R14).</p>
    </section>
  );
}

function AcademiaEModo() {
  const d = useDados();
  const { repositorio, executar, avisar } = useLoja();
  return (
    <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(0, 1fr) minmax(0, 1fr)', height: 'auto' }}>
      <section className="ad-painel">
        <h2>{d.academia.nome}</h2>
        <dl className="ad-dados"><dt>Pessoas no cadastro</dt><dd>{d.pessoas.length}</dd><dt>Lançamentos</dt><dd>{d.lancamentos.length}</dd><dt>Histórico</dt><dd>{plural(d.historico.length, 'registro', 'registros')}</dd><dt>Modo</dt><dd>{repositorio.modo === 'local' ? 'local, com dados de exemplo' : 'Supabase'}</dd></dl>
        <p className="ad-anotacao">Logo PROVISÓRIO (redesenhado das fotos). Entra o original quando a academia mandar.</p>
      </section>
      {repositorio.modo === 'local' && (
        <section className="ad-painel">
          <h2>Modo local</h2>
          <p className="t13b">Os dados são de exemplo, com nomes inventados, e ficam só neste navegador. Para usar com a academia de verdade, o Admin liga no Supabase (LEIA-ME do admin).</p>
          <div className="ad-acoes"><button type="button" className="ad-btn" onClick={() => void executar((r) => r.recomecarExemplo!()).then((x) => x.ok && avisar('Os dados de exemplo voltaram ao começo.'))}>Recomeçar os dados de exemplo</button></div>
        </section>
      )}
    </div>
  );
}
