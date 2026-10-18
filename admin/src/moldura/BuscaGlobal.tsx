/**
 * A busca global (Ctrl+K): pessoas, lançamentos e cobranças, notas. Setas
 * escolhem, Enter abre, Esc fecha. A busca ignora acento e caixa (`normalizar`).
 */

import { useMemo, useState, type RefObject } from 'react';
import { buscarNotas } from '@dominio/financeiro/anotacoes.ts';
import { situacaoDaCobranca } from '@dominio/financeiro/cobrancas.ts';
import { formatarDinheiro } from '@dominio/financeiro/dinheiro.ts';
import { normalizar } from '@dominio/financeiro/nomes.ts';
import { Icone } from '../componentes/basicos.tsx';
import { useLoja } from '../estado/loja.tsx';
import { ir } from '../estado/rota.ts';
import { diaMes } from '../util/formatar.ts';

interface Resultado { grupo: string; titulo: string; apoio: string; abrir: () => void }

function Marcado({ texto, alvo }: { texto: string; alvo: string }) {
  const n = normalizar(texto);
  const i = alvo ? n.indexOf(alvo) : -1;
  if (i < 0) return <>{texto}</>;
  return <>{texto.slice(0, i)}<mark>{texto.slice(i, i + alvo.length)}</mark>{texto.slice(i + alvo.length)}</>;
}

export function BuscaGlobal({ entrada, aberta, setAberta }: { entrada: RefObject<HTMLInputElement | null>; aberta: boolean; setAberta: (a: boolean) => void }) {
  const { dados, hoje, setMes } = useLoja();
  const [texto, setTexto] = useState('');
  const [sel, setSel] = useState(0);
  const alvo = normalizar(texto);

  const resultados = useMemo<Resultado[]>(() => {
    if (!dados || alvo.length < 2) return [];
    const nome = (id?: string) => dados.pessoas.find((p) => p.id === id)?.nome ?? '';
    const pessoas = dados.pessoas.filter((p) => normalizar(`${p.nome} ${p.telefone ?? ''}`).includes(alvo)).slice(0, 5).map((p): Resultado => {
      const filhos = dados.pessoas.filter((x) => x.responsavelPessoaId === p.id);
      const apoio = p.ehResponsavel && filhos.length ? `Responsável · ${filhos.length} ${filhos.length === 1 ? 'dependente' : 'dependentes'}`
        : p.ehFuncionario ? 'Equipe' : p.responsavelPessoaId ? `Kids · responsável ${nome(p.responsavelPessoaId)}` : 'Aluno';
      return { grupo: 'Pessoas', titulo: p.nome, apoio, abrir: () => ir('pessoas', 'ficha', p.id) };
    });
    const cobrancas = dados.cobrancas.filter((c) => c.estado === 'aberta' && normalizar(`${c.descricao} ${nome(c.alunoPessoaId ?? c.pessoaId)}`).includes(alvo)).slice(0, 3)
      .map((c): Resultado => {
        const s = situacaoDaCobranca(c, hoje);
        return { grupo: 'Lançamentos e cobranças', titulo: `${c.descricao} — ${nome(c.alunoPessoaId ?? c.pessoaId)}`, apoio: `${formatarDinheiro(c.valorCentavos)} · ${s.estado === 'atrasada' ? `venceu ${diaMes(c.vencimento)}` : `vence ${diaMes(c.vencimento)}`}`, abrir: () => { setMes(c.competencia); ir('financeiro', 'cobrancas'); } };
      });
    const lancs = dados.lancamentos.filter((l) => !l.arquivado && normalizar(l.descricao).includes(alvo)).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 3)
      .map((l): Resultado => ({ grupo: 'Lançamentos e cobranças', titulo: l.descricao, apoio: `${l.tipo === 'saida' ? '−' : ''}${formatarDinheiro(l.valorCentavos)} · ${l.situacao} · ${diaMes(l.data)}`, abrir: () => { setMes(l.data.slice(0, 7)); ir('financeiro', 'lancamentos'); } }));
    const notas = buscarNotas(dados.notas, texto).slice(0, 3).map((n): Resultado => ({ grupo: 'Notas', titulo: n.texto.slice(0, 80), apoio: `${n.pessoaId ? nome(n.pessoaId) : 'Sem pessoa'}${n.fixada ? ' · fixada' : ''}`, abrir: () => ir('notas') }));
    return [...pessoas, ...cobrancas, ...lancs, ...notas];
  }, [dados, alvo, texto, hoje, setMes]);

  const fechar = () => { setAberta(false); setTexto(''); entrada.current?.blur(); };
  const abrir = (r?: Resultado) => { if (!r) return; r.abrir(); fechar(); };
  const grupos = [...new Set(resultados.map((r) => r.grupo))];

  return (
    <div className="ad-busca">
      <label className="campo__caixa">
        <Icone nome="i-buscar" pequeno={false} />
        <input
          ref={entrada} type="search" placeholder="Buscar pessoa, lançamento, nota…" aria-label="Busca global" value={texto}
          role="combobox" aria-expanded={aberta && resultados.length > 0} aria-controls="busca-resultados" aria-autocomplete="list"
          onFocus={() => setAberta(true)} onBlur={() => setTimeout(() => setAberta(false), 150)}
          onChange={(e) => { setTexto(e.target.value); setSel(0); setAberta(true); }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { e.preventDefault(); fechar(); }
            else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(resultados.length - 1, s + 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
            else if (e.key === 'Enter') { e.preventDefault(); abrir(resultados[sel]); }
          }}
        />
        <kbd className="ad-kbd">Ctrl K</kbd>
      </label>
      {aberta && alvo.length >= 2 && (
        <div className="ad-suspensa folha-moldura" role="listbox" id="busca-resultados" aria-label={`Resultados para ${texto}`}>
          {!resultados.length && <p className="ad-anotacao" style={{ padding: 8 }}>Nada com "{texto}".</p>}
          {grupos.map((g) => {
            const doGrupo = resultados.filter((r) => r.grupo === g);
            return (
              <div key={g} style={{ display: 'contents' }}>
                <h3 className="ad-h3">{g} · {doGrupo.length}</h3>
                {doGrupo.map((r) => {
                  const i = resultados.indexOf(r);
                  return (
                    <a key={i} className="linha" href="#" role="option" aria-selected={i === sel} onMouseDown={(e) => { e.preventDefault(); abrir(r); }}>
                      <span><b><Marcado texto={r.titulo} alvo={alvo} /></b><small><Marcado texto={r.apoio} alvo={alvo} /></small></span>
                    </a>
                  );
                })}
              </div>
            );
          })}
          <footer><span>↑ ↓ escolher</span><span>Enter abrir</span><span>Esc fechar</span></footer>
        </div>
      )}
    </div>
  );
}
