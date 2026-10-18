/**
 * Anotar (N) e Lembrar (L): as duas gavetas que abrem de qualquer tela
 * (RA12). A validação é a do domínio (`validarNota`, `validarLembrete`).
 */

import { useState } from 'react';
import { validarLembrete, validarNota } from '@dominio/financeiro/anotacoes.ts';
import { lerDinheiro } from '@dominio/financeiro/dinheiro.ts';
import { formatarDataBR } from '@dominio/financeiro/datas.ts';
import { acharPorNome } from '@dominio/financeiro/nomes.ts';
import type { Lembrete, Nota, RepeticaoDoLembrete } from '@dominio/financeiro/tipos.ts';
import { useEnvio } from '../estado/envio.ts';
import { useDados, useLoja } from '../estado/loja.tsx';
import { lerDataDigitada } from '../util/datas-digitadas.ts';
import { agoraNaAcademia } from '../util/relogio.ts';
import { Campo, Gaveta } from './basicos.tsx';

export function GavetaNota({ aoFechar, pessoaId, nota }: { aoFechar: () => void; pessoaId?: string; nota?: Nota }) {
  const { executar, avisar, sessao } = useLoja();
  const dados = useDados();
  const [texto, setTexto] = useState(nota?.texto ?? '');
  const [pessoa, setPessoa] = useState(nota?.pessoaId ?? pessoaId ? dados.pessoas.find((p) => p.id === (nota?.pessoaId ?? pessoaId))?.nome ?? '' : '');
  const [fixada, setFixada] = useState(nota?.fixada ?? false);
  const [erro, setErro] = useState<string | null>(null);
  const envio = useEnvio();

  const gravar = () => envio.enviar(async () => {
    const em = agoraNaAcademia();
    const p = pessoa.trim() ? acharPorNome(dados.pessoas, pessoa) : undefined;
    if (pessoa.trim() && !p) { setErro('Pessoa não encontrada (ou mais de uma com esse começo).'); return; }
    const n: Nota = {
      id: nota?.id ?? crypto.randomUUID(), academiaId: dados.academia.id, texto: texto.trim(), ...(p ? { pessoaId: p.id } : {}),
      fixada, arquivada: false, criadaPor: nota?.criadaPor ?? sessao.usuarioId, criadaEm: nota?.criadaEm ?? em, atualizadaEm: em,
    };
    const erros = validarNota(n);
    if (erros.length) { setErro(erros[0]!); return; }
    const r = await executar((repo) => repo.salvar('notas', n));
    if (r.ok) { avisar(nota ? 'Nota atualizada.' : 'Nota guardada.'); aoFechar(); }
  });

  return (
    <Gaveta titulo={nota ? 'Editar nota' : 'Anotar'} aoFechar={aoFechar} rodape={<>
      <button type="button" className="ad-btn ad-btn--grande" onClick={aoFechar}>Cancelar</button>
      <button type="button" className="ad-btn ad-btn--primario ad-btn--grande" onClick={() => void gravar()} disabled={envio.enviando}>Guardar nota</button>
    </>}>
      <Campo rotulo="Nota" erro={erro} ajuda="Até 2.000 caracteres. Só você vê.">
        {(p) => <textarea {...p} rows={5} value={texto} onChange={(e) => { setTexto(e.target.value); setErro(null); }} style={{ width: '100%', resize: 'vertical' }} />}
      </Campo>
      <Campo rotulo="Ligada a uma pessoa (opcional)" ajuda="O começo do nome basta, se só uma pessoa bater.">
        {(p) => <input {...p} value={pessoa} onChange={(e) => setPessoa(e.target.value)} list="lista-pessoas" autoComplete="off" />}
      </Campo>
      <label className="marcar campo__caixa"><input type="checkbox" checked={fixada} onChange={(e) => setFixada(e.target.checked)} /><span>Fixar no topo</span></label>
    </Gaveta>
  );
}

const REPETICOES: [RepeticaoDoLembrete, string][] = [['nao_repete', 'Não repete'], ['semanal', 'Toda semana'], ['mensal', 'Todo mês'], ['anual', 'Todo ano']];

