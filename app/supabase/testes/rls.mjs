/**
 * Testes das regras de acesso (RLS) e das funções, num Postgres descartável.
 * Cada caso entra como um papel de verdade (`set role` + o JWT em
 * `request.jwt.claims`, como o PostgREST do Supabase faz) e confere o que volta.
 *
 * Rodar (de app/supabase/testes):
 *   PGLITE_CAMINHO=<…/@electric-sql/pglite/dist/index.js> node rls.mjs
 *
 * Os nomes são fictícios. Nenhum valor ou dado de pessoa é impresso: só o nome
 * do caso e passou/falhou (e, se falhou, a palavra-código do erro).
 */
import { bancoNovo } from './banco.mjs';

const A = 'a0000000-0000-4000-8000-000000000001';
const MT = 'b0000000-0000-4000-8000-000000000001';
const BX = 'b0000000-0000-4000-8000-000000000002';
const TURMA_MT_NOITE = 'c0000000-0000-4000-8000-000000000002';
const TURMA_BX_NOITE = 'c0000000-0000-4000-8000-000000000005';
const TURMA_MT_KIDS = 'c0000000-0000-4000-8000-000000000008';

const U = {
  dono: '10000000-0000-4000-8000-000000000001',
  profMt: '10000000-0000-4000-8000-000000000002',
  profBx: '10000000-0000-4000-8000-000000000003',
  recepcao: '10000000-0000-4000-8000-000000000004',
  ana: '10000000-0000-4000-8000-000000000005',      // aluna de Muay Thai, com matrícula
  bruno: '10000000-0000-4000-8000-000000000006',    // aluno de Boxe, sem matrícula
  carla: '10000000-0000-4000-8000-000000000007',    // responsável pela Duda (Kids)
  novo: '10000000-0000-4000-8000-000000000008',     // pediu vínculo de aluno
  novoProf: '10000000-0000-4000-8000-000000000009', // pediu vínculo de instrutor
  donoB: '10000000-0000-4000-8000-000000000010',    // dono de OUTRA academia
  visitante: '10000000-0000-4000-8000-000000000011', // conta nova, sem vínculo
};
const B = 'a0000000-0000-4000-8000-000000000002';

process.on('uncaughtException', (e) => { console.error('erro no cenário:', String(e.message).slice(0, 300)); process.exit(2); });
const db = await bancoNovo();
const resultados = [];

async function como(quem) {
  await db.exec('reset role');
  if (quem === 'postgres') {
    await db.query("select set_config('request.jwt.claims', '', false)");
    return;
  }
  const papel = quem === 'anon' ? 'anon' : 'authenticated';
  const claims = quem === 'anon' ? { role: 'anon' } : { sub: U[quem], role: 'authenticated' };
  await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify(claims)]);
  await db.exec(`set role ${papel}`);
}
async function linhas(quem, sql, params = []) {
  await como(quem);
  try {
    return (await db.query(sql, params)).rows;
  } finally {
    await como('postgres');
  }
}
async function erro(quem, sql, params = []) {
  await como(quem);
  try {
    await db.query(sql, params);
    return null;
  } catch (e) {
    return String(e.message);
  } finally {
    await como('postgres');
  }
}
async function caso(nome, fn) {
  try {
    const ok = await fn();
    resultados.push({ nome, ok: ok === true, detalhe: ok === true ? '' : String(ok) });
  } catch (e) {
    resultados.push({ nome, ok: false, detalhe: `erro: ${String(e.message).slice(0, 120)}` });
  }
}
const espera = (cond, detalhe) => (cond ? true : detalhe);

// -----------------------------------------------------------------------------
// o cenário (como postgres, o dono do banco)
// -----------------------------------------------------------------------------
await como('postgres');
const nomes = { dono: 'Dono Exemplo', profMt: 'Prof Muay', profBx: 'Prof Boxe', recepcao: 'Recepção Exemplo', ana: 'Ana Exemplo',
  bruno: 'Bruno Exemplo', carla: 'Carla Exemplo', novo: 'Novo Aluno', novoProf: 'Novo Prof', donoB: 'Dono B', visitante: 'Visitante' };
for (const [k, id] of Object.entries(U)) {
  await db.query('insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)', [id, `${k}@exemplo.invalid`, { nome: nomes[k] }]);
}
await db.query(`insert into public.academias (id, nome, janela_minutos_antes, janela_minutos_depois, codigo_dos_alunos, codigo_da_equipe)
  values ($1, 'Academia B', 30, 30, 'BBBBBB', 'CCCCCC')`, [B]);
