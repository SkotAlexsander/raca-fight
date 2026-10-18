/**
 * FINANCEIRO › IMPORTAR (RA8, FA2): trazer a planilha atual. 1) o arquivo
 * (CSV, XLSX ou colar); 2) CONFERIR AS COLUNAS, com o papel de cada uma e a
 * prévia em grupos; 3) gravar. Nada é gravado antes de conferir. A leitura das
 * linhas é do domínio (`acharCabecalho`, `detectarColunas`, `conferirImportacao`).
 */

import { useMemo, useState, type DragEvent } from 'react';
import { formatarDinheiro } from '@dominio/financeiro/dinheiro.ts';
import { formatarDataBR } from '@dominio/financeiro/datas.ts';
import { acharCabecalho, conferirImportacao, detectarColunas, lerCSV, type Celula, type ColunaDetectada, type LinhaConferida } from '@dominio/financeiro/importacao.ts';
import { acharPorNome } from '@dominio/financeiro/nomes.ts';
import type { PapelDaColuna, TipoDeLancamento } from '@dominio/financeiro/tipos.ts';
import { ErroDeArquivo, lerPlanilha } from '../arquivos/ler-planilha.ts';
import { Icone, Selo, Vazio } from '../componentes/basicos.tsx';
import { useEnvio } from '../estado/envio.ts';
import { useDados, useLoja } from '../estado/loja.tsx';
import { ir } from '../estado/rota.ts';
import { plural } from '../util/formatar.ts';
import { horaDe } from '../util/relogio.ts';

const PAPEIS: [PapelDaColuna, string][] = [
  ['data', 'Data'], ['descricao', 'Descrição'], ['valor', 'Valor'], ['valor_com_sinal', 'Valor com sinal'], ['entrada', 'Entrada (valor)'], ['saida', 'Saída (valor)'],
  ['tipo', 'Tipo'], ['categoria', 'Categoria'], ['forma', 'Forma de pagamento'], ['pessoa', 'Pessoa'], ['situacao', 'Situação'], ['modalidade', 'Modalidade'], ['observacao', 'Observação'], ['ignorar', 'Ignorar'],
];

interface Lido { nome: string; formato: 'csv' | 'xlsx' | 'colado'; linhas: Celula[][] }
type Grupo = 'prontas' | 'aviso' | 'repetidas' | 'erro';

