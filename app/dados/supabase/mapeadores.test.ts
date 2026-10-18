/**
 * Revisão AN, pedidos do AU (docs/revisao/AU-INTEGRACAO.md, seção 4, "App"):
 * a tradução na BORDA com o servidor, sem mudar os ids de texto do domínio
 * (o texto vira a `chave`; o banco usa os uuid fixos do seed.sql).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classificarErroDeEnvio, type ItemDaFila } from '../../dominio/sincronizacao.ts';
import { aulasDoDia } from '../../dominio/turmas/turmas.ts';
import { gradeDaRacaFight } from '../../dominio/turmas/grade-raca-fight.ts';
import { fazerCheckin, JANELA_PROPOSTA_L7 } from '../../dominio/presenca/presenca.ts';
import { msNoFuso } from '../../dominio/turmas/horario.ts';
import { redigir, REDIGIDO } from '../redigir.ts';
import { CODIGOS_DE_REGRA_DO_SERVIDOR, chaveDoServidor, ehErroDeRegraDoServidor, idNoServidor, presencaParaOServidor } from './mapeadores.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/;

test('AU-1: a academia, as modalidades, as turmas e os horários viram os uuid fixos do seed', () => {
  assert.equal(idNoServidor('academia', 'raca-fight'), 'a0000000-0000-4000-8000-000000000001');
  assert.equal(idNoServidor('modalidade', 'muay-thai'), 'b0000000-0000-4000-8000-000000000001');
  assert.equal(idNoServidor('modalidade', 'mma'), 'b0000000-0000-4000-8000-000000000005');
  assert.equal(idNoServidor('turma', 'muay-thai-noite-1'), 'c0000000-0000-4000-8000-000000000002');
  assert.equal(idNoServidor('turma', 'treino-de-competicao'), 'c0000000-0000-4000-8000-000000000011');
  // turma 02, 1º horário (seg 20h) → …0201
  assert.equal(idNoServidor('horario', 'muay-thai-noite-1-seg-20'), 'd0000000-0000-4000-8000-000000000201');
  assert.equal(idNoServidor('horario', 'muay-thai-noite-1-qui-20'), 'd0000000-0000-4000-8000-000000000204');
  for (const t of gradeDaRacaFight({ academiaId: 'raca-fight', professores: { muayThai: null, boxe: null, jiuJitsu: null, mma: null, muayThaiKids: null, jiuJitsuKids: null }, duracaoDaAulaMinutos: 60 })) {
    assert.match(idNoServidor('turma', t.id), UUID);
    for (const h of t.horarios) {
      const u = idNoServidor('horario', h.id);
      assert.match(u, UUID, h.id);
      assert.equal(chaveDoServidor('horario', u), h.id, 'volta para a chave');
    }
  }
});

test('AU-1: o que já é uuid (dado real) passa igual', () => {
  const u = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
  assert.equal(idNoServidor('turma', u), u);
  assert.equal(chaveDoServidor('turma', u), u);
});

test('AU-2/3/4: a presença vai no formato do registrar_presencas, SEM o id "aula|aluno", com pessoa_id e horario_id + data', () => {
  const FUSO = 'America/Sao_Paulo';
  const grade = gradeDaRacaFight({ academiaId: 'raca-fight', professores: { muayThai: 'diego', boxe: null, jiuJitsu: null, mma: null, muayThaiKids: null, jiuJitsuKids: null }, duracaoDaAulaMinutos: 60 });
  const aula = aulasDoDia(grade, '2026-10-15', FUSO).find((a) => a.turmaId === 'muay-thai-noite-1')!;
  const p = fazerCheckin({ aula, alunoId: '7e57d004-2b97-4e7a-b45f-5387367791cd', modalidadeId: 'muay-thai', porId: 'u', agoraMs: msNoFuso('2026-10-15', '19:45', FUSO), em: '2026-10-15T19:45:00-03:00', janela: JANELA_PROPOSTA_L7 });
  const s = presencaParaOServidor(p);
  assert.equal('id' in s, false, 'o id aula|aluno não é uuid: o servidor junta pelo par');
  assert.equal(s.horario_id, 'd0000000-0000-4000-8000-000000000204');
  assert.equal(s.data, '2026-10-15');
  assert.equal(s.pessoa_id, '7e57d004-2b97-4e7a-b45f-5387367791cd');
  assert.equal(s.modalidade_id, 'b0000000-0000-4000-8000-000000000001');
  assert.equal(s.origem, 'checkin');
  assert.equal(s.estado, 'pendente');
  // o que o servidor calcula não vai (turma, aula, pela_equipe, quem fez)
  for (const c of ['turma_id', 'aula_id', 'pela_equipe', 'registrada_por', 'atualizada_por', 'alunoId', 'aulaId']) assert.equal(c in s, false, c);
});

test('AU-4: erro de regra do servidor não volta para a fila; erro de rede volta', () => {
  const item = { usuarioId: 'u' } as ItemDaFila;
  const sessao = { usuarioId: 'u', valida: true };
  for (const codigo of CODIGOS_DE_REGRA_DO_SERVIDOR) {
    assert.ok(ehErroDeRegraDoServidor({ status: 400, codigo: 'P0001', mensagem: codigo }));
    assert.equal(classificarErroDeEnvio({ status: 400, codigo: 'P0001', mensagem: codigo }, item, sessao), 'regra');
  }
  assert.equal(ehErroDeRegraDoServidor({ status: 0 }), false);
  assert.equal(classificarErroDeEnvio({ status: 0 }, item, sessao), 'rede');
});

test('AU-5: o repositório do Supabase nunca usa select("*")', () => {
  const aqui = dirname(fileURLToPath(import.meta.url));
  const fonte = readFileSync(resolve(aqui, 'RepositorioSupabase.ts'), 'utf8');
  assert.equal(/select\(\s*(['"`])\*\1\s*\)|select\(\s*\)/.test(fonte), false);
});

test('AU-9: o registro redige motivoDaAnulacao, crianca, codigoDeIndicacao e token (e a forma snake_case)', () => {
  const s = redigir({ motivoDaAnulacao: 'x', crianca: { nome: 'Teo', idade: 7 }, codigoDeIndicacao: 'ABC123', token: 'ExponentPushToken[x]', motivo_da_anulacao: 'x', codigo_de_indicacao: 'ABC123' }) as Record<string, unknown>;
  for (const c of ['motivoDaAnulacao', 'crianca', 'codigoDeIndicacao', 'token', 'motivo_da_anulacao', 'codigo_de_indicacao']) assert.equal(s[c], REDIGIDO, c);
});