await db.query(`update public.academias set codigo_dos_alunos = 'RACA22', codigo_da_equipe = 'EQPXYZ' where id = $1`, [A]);
const vinc = [['dono', 'dono'], ['profMt', 'instrutor'], ['profBx', 'instrutor'], ['recepcao', 'recepcao'], ['ana', 'aluno'], ['bruno', 'aluno'], ['carla', 'aluno']];
for (const [k, papel] of vinc) {
  await db.query(`insert into public.vinculos (usuario_id, academia_id, papel, estado) values ($1, $2, $3, 'ativo')`, [U[k], A, papel]);
}
await db.query(`insert into public.vinculos (usuario_id, academia_id, papel, estado) values ($1, $2, 'dono', 'ativo')`, [U.donoB, B]);
await db.query(`insert into public.vinculos (usuario_id, academia_id, papel, estado) values ($1, $2, 'aluno', 'pendente'), ($3, $2, 'instrutor', 'pendente')`, [U.novo, A, U.novoProf]);
await db.query(`update public.turmas set professor_id = $1 where id in ($2, $3)`, [U.profMt, TURMA_MT_NOITE, TURMA_MT_KIDS]);
await db.query(`update public.turmas set professor_id = $1 where id = $2`, [U.profBx, TURMA_BX_NOITE]);

const pessoa = async (usuario) => (await db.query('select id from public.pessoas where usuario_id = $1', [usuario])).rows[0]?.id;
const P = { ana: await pessoa(U.ana), bruno: await pessoa(U.bruno), carla: await pessoa(U.carla) };
await db.query(`update public.pessoas set telefone = '51999990000' where id = $1`, [P.carla]);
await db.query(`insert into public.alunos_das_turmas (academia_id, turma_id, pessoa_id) values ($1, $2, $3), ($1, $4, $5)`, [A, TURMA_MT_NOITE, P.ana, TURMA_BX_NOITE, P.bruno]);

// o dinheiro da Ana (como o Admin grava)
const PLANO = '20000000-0000-4000-8000-000000000001';
await db.query(`insert into public.planos (id, academia_id, nome, modalidade_ids, periodicidade, valor_centavos) values ($1, $2, 'Muay Thai 2x', array[$3]::uuid[], 'mensal', 15000)`, [PLANO, A, MT]);
await db.query(`insert into public.matriculas (academia_id, pessoa_id, pagador_pessoa_id, plano_id, inicio, estado, dia_de_vencimento) values ($1, $2, $2, $3, current_date - 40, 'ativa', 10)`, [A, P.ana, PLANO]);
const COBRANCA = '30000000-0000-4000-8000-000000000001';
await db.query(`insert into public.cobrancas (id, academia_id, pessoa_id, tipo, competencia, vencimento, descricao, valor_bruto_centavos, desconto_centavos, valor_centavos, estado)
  values ($1, $2, $3, 'mensalidade', to_char(current_date, 'YYYY-MM'), current_date, 'Muay Thai 2x', 15000, 0, 15000, 'aberta')`, [COBRANCA, A, P.ana]);
await db.query(`insert into public.categorias (academia_id, nome, tipo) values ($1, 'Mensalidades', 'entrada'), ($1, 'Aluguel', 'saida')`, [A]);
await db.query(`insert into public.funcionarios (academia_id, pessoa_id, funcao, remuneracao, desde) values ($1, $2, 'professor', '{"tipo":"fixo","fixoCentavos":200000}', current_date)`, [A, P.carla]);
await db.query(`insert into public.notas (academia_id, texto, valor_centavos, criada_por) values ($1, 'nota do dono', 1000, $2)`, [A, U.dono]);
await db.query(`insert into public.regras_de_cobranca (academia_id, primeiro_mes, dias_para_retorno_da_experimental, dias_para_apagar_interessado, whatsapp_da_academia) values ($1, 'cheio', 3, 180, '5551981962077')`, [A]);
await db.query(`insert into public.pessoas (academia_id, nome) values ($1, 'Pessoa de B')`, [B]);

// as aulas de AGORA (hoje, na hora certa) para testar a janela do check-in
const agora = (await db.query(`select to_char(now() at time zone 'America/Sao_Paulo', 'HH24:MI') hora,
  (array['dom','seg','ter','qua','qui','sex','sab'])[extract(dow from now() at time zone 'America/Sao_Paulo')::int + 1] dia,
  (array['dom','seg','ter','qua','qui','sex','sab'])[extract(dow from (now() at time zone 'America/Sao_Paulo') + interval '1 day')::int + 1] amanha,
  (now() at time zone 'America/Sao_Paulo')::date hoje,
  ((now() at time zone 'America/Sao_Paulo') + interval '1 day')::date dia_seguinte,
  (array['dom','seg','ter','qua','qui','sex','sab'])[extract(dow from (now() at time zone 'America/Sao_Paulo') - interval '10 days')::int + 1] ha10,
  ((now() at time zone 'America/Sao_Paulo') - interval '10 days')::date data_ha10`)).rows[0];
