import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  codigoDeIndicacao,
  dataParaApagarInteressado,
  ErroDaExperimental,
  gruposDasExperimentais,
  jaFezExperimental,
  lerCodigoDeIndicacao,
  linkDoWhatsApp,
  mensagemDaExperimental,
  mensagemDeIndicacao,
  mudarEstadoDaExperimental,
  nomeNaChamada,
  novoInteressado,
  numeroParaWhatsApp,
  opcoesDaExperimental,
  podeMudarPara,
  remarcarExperimental,
  resumoDaIndicacao,
  type AulaExperimental,
  type Interessado,
} from './experimental.ts';

const WHATSAPP_DA_RACA_FIGHT = '(51) 98196-2077';

test('o link do WhatsApp da academia com a modalidade NA mensagem (R19.2)', () => {
  assert.equal(numeroParaWhatsApp(WHATSAPP_DA_RACA_FIGHT), '5551981962077');
  assert.equal(numeroParaWhatsApp('+55 51 98196-2077'), '5551981962077');
  assert.throws(() => numeroParaWhatsApp('98196-2077'), RangeError);
  const msg = mensagemDaExperimental('Muay Thai', 'Raça Fight');
  assert.equal(msg, 'Olá! Quero agendar uma aula experimental de Muay Thai na Raça Fight.');
  const link = linkDoWhatsApp(WHATSAPP_DA_RACA_FIGHT, msg);
  assert.ok(link.startsWith('https://wa.me/5551981962077?text='));
  assert.equal(decodeURIComponent(link.split('?text=')[1]!), msg);
  assert.equal(mensagemDaExperimental(null, 'Raça Fight'), 'Olá! Quero agendar uma aula experimental na Raça Fight. Ainda não sei a modalidade.');
  assert.deepEqual(opcoesDaExperimental(['Muay Thai', 'Boxe'], ['Muay Thai Kids']), ['Muay Thai', 'Boxe', 'Muay Thai Kids', null]);
});

const interessado = (m: Partial<Interessado> = {}): Interessado => ({ id: 'i1', academiaId: 'raca-fight', nome: 'Igor Lemos', whatsapp: '5551900000001', modalidadeId: 'muay-thai', criadoEm: 'x', criadoPorId: 'simone', ...m });
const experimental = (m: Partial<AulaExperimental> = {}): AulaExperimental => ({ id: 'e1', academiaId: 'raca-fight', interessadoId: 'i1', aulaId: 'a@2026-10-15', turmaId: 'muay-thai-noite-1', data: '2026-10-15', modalidadeId: 'muay-thai', estado: 'agendada', marcadaPorId: 'simone', criadaEm: 'x', atualizadaEm: 'x', ...m });

test('o cadastro do interessado guarda o WhatsApp no formato internacional', () => {
  const i = novoInteressado({ id: 'i9', academiaId: 'raca-fight', nome: ' Igor Lemos ', whatsapp: '(51) 90000-0001', modalidadeId: 'muay-thai', criadoEm: 'x', criadoPorId: 'simone' });
  assert.equal(i.nome, 'Igor Lemos');
  assert.equal(i.whatsapp, '5551900000001');
  assert.throws(() => novoInteressado({ ...i, whatsapp: '123' }), (e: unknown) => e instanceof ErroDaExperimental && e.codigo === 'whatsapp_invalido');
  assert.throws(() => novoInteressado({ ...i, nome: ' ' }), (e: unknown) => e instanceof ErroDaExperimental && e.codigo === 'nome_vazio');
});

test('os estados da experimental (R19.3)', () => {
  assert.equal(podeMudarPara('agendada', 'compareceu'), true);
  assert.equal(podeMudarPara('agendada', 'matriculou'), false);
  assert.equal(podeMudarPara('compareceu', 'matriculou'), true);
  const e = mudarEstadoDaExperimental(experimental(), 'compareceu', 'y');
  assert.equal(e.estado, 'compareceu');
  assert.equal(e.atualizadaEm, 'y');
  assert.throws(() => mudarEstadoDaExperimental(e, 'faltou', 'z'), (x: unknown) => x instanceof ErroDaExperimental && x.codigo === 'transicao_invalida');
});

