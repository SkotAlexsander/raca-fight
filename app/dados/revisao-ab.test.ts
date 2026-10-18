/**
 * Revisão AB (P11, onda 4): os bugs de DADOS achados depois do teste de ponta
 * a ponta, cada um com o teste que falhava antes da correção.
 *
 * - AB1: série gravada DURANTE o envio da fila sumia (o fim do envio apagava o
 *   item novo e regravava o treino velho por cima). Na luta (P12, agente AM2),
 *   o mesmo vale para o check-in desfeito durante o envio.
 * - AB2: duas subidas ao mesmo tempo mandavam o mesmo item duas vezes.
 * - AB3: refeição desmarcada depois de subir não virava "apagar" na fila
 *   (pendência do AA), nem a desmarcada enquanto subia.
 * - AB4: migração do SQLite da versão 1 para a 2 (o teste que faltava), com o
 *   SQL de verdade (`node:sqlite`, o mesmo motor do expo-sqlite).
 * - AB5: armazenamento corrompido derrubava a abertura do app.
 * - AB6: limites — 100 eventos, nome de 200 caracteres, emoji e acento (eram treinos).
 * - AB7: "Entrar com e-mail" não achava a conta criada na entrada (pendência do AA).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import type { RefeicaoRegistrada } from '../dominio/tipos.ts';
import type { Presenca } from '../dominio/presenca/presenca.ts';
import type { EventoDaAcademia } from '../dominio/eventos/eventos.ts';
import type { ItemDaFila } from '../dominio/sincronizacao.ts';
import { criarArmazenamentoEmMemoria, estadoVazio } from './armazenamento/memoria.ts';
import { criarArmazenamentoSqlite, migrar, VERSAO_DO_BANCO, type BancoSincrono } from './armazenamento/sqlite.ts';
import { COLECAO_DE_PRESENCAS, enviarFila, gravarPresencasEEnfileirar, idDoItemDaPresenca, pendentesDe, type DestinoDaFila } from './fila.ts';
import { presencaDeTeste, presencasNoAparelho } from './apoio-de-teste.ts';
import { ID, montarDadosDeExemplo } from './local/dados-de-exemplo.ts';
import { criarRepositorioLocal } from './local/RepositorioLocal.ts';
import type { ArmazenamentoLocal } from './armazenamento/tipos.ts';
import { validarAvisoDaAcademia } from '../dominio/avisos.ts';

const abrir = (arm: ArmazenamentoLocal) => criarRepositorioLocal(montarDadosDeExemplo({ agora: new Date() }), arm);

const agora = () => '2026-10-14T21:30:00-03:00';
/** A presença da Ana na aula `aula`, na versão `n` (1 = check-in, 2 = desfeito). */
const presenca = (aula: string, n = 1): Presenca =>
  presencaDeTeste(aula, 'ana', n === 1 ? { atualizadaEm: '2026-10-14T19:41:00-03:00' } : { estado: 'retirada', motivoDaRetirada: 'desfeito_pelo_aluno', atualizadaEm: '2026-10-14T19:43:00-03:00' });
const gravar = (arm: ArmazenamentoLocal, p: Presenca, quando = p.atualizadaEm) => gravarPresencasEEnfileirar(arm, [p], 'checkin', 'ana', quando);
const idDe = (aula: string) => idDoItemDaPresenca('checkin', `${aula}|ana`, 'ana');

/** Um destino que segura cada envio até o teste soltar. */
function destinoSegurado() {
  const esperando: { item: ItemDaFila; soltar: () => void; falhar: (e: unknown) => void }[] = [];
  const recebidos: { id: string; estado: string; tipo: string }[] = [];
  const destino: DestinoDaFila = {
    enviar: (item) =>
      new Promise<void>((ok, erro) => {
        esperando.push({
          item,
          soltar: () => {
            recebidos.push({ id: item.id, tipo: item.tipo, estado: (item.carga as Presenca).estado ?? '' });
            ok();
          },
          falhar: erro,
        });
      }),
  };
  return { destino, esperando, recebidos };
}
const umTique = () => new Promise((r) => setTimeout(r, 0));

// ---------------------------------------------------------------------------
// AB1 e AB2 — concorrência na fila
// ---------------------------------------------------------------------------