export function Importar() {
  const d = useDados();
  const { hoje, executar, avisar } = useLoja();
  const [lido, setLido] = useState<Lido | null>(null);
  const [colunas, setColunas] = useState<ColunaDetectada[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [colado, setColado] = useState('');
  const [grupo, setGrupo] = useState<Grupo>('prontas');
  const [escolhas, setEscolhas] = useState<Record<string, string>>({});
  const [incluirRepetidas, setIncluirRepetidas] = useState(false);
  const [feito, setFeito] = useState<number | null>(null);
  const [arrastando, setArrastando] = useState(false);
  // a planilha só de recebimentos (ou só de gastos) não tem coluna de tipo (AO)
  const [tipoPadrao, setTipoPadrao] = useState<TipoDeLancamento | ''>('');
  const envio = useEnvio();

  const cab = lido ? acharCabecalho(lido.linhas) : -1;
  const conferida = useMemo(() => (lido ? conferirImportacao({
    linhas: lido.linhas, indiceDoCabecalho: cab, colunas, categorias: d.categorias, pessoas: d.pessoas, modalidades: d.modalidades, existentes: d.lancamentos, hoje,
    ...(tipoPadrao ? { tipoPadrao } : {}),
  }) : null), [lido, cab, colunas, d, hoje, tipoPadrao]);

  function abrir(l: Lido) {
    if (!l.linhas.length) { setErro('A planilha está vazia.'); return; }
    const c = acharCabecalho(l.linhas);
    setLido(l); setColunas(detectarColunas(l.linhas, c)); setErro(null); setFeito(null); setEscolhas({}); setGrupo('prontas'); setTipoPadrao(''); setIncluirRepetidas(false);
  }

  async function escolherArquivo(f: File | undefined) {
    if (!f) return;
    try {
      const p = await lerPlanilha(f);
      abrir({ nome: p.nome, formato: p.formato, linhas: p.linhas });
    } catch (e) {
      setErro(e instanceof ErroDeArquivo ? e.message : 'Não deu para ler o arquivo.');
    }
  }

  function soltar(e: DragEvent) {
    e.preventDefault(); setArrastando(false);
    void escolherArquivo(e.dataTransfer.files[0]);
  }

  // as categorias que não existem: criar ou apontar para uma que já existe
  const novas = conferida?.categoriasNovas ?? [];
  const sugestao = (nome: string, tipo: 'entrada' | 'saida') => {
    const ja = acharPorNome(d.categorias.filter((c) => c.tipo === tipo && !c.arquivada), nome);
    return ja ? ja.id : 'criar';
  };
  const escolhaDe = (nome: string, tipo: 'entrada' | 'saida') => escolhas[`${nome}|${tipo}`] ?? sugestao(nome, tipo);

  const grupoDe = (l: LinhaConferida): Grupo => (l.erros.length ? 'erro' : l.repetida ? 'repetidas' : l.avisos.length ? 'aviso' : 'prontas');
  const linhas = conferida?.linhas ?? [];
  const contagem = (g: Grupo) => linhas.filter((l) => grupoDe(l) === g).length;
  const aGravar = linhas.filter((l) => l.rascunho && (!l.repetida || incluirRepetidas)).length;

  // duplo clique em "Gravar 40 linhas" importava duas vezes (AO): um envio por vez
  const gravar = () => envio.enviar(async () => {
    if (!lido || !conferida) return;
    const ajustadas: LinhaConferida[] = conferida.linhas.map((l) => {
      if (!l.rascunho?.categoriaNova) return l;
      const e = escolhaDe(l.rascunho.categoriaNova, l.rascunho.tipo);
      if (e === 'criar') return l;
      const { categoriaNova: _, ...r } = l.rascunho;
      return { ...l, rascunho: { ...r, categoriaId: e } };
    });
    const criar = novas.filter((c) => escolhaDe(c.nome, c.tipo) === 'criar');
    const r = await executar((repo) => repo.importar({ arquivoNome: lido.nome, formato: lido.formato, colunas, linhas: ajustadas, categoriasNovas: criar, incluirRepetidas }));
    if (r.ok) { setFeito(r.valor.gravadas); avisar(`Importadas ${plural(r.valor.gravadas, 'linha', 'linhas')} de ${lido.nome}. Dá para desfazer a importação inteira.`); }
  });

  const nomeCat = (id?: string) => d.categorias.find((c) => c.id === id)?.nome;
  const nomePessoa = (id?: string) => d.pessoas.find((p) => p.id === id)?.nome;

  if (feito != null && lido) {
    return (
      <section className="ad-painel">
        <ol className="ad-passos" aria-label="Passos"><li className="feito"><b>✓</b>Arquivo</li><li className="ad-passos__seta" aria-hidden="true">›</li><li className="feito"><b>✓</b>Conferir colunas</li><li className="ad-passos__seta" aria-hidden="true">›</li><li aria-current="step"><b>3</b>Gravado</li></ol>
        <div className="ad-estado"><h2 className="t20">{plural(feito, 'linha gravada', 'linhas gravadas')} de {lido.nome}</h2><p>As linhas estão na planilha, marcadas "importada". Se algo saiu errado, desfaça a importação inteira abaixo.</p>
          <div className="ad-acoes"><button type="button" className="ad-btn ad-btn--primario" onClick={() => ir('financeiro', 'lancamentos')}>Ver na planilha</button><button type="button" className="ad-btn" onClick={() => { setLido(null); setFeito(null); }}>Importar outro arquivo</button></div>
        </div>
        <Importacoes />
      </section>
    );
  }

  if (!lido || !conferida) {
    return (
      <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
        <section className="ad-painel">
          <ol className="ad-passos" aria-label="Passos"><li aria-current="step"><b>1</b>Arquivo</li><li className="ad-passos__seta" aria-hidden="true">›</li><li><b>2</b>Conferir colunas</li><li className="ad-passos__seta" aria-hidden="true">›</li><li><b>3</b>Gravar</li></ol>
          <label className={`ad-soltar${arrastando ? ' ad-soltar--sobre' : ''}`} onDragOver={(e) => { e.preventDefault(); setArrastando(true); }} onDragLeave={() => setArrastando(false)} onDrop={soltar}>
            <Icone nome="i-nuvem" pequeno={false} />
            <b>Escolha a planilha ou arraste para cá</b>
            <span>.xlsx ou .csv, até 5 MB. O arquivo não é guardado: só as linhas que você aceitar.</span>
            <input type="file" accept=".csv,.xlsx,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; void escolherArquivo(f); }} />
          </label>
          {erro && <p className="campo__erro" role="alert"><Icone nome="i-alerta" />{erro}</p>}
          <div className="ad-sep" />
          <label className="campo"><span>Ou cole as linhas copiadas do Excel</span><span className="campo__caixa"><textarea rows={6} value={colado} onChange={(e) => setColado(e.target.value)} placeholder={'Data\tDescrição\tValor\n01/10/2026\tMensalidade Breno\t150,00'} /></span></label>
          <div className="ad-acoes"><button type="button" className="ad-btn" disabled={!colado.trim()} onClick={() => abrir({ nome: 'colado do Excel', formato: 'colado', linhas: lerCSV(colado) })}>Conferir o que colei</button></div>
          <p className="ad-anotacao">A importação foi testada com uma planilha montada no formato mais comum. Com a planilha real da academia (A13), a conferência já sai com as colunas certas.</p>
        </section>
        <section className="ad-painel ad-painel--sem-pad"><div className="ad-painel__topo"><h2>Importações</h2></div><Importacoes /></section>
      </div>
    );
  }

  const vistas = linhas.filter((l) => grupoDe(l) === grupo).slice(0, 200);
  return (
    <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(0, 1fr)' }}>
      <div className="ad-coluna">
        <section className="ad-painel">
          <div className="ad-painel__topo">
            <ol className="ad-passos" aria-label="Passos"><li className="feito"><b>✓</b>Arquivo</li><li className="ad-passos__seta" aria-hidden="true">›</li><li aria-current="step"><b>2</b>Conferir colunas</li><li className="ad-passos__seta" aria-hidden="true">›</li><li><b>3</b>Gravar</li></ol>
            <div className="ad-acoes"><button type="button" className="ad-btn" onClick={() => setLido(null)}>Trocar arquivo</button><button type="button" className="ad-btn ad-btn--primario" disabled={!aGravar || envio.enviando} onClick={() => void gravar()}>{envio.enviando ? 'Gravando…' : `Gravar ${plural(aGravar, 'linha', 'linhas')}`}</button></div>
          </div>
          <p className="t13b"><b>{lido.nome}</b>{cab > 0 ? ` · o cabeçalho está na linha ${cab + 1} (as de cima são título)` : cab === 0 ? ' · cabeçalho na linha 1' : ' · sem cabeçalho reconhecido: as colunas foram adivinhadas pelo conteúdo'} · {plural(linhas.length, 'linha', 'linhas')}. <span className="sec">Nada foi gravado ainda.</span></p>
          {!colunas.some((c) => c.papel === 'tipo' || c.papel === 'entrada' || c.papel === 'saida' || c.papel === 'valor_com_sinal') && (
            <label className="campo"><span>A planilha não diz se é entrada ou saída. As linhas sem tipo são:</span>
              <span className="campo__caixa"><select value={tipoPadrao} onChange={(e) => setTipoPadrao(e.target.value as TipoDeLancamento | '')}>
                <option value="">Decidir pela categoria (ou pelo sinal do valor)</option>
                <option value="entrada">Entradas (o que recebi)</option>
                <option value="saida">Saídas (o que paguei)</option>
              </select></span>
            </label>
          )}
          <div className="ad-mapa">
            {colunas.map((c, i) => (
              <div key={c.indice} className={`ad-mapa__col${c.papel === 'ignorar' ? ' ad-mapa__col--ignorada' : ''}`}>
                <header><Icone nome={c.papel === 'ignorar' ? 'i-fechar' : 'i-seta-direita'} /><b>{(c.cabecalho || `Coluna ${c.indice + 1}`).toUpperCase()}</b></header>
                <label className="campo"><span>Vira</span><span className="campo__caixa"><select aria-label={`Papel da coluna ${c.cabecalho || c.indice + 1}`} value={c.papel} onChange={(e) => {
                  const novo = e.target.value as PapelDaColuna;
                  setColunas(colunas.map((x, j) => (j === i ? { ...x, papel: novo } : x.papel === novo && novo !== 'ignorar' ? { ...x, papel: 'ignorar' } : x)));
                }}>{PAPEIS.map(([k, rot]) => <option key={k} value={k}>{rot}</option>)}</select></span></label>
                <p>1ª linha: {c.exemplo || '—'}</p>
              </div>
            ))}
          </div>
        </section>
        <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(0, 2.2fr) minmax(0, 1fr)', height: 'auto' }}>
          <section className="ad-painel ad-painel--sem-pad" aria-labelledby="im-prev">
            <div className="ad-painel__topo"><h2 id="im-prev">Prévia</h2>
              <div className="ad-grupos" role="group" aria-label="Grupos da prévia">
                {([['prontas', 'Prontas'], ['aviso', 'Com aviso'], ['repetidas', 'Repetidas'], ['erro', 'Com erro']] as [Grupo, string][]).map(([g, rot]) => <a key={g} href="#" aria-current={grupo === g ? 'true' : undefined} onClick={(e) => { e.preventDefault(); setGrupo(g); }}>{rot} <b>{contagem(g)}</b></a>)}
              </div>
            </div>
            {!vistas.length ? <Vazio titulo="Nenhuma linha neste grupo" /> : (
              <div className="lista ad-tabela-rola">
                <table className="ad-tabela">
                  <thead><tr><th scope="col">Linha</th><th scope="col">Data</th><th scope="col">Descrição</th><th scope="col">Categoria</th><th scope="col">Tipo</th><th scope="col" className="dir">Valor</th><th scope="col">Pessoa</th><th scope="col">Situação</th></tr></thead>
                  <tbody>
                    {vistas.map((l) => {
                      const r = l.rascunho;
                      if (!r) return <tr key={l.numero}><td>{l.numero}</td><td colSpan={7} className="neg">{l.erros.join(' ')}</td></tr>;
                      return (
                        <tr key={l.numero}>
                          <td>{l.numero}</td><td>{formatarDataBR(r.data)}</td><td>{r.descricao}</td>
                          <td>{r.categoriaNova ? `${r.categoriaNova} → ${escolhaDe(r.categoriaNova, r.tipo) === 'criar' ? 'nova' : nomeCat(escolhaDe(r.categoriaNova, r.tipo))}` : nomeCat(r.categoriaId) ?? '—'}</td>
                          <td>{r.tipo === 'entrada' ? 'Entrada' : 'Saída'}</td><td className="dir">{formatarDinheiro(r.valorCentavos)}</td>
                          <td>{l.avisos.find((a) => a.startsWith('Pessoa')) ? <span className="ate">{l.avisos.find((a) => a.startsWith('Pessoa'))!.replace(/^Pessoa não encontrada no cadastro: /, '').replace(/\.$/, '')} não achado: vai na observação</span> : nomePessoa(r.pessoaId) ?? '—'}</td>
                          <td>{r.situacao === 'pago' ? <Selo tom="ok">Pago</Selo> : <Selo tom="pend">Pendente{r.data > hoje ? ' (data futura)' : ''}</Selo>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <section className="ad-painel" aria-labelledby="im-cat">
            <h2 id="im-cat">{novas.length ? 'Criar estas categorias?' : 'Categorias'}</h2>
            {novas.length ? <>
              <p className="ad-anotacao">Estão na planilha e não existem no Admin. Aceite ou aponte para uma que já existe.</p>
              {novas.map((c) => {
                const n = linhas.filter((l) => l.rascunho?.categoriaNova === c.nome && l.rascunho.tipo === c.tipo).length;
                return (
                  <label key={`${c.nome}|${c.tipo}`} className="campo"><span>"{c.nome}" ({c.tipo === 'entrada' ? 'entrada' : 'saída'}, {plural(n, 'linha', 'linhas')})</span>
                    <span className="campo__caixa"><select value={escolhaDe(c.nome, c.tipo)} onChange={(e) => setEscolhas({ ...escolhas, [`${c.nome}|${c.tipo}`]: e.target.value })}>
                      <option value="criar">Criar "{c.nome}"</option>
                      {d.categorias.filter((x) => x.tipo === c.tipo && !x.arquivada).map((x) => <option key={x.id} value={x.id}>Usar: {x.nome}</option>)}
                    </select></span>
                  </label>
                );
              })}
            </> : <p className="ad-anotacao">Todas as categorias da planilha já existem no Admin.</p>}
            <div className="ad-sep" />
            <h3 className="ad-h3">Repetidas</h3>
            <p className="ad-anotacao">{plural(contagem('repetidas'), 'linha igual', 'linhas iguais')} a lançamentos que já existem (mesma data, tipo, valor e descrição). Ficam de fora, a menos que você marque.</p>
            {contagem('repetidas') > 0 && <label className="marcar campo__caixa"><input type="checkbox" checked={incluirRepetidas} onChange={(e) => setIncluirRepetidas(e.target.checked)} /><span>Gravar as repetidas também</span></label>}
            <h3 className="ad-h3">Com erro · {contagem('erro')}</h3>
            {linhas.filter((l) => l.erros.length).slice(0, 8).map((l) => <p key={l.numero} className="campo__erro"><Icone nome="i-alerta" />Linha {l.numero}: {l.erros.join(' ')}</p>)}
            {contagem('erro') > 8 && <p className="ad-anotacao">e mais {contagem('erro') - 8}.</p>}
          </section>
        </div>
      </div>
    </div>
  );
}

function Importacoes() {
  const d = useDados();
  const { executar, avisar } = useLoja();
  const envio = useEnvio();
  if (!d.importacoes.length) return <p className="ad-anotacao" style={{ padding: 16 }}>Nenhuma importação ainda.</p>;
  return (
    <div className="lista ad-tabela-rola">
      <table className="ad-tabela">
        <thead><tr><th scope="col">Arquivo</th><th scope="col">Quando</th><th scope="col" className="dir">Gravadas</th><th scope="col" className="dir">Repetidas</th><th scope="col" className="dir">Com erro</th><th scope="col">Estado</th><th scope="col" /></tr></thead>
        <tbody>
          {d.importacoes.map((i) => (
            <tr key={i.id}>
              <td><b>{i.arquivoNome}</b></td><td>{formatarDataBR(i.em.slice(0, 10))} {horaDe(i.em)}</td>
              <td className="dir">{i.linhasGravadas}</td><td className="dir">{i.linhasRepetidas}</td><td className="dir">{i.linhasComErro}</td>
              <td>{i.estado === 'desfeita' ? <Selo>desfeita</Selo> : <Selo tom="ok">gravada</Selo>}</td>
              <td>{i.estado === 'gravada' && <button type="button" className="ad-btn" disabled={envio.enviando} onClick={() => void envio.enviar(() => executar((r) => r.desfazerImportacao(i.id)).then((x) => { if (x.ok) avisar(`Importação desfeita: as linhas de ${i.arquivoNome} foram arquivadas.`); }))}>Desfazer</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
