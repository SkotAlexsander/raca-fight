/**
 * NOTAS (RA12.1): o caderno do dono. Fixadas primeiro, depois as mais novas;
 * a busca ignora acento e caixa (`buscarNotas`); filtro por pessoa e período.
 */

import { useState } from 'react';
import { buscarNotas, notasLigadas } from '@dominio/financeiro/anotacoes.ts';
import { somarDias } from '@dominio/financeiro/datas.ts';
import type { Nota } from '@dominio/financeiro/tipos.ts';
import { GavetaNota } from '../componentes/anotar.tsx';
import { Icone, Vazio } from '../componentes/basicos.tsx';
import { useDados, useLoja } from '../estado/loja.tsx';
import { diaMes, plural, reais } from '../util/formatar.ts';
import { agoraNaAcademia } from '../util/relogio.ts';

export function Notas() {
  const d = useDados();
  const { hoje, executar, avisar } = useLoja();
  const [texto, setTexto] = useState('');
  const [pessoaId, setPessoaId] = useState('');
  const [periodo, setPeriodo] = useState<'90' | 'mes' | 'tudo'>('90');
  const [editar, setEditar] = useState<Nota | 'nova' | null>(null);
  const base = texto.trim() ? buscarNotas(d.notas, texto) : notasLigadas(d.notas, {});
  const desde = periodo === '90' ? somarDias(hoje, -90) : periodo === 'mes' ? `${hoje.slice(0, 7)}-01` : '0000';
  const vistas = base.filter((n) => (!pessoaId || n.pessoaId === pessoaId) && n.criadaEm.slice(0, 10) >= desde);
  const fixadas = vistas.filter((n) => n.fixada);
  const outras = vistas.filter((n) => !n.fixada);
  const comNota = [...new Set(d.notas.map((n) => n.pessoaId).filter(Boolean))] as string[];
  const nome = (id?: string) => d.pessoas.find((p) => p.id === id)?.nome;

  async function alternar(n: Nota, campo: 'fixada' | 'arquivada') {
    const r = await executar((repo) => repo.salvar('notas', { ...n, [campo]: !n[campo], atualizadaEm: agoraNaAcademia() }));
    if (r.ok) avisar(campo === 'fixada' ? (n.fixada ? 'Nota solta do topo.' : 'Nota fixada.') : 'Nota arquivada.', campo === 'arquivada' ? { desfazer: () => void executar((repo) => repo.salvar('notas', n)) } : {});
  }

  const cartao = (n: Nota) => (
    <div key={n.id} className={`ad-nota${n.fixada ? ' ad-nota--fixa' : ''}`}>
      <p>{n.texto}</p>
      <span>{[nome(n.pessoaId), n.valorCentavos ? reais(n.valorCentavos) : '', diaMes(n.criadaEm.slice(0, 10))].filter(Boolean).join(' · ')}</span>
      <div className="ad-acoes">
        <button type="button" className="ad-btn ad-btn--plano" onClick={() => setEditar(n)}>Editar</button>
        <button type="button" className="ad-btn ad-btn--plano" onClick={() => void alternar(n, 'fixada')}>{n.fixada ? 'Soltar' : 'Fixar'}</button>
        <button type="button" className="ad-btn ad-btn--plano" onClick={() => void alternar(n, 'arquivada')}>Arquivar</button>
      </div>
    </div>
  );

  return (
    <div className="ad-colunas" style={{ ['--colunas' as string]: 'minmax(0, 1fr)' }}>
      <div className="ad-coluna">
        <div className="ad-acoes">
          <label className="campo__caixa" style={{ flex: '1 1 320px', maxWidth: 480 }}><Icone nome="i-buscar" /><input type="search" placeholder="Buscar nas notas" aria-label="Buscar nas notas" value={texto} onChange={(e) => setTexto(e.target.value)} /></label>
          <span className="campo__caixa"><select aria-label="Pessoa" value={pessoaId} onChange={(e) => setPessoaId(e.target.value)}><option value="">Qualquer pessoa</option>{comNota.map((id) => <option key={id} value={id}>{nome(id)}</option>)}</select></span>
          <span className="campo__caixa"><select aria-label="Período" value={periodo} onChange={(e) => setPeriodo(e.target.value as typeof periodo)}><option value="90">Últimos 90 dias</option><option value="mes">Este mês</option><option value="tudo">Tudo</option></select></span>
          <button type="button" className="ad-btn ad-btn--primario" onClick={() => setEditar('nova')}><Icone nome="i-mais" />Nota <kbd>N</kbd></button>
        </div>
        {!vistas.length ? <Vazio titulo={texto ? `Nenhuma nota com "${texto}"` : 'Nenhuma nota ainda'} texto="Anote combinados, orçamentos e o que não pode esquecer. Só você vê." /> : <>
          {fixadas.length > 0 && <><h2 className="ad-h3">Fixadas · {fixadas.length}</h2><div className="ad-mapa" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>{fixadas.map(cartao)}</div></>}
          {outras.length > 0 && <><h2 className="ad-h3">Mais novas · {plural(outras.length, 'nota', 'notas')}</h2><div className="ad-mapa" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>{outras.map(cartao)}</div></>}
        </>}
      </div>
      {editar && <GavetaNota nota={editar === 'nova' ? undefined : editar} aoFechar={() => setEditar(null)} />}
    </div>
  );
}