test('AB1: o check-in desfeito enquanto a presença sobe não se perde (nem no aparelho, nem na fila)', async () => {
  const arm = criarArmazenamentoEmMemoria();
  gravar(arm, presenca('a1', 1));
  const { destino, esperando, recebidos } = destinoSegurado();
  const subida = enviarFila(arm, destino, { usuarioId: 'ana', valida: true }, agora);
  await umTique();
  assert.equal(esperando.length, 1, 'o check-in está subindo');

  // a Ana desfaz no meio do envio (o envio de verdade leva segundos no tatame)
  gravar(arm, presenca('a1', 2));
  esperando[0].soltar();
  await subida;

  assert.equal(presencasNoAparelho(arm, 'ana')[0].estado, 'retirada', 'o aparelho continua com o desfeito');
  assert.equal(presencasNoAparelho(arm, 'ana')[0].sincronizadaEm, undefined, 'a versão nova ainda não subiu');
  const naFila = pendentesDe(arm, 'ana');
  assert.equal(naFila.length, 1, 'a versão nova continua na fila');
  assert.equal((naFila[0].carga as Presenca).estado, 'retirada');

  // a próxima subida leva a versão nova
  const segunda = enviarFila(arm, destino, { usuarioId: 'ana', valida: true }, agora);
  await umTique();
  esperando[1].soltar();
  await segunda;
  assert.deepEqual(recebidos.map((r) => r.estado), ['pendente', 'retirada']);
  assert.equal(pendentesDe(arm, 'ana').length, 0);
  assert.ok(presencasNoAparelho(arm, 'ana')[0].sincronizadaEm);
  assert.equal(presencasNoAparelho(arm, 'ana')[0].estado, 'retirada');
});

test('AB2: duas subidas ao mesmo tempo (rede voltou + o relógio de 15 s) mandam cada item uma vez só', async () => {
  const arm = criarArmazenamentoEmMemoria();
  gravar(arm, presenca('a1'), '2026-10-14T19:41:00-03:00');
  gravar(arm, presenca('a2'), '2026-10-14T19:42:00-03:00');
  const { destino, esperando, recebidos } = destinoSegurado();
  const a = enviarFila(arm, destino, { usuarioId: 'ana', valida: true }, agora);
  const b = enviarFila(arm, destino, { usuarioId: 'ana', valida: true }, agora);
  let pronto = false;
  const tudo = Promise.all([a, b]).then(() => (pronto = true));
  for (let i = 0; i < 50 && !pronto; i += 1) {
    await umTique();
    for (const e of esperando.splice(0)) e.soltar();
  }
  await tudo;
  assert.deepEqual(recebidos.map((r) => r.id).sort(), [idDe('a1'), idDe('a2')], 'nenhum item subiu duas vezes');
  assert.equal(pendentesDe(arm, 'ana').length, 0);
});

test('AB2: a rede caindo no meio do envio guarda o resto, na ordem, sem contar tentativa a mais', async () => {
  const arm = criarArmazenamentoEmMemoria();
  gravar(arm, presenca('a1'), '2026-10-14T19:41:00-03:00');
  gravar(arm, presenca('a2'), '2026-10-14T19:42:00-03:00');
  const { destino, esperando } = destinoSegurado();
  const subida = enviarFila(arm, destino, { usuarioId: 'ana', valida: true }, agora);
  await umTique();
  esperando[0].soltar(); // a1 subiu
  await umTique();
  esperando[1].falhar({ status: 0 }); // a rede caiu no a2
  const r = await subida;
  assert.equal(r.enviados, 1);
  assert.equal(r.semRede, true);
  const fila = pendentesDe(arm, 'ana');
  assert.deepEqual(fila.map((i) => [i.id, i.tentativas]), [[idDe('a2'), 1]]);
});

// ---------------------------------------------------------------------------
// AB3 — refeição desmarcada depois de subir
// ---------------------------------------------------------------------------

const refeicao = (id: string): RefeicaoRegistrada => ({
  id,
  alunoId: ID.ana,
  academiaId: ID.academia,
  planoId: 'plano-ana',
  refeicaoId: 'refeicao-almoco',
  data: '2026-10-14',
  estado: 'feita',
  feitaEm: '2026-10-14T12:30:00-03:00',
  registradaEm: '2026-10-14T12:30:00-03:00',
});

test('AB3: desmarcar a refeição que AINDA NÃO subiu só tira da fila (nada a apagar no servidor)', () => {
  const arm = criarArmazenamentoEmMemoria();
  const repo = abrir(arm);
  repo.registrarRefeicao(refeicao('m1'), ID.ana);
  repo.desfazerRefeicao(ID.ana, 'refeicao-almoco', '2026-10-14');
  assert.deepEqual(arm.fila(), []);
});

