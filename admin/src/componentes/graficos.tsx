/**
 * Os gráficos do Admin: UMA cor para o destaque (o vermelho de preenchimento)
 * e o resto em cinza (RA7.3). Negativo é tracejado E com sinal no texto, nunca
 * só cor. O número de cada barra está no título e na tabela ao lado.
 */

import { formatarDinheiro } from '@dominio/financeiro/dinheiro.ts';
import { nomeDaCompetencia } from '@dominio/financeiro/datas.ts';

const curto = (comp: string) => nomeDaCompetencia(comp).slice(0, 3);

export function Barras({ meses, atual, comValor = false }: { meses: { competencia: string; valor: number }[]; atual: string; comValor?: boolean }) {
  const max = Math.max(1, ...meses.map((m) => Math.abs(m.valor)));
  const primeiro = meses[0]?.competencia;
  const ultimo = meses.at(-1)?.competencia;
  return (
    <div className="ad-barras" role="img" aria-label={`Resultado mensal de ${primeiro ? nomeDaCompetencia(primeiro) : ''} a ${ultimo ? nomeDaCompetencia(ultimo) : ''}`}>
      {meses.map((m) => (
        <div key={m.competencia} className={`ad-barras__col${m.competencia === atual ? ' ad-barras__col--atual' : ''}`} title={`${curto(m.competencia)}: ${formatarDinheiro(m.valor)}`}>
          {comValor && <span className="ad-barras__val">{formatarDinheiro(Math.round(m.valor / 100) * 100).replace(/,00$/, '')}</span>}
          <span className={`ad-barras__barra${m.valor < 0 ? ' ad-barras__barra--neg' : ''}`} style={{ height: `${Math.max(4, Math.round((Math.abs(m.valor) / max) * 100))}%` }} />
          <span className="ad-barras__rot">{curto(m.competencia)}</span>
        </div>
      ))}
    </div>
  );
}

export function BarraHorizontal({ rotulo, valor, maximo, destaque, texto }: { rotulo: string; valor: number; maximo: number; destaque?: boolean; texto?: string }) {
  return (
    <div className={`ad-hbarra${destaque ? ' ad-hbarra--destaque' : ''}`}>
      <span className="t13b forte">{rotulo}</span>
      <span className="ad-hbarra__trilho"><span className="ad-hbarra__cheio" style={{ display: 'block', width: `${maximo ? Math.max(1, Math.round((valor / maximo) * 100)) : 0}%` }} /></span>
      <span className="t13b forte num">{texto ?? formatarDinheiro(valor)}</span>
    </div>
  );
}
