/**
 * AJUSTES › TURMAS E HORÁRIOS (R14.2a; pedido do AU, 16/10): o dono monta a
 * grade de aulas. A semana mostra as aulas dia a dia; a gaveta cria ou muda a
 * turma com os horários dela. A conferência é do domínio (`validarTurma`) e,
 * no banco, das restrições de `turmas` e `horarios`. Horário que sai da
 * turma fica inativo (nada se apaga). A aula experimental do funil é marcada
 * num destes horários e aparece na chamada do professor.
 */

import { useState } from 'react';
import { NOME_DO_DIA, gradeDaSemana, validarTurma } from '@dominio/financeiro/grade-de-aulas.ts';
import { DIAS_DA_SEMANA, type DiaDaSemana } from '@dominio/tipos.ts';
import { NOME_DO_NIVEL_DA_TURMA, NOME_DO_PUBLICO, type Horario, type NivelDaTurma, type PublicoDaTurma, type Turma } from '@dominio/turmas/turmas.ts';
import { Campo, Gaveta, Icone, Selo, Vazio } from '../componentes/basicos.tsx';
import { useEnvio } from '../estado/envio.ts';
import { useDados, useLoja } from '../estado/loja.tsx';
import { plural } from '../util/formatar.ts';

/** A semana começa na segunda, como o cartaz da academia. */
const SEMANA: DiaDaSemana[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

export function Turmas() {
  const d = useDados();
  const [editar, setEditar] = useState<Turma | 'nova' | null>(null);
  const semana = gradeDaSemana(d.turmas);
  const nome = (id: string | null) => (id ? d.pessoas.find((p) => p.id === id || p.usuarioId === id)?.nome ?? '—' : 'sem professor fixo');
  const mod = (ids: string[]) => ids.map((id) => d.modalidades.find((m) => m.id === id)?.nome).filter(Boolean).join(' + ');
  const ordenadas = [...d.turmas].sort((a, b) => Number(b.ativa) - Number(a.ativa) || a.nome.localeCompare(b.nome));

  return (
    <>
      <section className="ad-painel" aria-labelledby="tu-sem">
        <div className="ad-painel__topo">
          <h2 id="tu-sem">A semana · {plural(d.turmas.filter((t) => t.ativa).length, 'turma ativa', 'turmas ativas')}</h2>
          <button type="button" className="ad-btn ad-btn--primario" onClick={() => setEditar('nova')}><Icone nome="i-mais" />Turma</button>
        </div>
        {!d.turmas.length ? <Vazio titulo="Nenhuma turma ainda" texto="Monte a grade: cada turma com os dias e as horas. A aula experimental do funil é marcada nela." /> : (
          <div className="ad-semana">
            {SEMANA.map((dia) => (
              <div key={dia} className="ad-semana__dia">
                <h3 className="ad-h3">{NOME_DO_DIA[dia]}</h3>
                {semana[dia].length ? semana[dia].map(({ turma, horario }) => (
                  <button type="button" key={horario.id} className="ad-semana__aula" onClick={() => setEditar(turma)}>
                    <b>{horario.inicio}</b><span>{turma.nome}</span>
                  </button>
                )) : <p className="ad-anotacao">sem aula</p>}
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="ad-painel ad-painel--sem-pad" aria-labelledby="tu-lista">
        <div className="ad-painel__topo"><h2 id="tu-lista">Turmas</h2></div>
        <div className="lista ad-tabela-rola">
          <table className="ad-tabela">
            <thead><tr><th scope="col">Turma</th><th scope="col">Modalidades</th><th scope="col">Público</th><th scope="col">Professor</th><th scope="col">Horários</th><th scope="col">Lugares</th><th scope="col">Situação</th></tr></thead>
            <tbody>
              {ordenadas.map((t) => (
                <tr key={t.id} data-abre onClick={() => setEditar(t)}>
                  <td><b><a className="forte" href="#" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditar(t); }}>{t.nome}</a></b></td>
                  <td>{mod(t.modalidadeIds) || '—'}</td>
                  <td>{NOME_DO_PUBLICO[t.publico]}{t.nivel !== 'todos' ? ` · ${NOME_DO_NIVEL_DA_TURMA[t.nivel]}` : ''}</td>
                  <td>{nome(t.professorId)}</td>
                  <td>{t.horarios.map((h) => `${NOME_DO_DIA[h.dia].slice(0, 3)} ${h.inicio}`).join(' · ') || '—'}</td>
                  <td>{t.capacidade ?? 'sem limite'}</td>
                  <td>{t.ativa ? <Selo tom="ok">ativa</Selo> : <Selo>desligada</Selo>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {editar && <GavetaTurma turma={editar === 'nova' ? null : editar} aoFechar={() => setEditar(null)} />}
    </>
  );
}

const PUBLICOS: PublicoDaTurma[] = ['adulto', 'kids', 'competicao', 'aberta'];
const NIVEIS: NivelDaTurma[] = ['todos', 'iniciante', 'intermediario', 'avancado'];

function GavetaTurma({ turma, aoFechar }: { turma: Turma | null; aoFechar: () => void }) {
  const d = useDados();
  const { executar, avisar, repositorio, hoje } = useLoja();
  const envio = useEnvio();
  const [nome, setNome] = useState(turma?.nome ?? '');
  const [modalidadeIds, setModalidadeIds] = useState<string[]>(turma?.modalidadeIds ?? []);
  const [publico, setPublico] = useState<PublicoDaTurma>(turma?.publico ?? 'adulto');
  const [nivel, setNivel] = useState<NivelDaTurma>(turma?.nivel ?? 'todos');
  const [professorId, setProfessorId] = useState<string>(turma?.professorId ?? '');
  const [capacidade, setCapacidade] = useState(turma?.capacidade != null ? String(turma.capacidade) : '');
  const [ativa, setAtiva] = useState(turma?.ativa ?? true);
  const [horarios, setHorarios] = useState<Horario[]>(turma?.horarios ?? [{ id: crypto.randomUUID(), dia: 'seg', inicio: '20:00', duracaoMinutos: 60 }]);
  const [erro, setErro] = useState<string | null>(null);

  // o professor no banco é a CONTA do app (auth.users): no modo Supabase, só quem tem conta entra na lista
  const professores = d.funcionarios.filter((f) => f.funcao === 'professor' && (!f.ate || f.ate >= hoje))
    .map((f) => d.pessoas.find((p) => p.id === f.pessoaId))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({ id: p.usuarioId ?? (repositorio.modo === 'local' ? p.id : ''), nome: p.nome }))
    .filter((p) => p.id);

  const mudarHorario = (i: number, m: Partial<Horario>) => { setHorarios(horarios.map((h, j) => (j === i ? { ...h, ...m } : h))); setErro(null); };

  const gravar = () => envio.enviar(async () => {
    const cap = capacidade.trim() ? Number(capacidade.replace(/\D/g, '')) : null;
    const t: Turma = {
      ...(turma ?? { id: crypto.randomUUID(), academiaId: d.academia.id, auxiliarIds: [] }),
      nome: nome.trim(), modalidadeIds, publico, nivel, professorId: professorId || null, capacidade: cap, ativa, horarios,
    } as Turma;
    const erros = validarTurma(t);
    if (erros.length) { setErro(erros[0]!); return; }
    const r = await executar((repo) => repo.salvar('turmas', t));
    if (r.ok) { avisar(turma ? `Turma "${t.nome}" atualizada.` : `Turma "${t.nome}" criada.`); aoFechar(); }
  });

  return (
    <Gaveta titulo={turma ? turma.nome : 'Turma nova'} aoFechar={aoFechar} rodape={<>
      <button type="button" className="ad-btn ad-btn--grande" onClick={aoFechar}>Cancelar</button>
      <button type="button" className="ad-btn ad-btn--primario ad-btn--grande" onClick={() => void gravar()} disabled={envio.enviando}>Guardar</button>
    </>}>
      <Campo rotulo="Nome" erro={erro}>{(p) => <input {...p} value={nome} maxLength={80} onChange={(e) => { setNome(e.target.value); setErro(null); }} placeholder="Muay Thai — noite" />}</Campo>
      <fieldset className="ad-filtros"><legend className="ad-h3">Modalidades</legend>
        {d.modalidades.filter((m) => m.ativa).map((m) => (
          <label key={m.id} className="marcar campo__caixa"><input type="checkbox" checked={modalidadeIds.includes(m.id)} onChange={() => { setModalidadeIds(modalidadeIds.includes(m.id) ? modalidadeIds.filter((x) => x !== m.id) : [...modalidadeIds, m.id]); setErro(null); }} /><span>{m.nome}</span></label>
        ))}
      </fieldset>
      <div className="ad-par-campos">
        <Campo rotulo="Público">{(p) => <select {...p} value={publico} onChange={(e) => setPublico(e.target.value as PublicoDaTurma)}>{PUBLICOS.map((x) => <option key={x} value={x}>{NOME_DO_PUBLICO[x]}</option>)}</select>}</Campo>
        <Campo rotulo="Nível">{(p) => <select {...p} value={nivel} onChange={(e) => setNivel(e.target.value as NivelDaTurma)}>{NIVEIS.map((x) => <option key={x} value={x}>{NOME_DO_NIVEL_DA_TURMA[x]}</option>)}</select>}</Campo>
      </div>
      <div className="ad-par-campos">
        <Campo rotulo="Professor">{(p) => <select {...p} value={professorId} onChange={(e) => setProfessorId(e.target.value)}><option value="">Sem professor fixo</option>{professores.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}</select>}</Campo>
        <Campo rotulo="Lugares" ajuda="Vazio = sem limite (L15).">{(p) => <input {...p} value={capacidade} onChange={(e) => setCapacidade(e.target.value.replace(/\D/g, ''))} inputMode="numeric" />}</Campo>
      </div>
      <h3 className="ad-h3">Horários</h3>
      {horarios.map((h, i) => (
        <div key={h.id} className="ad-horario">
          <span className="campo__caixa"><select aria-label={`Dia do horário ${i + 1}`} value={h.dia} onChange={(e) => mudarHorario(i, { dia: e.target.value as DiaDaSemana })}>{DIAS_DA_SEMANA.map((x) => <option key={x} value={x}>{NOME_DO_DIA[x]}</option>)}</select></span>
          <span className="campo__caixa"><input aria-label={`Hora do horário ${i + 1}`} type="time" value={h.inicio} onChange={(e) => mudarHorario(i, { inicio: e.target.value })} /></span>
          <span className="campo__caixa"><input aria-label={`Duração em minutos do horário ${i + 1}`} inputMode="numeric" value={String(h.duracaoMinutos || '')} onChange={(e) => mudarHorario(i, { duracaoMinutos: Number(e.target.value.replace(/\D/g, '')) || 0 })} /><span className="sec">min</span></span>
          <button type="button" className="ad-btn ad-btn--icone ad-btn--plano" aria-label={`Tirar o horário ${i + 1}`} onClick={() => setHorarios(horarios.filter((_, j) => j !== i))}><Icone nome="i-fechar" /></button>
        </div>
      ))}
      <div className="ad-acoes"><button type="button" className="ad-btn" onClick={() => setHorarios([...horarios, { id: crypto.randomUUID(), dia: 'seg', inicio: '20:00', duracaoMinutos: horarios[0]?.duracaoMinutos ?? 60 }])}><Icone nome="i-mais" />Horário</button></div>
      <p className="ad-anotacao">A duração das aulas de turma ainda é [decidir] L1 (o exemplo usa 60 min). Horário tirado fica inativo no histórico; a mudança vale para as próximas aulas.</p>
      <label className="marcar campo__caixa"><input type="checkbox" checked={ativa} onChange={(e) => setAtiva(e.target.checked)} /><span>Turma ativa (aparece na grade e no check-in)</span></label>
    </Gaveta>
  );
}