const H = { mtAgora: '40000000-0000-4000-8000-000000000001', bxAgora: '40000000-0000-4000-8000-000000000002', mtAmanha: '40000000-0000-4000-8000-000000000003', mtHa10: '40000000-0000-4000-8000-000000000004' };
await db.query(`insert into public.horarios (id, academia_id, turma_id, dia, inicio, duracao_minutos) values
  ($1, $5, $6, $8, $9, 60), ($2, $5, $7, $8, $9, 60), ($3, $5, $6, $10, $9, 60), ($4, $5, $6, $11, $9, 60)`,
  [H.mtAgora, H.bxAgora, H.mtAmanha, H.mtHa10, A, TURMA_MT_NOITE, TURMA_BX_NOITE, agora.dia, agora.hora, agora.amanha, agora.ha10]);
const hoje = agora.hoje instanceof Date ? agora.hoje.toISOString().slice(0, 10) : String(agora.hoje);
const amanha = agora.dia_seguinte instanceof Date ? agora.dia_seguinte.toISOString().slice(0, 10) : String(agora.dia_seguinte);
const ha10 = agora.data_ha10 instanceof Date ? agora.data_ha10.toISOString().slice(0, 10) : String(agora.data_ha10);
const inicio = (await db.query('select public.inicio_da_aula($1, $2::date) i', [H.mtAgora, hoje])).rows[0].i;
const instante = (minutos) => new Date(new Date(inicio).getTime() + minutos * 60_000).toISOString();

const checkin = (pessoaId, horario, modalidade, extra = {}) =>
  JSON.stringify([{ id: crypto.randomUUID(), horario_id: horario, data: hoje, pessoa_id: pessoaId, modalidade_id: modalidade, origem: 'checkin',
    estado: 'pendente', registrada_em: instante(1), atualizada_em: instante(1), ...extra }]);

// =============================================================================
// O CATÁLOGO: toda tabela com RLS ligada e com política (menos a só do servidor)
// =============================================================================
await caso('catálogo: TODA tabela de public tem RLS ligada e pelo menos uma política', async () => {
  const r = await linhas('postgres', `select c.relname t, c.relrowsecurity rls, (select count(*)::int from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) n
    from pg_class c join pg_namespace s on s.oid = c.relnamespace where s.nspname = 'public' and c.relkind = 'r' order by 1`);
  const semRls = r.filter((x) => !x.rls).map((x) => x.t);
  const semPolitica = r.filter((x) => x.n === 0 && x.t !== 'avisos_enviados').map((x) => x.t);
  return espera(r.length >= 45 && semRls.length === 0 && semPolitica.length === 0, `${r.length} tabelas; sem RLS: ${semRls}; sem política: ${semPolitica}`);
});
await caso('catálogo: avisos_enviados (só o servidor) não abre para ninguém pela API', async () => {
  const r = await linhas('dono', 'select count(*)::int n from public.avisos_enviados');
  return espera(r[0].n === 0, r[0].n);
});

// =============================================================================
// VITRINE (sem conta)
// =============================================================================
await caso('vitrine: lê a grade real (11 turmas, 22 horários) e as 5 modalidades', async () => {
  const t = await linhas('anon', 'select count(*)::int n from public.turmas where academia_id = $1', [A]);
  const h = await linhas('anon', `select count(*)::int n from public.horarios where academia_id = $1 and id::text like 'd%'`, [A]);
  const m = await linhas('anon', 'select count(*)::int n from public.modalidades');
  return espera(t[0].n === 11 && h[0].n === 22 && m[0].n === 5, `${t[0].n}/${h[0].n}/${m[0].n}`);
});
await caso('vitrine: não lê pessoa, presença, graduação nem dinheiro', async () => {
  const tabelas = ['pessoas', 'presencas', 'graduacoes', 'planos', 'matriculas', 'cobrancas', 'lancamentos', 'interessados', 'vinculos'];
  for (const t of tabelas) {
    const e = await erro('anon', `select count(*) from public.${t}`);
    if (e === null) {
      const r = await linhas('anon', `select count(*)::int n from public.${t}`);
      if (r[0].n !== 0) return `${t} devolveu linhas`;
    }
  }
  return true;
});
await caso('vitrine: não lê o código de entrada da academia', async () => {
  const e = await erro('anon', 'select codigo_dos_alunos from public.academias');
  return espera(e && e.includes('permission denied'), e);
});
await caso('vitrine: não escreve em nada', async () => {
  const e = await erro('anon', `insert into public.perguntas_frequentes (academia_id, pergunta, resposta) values ('${A}', 'x', 'y')`);
  return espera(e && e.includes('permission denied'), e);
});