export function GavetaLembrete({ aoFechar, pessoaId, tituloInicial }: { aoFechar: () => void; pessoaId?: string; tituloInicial?: string }) {
  const { executar, avisar, sessao, hoje } = useLoja();
  const dados = useDados();
  const [titulo, setTitulo] = useState(tituloInicial ?? '');
  const [data, setData] = useState(formatarDataBR(hoje));
  const [hora, setHora] = useState('');
  const [repeticao, setRepeticao] = useState<RepeticaoDoLembrete>('nao_repete');
  const [antes, setAntes] = useState('0');
  const [valor, setValor] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const envio = useEnvio();

  const gravar = () => envio.enviar(async () => {
    // "10/01" digitado em dezembro é o janeiro que vem, não um lembrete já atrasado (AO)
    const iso = lerDataDigitada(data, hoje, { futuro: true });
    if (!iso) { setErro('A data não existe. Use dd/mm/aaaa.'); return; }
    if (iso < hoje) { setErro(`O dia ${formatarDataBR(iso)} já passou. Escolha hoje ou depois.`); return; }
    const v = valor.trim() ? lerDinheiro(valor) : null;
    if (valor.trim() && v == null) { setErro('Valor inválido.'); return; }
    const l: Lembrete = {
      id: crypto.randomUUID(), academiaId: dados.academia.id, titulo: titulo.trim(), data: iso, ...(hora ? { hora } : {}), repeticao,
      ...(repeticao === 'mensal' ? { diaDoMes: Number(iso.slice(8)) } : {}), avisarDiasAntes: Number(antes) || 0,
      ...(pessoaId ? { pessoaId } : {}), ...(v != null ? { valorCentavos: Math.abs(v) } : {}), criadoPor: sessao.usuarioId, criadoEm: agoraNaAcademia(),
    };
    const erros = validarLembrete(l);
    if (erros.length) { setErro(erros[0]!); return; }
    const r = await executar((repo) => repo.salvar('lembretes', l));
    if (r.ok) { avisar(`Lembrete para ${formatarDataBR(iso)}.`); aoFechar(); }
  });

  return (
    <Gaveta titulo="Lembrar" aoFechar={aoFechar} rodape={<>
      <button type="button" className="ad-btn ad-btn--grande" onClick={aoFechar}>Cancelar</button>
      <button type="button" className="ad-btn ad-btn--primario ad-btn--grande" onClick={() => void gravar()} disabled={envio.enviando}>Guardar lembrete</button>
    </>}>
      <Campo rotulo="O que lembrar" erro={erro}>
        {(p) => <input {...p} value={titulo} onChange={(e) => { setTitulo(e.target.value); setErro(null); }} maxLength={120} />}
      </Campo>
      <Campo rotulo="Dia" ajuda='"amanhã", "20" e "20/10" valem: sem ano, a próxima vez que o dia chega.'>{(p) => <input {...p} value={data} onChange={(e) => setData(e.target.value)} inputMode="numeric" />}</Campo>
      <Campo rotulo="Hora (opcional)" ajuda="Sem hora, entra no resumo da manhã.">{(p) => <input {...p} type="time" value={hora} onChange={(e) => setHora(e.target.value)} />}</Campo>
      <Campo rotulo="Repete">
        {(p) => <select {...p} value={repeticao} onChange={(e) => setRepeticao(e.target.value as RepeticaoDoLembrete)}>{REPETICOES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select>}
      </Campo>
      <Campo rotulo="Avisar antes (dias)">{(p) => <input {...p} inputMode="numeric" value={antes} onChange={(e) => setAntes(e.target.value.replace(/\D/g, ''))} />}</Campo>
      <Campo rotulo="Valor (opcional)">{(p) => <input {...p} inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="R$ 0,00" />}</Campo>
      <p className="campo__ajuda">O aviso no celular diz só "Você tem 1 lembrete hoje": nunca o texto nem o valor.</p>
    </Gaveta>
  );
}