test('remarcar: a antiga fica "remarcada" e a nova aponta para ela', () => {
  const { antiga, nova } = remarcarExperimental(experimental({ estado: 'faltou' }), { id: 'e2', aulaId: 'b@2026-10-20', turmaId: 'muay-thai-noite-1', data: '2026-10-20', porId: 'simone', em: 'z' });
  assert.equal(antiga.estado, 'remarcada');
  assert.equal(nova.estado, 'agendada');
  assert.equal(nova.remarcadaDe, 'e1');
});

test('uma experimental por pessoa por modalidade: só AVISA a recepção (L24)', () => {
  const is = [interessado()];
  assert.equal(jaFezExperimental([experimental()], is, '(51) 90000-0001', 'muay-thai'), true);
  assert.equal(jaFezExperimental([experimental()], is, '(51) 90000-0001', 'boxe'), false);
  assert.equal(jaFezExperimental([experimental({ estado: 'cancelada' })], is, '(51) 90000-0001', 'muay-thai'), false);
  assert.equal(jaFezExperimental([experimental()], is, 'lixo', 'muay-thai'), false);
});

test('na chamada o professor vê só o primeiro nome (da criança, quando é dela) — R19.5, R19.10', () => {
  assert.equal(nomeNaChamada(interessado()), 'Igor');
  assert.equal(nomeNaChamada(interessado({ nome: 'Carla Nunes', crianca: { nome: 'Pedro Nunes', idade: 9 } })), 'Pedro');
});

test('o prazo para apagar o interessado é parâmetro (L23)', () => {
  assert.equal(dataParaApagarInteressado('2026-10-15', 180), '2027-04-13');
  assert.throws(() => dataParaApagarInteressado('2026-10-15', 0), RangeError);
});

test('os grupos da aba Experimentais', () => {
  const g = gruposDasExperimentais([experimental({ id: 'hoje' }), experimental({ id: 'futura', data: '2026-10-20' }), experimental({ id: 'veio', estado: 'compareceu' }), experimental({ id: 'antiga', data: '2026-10-10' })], '2026-10-15');
  assert.deepEqual(g.hoje.map((e) => e.id), ['hoje']);
  assert.deepEqual(g.agendadas.map((e) => e.id), ['futura']);
  assert.deepEqual(g.compareceramSemMatricula.map((e) => e.id), ['veio']);
  assert.deepEqual(g.faltaram.map((e) => e.id), ['antiga']);
});

test('"Traga um amiguinho": o código de 6 caracteres é estável e sem letras que confundem (R19.9)', () => {
  const c = codigoDeIndicacao('usuario-lucas');
  assert.match(c, /^[A-HJ-NP-Z2-9]{6}$/);
  assert.equal(codigoDeIndicacao('usuario-lucas'), c);
  assert.notEqual(codigoDeIndicacao('usuario-ana'), c);
  assert.equal(lerCodigoDeIndicacao(` ${c.toLowerCase()} `), c);
  assert.equal(lerCodigoDeIndicacao('O0I1AA'), null);
  const msg = mensagemDeIndicacao(c, 'Raça Fight', 'https://wa.me/5551981962077');
  assert.match(msg, new RegExp(`Diga o código ${c}\\.$`));
  assert.match(msg, /^Treina comigo na Raça Fight!/);
});

test('o aluno vê da indicação só o primeiro nome e o estado', () => {
  const r = resumoDaIndicacao({ id: 'x', academiaId: 'a', codigo: 'Q7K2PX', alunoId: 'lucas', interessadoId: 'i1', estado: 'convertida', criadaEm: 'x' }, { nome: 'Igor Lemos' });
  assert.deepEqual(r, { nome: 'Igor', texto: 'Sua indicação virou matrícula' });
});