// =============================================================================
// ALUNO
// =============================================================================
await caso('aluno: minhas_fichas devolve só a dele, com a modalidade da matrícula e sem valor', async () => {
  const r = await linhas('ana', 'select * from public.minhas_fichas()');
  return espera(r.length === 1 && r[0].pessoa_id === P.ana && r[0].modalidade_ids.length === 1 && r[0].modalidade_ids[0] === MT
    && !Object.keys(r[0]).some((k) => k.includes('valor')), JSON.stringify(r.map((x) => x.pessoa_id)));
});
await caso('aluno: não lê pessoas, plano, matrícula, cobrança, lançamento nem histórico', async () => {
  for (const t of ['pessoas', 'planos', 'matriculas', 'cobrancas', 'lancamentos', 'historico', 'funcionarios', 'notas']) {
    const r = await linhas('ana', `select count(*)::int n from public.${t}`);
    if (r[0].n !== 0) return `${t}: ${r[0].n}`;
  }
  return true;
});
await caso('aluno: faz check-in na aula de agora (dentro da janela)', async () => {
  const r = await linhas('ana', 'select public.registrar_presencas($1::jsonb) n', [checkin(P.ana, H.mtAgora, MT)]);
  return espera(r[0].n === 1, r[0].n);
});
await caso('aluno: não faz check-in por outro aluno', async () => {
  const e = await erro('ana', 'select public.registrar_presencas($1::jsonb)', [checkin(P.bruno, H.bxAgora, BX)]);
  return espera(e && e.includes('sem_permissao'), e);
});
await caso('aluno: check-in fora da janela é recusado', async () => {
  const e = await erro('bruno', 'select public.registrar_presencas($1::jsonb)', [checkin(P.bruno, H.bxAgora, BX, { registrada_em: instante(-120), atualizada_em: instante(-120) })]);
  return espera(e && e.includes('fora_da_janela'), e);
});
await caso('aluno: check-in numa modalidade que a matrícula não libera é recusado (R14.6)', async () => {
  const e = await erro('ana', 'select public.registrar_presencas($1::jsonb)', [checkin(P.ana, H.bxAgora, BX)]);
  return espera(e && e.includes('sem_a_modalidade'), e);
});
await caso('aluno sem matrícula no Admin: passa só com o vínculo (o provisório do R14.6)', async () => {
  const r = await linhas('bruno', 'select public.registrar_presencas($1::jsonb) n', [checkin(P.bruno, H.bxAgora, BX)]);
  return espera(r[0].n === 1, r[0].n);
});
await caso('aluno: não vê a presença do colega (R15.13)', async () => {
  const r = await linhas('bruno', 'select count(*)::int n from public.presencas where pessoa_id = $1', [P.ana]);
  const meu = await linhas('bruno', 'select count(*)::int n from public.presencas');
  return espera(r[0].n === 0 && meu[0].n === 1, `${r[0].n}/${meu[0].n}`);
});
await caso('aluno: não escreve presença direto na tabela (só pela função)', async () => {
  const e = await erro('ana', `update public.presencas set estado = 'confirmada'`);
  const r = await linhas('postgres', `select count(*)::int n from public.presencas where estado = 'confirmada'`);
  return espera(r[0].n === 0, e); // sem política de update: o pedido não muda linha nenhuma
});
await caso('aluno: não vê o motivo de saída do vínculo (R12.11)', async () => {
  const e = await erro('ana', 'select motivo_de_saida from public.vinculos');
  return espera(e && e.includes('permission denied'), e);
});

