/**
 * "Marcar como paga" (RA4.7), na gaveta do AK: data, forma e valor. A conta
 * de multa e juros é do domínio (`calcularEncargos`) e só aparece se a
 * academia cobra (A3). Pagamento parcial é recusado.
 */

import { useState } from 'react';
import { calcularEncargos, situacaoDaCobranca } from '@dominio/financeiro/cobrancas.ts';
import { formatarDinheiro, lerDinheiro } from '@dominio/financeiro/dinheiro.ts';
import { formatarDataBR } from '@dominio/financeiro/datas.ts';
import { ROTULO_DA_FORMA } from '@dominio/financeiro/nomes.ts';
import { FORMAS_DE_PAGAMENTO, type Cobranca, type FormaDePagamento } from '@dominio/financeiro/tipos.ts';
import { useEnvio } from '../estado/envio.ts';
import { useDados, useLoja } from '../estado/loja.tsx';
import { lerDataDigitada } from '../util/datas-digitadas.ts';
import { Campo, Gaveta } from './basicos.tsx';

export function GavetaPagar({ cobranca: c, aoFechar }: { cobranca: Cobranca; aoFechar: () => void }) {
  const { hoje, executar, avisar } = useLoja();
  const d = useDados();
  const [data, setData] = useState(formatarDataBR(hoje));
  const [forma, setForma] = useState<FormaDePagamento>('pix');
  const enc = calcularEncargos(c.valorCentavos, c.vencimento, hoje, d.regras.atraso);
  const [valor, setValor] = useState(formatarDinheiro(c.valorCentavos + enc.totalCentavos));
  const [erro, setErro] = useState<string | null>(null);
  // o valor maior que o esperado ("1500" no lugar de "150") pede um segundo clique (AO)
  const [confirmarMaior, setConfirmarMaior] = useState<number | null>(null);
  const envio = useEnvio();
  const s = situacaoDaCobranca(c, hoje);
  const nome = (id?: string) => d.pessoas.find((p) => p.id === id)?.nome ?? '—';
  const plano = d.planos.find((p) => p.id === d.matriculas.find((m) => m.id === c.matriculaId)?.planoId);

  // um envio por vez: o duplo clique em "Confirmar pagamento" não paga duas vezes (AO)
  const confirmar = () => envio.enviar(async () => {
    const iso = lerDataDigitada(data, hoje);
    if (!iso) { setErro('A data não existe. Use dd/mm/aaaa.'); return; }
    // pago no futuro não existe: o caixa conta o que entrou de fato (AO)
    if (iso > hoje) { setErro(`A data do pagamento é depois de hoje (${formatarDataBR(hoje)}).`); return; }
    const v = lerDinheiro(valor);
    if (v == null || v <= 0) { setErro('Valor inválido.'); return; }
    if (v < c.valorCentavos) { setErro(`Pagamento parcial não é aceito: o valor é ${formatarDinheiro(c.valorCentavos)}.`); return; }
    const esperado = c.valorCentavos + enc.totalCentavos;
    if (v > esperado && confirmarMaior !== v) {
      setConfirmarMaior(v);
      setErro(`${formatarDinheiro(v)} é mais que o esperado (${formatarDinheiro(esperado)}). Confira e clique de novo para confirmar.`);
      return;
    }
    const r = await executar((repo) => repo.marcarComoPaga(c.id, { data: iso, forma, valorPagoCentavos: v }));
    if (r.ok) {
      avisar(`Paga: ${c.descricao}. Nasceu a linha de entrada na planilha.`, { desfazer: () => { void executar((repo) => repo.desfazerPagamento(c.id)); } });
      aoFechar();
    }
  });

  return (
    <Gaveta titulo="Marcar como paga" aoFechar={aoFechar} rodape={<>
      <button type="button" className="ad-btn ad-btn--grande" onClick={aoFechar}>Cancelar</button>
      <button type="button" className="ad-btn ad-btn--primario ad-btn--grande" onClick={() => void confirmar()} disabled={envio.enviando}>{envio.enviando ? 'Gravando…' : confirmarMaior != null ? 'Confirmar o valor maior' : 'Confirmar pagamento'}</button>
    </>}>
      <dl className="ad-dados">
        <dt>Cobrança</dt><dd>{c.descricao}{plano ? ` · ${plano.nome}` : ''}</dd>
        {c.alunoPessoaId && <><dt>Aluno</dt><dd>{nome(c.alunoPessoaId)}</dd></>}
        <dt>Quem paga</dt><dd>{nome(c.pessoaId)}{c.alunoPessoaId ? ' (responsável)' : ''}</dd>
        <dt>{s.estado === 'atrasada' ? 'Venceu' : 'Vence'}</dt>
        <dd className={s.estado === 'atrasada' ? 'neg' : undefined}>{formatarDataBR(c.vencimento)}{s.estado === 'atrasada' ? ` · há ${s.diasDeAtraso} ${s.diasDeAtraso === 1 ? 'dia' : 'dias'}` : s.estado === 'vence_hoje' ? ' · hoje' : ''}</dd>
        {c.descontoCentavos > 0 && <><dt>Desconto</dt><dd>{formatarDinheiro(c.descontoCentavos)}</dd></>}
      </dl>
      <Campo rotulo="Data do pagamento" erro={null} ajuda='"hoje", "ontem" e "14/10" valem.'>{(p) => <input {...p} value={data} onChange={(e) => { setData(e.target.value); setErro(null); }} inputMode="numeric" />}</Campo>
      <Campo rotulo="Forma">
        {(p) => <select {...p} value={forma} onChange={(e) => setForma(e.target.value as FormaDePagamento)}>{FORMAS_DE_PAGAMENTO.map((f) => <option key={f} value={f}>{ROTULO_DA_FORMA[f]}</option>)}</select>}
      </Campo>
      <Campo rotulo="Valor pago" erro={erro}>{(p) => <input {...p} value={valor} onChange={(e) => { setValor(e.target.value); setErro(null); setConfirmarMaior(null); }} inputMode="decimal" />}</Campo>
      <p className="campo__ajuda">
        {d.regras.atraso
          ? enc.totalCentavos ? `Com ${enc.diasDeAtraso} dias de atraso: multa ${formatarDinheiro(enc.multaCentavos)} e juros ${formatarDinheiro(enc.jurosCentavos)}.` : 'Sem multa nem juros: ainda está na tolerância.'
          : 'Sem multa nem juros: a academia não cobra (Ajustes › Regras de cobrança).'} Pagamento parcial não é aceito.
      </p>
      <p className="ad-anotacao">Ao confirmar, a cobrança vira paga e nasce a linha de entrada na planilha, com a modalidade. Dá para desfazer.</p>
    </Gaveta>
  );
}