test('AB3: desmarcar a refeição que JÁ SUBIU põe um "apagar" na fila, que sobe depois', async () => {
  const arm = criarArmazenamentoEmMemoria();
  const repo = abrir(arm);
  repo.registrarRefeicao(refeicao('m1'), ID.ana);
  const recebidos: string[] = [];
  const destino: DestinoDaFila = { enviar: async (i) => void recebidos.push(`${i.tipo}:${i.id}`) };
  await enviarFila(arm, destino, { usuarioId: ID.ana, valida: true }, agora);
  assert.deepEqual(arm.fila(), [], 'a marca subiu');

  repo.desfazerRefeicao(ID.ana, 'refeicao-almoco', '2026-10-14');
  const fila = arm.fila();
  assert.equal(fila.length, 1);
  assert.equal(fila[0].tipo, 'refeicao_apagada');
  assert.equal(fila[0].usuarioId, ID.ana);
  // reabrir o app: o apagar continua lá, e a refeição continua desmarcada
  const reaberto = abrir(arm);
  assert.deepEqual(await reaberto.refeicoesRegistradas(ID.ana, '2026-10-14'), []);
  await enviarFila(arm, destino, { usuarioId: ID.ana, valida: true }, agora);
  assert.deepEqual(recebidos, ['refeicao_registrada:m1', `refeicao_apagada:${fila[0].id}`]);
  assert.deepEqual(arm.fila(), []);
});

test('AB3: desmarcar ENQUANTO a marca sobe também vira "apagar" (senão ela ficaria no servidor)', async () => {
  const arm = criarArmazenamentoEmMemoria();
  const repo = abrir(arm);
  repo.registrarRefeicao(refeicao('m1'), ID.ana);
  const { destino, esperando } = destinoSegurado();
  const subida = enviarFila(arm, destino, { usuarioId: ID.ana, valida: true }, agora);
  await umTique();
  repo.desfazerRefeicao(ID.ana, 'refeicao-almoco', '2026-10-14');
  esperando[0].soltar();
  await subida;
  const fila = arm.fila();
  assert.deepEqual(fila.map((i) => i.tipo), ['refeicao_apagada']);
  assert.deepEqual(arm.colecao('refeicoes').filter(([, v]) => !(v as { __apagado?: boolean }).__apagado), []);
});

test('AB3: trocar a marca (feita → "não segui") de uma refeição que já subiu apaga a antiga no servidor', async () => {
  const arm = criarArmazenamentoEmMemoria();
  const repo = abrir(arm);
  repo.registrarRefeicao(refeicao('m1'), ID.ana);
  await enviarFila(arm, { enviar: async () => {} }, { usuarioId: ID.ana, valida: true }, agora);
  repo.registrarRefeicao({ ...refeicao('m2'), estado: 'nao_segui', motivo: 'sem tempo' } as RefeicaoRegistrada, ID.ana);
  assert.deepEqual(arm.fila().map((i) => i.tipo).sort(), ['refeicao_apagada', 'refeicao_registrada']);
});

// ---------------------------------------------------------------------------
// AB4 — migração do SQLite (versão 1 → 2), com o SQL de verdade
// ---------------------------------------------------------------------------

/** O `node:sqlite` com a mesma forma síncrona do expo-sqlite. */
function bancoNode(db = new DatabaseSync(':memory:')): BancoSincrono & { db: DatabaseSync } {
  return {
    db,
    executar: (sql) => db.exec(sql),
    um: (sql, p = []) => (db.prepare(sql).get(...(p as never[])) as never) ?? null,
    todos: (sql, p = []) => db.prepare(sql).all(...(p as never[])) as never,
    rodar: (sql, p = []) => void db.prepare(sql).run(...(p as never[])),
    transacao: (f) => {
      db.exec('begin');
      try {
        f();
        db.exec('commit');
      } catch (e) {
        db.exec('rollback');
        throw e;
      }
    },
  };
}

/** O banco como a versão 1 do app deixava (antes do agente AA). */
const SQL_DA_VERSAO_1 = `
  create table treinos_realizados (id text primary key not null, aluno_id text not null, dados_json text not null, atualizado_em text not null);
  create index treinos_realizados_aluno on treinos_realizados (aluno_id);
  create table fila_de_envio (id text primary key not null, tipo text not null, usuario_id text not null, carga_json text not null, criado_em text not null, tentativas integer not null default 0, estado text not null, ultimo_erro text);
  create table preferencias (chave text primary key not null, valor text not null);
  pragma user_version = 1;
`;

