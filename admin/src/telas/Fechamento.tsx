/**
 * FINANCEIRO › FECHAMENTO (RA4.10): os meses, fechados ou abertos, com os
 * totais congelados e quem fechou. Fechar mostra antes o que está pendurado
 * (não impede: o dono decide); reabrir pede motivo, que vai ao histórico.
 */

import { useState } from 'react';
import { mesFechado, pendenciasAntesDeFechar, type TipoDePendencia } from '@dominio/financeiro/fechamento.ts';
import { totaisDoPeriodo } from '@dominio/financeiro/totais.ts';
import { competenciaDe, formatarDataBR, periodoDaCompetencia, somarMeses } from '@dominio/financeiro/datas.ts';
import { Campo, Gaveta, Icone, Selo } from '../componentes/basicos.tsx';
import { useEnvio } from '../estado/envio.ts';
import { useDados, useLoja } from '../estado/loja.tsx';
import { ir } from '../estado/rota.ts';
import { mesTitulo, nomeDoMes, reais } from '../util/formatar.ts';
import { horaDe } from '../util/relogio.ts';

const PENDENCIA: Record<TipoDePendencia, string> = {
  mes_nao_terminou: 'O mês ainda não terminou.',
  lancamento_pendente: 'linhas pendentes',
  sem_categoria: 'linhas sem categoria',
  cobranca_em_aberto: 'cobranças em aberto',
};