// =============================================================================
// PROFESSOR
// =============================================================================
await caso('professor: vê as fichas das modalidades dele, não as de outra', async () => {
  const r = await linhas('profMt', 'select pessoa_id from public.fichas_da_academia($1)', [A]);
  const ids = r.map((x) => x.pessoa_id);
  return espera(ids.includes(P.ana) && !ids.includes(P.bruno), `${ids.length} fichas`);
});
await caso('professor: lê a presença das aulas dele; o de outra modalidade não', async () => {
  const mt = await linhas('profMt', 'select count(*)::int n from public.presencas where pessoa_id = $1', [P.ana]);
  const bx = await linhas('profBx', 'select count(*)::int n from public.presencas where pessoa_id = $1', [P.ana]);
  return espera(mt[0].n === 1 && bx[0].n === 0, `${mt[0].n}/${bx[0].n}`);
});
await caso('professor confirma; o "desfazer" do aluno depois NÃO vence a equipe (R15.9)', async () => {
  const id = (await linhas('postgres', 'select id from public.presencas where pessoa_id = $1', [P.ana]))[0].id;
  await linhas('profMt', 'select public.registrar_presencas($1::jsonb)', [JSON.stringify([{ id, horario_id: H.mtAgora, data: hoje, pessoa_id: P.ana, modalidade_id: MT, origem: 'chamada', estado: 'confirmada', registrada_em: instante(2), atualizada_em: instante(2) }])]);
  await linhas('ana', 'select public.registrar_presencas($1::jsonb)', [checkin(P.ana, H.mtAgora, MT, { estado: 'retirada', motivo_da_retirada: 'desfeito_pelo_aluno', registrada_em: instante(3), atualizada_em: instante(3) })]);
  const r = await linhas('postgres', 'select estado, pela_equipe from public.presencas where pessoa_id = $1', [P.ana]);
  return espera(r[0].estado === 'confirmada' && r[0].pela_equipe === true, JSON.stringify(r[0]));
});
await caso('professor: presença de 10 dias atrás é recusada (R15.8)', async () => {
  const e = await erro('profMt', 'select public.registrar_presencas($1::jsonb)', [JSON.stringify([{ horario_id: H.mtHa10, data: ha10, pessoa_id: P.ana, modalidade_id: MT, origem: 'correcao', estado: 'confirmada', registrada_em: new Date().toISOString() }])]);
  return espera(e && e.includes('fora_do_prazo'), e);
});
await caso('professor: NENHUM valor em reais (11 tabelas do dinheiro e pessoas vazias)', async () => {
  for (const t of ['planos', 'matriculas', 'cobrancas', 'lancamentos', 'funcionarios', 'despesas_fixas', 'fechamentos', 'regras_de_cobranca', 'notas', 'lembretes', 'importacoes', 'pessoas']) {
    const r = await linhas('profMt', `select count(*)::int n from public.${t}`);
    if (r[0].n !== 0) return `${t}: ${r[0].n}`;
  }
  return true;
});
await caso('professor: não marca mensalidade como paga', async () => {
  const e = await erro('profMt', `select public.marcar_como_paga($1, current_date, 'pix')`, [COBRANCA]);
  return espera(e && e.includes('sem_permissao'), e);
});
const SISTEMA = '50000000-0000-4000-8000-000000000001';
await db.query(`insert into public.sistemas_de_graduacao (id, academia_id, modalidade_id, modalidade_chave, publico, nome, palavra_do_nivel, contagem_da_idade, origem, niveis)
  values ($1, $2, $3, 'muay_thai', 'adulto', 'Kruang', 'Kruang', 'aniversario', 'academia', '[{"id":"branco","nome":"branco","cores":["#fff"],"grausMaximos":0},{"id":"amarelo","nome":"amarelo","cores":["#ff0"],"grausMaximos":0}]')`, [SISTEMA, A, MT]);
const GRAD = '60000000-0000-4000-8000-000000000001';
await caso('professor da modalidade registra a graduação; o de outra modalidade não', async () => {
  const ok = await erro('profMt', `insert into public.graduacoes (id, academia_id, pessoa_id, modalidade_id, sistema_id, nivel_id, data, origem, registrada_por)
    values ($1, $2, $3, $4, $5, 'amarelo', current_date, 'promocao', $6)`, [GRAD, A, P.ana, MT, SISTEMA, U.profMt]);
  const nao = await erro('profBx', `insert into public.graduacoes (academia_id, pessoa_id, modalidade_id, sistema_id, nivel_id, data, origem, registrada_por)
    values ($1, $2, $3, $4, 'amarelo', current_date, 'promocao', $5)`, [A, P.ana, MT, SISTEMA, U.profBx]);
  return espera(ok === null && nao && nao.includes('row-level security'), `${ok} | ${nao}`);
});
await caso('graduação não muda: só se anula com motivo, e a anulada some para o aluno (R16.13)', async () => {
  const muda = await erro('profMt', `update public.graduacoes set nivel_id = 'branco' where id = $1`, [GRAD]);
  const anula = await erro('profMt', `update public.graduacoes set anulada_em = now(), anulada_por = $2, motivo_da_anulacao = 'registro errado' where id = $1`, [GRAD, U.profMt]);
  const aluno = await linhas('ana', 'select count(*)::int n from public.graduacoes');
  const equipe = await linhas('profMt', 'select count(*)::int n from public.graduacoes');
  const apaga = await erro('profMt', 'delete from public.graduacoes');
  return espera(muda && muda.includes('graduacao_so_anula') && anula === null && aluno[0].n === 0 && equipe[0].n === 1 && apaga && apaga.includes('permission denied'),
    `${muda} | ${anula} | ${aluno[0].n} | ${equipe[0].n} | ${apaga}`);
});
await db.query(`insert into public.interessados (id, academia_id, nome, whatsapp, modalidade_ids) values ('70000000-0000-4000-8000-000000000001', $1, 'Edu Interessado', '51988887777', array[$2]::uuid[])`, [A, MT]);
await db.query(`insert into public.aulas_experimentais (academia_id, interessado_id, data, horario_id, turma_id, modalidade_id, estado, marcada_por) values ($1, '70000000-0000-4000-8000-000000000001', $2, $3, $4, $5, 'agendada', $6)`, [A, hoje, H.mtAgora, TURMA_MT_NOITE, MT, U.recepcao]);
await caso('professor: vê o experimental na chamada só pelo primeiro nome, nunca o WhatsApp (R19.5)', async () => {
  const tabela = await linhas('profMt', 'select count(*)::int n from public.interessados');
  const chamada = await linhas('profMt', 'select * from public.experimentais_da_aula($1, $2::date)', [H.mtAgora, hoje]);
  return espera(tabela[0].n === 0 && chamada.length === 1 && chamada[0].primeiro_nome === 'Edu' && !('whatsapp' in chamada[0]), `${tabela[0].n}/${chamada.length}`);
});
await caso('professor cancela a aula de amanhã dele; o de outra modalidade não', async () => {
  const outro = await erro('profBx', 'select public.cancelar_aula($1, $2::date, $3)', [H.mtAmanha, amanha, 'feriado']);
  const dele = await erro('profMt', 'select public.cancelar_aula($1, $2::date, $3)', [H.mtAmanha, amanha, 'feriado']);
  const aluno = await linhas('ana', `select count(*)::int n from public.ajustes_de_aula where tipo = 'cancelada'`);
  return espera(outro && outro.includes('sem_permissao') && dele === null && aluno[0].n === 1, `${outro} | ${dele} | ${aluno[0].n}`);
});

