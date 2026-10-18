/**
 * A mecânica da fila com o armazenamento em memória: a presença do tatame sem
 * Wi-Fi fica guardada sem rede e sobe depois; sessão vencida não perde nada
 * (R15.9, R1.24, R12.3). Até o P12, era o treino do porão.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { ItemDaFila } from '../dominio/sincronizacao.ts';
import { criarArmazenamentoEmMemoria } from './armazenamento/memoria.ts';
import { enviarFila, gravarPresencasEEnfileirar, idDoItemDaPresenca, pendentesDe, type DestinoDaFila } from './fila.ts';
import { presencaDeTeste, presencasNoAparelho } from './apoio-de-teste.ts';

const agora = () => '2026-10-14T21:30:00-03:00';
const id1 = idDoItemDaPresenca('checkin', 'a1|ana', 'ana');

function destino(comportamento: (i: ItemDaFila) => void): DestinoDaFila & { recebidos: string[] } {
  const recebidos: string[] = [];
  return {
    recebidos,
    async enviar(i) {
      comportamento(i);
      recebidos.push(i.id);
    },
  };
}

const checkin = (arm: ReturnType<typeof criarArmazenamentoEmMemoria>, aula: string, quando: string, alunoId = 'ana') =>
  gravarPresencasEEnfileirar(arm, [presencaDeTeste(aula, alunoId, { atualizadaEm: quando })], 'checkin', alunoId, quando);

test('sem rede: fica na fila, conta a tentativa e sobe quando a rede volta', async () => {
  const arm = criarArmazenamentoEmMemoria();
  checkin(arm, 'a1', '2026-10-14T19:41:00-03:00');
  checkin(arm, 'a2', '2026-10-14T20:41:00-03:00');
  assert.equal(presencasNoAparelho(arm, 'ana').length, 2, 'a presença já está no aparelho antes de qualquer envio');

  const semRede = destino(() => {
    throw { status: 0 };
  });
  const r1 = await enviarFila(arm, semRede, { usuarioId: 'ana', valida: true }, agora);
  assert.equal(r1.semRede, true);
  assert.equal(r1.enviados, 0);
  assert.equal(pendentesDe(arm, 'ana').length, 2);
  assert.equal(arm.fila().find((i) => i.id === id1)?.tentativas, 1);

  const comRede = destino(() => {});
  const r2 = await enviarFila(arm, comRede, { usuarioId: 'ana', valida: true }, agora);
  assert.equal(r2.enviados, 2);
  assert.deepEqual(comRede.recebidos, [id1, idDoItemDaPresenca('checkin', 'a2|ana', 'ana')], 'sobe na ordem de registro');
  assert.equal(arm.fila().length, 0);
  assert.ok(presencasNoAparelho(arm, 'ana').every((p) => p.sincronizadaEm === agora()));
});

test('sessão vencida: não envia, pede para entrar e não perde nada', async () => {
  const arm = criarArmazenamentoEmMemoria();
  checkin(arm, 'a1', '2026-10-14T19:41:00-03:00');
  const d = destino(() => {});
  const r = await enviarFila(arm, d, { usuarioId: 'ana', valida: false }, agora);
  assert.equal(r.precisaEntrar, true);
  assert.equal(d.recebidos.length, 0);
  assert.equal(pendentesDe(arm, 'ana').length, 1);
});

test('recusa 401 no meio: guarda sem contar tentativa', async () => {
  const arm = criarArmazenamentoEmMemoria();
  checkin(arm, 'a1', '2026-10-14T19:41:00-03:00');
  const r = await enviarFila(arm, destino(() => { throw { status: 401 }; }), { usuarioId: 'ana', valida: true }, agora);
  assert.equal(r.precisaEntrar, true);
  assert.equal(arm.fila()[0].tentativas, 0);
  assert.equal(arm.fila()[0].estado, 'pendente');
});

test('erro de regra com a sessão certa: marca falhou e segue com o próximo', async () => {
  const arm = criarArmazenamentoEmMemoria();
  checkin(arm, 'a1', '2026-10-14T19:41:00-03:00');
  checkin(arm, 'a2', '2026-10-14T20:41:00-03:00');
  const d = destino((i) => {
    if (i.id === id1) throw { status: 400, code: '23514', message: 'Failing row contains (ana, muay-thai)' };
  });
  const r = await enviarFila(arm, d, { usuarioId: 'ana', valida: true }, agora);
  assert.equal(r.falharam, 1);
  assert.equal(r.enviados, 1);
  const p1 = arm.fila().find((i) => i.id === id1)!;
  assert.equal(p1.estado, 'falhou');
  assert.equal(p1.ultimoErro, '400 23514', 'só status e código, nunca a linha');
});

test('outra conta no aparelho: a presença da Ana espera a conta dela', async () => {
  const arm = criarArmazenamentoEmMemoria();
  checkin(arm, 'a1', '2026-10-14T19:41:00-03:00');
  const d = destino(() => {});
  const r = await enviarFila(arm, d, { usuarioId: 'bia', valida: true }, agora);
  assert.equal(d.recebidos.length, 0);
  assert.deepEqual(r.esperandoOutraConta, [{ usuarioId: 'ana', quantos: 1 }]);
});

test('gravar a mesma presença de novo (desfazer e marcar) não duplica a fila', () => {
  const arm = criarArmazenamentoEmMemoria();
  checkin(arm, 'a1', '2026-10-14T19:41:00-03:00');
  gravarPresencasEEnfileirar(arm, [presencaDeTeste('a1', 'ana', { estado: 'retirada', motivoDaRetirada: 'desfeito_pelo_aluno', atualizadaEm: '2026-10-14T19:42:00-03:00' })], 'checkin', 'ana', '2026-10-14T19:42:00-03:00');
  assert.equal(arm.fila().length, 1);
  assert.equal(presencasNoAparelho(arm, 'ana').length, 1);
  assert.equal(presencasNoAparelho(arm, 'ana')[0]!.estado, 'retirada');
});

test('a chamada do professor é um item da conta dele, separado do check-in do aluno', () => {
  const arm = criarArmazenamentoEmMemoria();
  checkin(arm, 'a1', '2026-10-14T19:41:00-03:00');
  gravarPresencasEEnfileirar(arm, [presencaDeTeste('a1', 'ana', { estado: 'confirmada', pelaEquipe: true, atualizadaPorId: 'diego', atualizadaEm: '2026-10-14T20:05:00-03:00' })], 'chamada', 'diego', '2026-10-14T20:05:00-03:00');
  assert.equal(arm.fila().length, 2);
  assert.equal(pendentesDe(arm, 'diego').length, 1);
  assert.throws(() => gravarPresencasEEnfileirar(arm, [presencaDeTeste('a1', 'ana')], 'chamada', 'diego', '2026-10-14T20:06:00-03:00'), /dono/);
});
