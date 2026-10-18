/**
 * No celular, a planilha vira LISTA POR DIA e a edição é numa FOLHA (AK,
 * quadro financeiro-folha). Cada campo passa pelo mesmo `editarCelula` da
 * grade: o que vale no PC vale aqui.
 */

import { useState } from 'react';
import { formatarDinheiro } from '@dominio/financeiro/dinheiro.ts';
import { formatarDataBR } from '@dominio/financeiro/datas.ts';
import { editarLinhaInteira, textoDaCelula, type ColunaDaGrade, type ContextoDaGrade } from '@dominio/financeiro/grade.ts';
import { ROTULO_DA_FORMA } from '@dominio/financeiro/nomes.ts';
import { FORMAS_DE_PAGAMENTO, type Lancamento } from '@dominio/financeiro/tipos.ts';
import { useEnvio } from '../estado/envio.ts';
import { diaMes } from '../util/formatar.ts';
import { Campo, Gaveta, Selo } from './basicos.tsx';
import type { LinhaDaGrade } from './Grade.tsx';

const SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const diaDaSemana = (iso: string) => SEMANA[new Date(`${iso}T12:00:00Z`).getUTCDay()];

export function ListaPorDia({ linhas, aoAbrir }: { linhas: LinhaDaGrade[]; aoAbrir: (x: LinhaDaGrade) => void }) {
  const porDia = new Map<string, LinhaDaGrade[]>();
  for (const x of linhas) {
    const data = x.tipo === 'cobranca' ? x.c.vencimento : x.l.data;
    porDia.set(data, [...(porDia.get(data) ?? []), x]);
  }
  return (
    <div className="ad-lanc">
      {[...porDia.entries()].map(([data, xs]) => (
        <div key={data}>
          <p className="ad-lanc__dia">{diaMes(data)} · {diaDaSemana(data)}</p>
          {xs.map((x) => {
            const cob = x.tipo === 'cobranca';
            const desc = cob ? x.descricao : x.l.descricao;
            const valor = cob ? x.c.valorCentavos : x.l.valorCentavos;
            const saida = !cob && x.l.tipo === 'saida';
            const pago = !cob && x.l.situacao === 'pago';
            return (
              <button type="button" className="linha" key={cob ? x.c.id : x.l.id} onClick={() => aoAbrir(x)}>
                <span className="linha__txt"><b>{desc}</b><span>{cob ? `${x.pessoa} · cobrança` : (x.l.formaDePagamento ? ROTULO_DA_FORMA[x.l.formaDePagamento] : 'sem forma')}</span></span>
                <span className="linha__val">
                  <b className={saida ? 'neg' : 'pos'}>{saida ? '−' : ''}{formatarDinheiro(valor)}</b>
                  {pago ? <Selo tom="ok">Pago</Selo> : <Selo tom="pend">{cob ? 'Pagar' : 'Pendente'}</Selo>}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

const CAMPOS: [ColunaDaGrade, string][] = [['descricao', 'Descrição'], ['valor', 'Valor'], ['data', 'Data'], ['tipo', 'Tipo'], ['categoria', 'Categoria'], ['forma', 'Forma'], ['pessoa', 'Pessoa'], ['situacao', 'Situação']];

export function EdicaoNoCelular({ lancamento, ctx, aoFechar, aoGravar, novo }: {
  lancamento: Lancamento; ctx: ContextoDaGrade; aoFechar: () => void; novo: boolean;
  aoGravar: (m: { antes?: Lancamento; depois: Lancamento }[], descricao: string) => Promise<boolean>;
}) {
  const [textos, setTextos] = useState<Record<ColunaDaGrade, string>>(() => Object.fromEntries(CAMPOS.map(([k]) => [k, k === 'valor' && !lancamento.valorCentavos ? '' : textoDaCelula(lancamento, k, ctx)])) as Record<ColunaDaGrade, string>);
  const [erro, setErro] = useState<{ campo: ColunaDaGrade; texto: string } | null>(null);

  const envio = useEnvio();

  // todos os campos de uma vez, na ordem certa (AO): "-20" vira saída mesmo com o
  // seletor em "Entrada", e categoria do outro tipo é erro no campo dela
  const gravar = () => envio.enviar(async () => {
    const r = editarLinhaInteira(lancamento, textos, ctx);
    if (!r.ok) { setErro({ campo: r.campo, texto: r.erro }); return; }
    const l = r.lancamento;
    const ok = await aoGravar([novo ? { depois: l } : { antes: lancamento, depois: l }], novo ? `Linha nova "${l.descricao}"` : `"${l.descricao}" atualizado`);
    if (ok) aoFechar();
  });

  const campo = (k: ColunaDaGrade, rot: string) => {
    const comum = { value: textos[k], onChange: (e: { target: { value: string } }) => { setTextos({ ...textos, [k]: e.target.value }); setErro(null); } };
    return (
      <Campo key={k} rotulo={rot} erro={erro?.campo === k ? erro.texto : null} ajuda={k === 'valor' ? '"160", "160,00" e "R$ 1.600" valem; "-20" vira saída.' : undefined}>
        {(p) => k === 'tipo' ? <select {...p} {...comum}><option>Entrada</option><option>Saída</option></select>
          : k === 'situacao' ? <select {...p} {...comum}><option>Pago</option><option>Pendente</option></select>
          : k === 'forma' ? <select {...p} {...comum}><option value="">—</option>{FORMAS_DE_PAGAMENTO.map((f) => <option key={f}>{ROTULO_DA_FORMA[f]}</option>)}</select>
          : k === 'categoria' ? (
            <select {...p} {...comum}>
              <option value="">—</option>
              {(['entrada', 'saida'] as const).map((t) => (
                <optgroup key={t} label={t === 'entrada' ? 'Entradas' : 'Saídas'}>
                  {ctx.categorias.filter((c) => !c.arquivada && c.tipo === t).map((c) => <option key={c.id}>{c.nome}</option>)}
                </optgroup>
              ))}
            </select>
          )
          : <input {...p} {...comum} inputMode={k === 'valor' ? 'decimal' : k === 'data' ? 'numeric' : undefined} list={k === 'pessoa' ? 'lista-pessoas' : undefined} />}
      </Campo>
    );
  };

  return (
    <Gaveta titulo={novo ? 'Lançamento novo' : lancamento.descricao} aoFechar={aoFechar} rodape={<>
      <button type="button" className="ad-btn ad-btn--grande" onClick={aoFechar}>Cancelar</button>
      <button type="button" className="ad-btn ad-btn--primario ad-btn--grande" onClick={() => void gravar()} disabled={envio.enviando}>{envio.enviando ? 'Gravando…' : 'Gravar'}</button>
    </>}>
      {!novo && <p className="ad-anotacao">Lançado em {formatarDataBR(lancamento.data)}.</p>}
      {CAMPOS.map(([k, rot]) => campo(k, rot))}
    </Gaveta>
  );
}
