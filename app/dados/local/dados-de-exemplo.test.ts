/** Os dados de exemplo de luta (P12, agente AM2): a grade real, pessoas fictícias, sem foto de criança. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ID, montarDadosDeExemplo, NOMES_REAIS_PROIBIDOS } from './dados-de-exemplo.ts';
import { decidirDestino } from '../../dominio/papel.ts';
import { msNoFuso } from '../../dominio/turmas/horario.ts';
import { aulasDoDia } from '../../dominio/turmas/turmas.ts';
import { contarNaAula, montarChamada } from '../../dominio/presenca/presenca.ts';
import { graduacaoAtual, descreverGraduacao } from '../../dominio/graduacao/graduacao.ts';

const FUSO = 'America/Sao_Paulo';
/** Quinta, 15/10/2026, 19:41 em Gravataí (a cena do desenho). */
const QUINTA = new Date(msNoFuso('2026-10-15', '19:41', FUSO));
const dados = montarDadosDeExemplo({ agora: QUINTA });

test('a grade real: 11 turmas, a quinta sem Muay Thai às 21h (achado do AS)', () => {
  assert.equal(dados.luta.turmas.length, 11);
  const quinta = aulasDoDia(dados.luta.turmas, '2026-10-15', FUSO);
  assert.ok(!quinta.some((a) => a.hora === '21:00' && a.turmaId.startsWith('muay-thai')));
  assert.deepEqual(dados.luta.modalidades.map((m) => m.nome), ['Muay Thai', 'Boxe', 'Jiu-Jitsu', 'Luta Livre', 'MMA']);
  assert.equal(dados.luta.contato.whatsapp, '(51) 98196-2077');
});

test('nenhum nome de exemplo é de professor ou atleta real do Instagram (L34; o Bruno da chamada virou Breno)', () => {
  const nomes = [...dados.usuarios.map((u) => u.nome), ...dados.fichas.map((f) => f.nome), ...dados.dependentes.map((d) => d.nome), ...dados.interessados.map((i) => i.nome), ...dados.interessados.map((i) => i.crianca?.nome ?? ''), ...dados.lutas.map((l) => l.adversario), ...dados.perfisProfissionais.map((p) => p.nomeExibicao)];
  for (const nome of nomes) {
    for (const real of NOMES_REAIS_PROIBIDOS) assert.ok(!new RegExp(`\\b${real}\\b`, 'i').test(nome), `"${nome}" usa o nome real "${real}"`);
  }
  assert.ok(dados.fichas.some((f) => f.nome === 'Breno Souza'));
});

test('as fontes do exemplo e do domínio de luta também não citam os nomes reais', () => {
  const aqui = dirname(fileURLToPath(import.meta.url));
  const arquivos = ['dados-de-exemplo.ts', '../../dominio/turmas/grade-raca-fight.ts', '../../dominio/eventos/eventos.ts', '../../dominio/experimental/experimental.ts'];
  for (const a of arquivos) {
    const texto = readFileSync(resolve(aqui, a), 'utf8').replace(/NOMES_REAIS_PROIBIDOS = \[[^\]]*\]/, '');
    for (const real of ['Moreschi', 'Thales', 'Norton', 'Cardozo', 'Schutz', 'Toledo']) assert.ok(!texto.includes(real), `${a} cita ${real}`);
  }
});

test('Kids: o dependente nasce sem autorização de imagem, e não há foto de criança no exemplo', () => {
  const pedro = dados.dependentes.find((d) => d.id === ID.pedro)!;
  assert.equal(pedro.autorizacaoDeImagem.ligada, false);
  assert.equal(pedro.responsavelId, ID.carla);
  assert.ok(dados.tecnicas.every((t) => !t.temMenor));
  assert.ok(dados.usuarios.every((u) => !u.fotoUrl));
});

test('a cena do desenho: quinta 19:41, o Lucas ainda não fez check-in e a chamada conta igual ao Hoje', () => {
  const aula = aulasDoDia(dados.luta.turmas, '2026-10-15', FUSO).find((a) => a.turmaId === 'muay-thai-noite-1')!;
  const grupos = montarChamada(aula.id, dados.presencas, dados.fichas.filter((f) => f.turmaIds.includes(aula.turmaId)).map((f) => f.alunoId));
  assert.equal(grupos.checkins.length, contarNaAula(aula.id, dados.presencas));
  assert.ok(grupos.checkins.length >= 3);
  assert.ok(!grupos.checkins.some((p) => p.alunoId === ID.lucas));
  assert.ok(grupos.daTurmaSemCheckin.includes(ID.lucas));
  assert.ok(grupos.daTurmaSemCheckin.includes(ID.davi), 'o Davi sumiu (última aula há 9 dias)');
  // a experimental do Igor é nessa aula
  assert.equal(dados.experimentais.find((e) => e.id === 'experimental-igor')?.aulaId, aula.id);
});

test('a faixa do Lucas: "Faixa branca, 2º grau" no Jiu-Jitsu e o kruang amarelo no Muay Thai', () => {
  const ibjjf = dados.luta.sistemas.find((s) => s.id === 'ibjjf-adulto')!;
  const jj = graduacaoAtual(dados.graduacoes, ID.lucas, 'jiu-jitsu')!;
  assert.equal(descreverGraduacao(ibjjf, jj.nivelId, jj.grau), 'Faixa branca, 2º grau');
  const mt = dados.luta.sistemas.find((s) => s.id === 'muay-thai-adulto')!;
  assert.equal(mt.aConfigurar, true, 'a régua do Muay Thai é [decidir] L3');
  const g = graduacaoAtual(dados.graduacoes, ID.lucas, 'muay-thai')!;
  assert.equal(descreverGraduacao(mt, g.nivelId, g.grau), 'Kruang amarelo');
});

test('vínculos: o Lucas vai ao aluno; a Rita está pendente; o dono abre o Admin', () => {
  const vs = (id: string) => dados.vinculos.filter((v) => v.usuarioId === id);
  assert.equal(decidirDestino({ usuarioId: ID.lucas }, vs(ID.lucas), null).tipo, 'visao');
  assert.equal(vs(ID.rita)[0]!.estado, 'pendente');
  assert.equal(vs(ID.sergio)[0]!.papel, 'dono');
});

test('Plus e dieta: desligados, o exemplo não tem nenhum', () => {
  assert.deepEqual(dados.assinaturas, []);
  assert.deepEqual(dados.planos, []);
});

test('as presenças do exemplo têm fuso e as passadas já estão confirmadas e sincronizadas', () => {
  const passadas = dados.presencas.filter((p) => p.data < '2026-10-15');
  assert.ok(passadas.length > 50);
  assert.ok(passadas.every((p) => p.estado === 'confirmada' && p.sincronizadaEm && /-03:00$/.test(p.registradaEm)));
});
