/**
 * "Gerar mensalidades de outubro" (RA3.3): roda o `gerarMensalidadesDoMes`
 * (idempotente) e mostra quem ficou de fora e por quê.
 */

import { useState } from 'react';
import { formatarDinheiro } from '@dominio/financeiro/dinheiro.ts';
import type { MotivoDePular, ResultadoDaGeracao } from '@dominio/financeiro/mensalidades.ts';
import { useEnvio } from '../estado/envio.ts';
import { useDados, useLoja } from '../estado/loja.tsx';
import { nomeDoMes, plural } from '../util/formatar.ts';
import { Gaveta } from './basicos.tsx';

const MOTIVO: Record<MotivoDePular, string> = {
  ja_existe: 'já tinha a cobrança', trancada: 'matrícula trancada', encerrada: 'matrícula encerrada', fora_do_periodo: 'ainda não começou',
  gratuito: 'plano gratuito', isenta: 'isenta (100 % de desconto)', nao_e_mes_de_cobranca: 'não é mês de cobrança (trimestral)',
  plano_inexistente: 'plano não existe mais', primeiro_mes: 'primeiro mês (regra: só a partir do próximo)',
};

export function GerarMensalidades({ competencia, compacto = false, rotulo }: { competencia: string; compacto?: boolean; rotulo?: string }) {
  const { executar } = useLoja();
  const d = useDados();
  const [resultado, setResultado] = useState<ResultadoDaGeracao | null>(null);
  const envio = useEnvio();

  const gerar = () => envio.enviar(async () => {
    const r = await executar((repo) => repo.gerarMensalidades(competencia));
    if (r.ok) setResultado(r.valor.resultado);
  });

  const nome = (matriculaId: string) => {
    const m = d.matriculas.find((x) => x.id === matriculaId);
    return d.pessoas.find((p) => p.id === m?.pessoaId)?.nome ?? '—';
  };
  const contagem = resultado ? Object.entries(resultado.puladas.reduce<Record<string, number>>((s, p) => ({ ...s, [p.motivo]: (s[p.motivo] ?? 0) + 1 }), {})) : [];

  return (
    <>
      <button type="button" className="ad-btn" onClick={() => void gerar()} disabled={envio.enviando} data-compacto={compacto || undefined}>{rotulo ?? `Gerar mensalidades de ${nomeDoMes(competencia)}`}</button>
      {resultado && (
        <Gaveta titulo={`Mensalidades de ${nomeDoMes(competencia)}`} aoFechar={() => setResultado(null)} rodape={<button type="button" className="ad-btn ad-btn--primario ad-btn--grande" onClick={() => setResultado(null)}>Pronto</button>}>
          <p className="t16">
            {resultado.novas.length
              ? <>Geradas <b>{plural(resultado.novas.length, 'cobrança', 'cobranças')}</b>, somando <b>{formatarDinheiro(resultado.novas.reduce((s, c) => s + c.valorCentavos, 0))}</b>.</>
              : <>Nenhuma cobrança nova: o mês já estava gerado.</>}
          </p>
          <p className="ad-anotacao">Rodar de novo não duplica nada, nem recria a cobrança que você cancelou. Regra do primeiro mês: {d.regras.primeiroMes === 'cheio' ? 'mês cheio' : d.regras.primeiroMes === 'proporcional' ? 'proporcional' : 'só a partir do próximo'}{d.regras.provisorio ? ' (provisória, A7)' : ''}.</p>
          {contagem.length > 0 && (
            <>
              <h3 className="ad-h3">Ficaram de fora</h3>
              <ul className="ad-lista ad-lista--compacta">
                {contagem.map(([m, n]) => <li key={m}><span className="ad-lista__txt"><span>{MOTIVO[m as MotivoDePular]}</span></span><span className="ad-lista__val">{n}</span></li>)}
              </ul>
              <details>
                <summary className="ad-anotacao">Ver os nomes</summary>
                <ul className="ad-lista ad-lista--compacta">
                  {resultado.puladas.filter((p) => p.motivo !== 'ja_existe').map((p) => <li key={p.matriculaId}><span className="ad-lista__txt"><b>{nome(p.matriculaId)}</b><span>{MOTIVO[p.motivo]}</span></span></li>)}
                </ul>
              </details>
            </>
          )}
        </Gaveta>
      )}
    </>
  );
}