// =============================================================================
// RECEPÇÃO
// =============================================================================
await caso('recepção: lê o funil (com WhatsApp) e nenhum dinheiro', async () => {
  const i = await linhas('recepcao', 'select whatsapp from public.interessados');
  const l = await linhas('recepcao', 'select count(*)::int n from public.lancamentos');
  const c = await linhas('recepcao', 'select count(*)::int n from public.cobrancas');
  const e = await erro('recepcao', `select public.marcar_como_paga($1, current_date, 'pix')`, [COBRANCA]);
  return espera(i.length === 1 && i[0].whatsapp && l[0].n === 0 && c[0].n === 0 && e && e.includes('sem_permissao'), `${i.length}/${l[0].n}/${c[0].n}`);
});
await caso('recepção: confirma vínculo de aluno, não o de professor (R12.9)', async () => {
  const ids = await linhas('postgres', `select id, papel from public.vinculos where estado = 'pendente'`);
  const aluno = ids.find((v) => v.papel === 'aluno').id;
  const prof = ids.find((v) => v.papel === 'instrutor').id;
  const ok = await erro('recepcao', 'select public.confirmar_vinculos(array[$1]::uuid[])', [aluno]);
  const nao = await erro('recepcao', 'select public.confirmar_vinculos(array[$1]::uuid[])', [prof]);
  const pessoaNova = await linhas('postgres', 'select count(*)::int n from public.pessoas where usuario_id = $1', [U.novo]);
  return espera(ok === null && nao && nao.includes('sem_permissao') && pessoaNova[0].n === 1, `${ok} | ${nao} | pessoa ${pessoaNova[0].n}`);
});

// =============================================================================
// KIDS E SAÚDE
// =============================================================================
let DUDA;
await caso('responsável cadastra o dependente; a saúde fica escondida da equipe até ele ligar (R20.5)', async () => {
  DUDA = (await linhas('carla', 'select public.salvar_dependente($1::jsonb) id', [JSON.stringify({ academia_id: A, nome: 'Duda Exemplo Kids', data_nascimento: '2018-05-01', saude: 'asma', saude_visivel_para_equipe: false })]))[0].id;
  const antes = await linhas('profMt', 'select count(*)::int n from public.dependentes');
  await linhas('carla', 'select public.salvar_dependente($1::jsonb)', [JSON.stringify({ academia_id: A, pessoa_id: DUDA, saude: 'asma', saude_visivel_para_equipe: true })]);
  const depois = await linhas('profMt', 'select count(*)::int n from public.dependentes');
  const fichas = await linhas('carla', 'select pessoa_id from public.minhas_fichas()');
  return espera(antes[0].n === 0 && depois[0].n === 1 && fichas.length === 2, `${antes[0].n}/${depois[0].n}/${fichas.length}`);
});
await caso('o telefone do responsável: a recepção vê, o professor não (R20.7)', async () => {
  const r = await linhas('recepcao', 'select telefone from public.contato_do_responsavel($1)', [DUDA]);
  const p = await linhas('profMt', 'select telefone from public.contato_do_responsavel($1)', [DUDA]);
  return espera(r.length === 1 && r[0].telefone && p.length === 0, `${r.length}/${p.length}`);
});
await caso('o histórico não guarda dado de saúde (dependentes fica fora)', async () => {
  const r = await linhas('postgres', `select count(*)::int n from public.historico where tabela in ('dependentes', 'perfis_de_alunos', 'medicoes_corporais')`);
  return espera(r[0].n === 0, r[0].n);
});