test('AB4: o banco da versão 1 (com treino, fila e preferência) migra para a 2 sem perder nada', () => {
  const b = bancoNode();
  b.executar(SQL_DA_VERSAO_1);
  // o treino do tempo da musculação: a tabela fica; nada mais lê, mas nada se apaga
  const r = { id: 'r1', alunoId: 'ana', inicioEm: '2026-10-14T09:00:00-03:00', series: [{}, {}] };
  b.rodar('insert into treinos_realizados values (?, ?, ?, ?)', ['r1', 'ana', JSON.stringify(r), r.inicioEm]);
  b.rodar("insert into fila_de_envio values ('r1', 'treino_realizado', 'ana', ?, '2026-10-14T09:05:00-03:00', 2, 'pendente', '503')", [JSON.stringify(r)]);
  b.rodar("insert into preferencias values ('sessao.usuarioId', 'ana')");

  migrar(b);
  assert.equal(b.um<{ user_version: number }>('pragma user_version')?.user_version, VERSAO_DO_BANCO);
  assert.equal(VERSAO_DO_BANCO, 2);

  const arm = criarArmazenamentoSqlite(b);
  assert.equal(b.um<{ n: number }>('select count(*) as n from treinos_realizados')?.n, 1);
  assert.deepEqual(arm.fila().map((i) => [i.id, i.tentativas, i.estado, i.ultimoErro]), [['r1', 2, 'pendente', '503']]);
  assert.equal(arm.lerPreferencia('sessao.usuarioId'), 'ana');
  // a tabela nova (registros) funciona
  arm.gravarNaColecao('eventos', 'e1', { id: 'e1', nome: 'A' });
  assert.deepEqual(arm.colecao('eventos'), [['e1', { id: 'e1', nome: 'A' }]]);
  // abrir de novo não migra de novo nem apaga
  migrar(b);
  assert.equal(criarArmazenamentoSqlite(b).colecao('eventos').length, 1);
});

test('AB4: banco novo (versão 0) chega à 2; migração que falha volta atrás inteira', () => {
  const b = bancoNode();
  migrar(b);
  assert.equal(b.um<{ user_version: number }>('pragma user_version')?.user_version, 2);

  const c = bancoNode();
  c.executar(SQL_DA_VERSAO_1);
  assert.throws(() => migrar(c, { 2: 'create table registros (x text); isto não é sql;' }));
  assert.equal(c.um<{ user_version: number }>('pragma user_version')?.user_version, 1, 'a versão não sobe com a migração quebrada');
  assert.equal(c.um("select name from sqlite_master where name = 'registros'"), null, 'nada da migração quebrada ficou');
});

// ---------------------------------------------------------------------------
// AB5 — armazenamento corrompido
// ---------------------------------------------------------------------------

test('AB5: no SQLite, uma linha com JSON quebrado é pulada (o app abre com o resto)', () => {
  const b = bancoNode();
  migrar(b);
  const arm = criarArmazenamentoSqlite(b);
  gravar(arm, presenca('a2'));
  arm.gravarNaColecao('eventos', 'e1', { id: 'e1' });
  b.rodar("insert into fila_de_envio values ('fx', 'checkin', 'ana', 'nao e json', '2026-10-14T09:00:00-03:00', 0, 'pendente', null)");
  b.rodar(`insert into registros values ('${COLECAO_DE_PRESENCAS}', 'px', '{quebrado', 1)`);
  b.rodar("insert into registros values ('eventos', 'ex', '[[[', 1)");
  assert.deepEqual(presencasNoAparelho(arm, 'ana').map((p) => p.id), ['a2|ana']);
  assert.deepEqual(arm.fila().map((i) => i.id), [idDe('a2')]);
  assert.deepEqual(arm.colecao('eventos').map(([id]) => id), ['e1']);
  assert.doesNotThrow(() => abrir(arm));
});