export function Fechamento() {
  const d = useDados();
  const { hoje, setMes } = useLoja();
  const [fechar, setFechar] = useState<string | null>(null);
  const [reabrir, setReabrir] = useState<string | null>(null);
  const comp = competenciaDe(hoje);
  const meses = Array.from({ length: 13 }, (_, i) => somarMeses(comp, -i));
  const nome = (id?: string) => d.pessoas.find((p) => p.id === id)?.nome ?? 'Alex';

  return (
    <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(0, 1fr)' }}>
      <section className="ad-painel ad-painel--sem-pad ad-painel--cheio" aria-labelledby="fe-tit">
        <div className="ad-painel__topo"><h2 id="fe-tit">Os meses</h2><p className="ad-anotacao" style={{ marginLeft: 'auto' }}>Fechar guarda a foto dos números e trava as linhas do mês. Reabrir pede motivo.</p></div>
        <div className="lista ad-tabela-rola">
          <table className="ad-tabela">
            <thead><tr><th scope="col">Mês</th><th scope="col">Situação</th><th scope="col" className="dir">Entrou</th><th scope="col" className="dir">Saiu</th><th scope="col" className="dir">Resultado</th><th scope="col" className="dir">A receber em aberto</th><th scope="col">Quem e quando</th><th scope="col" /></tr></thead>
            <tbody>
              {meses.map((m) => {
                const f = d.fechamentos.filter((x) => x.competencia === m).sort((a, b) => b.fechadoEm.localeCompare(a.fechadoEm))[0];
                const fechado = mesFechado(m, d.fechamentos);
                const t = fechado && f ? f.totais : totaisDoPeriodo(d.lancamentos, periodoDaCompetencia(m));
                return (
                  <tr key={m}>
                    <th scope="row" className="t13b"><a className="forte" href="#" onClick={(e) => { e.preventDefault(); setMes(m); ir('financeiro', 'lancamentos'); }}>{mesTitulo(m)}</a></th>
                    <td>{fechado ? <Selo icone="i-cadeado">Fechado</Selo> : f?.reabertoEm ? <Selo tom="pend">Reaberto</Selo> : <Selo tom="ok">Aberto</Selo>}</td>
                    <td className="dir">{reais(t.entradas)}</td>
                    <td className="dir">{reais(t.saidas)}</td>
                    <td className={`dir ${t.resultado < 0 ? 'neg' : ''}`}><b>{reais(t.resultado)}</b>{!fechado && <span className="sec"> (até agora)</span>}</td>
                    <td className="dir sec">{fechado && f ? reais(f.aReceberEmAberto) : '—'}</td>
                    <td className="sec">
                      {fechado && f ? `${nome(f.fechadoPor)} · ${formatarDataBR(f.fechadoEm.slice(0, 10))} ${horaDe(f.fechadoEm)}`
                        : f?.reabertoEm ? `Reaberto ${formatarDataBR(f.reabertoEm.slice(0, 10))}: ${f.motivoDaReabertura}` : '—'}
                    </td>
                    <td className="dir">
                      {fechado
                        ? <button type="button" className="ad-btn" onClick={() => setReabrir(m)}>Reabrir</button>
                        : m <= comp && <button type="button" className="ad-btn" onClick={() => setFechar(m)}><Icone nome="i-cadeado" />Fechar {nomeDoMes(m)}</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      {fechar && <GavetaFechar competencia={fechar} aoFechar={() => setFechar(null)} />}
      {reabrir && <GavetaReabrir competencia={reabrir} aoFechar={() => setReabrir(null)} />}
    </div>
  );
}

export function GavetaFechar({ competencia, aoFechar }: { competencia: string; aoFechar: () => void }) {
  const d = useDados();
  const { hoje, executar, avisar } = useLoja();
  const pend = pendenciasAntesDeFechar(competencia, d.lancamentos, d.cobrancas, hoje);
  const t = totaisDoPeriodo(d.lancamentos, periodoDaCompetencia(competencia));
  const envio = useEnvio();
  const confirmar = () => envio.enviar(async () => {
    const r = await executar((repo) => repo.fecharMes(competencia));
    if (r.ok) { avisar(`${mesTitulo(competencia).split(' de ')[0]} fechado. As linhas ficaram travadas.`); aoFechar(); }
  });
  return (
    <Gaveta titulo={`Fechar ${nomeDoMes(competencia)}`} aoFechar={aoFechar} rodape={<>
      <button type="button" className="ad-btn ad-btn--grande" onClick={aoFechar}>Cancelar</button>
      <button type="button" className="ad-btn ad-btn--primario ad-btn--grande" onClick={() => void confirmar()} disabled={envio.enviando}><Icone nome="i-cadeado" />Fechar o mês</button>
    </>}>
      <dl className="ad-dados">
        <dt>Entrou</dt><dd className="pos">{reais(t.entradas)}</dd>
        <dt>Saiu</dt><dd className="neg">{reais(-t.saidas)}</dd>
        <dt>Resultado</dt><dd>{reais(t.resultado)}</dd>
        <dt>Linhas</dt><dd>{t.quantidade}</dd>
      </dl>
      <h3 className="ad-h3">Antes de fechar</h3>
      {pend.length === 0 ? <p className="t16">Nada pendurado. Pode fechar.</p> : (
        <ul className="ad-lista ad-lista--compacta">
          {pend.map((x) => (
            <li key={x.tipo}><span className="ad-lista__txt"><span>{x.tipo === 'mes_nao_terminou' ? PENDENCIA[x.tipo] : `${x.quantidade} ${PENDENCIA[x.tipo]}`}</span></span>{x.centavos > 0 && <span className="ad-lista__val">{reais(x.centavos)}</span>}</li>
          ))}
        </ul>
      )}
      <p className="ad-anotacao">Isso não impede o fechamento: você decide. Depois de fechado, nenhuma linha do mês muda (nem pela importação) até alguém reabrir com motivo.</p>
    </Gaveta>
  );
}

export function GavetaReabrir({ competencia, aoFechar }: { competencia: string; aoFechar: () => void }) {
  const { executar, avisar } = useLoja();
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const envio = useEnvio();
  const confirmar = () => envio.enviar(async () => {
    if (!motivo.trim()) { setErro('Escreva o motivo: ele fica no histórico.'); return; }
    const r = await executar((repo) => repo.reabrirMes(competencia, motivo));
    if (r.ok) { avisar(`${mesTitulo(competencia).split(' de ')[0]} reaberto. O motivo ficou no histórico.`); aoFechar(); }
  });
  return (
    <Gaveta titulo={`Reabrir ${nomeDoMes(competencia)}`} aoFechar={aoFechar} rodape={<>
      <button type="button" className="ad-btn ad-btn--grande" onClick={aoFechar}>Cancelar</button>
      <button type="button" className="ad-btn ad-btn--primario ad-btn--grande" onClick={() => void confirmar()} disabled={envio.enviando}>Reabrir</button>
    </>}>
      <p className="t16">Os números foram congelados como foram para o contador. Reabrir destrava as linhas; a foto antiga fica guardada.</p>
      <Campo rotulo="Motivo" erro={erro}>{(p) => <textarea {...p} rows={3} value={motivo} onChange={(e) => { setMotivo(e.target.value); setErro(null); }} placeholder="Ex.: faltou lançar a venda de luvas" />}</Campo>
      <p className="ad-anotacao">A reabertura vai ao histórico, com o seu nome, a hora e o motivo.</p>
    </Gaveta>
  );
}