// =============================================================================
// DONO E HISTÓRICO
// =============================================================================
await caso('dono: lê pessoas, dinheiro e histórico da academia dele', async () => {
  const p = await linhas('dono', 'select count(*)::int n from public.pessoas');
  const c = await linhas('dono', 'select count(*)::int n from public.cobrancas');
  const h = await linhas('dono', 'select count(*)::int n from public.historico');
  return espera(p[0].n >= 5 && c[0].n === 1 && h[0].n > 0, `${p[0].n}/${c[0].n}/${h[0].n}`);
});
await caso('dono: marcar como paga cria o lançamento na mesma transação', async () => {
  const r = await linhas('dono', `select public.marcar_como_paga($1, current_date, 'pix') id`, [COBRANCA]);
  const l = await linhas('dono', 'select count(*)::int n from public.lancamentos where cobranca_id = $1', [COBRANCA]);
  return espera(r[0].id && l[0].n === 1, l[0].n);
});
await caso('dono: mês fechado trava o lançamento (RA4.10)', async () => {
  await linhas('dono', `select public.fechar_mes($1, to_char(current_date, 'YYYY-MM'))`, [A]);
  const e = await erro('dono', `insert into public.lancamentos (academia_id, data, descricao, tipo, valor_centavos, situacao, origem) values ($1, current_date, 'x', 'saida', 100, 'pago', 'manual')`, [A]);
  return espera(e && e.includes('mes_fechado'), e);
});
await caso('dono: não lê nada da outra academia', async () => {
  const r = await linhas('dono', 'select count(*)::int n from public.pessoas where academia_id = $1', [B]);
  const s = await linhas('donoB', 'select count(*)::int n from public.pessoas where academia_id = $1', [A]);
  return espera(r[0].n === 0 && s[0].n === 0, `${r[0].n}/${s[0].n}`);
});
await caso('nada se apaga: o dono não apaga lançamento, pessoa nem cobrança', async () => {
  for (const t of ['lancamentos', 'pessoas', 'cobrancas', 'presencas', 'turmas']) {
    const e = await erro('dono', `delete from public.${t}`);
    if (!(e && e.includes('permission denied'))) return `${t}: ${e}`;
  }
  return true;
});
await caso('histórico: ninguém escreve, muda nem apaga (nem o dono, nem o dono do banco)', async () => {
  const ins = await erro('dono', `insert into public.historico (academia_id, tabela, registro_id, acao) values ($1, 'x', $1, 'criou')`, [A]);
  const upd = await erro('dono', `update public.historico set motivo = 'x'`);
  const del = await erro('dono', 'delete from public.historico');
  const pg = await erro('postgres', `update public.historico set motivo = 'x'`);
  const pgDel = await erro('postgres', 'delete from public.historico');
  const ok = [ins, upd, del].every((e) => e && e.includes('permission denied')) && pg && pg.includes('historico_imutavel') && pgDel && pgDel.includes('historico_imutavel');
  return espera(ok, [ins, upd, del, pg, pgDel].map((e) => (e || 'passou').slice(0, 40)).join(' | '));
});
await caso('histórico: professor, recepção e aluno não leem', async () => {
  for (const q of ['profMt', 'recepcao', 'ana']) {
    const r = await linhas(q, 'select count(*)::int n from public.historico');
    if (r[0].n !== 0) return `${q}: ${r[0].n}`;
  }
  return true;
});
await caso('o histórico não guarda o motivo de saída por pessoa (R12.12)', async () => {
  const v = (await linhas('postgres', `select id from public.vinculos where usuario_id = $1`, [U.bruno]))[0].id;
  await linhas('recepcao', 'select public.encerrar_vinculo($1, $2)', [v, 'mudou_de_academia']);
  const h = await linhas('dono', `select mudancas::text m from public.historico where tabela = 'vinculos' and registro_id = $1`, [v]);
  const soma = await linhas('dono', `select * from public.motivos_de_saida($1, current_date - 1, current_date + 1)`, [A]);
  return espera(h.length >= 1 && h.every((x) => !x.m.includes('mudou_de_academia')) && soma.length === 1 && Number(soma[0].quantidade) === 1, `${h.length}/${soma.length}`);
});
await caso('perfil profissional: não se cria perfil apontando para outra academia (achado S3)', async () => {
  const v = (await linhas('postgres', `select id from public.vinculos where usuario_id = $1`, [U.profMt]))[0].id;
  const e = await erro('profMt', `insert into public.perfis_profissionais (vinculo_id, usuario_id, academia_id, nome_exibicao) values ($1, $2, $3, 'Prof')`, [v, U.profMt, B]);
  const ok = await erro('profMt', `insert into public.perfis_profissionais (vinculo_id, usuario_id, academia_id, nome_exibicao) values ($1, $2, $3, 'Prof')`, [v, U.profMt, A]);
  return espera(e !== null && ok === null, `${e} | ${ok}`);
});