test('AB5: no navegador, o estado guardado com formato errado não derruba a abertura', async () => {
  const guardado = new Map<string, string>();
  const antes = (globalThis as { localStorage?: unknown }).localStorage;
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => guardado.get(k) ?? null,
    setItem: (k: string, v: string) => void guardado.set(k, v),
  };
  try {
    const { abrirArmazenamentoLocal } = await import('./armazenamento/banco.web.ts');
    const casos = [
      '{"fila": null, "realizados": {"x": null, "y": 3}, "preferencias": [], "colecoes": "lixo"}',
      '{"colecoes": {"presencas": null, "usuarios": {"u": null}}}',
      '[]',
      'null',
      '"texto"',
      '{quebrado',
    ];
    for (const caso of casos) {
      guardado.set('academia-plus:armazenamento-local', caso);
      const arm = abrirArmazenamentoLocal();
      assert.doesNotThrow(() => abrir(arm), caso);
      assert.deepEqual(arm.fila(), [], caso);
      assert.deepEqual(presencasNoAparelho(arm, 'x'), [], caso);
      const repo = abrir(arm);
      assert.ok((await repo.usuario(ID.ana))?.nome, caso);
      gravar(arm, presenca('a1'));
      assert.equal(arm.fila().length, 1, caso);
    }
  } finally {
    (globalThis as { localStorage?: unknown }).localStorage = antes;
  }
});

test('AB5: na memória, valor nulo dentro das tabelas é ignorado', () => {
  const e = { ...estadoVazio(), fila: { y: null } as never, colecoes: { presencas: { x: null } } as never };
  const arm = criarArmazenamentoEmMemoria(e);
  assert.deepEqual(presencasNoAparelho(arm, 'ana'), []);
  assert.deepEqual(arm.fila(), []);
});

// ---------------------------------------------------------------------------
// AB6 — limites
// ---------------------------------------------------------------------------

test('AB6: 100 eventos com nome de 200 caracteres, emoji e acento voltam iguais ao reabrir', async () => {
  const guardado = new Map<string, string>();
  const antes = (globalThis as { localStorage?: unknown }).localStorage;
  (globalThis as { localStorage?: unknown }).localStorage = { getItem: (k: string) => guardado.get(k) ?? null, setItem: (k: string, v: string) => void guardado.set(k, v) };
  try {
    const { abrirArmazenamentoLocal } = await import('./armazenamento/banco.web.ts');
    const repo = abrir(abrirArmazenamentoLocal());
    const base = (await repo.eventos(ID.academia))[0];
    const nome = (i: number) => `Evento ${i} 🥊🏽 ação força ç ã é ü — ${'x'.repeat(200)}`.slice(0, 200);
    for (let i = 0; i < 100; i += 1) await repo.salvarEvento({ ...base, id: `e-${i}`, nome: nome(i) } as EventoDaAcademia);
    const reaberto = abrir(abrirArmazenamentoLocal());
    const meus = (await reaberto.eventos(ID.academia)).filter((e) => e.id.startsWith('e-'));
    assert.equal(meus.length, 100);
    assert.equal(meus[42].nome, nome(42));
    assert.equal([...meus[0].nome].length <= 200, true);
  } finally {
    (globalThis as { localStorage?: unknown }).localStorage = antes;
  }
});

test('AB6: aviso da academia escrito com letras de largura total também é link (e HTML não tem vez)', () => {
  assert.deepEqual(validarAvisoDaAcademia({ texto: 'Ｗｗｗ．ａｃａｄｅｍｉａ．ｃｏｍ', validadeDias: 3 }), ['tem_link']);
  assert.deepEqual(validarAvisoDaAcademia({ texto: 'academia．com．br', validadeDias: 3 }), ['tem_link']);
  // o HTML não é interpretado (o Text mostra o texto); o que vale é não ter link
  assert.deepEqual(validarAvisoDaAcademia({ texto: '<a href="https://x.co">aqui</a>', validadeDias: 3 }), ['tem_link']);
  assert.deepEqual(validarAvisoDaAcademia({ texto: 'Feriado dia 15.11, abrimos 7.30 💪', validadeDias: 3 }), []);
});

// ---------------------------------------------------------------------------
// AB7 — entrar com o e-mail da conta criada
// ---------------------------------------------------------------------------

test('AB7: a conta criada na entrada é achada pelo e-mail (qualquer caixa), depois de reabrir', async () => {
  const arm = criarArmazenamentoEmMemoria();
  const repo = abrir(arm);
  const u = await repo.criarConta({ nome: 'Paula Gomes', email: 'Paula.Gomes@Exemplo.com ' });
  const reaberto = abrir(arm);
  assert.equal((await reaberto.usuarioPeloEmail('paula.gomes@exemplo.com'))?.id, u.id);
  assert.equal((await reaberto.usuarioPeloEmail(' PAULA.GOMES@EXEMPLO.COM'))?.id, u.id);
  assert.equal((await reaberto.usuarioPeloEmail('ana.paula@exemplo.com.br'))?.id, ID.ana);
  assert.equal(await reaberto.usuarioPeloEmail('ninguem@exemplo.com'), null);
});