// =============================================================================
// O CAMINHO INTEIRO: pedir vínculo, matricular do funil, pagar em lote, a grade
// =============================================================================
await caso('conta nova pede vínculo de aluno: nasce pendente, e pedir de novo não duplica', async () => {
  const a = await linhas('visitante', 'select public.pedir_vinculo($1, $2) id', [A, 'aluno']);
  const b = await linhas('visitante', 'select public.pedir_vinculo($1, $2) id', [A, 'aluno']);
  const dono = await erro('visitante', 'select public.pedir_vinculo($1, $2)', [A, 'dono']);
  const v = await linhas('visitante', 'select estado from public.vinculos');
  return espera(a[0].id === b[0].id && v.length === 1 && v[0].estado === 'pendente' && dono && dono.includes('papel_invalido'), `${v.length} ${dono}`);
});
await caso('matricular do funil: uma transação cria pessoa, matrícula e cobrança; a recepção não pode', async () => {
  const INT = '70000000-0000-4000-8000-000000000001';
  const args = [A, INT, JSON.stringify({ nome: 'Edu Interessado', telefone: '51988887777' }),
    JSON.stringify({ plano_id: PLANO, inicio: hoje, estado: 'ativa', dia_de_vencimento: 10 }), JSON.stringify([])];
  const nao = await erro('recepcao', 'select public.matricular_interessado($1, $2, $3::jsonb, $4::jsonb, $5::jsonb)', args);
  const r = await linhas('dono', 'select public.matricular_interessado($1, $2, $3::jsonb, $4::jsonb, $5::jsonb) id', args);
  const cob = JSON.stringify([{ id: crypto.randomUUID(), academia_id: A, pessoa_id: r[0].id, tipo: 'matricula', competencia: hoje.slice(0, 7), vencimento: hoje,
    descricao: 'Taxa de matrícula', valor_bruto_centavos: 5000, desconto_centavos: 0, valor_centavos: 5000, estado: 'aberta', reparticao: [], criada_em: new Date().toISOString() }]);
  const n = await linhas('dono', 'select public.inserir_cobrancas($1, $2::jsonb) n', [A, cob]);
  const i = await linhas('dono', 'select matriculado_em, pessoa_id from public.interessados where id = $1', [INT]);
  const m = await linhas('dono', 'select count(*)::int n from public.matriculas where pessoa_id = $1', [r[0].id]);
  return espera(nao && nao.includes('sem_permissao') && i[0].pessoa_id === r[0].id && i[0].matriculado_em && m[0].n === 1 && n[0].n === 1, `${nao} | ${m[0].n} | ${n[0].n}`);
});
await caso('marcar as N como pagas (família): tudo junto, e repetir recusa sem pagar duas vezes', async () => {
  const ids = (await linhas('dono', `select id from public.cobrancas where estado = 'aberta'`)).map((x) => x.id);
  const prox = (await linhas('postgres', `select (date_trunc('month', current_date) + interval '1 month')::date d`))[0].d;
  const dia = prox instanceof Date ? prox.toISOString().slice(0, 10) : String(prox);
  const r = await linhas('dono', `select public.marcar_como_pagas($1::uuid[], $2::date, 'dinheiro') n`, [ids, dia]);
  const de_novo = await erro('dono', `select public.marcar_como_pagas($1::uuid[], $2::date, 'dinheiro')`, [ids, dia]);
  const l = await linhas('dono', `select count(*)::int n from public.lancamentos where data = $1::date`, [dia]);
  return espera(r[0].n === ids.length && de_novo && de_novo.includes('ja_paga') && l[0].n === ids.length, `${ids.length} | ${de_novo} | ${l[0].n}`);
});
await caso('a grade do dono grava linha num mês aberto; o professor não', async () => {
  const prox = (await linhas('postgres', `select (date_trunc('month', current_date) + interval '1 month' + interval '4 days')::date d`))[0].d;
  const dia = prox instanceof Date ? prox.toISOString().slice(0, 10) : String(prox);
  const linha = JSON.stringify([{ id: crypto.randomUUID(), academia_id: A, data: dia, descricao: 'Luvas novas', tipo: 'saida', valor_centavos: 32000, situacao: 'pago', origem: 'manual' }]);
  const r = await linhas('dono', 'select public.gravar_lancamentos($1, $2::jsonb) n', [A, linha]);
  const nao = await erro('profMt', 'select public.gravar_lancamentos($1, $2::jsonb)', [A, linha]);
  return espera(r[0].n === 1 && nao && nao.includes('sem_permissao'), `${r[0].n} | ${nao}`);
});

// -----------------------------------------------------------------------------
const falhas = resultados.filter((r) => !r.ok);
for (const r of resultados) console.log(`${r.ok ? 'ok   ' : 'FALHA'} ${r.nome}${r.ok ? '' : `  → ${r.detalhe}`}`);
console.log(`\n${resultados.length - falhas.length} de ${resultados.length} casos passaram.`);
process.exit(falhas.length ? 1 : 0);
