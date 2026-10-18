/**
 * Revisão AG (P11, onda 5): leitura do código de `dados/` e FALHAS SIMULADAS.
 * Cada teste falhava antes da correção. A regra de todos: o dado do aluno
 * nunca se perde, e quando não deu para gravar, quem chamou fica sabendo
 * (erro tipado), em vez de a tela mostrar "salvo" e o dado sumir ao reabrir.
 *
 * - AG1: fechar o app ENTRE as duas escritas de "gravar e enfileirar": o
 *   treino ficava gravado e fora da fila, e nunca subia. Na luta (P12, agente
 *   AM2), a mesma prova vale para a PRESENÇA (check-in e chamada, R15.9).
 * - AG2: SQLite com disco cheio ou banco travado: o erro saía cru e o
 *   repositório já mostrava o dado como salvo (sumia ao reabrir).
 * - AG3: navegador sem espaço (QuotaExceeded): o erro era engolido; a tela
 *   dizia "salvo" e o dado sumia ao recarregar.
 * - AG4: um item da fila com o instante estragado travava a fila INTEIRA.
 * - AG5: o relógio voltando entre "desmarcar" e "marcar de novo" subia a
 *   marca nova ANTES do "apagar" da antiga.
 * - AG6: fila com 1.000 itens: o envio relia a fila inteira a cada item
 *   (41 s no SQLite, com a tela parada entre um envio e outro).
 * - AG7: instantes comparados como TEXTO (fusos diferentes). O teste do histórico
 *   de treino saiu com a musculação; o do aviso fica.
 * - AG8: preferências gravadas por uma versão antiga voltavam sem as chaves novas.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import type { RefeicaoRegistrada } from '../dominio/tipos.ts';
import type { Presenca } from '../dominio/presenca/presenca.ts';
import type { EventoDaAcademia } from '../dominio/eventos/eventos.ts';
import type { ItemDaFila } from '../dominio/sincronizacao.ts';
import { criarArmazenamentoEmMemoria, estadoVazio, type Estado } from './armazenamento/memoria.ts';
import { criarArmazenamentoSqlite, migrar, type BancoSincrono } from './armazenamento/sqlite.ts';
import { abrirArmazenamentoLocal as abrirNoNavegador } from './armazenamento/banco.web.ts';
import type { ArmazenamentoLocal } from './armazenamento/tipos.ts';
import { enfileirarApagarRefeicao, enviarFila, gravarPresencasEEnfileirar, gravarRefeicaoEEnfileirar, idDoItemDaPresenca, type DestinoDaFila } from './fila.ts';
import { presencaDeTeste, presencasNoAparelho } from './apoio-de-teste.ts';
import { ErroDeArmazenamento, textoDoErroDeGravacao, tipoDoErroDeGravacao } from './erros.ts';
import { ErroSemSinal } from './repositorio.ts';
import { ID, montarDadosDeExemplo } from './local/dados-de-exemplo.ts';
import { criarRepositorioLocal } from './local/RepositorioLocal.ts';
import { PREFERENCIAS_PADRAO } from '../dominio/avisos.ts';

const abrir = (arm: ArmazenamentoLocal) => criarRepositorioLocal(montarDadosDeExemplo({ agora: new Date() }), arm);

/** A presença `id` da Ana (o "treino" de antes): a versão muda pelo instante da última ação. */
const realizado = (id: string, versao = 1, alunoId = 'ana'): Presenca => presencaDeTeste(id, alunoId, { atualizadaEm: `2026-10-14T19:${String(40 + versao).padStart(2, '0')}:00-03:00` });
const gravarEEnfileirar = (arm: ArmazenamentoLocal, p: Presenca, alunoId: string, quando: string) => gravarPresencasEEnfileirar(arm, [p], 'checkin', alunoId, quando);
const idDe = (aula: string, alunoId = 'ana') => idDoItemDaPresenca('checkin', `${aula}|${alunoId}`, alunoId);

/** O `node:sqlite` com a forma do expo-sqlite; `falhar` simula o disco cheio ou o banco travado na ESCRITA. */
function bancoNode(db = new DatabaseSync(':memory:')) {
  const controle = { falhar: null as null | string, escritasAteCair: Infinity };
  const banco: BancoSincrono = {
    executar: (sql) => db.exec(sql),
    um: (sql, p = []) => (db.prepare(sql).get(...(p as never[])) as never) ?? null,
    todos: (sql, p = []) => db.prepare(sql).all(...(p as never[])) as never,
    rodar: (sql, p = []) => {
      if (controle.falhar) throw new Error(controle.falhar);
      // "o app fechou aqui": a escrita seguinte nunca acontece
      if (controle.escritasAteCair <= 0) throw new Error('processo encerrado');
      controle.escritasAteCair -= 1;
      db.prepare(sql).run(...(p as never[]));
    },
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
  migrar(banco);
  return { db, banco, controle };
}

const sessao = { usuarioId: 'ana', valida: true };
const agoraFixo = () => '2026-10-14T10:30:00-03:00';
const destinoQueAnota = () => {
  const recebidos: string[] = [];
  const destino: DestinoDaFila = { enviar: async (item) => void recebidos.push(item.id) };
  return { destino, recebidos };
};

// ---------------------------------------------------------------------------
// AG1 — fechar o app entre duas escritas
// ---------------------------------------------------------------------------

test('AG1 (SQLite): o app fechando entre "gravar a presença" e "pôr na fila" não deixa a presença fora da fila', () => {
  const { db, banco, controle } = bancoNode();
  const arm = criarArmazenamentoSqlite(banco);
  controle.escritasAteCair = 1; // a primeira escrita acontece, a segunda não
  assert.throws(() => gravarEEnfileirar(arm, realizado('r1'), 'ana', agoraFixo()));
  // reabre o mesmo arquivo
  const depois = criarArmazenamentoSqlite(bancoNode(db).banco);
  const gravado = presencasNoAparelho(depois, 'ana').length;
  const naFila = depois.fila().length;
  // tudo ou nada: nunca a presença gravada sem o item da fila (ela nunca subiria)
  assert.equal(gravado, naFila, `presença gravada ${gravado}, na fila ${naFila}`);
});

test('AG1 (navegador): o que vai para o disco é o par presença + fila, nunca só a metade', () => {
  let disco: string | null = null;
  let gravacoes = 0;
  // "fecha o app" logo depois da primeira gravação no disco
  const arm = criarArmazenamentoEmMemoria(estadoVazio(), (e) => {
    gravacoes += 1;
    if (gravacoes === 1) disco = JSON.stringify(e);
  });
  gravarEEnfileirar(arm, realizado('r1'), 'ana', agoraFixo());
  const reaberto = criarArmazenamentoEmMemoria(JSON.parse(disco!) as Estado);
  assert.equal(presencasNoAparelho(reaberto, 'ana').length, 1);
  assert.equal(reaberto.fila().length, 1, 'a presença chegou ao disco sem o item da fila');
});

test('AG1: a refeição marcada e a antiga desmarcada vão juntas (o "apagar" da antiga não se perde)', () => {
  const { db, banco, controle } = bancoNode();
  const arm = criarArmazenamentoSqlite(banco);
  const repo = abrir(arm);
  const marca = (id: string): RefeicaoRegistrada => ({ id, alunoId: ID.ana, academiaId: ID.academia, planoId: 'plano-ana', refeicaoId: 'refeicao-jantar', data: '2026-10-14', estado: 'feita', feitaEm: '2026-10-14T20:00:00-03:00', registradaEm: '2026-10-14T20:00:00-03:00' });
  repo.registrarRefeicao(marca('m1'), ID.ana);
  // m1 subiu
  arm.removerItemDaFila('m1');
  controle.escritasAteCair = 2;
  assert.throws(() => repo.registrarRefeicao({ ...marca('m2'), estado: 'nao_segui', motivo: 'viagem' } as RefeicaoRegistrada, ID.ana));
  const depois = criarArmazenamentoSqlite(bancoNode(db).banco);
  // ou nada mudou (m1 continua, sem "apagar") ou tudo mudou (m2 gravada, m1:apagar e m2 na fila)
  const ids = depois.fila().map((i) => i.id).sort();
  const marcas = depois.colecao('refeicoes').filter(([, v]) => !(v as { __apagado?: boolean }).__apagado).map(([id]) => id);
  assert.ok(
    (ids.length === 0 && marcas.join() === 'm1') || (ids.join() === 'm1:apagar,m2' && marcas.join() === 'm2'),
    `fila ${ids.join()} · marcas ${marcas.join()}`,
  );
});

// ---------------------------------------------------------------------------
// AG2 — SQLite com disco cheio ou travado
// ---------------------------------------------------------------------------

test('AG2: disco cheio — o repositório devolve ErroDeArmazenamento e NÃO mostra o evento como salvo', async () => {
  const { db, banco, controle } = bancoNode();
  const repo = abrir(criarArmazenamentoSqlite(banco));
  const base = (await repo.eventos(ID.academia))[0]!;
  const evento: EventoDaAcademia = { ...base, id: 'evento-novo', nome: 'Seminário de quedas' };
  controle.falhar = 'database or disk is full';
  const erro = await repo.salvarEvento(evento).then(
    () => null,
    (e: unknown) => e,
  );
  assert.ok(erro instanceof ErroDeArmazenamento, `veio ${String(erro)}`);
  assert.equal(erro.codigo, 'armazenamento');
  assert.equal(erro.motivo, 'cheio');
  assert.ok(!erro.message.includes('Seminário'), 'o erro não repete o conteúdo');
  // a tela relê e não vê um evento que não está no disco
  assert.ok(!(await repo.eventos(ID.academia)).some((e) => e.id === evento.id));
  // o disco liberou: "Tentar de novo" grava, e sobrevive a reabrir
  controle.falhar = null;
  await repo.salvarEvento(evento);
  const reaberto = abrir(criarArmazenamentoSqlite(bancoNode(db).banco));
  assert.ok((await reaberto.eventos(ID.academia)).some((e) => e.id === evento.id));
});

test('AG2: banco travado no check-in — erro tipado (motivo "travado") e a fila fica como estava', () => {
  const { banco, controle } = bancoNode();
  const arm = criarArmazenamentoSqlite(banco);
  const repo = abrir(arm);
  repo.registrarPresencas([realizado('r1', 1, ID.ana)], 'checkin', ID.ana);
  controle.falhar = 'database is locked';
  assert.throws(
    () => repo.registrarPresencas([realizado('r1', 2, ID.ana)], 'checkin', ID.ana),
    (e: unknown) => e instanceof ErroDeArmazenamento && e.motivo === 'travado',
  );
  controle.falhar = null;
  // a versão 1 continua inteira; o toque seguinte regrava a presença toda
  assert.equal((arm.fila()[0]?.carga as Presenca).atualizadaEm, realizado('r1', 1).atualizadaEm);
  repo.registrarPresencas([realizado('r1', 3, ID.ana)], 'checkin', ID.ana);
  assert.equal((arm.fila()[0]?.carga as Presenca).atualizadaEm, realizado('r1', 3).atualizadaEm);
});

test('AG2: o erro da gravação diz à tela o que mostrar', () => {
  assert.equal(tipoDoErroDeGravacao(new ErroDeArmazenamento('cheio')), 'armazenamento');
  assert.equal(tipoDoErroDeGravacao(new ErroSemSinal()), 'sem_sinal');
  assert.equal(tipoDoErroDeGravacao(new Error('aviso recusado: link')), 'recusado');
  assert.equal(textoDoErroDeGravacao(new ErroDeArmazenamento('cheio')), 'Não deu para salvar. O celular está sem espaço.');
  assert.equal(textoDoErroDeGravacao(new ErroDeArmazenamento('travado')), 'Não deu para salvar.');
  assert.equal(textoDoErroDeGravacao(new ErroSemSinal()), 'Sem sinal. Isso precisa de internet.');
  assert.equal(textoDoErroDeGravacao(new Error('x')), 'Não deu para salvar.');
});

// ---------------------------------------------------------------------------
// AG3 — navegador sem espaço
// ---------------------------------------------------------------------------

function comLocalStorage<T>(f: (ls: { cheio: boolean; guardado: () => string | null }) => T): T {
  const mapa = new Map<string, string>();
  const ls = { cheio: false, guardado: () => mapa.get('academia-plus:armazenamento-local') ?? null };
  const falso = {
    getItem: (k: string) => mapa.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (ls.cheio) {
        const e = new Error('The quota has been exceeded.');
        e.name = 'QuotaExceededError';
        throw e;
      }
      mapa.set(k, v);
    },
    removeItem: (k: string) => void mapa.delete(k),
  };
  const antes = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { value: falso, configurable: true, writable: true });
  try {
    return f(ls);
  } finally {
    if (antes) Object.defineProperty(globalThis, 'localStorage', antes);
    else delete (globalThis as { localStorage?: unknown }).localStorage;
  }
}

test('AG3: navegador cheio — a gravação avisa (ErroDeArmazenamento "cheio") e nada fica pela metade', () => {
  comLocalStorage((ls) => {
    const arm = abrirNoNavegador();
    arm.gravarNaColecao('eventos', 'e1', { id: 'e1' });
    ls.cheio = true;
    assert.throws(
      () => gravarEEnfileirar(arm, realizado('r1'), 'ana', agoraFixo()),
      (e: unknown) => e instanceof ErroDeArmazenamento && e.motivo === 'cheio',
    );
    // o que não foi para o disco também não aparece como gravado
    assert.equal(presencasNoAparelho(arm, 'ana').length, 0);
    assert.equal(arm.fila().length, 0);
    // liberou espaço: grava, e o disco tem o novo e o antigo
    ls.cheio = false;
    gravarEEnfileirar(arm, realizado('r1'), 'ana', agoraFixo());
    const disco = JSON.parse(ls.guardado()!) as Estado;
    assert.ok(disco.colecoes.presencas?.['r1|ana'] && disco.fila[idDe('r1')] && disco.colecoes.eventos?.e1);
  });
});

// ---------------------------------------------------------------------------
// AG4 — item estragado na fila
// ---------------------------------------------------------------------------

test('AG4: um item com o instante estragado não trava a fila inteira (e não é apagado)', async () => {
  const { banco } = bancoNode();
  const arm = criarArmazenamentoSqlite(banco);
  gravarEEnfileirar(arm, realizado('bom1'), 'ana', '2026-10-14T10:00:00-03:00');
  banco.rodar("insert into fila_de_envio (id, tipo, usuario_id, carga_json, criado_em, tentativas, estado) values ('ruim', 'checkin', 'ana', ?, 'ontem à noite', 0, 'pendente')", [JSON.stringify(realizado('ruim'))]);
  banco.rodar("insert into fila_de_envio (id, tipo, usuario_id, carga_json, criado_em, tentativas, estado) values ('quebrado', 'checkin', 'ana', '{nao e json', '2026-10-14T09:00:00-03:00', 0, 'pendente')");
  gravarEEnfileirar(arm, realizado('bom2'), 'ana', '2026-10-14T11:00:00-03:00');
  const { destino, recebidos } = destinoQueAnota();
  await enviarFila(arm, destino, sessao, agoraFixo);
  assert.deepEqual(recebidos.slice(0, 2), [idDe('bom1'), idDe('bom2')]);
  // a linha com JSON quebrado fica guardada (nunca se apaga dado do aluno)
  assert.equal(banco.um<{ n: number }>("select count(*) as n from fila_de_envio where id = 'quebrado'")?.n, 1);
});

// ---------------------------------------------------------------------------
// AG5 — o relógio volta no meio
// ---------------------------------------------------------------------------

test('AG5: relógio voltou entre desmarcar e marcar de novo — o "apagar" da marca velha sobe ANTES da marca nova', async () => {
  const arm = criarArmazenamentoEmMemoria();
  const marca = (id: string, estado: 'feita' | 'nao_segui'): RefeicaoRegistrada => ({ id, alunoId: 'ana', academiaId: 'raca-fight', planoId: 'p', refeicaoId: 'almoco', data: '2026-10-14', estado, registradaEm: '2026-10-14T12:30:00-03:00' });
  // m1 já subiu; desmarcou às 12:40
  enfileirarApagarRefeicao(arm, marca('m1', 'feita'), 'ana', '2026-10-14T12:40:00-03:00');
  // o relógio do aparelho voltou 1 hora (acerto de rede, troca manual)
  gravarRefeicaoEEnfileirar(arm, marca('m2', 'nao_segui'), 'ana', '2026-10-14T11:41:00-03:00');
  const { destino, recebidos } = destinoQueAnota();
  await enviarFila(arm, destino, sessao, agoraFixo);
  // com uma marca por (aluno, refeição, data) no servidor, a ordem inversa recusaria a nova ou apagaria a errada
  assert.deepEqual(recebidos, ['m1:apagar', 'm2']);
});

// ---------------------------------------------------------------------------
// AG6 — 1.000 itens na fila
// ---------------------------------------------------------------------------

for (const [nome, criar] of [
  ['SQLite', () => criarArmazenamentoSqlite(bancoNode().banco)],
  ['memória', () => criarArmazenamentoEmMemoria()],
] as const) {
  test(`AG6 (${nome}): 1.000 presenças na fila sobem todas, em ordem e sem reler a fila a cada item`, async () => {
    const arm: ArmazenamentoLocal = criar();
    for (let i = 0; i < 1000; i += 1) {
      const mm = String(Math.floor(i / 60)).padStart(2, '0');
      const ss = String(i % 60).padStart(2, '0');
      gravarEEnfileirar(arm, realizado(`r${String(i).padStart(4, '0')}`), 'ana', `2026-10-14T10:${mm}:${ss}-03:00`);
    }
    const { destino, recebidos } = destinoQueAnota();
    const t = performance.now();
    const r = await enviarFila(arm, destino, sessao, agoraFixo);
    const ms = performance.now() - t;
    assert.equal(r.enviados, 1000);
    assert.equal(arm.fila().length, 0);
    assert.deepEqual(recebidos, [...recebidos].sort());
    assert.equal(presencasNoAparelho(arm, 'ana').filter((x) => x.sincronizadaEm).length, 1000);
    // antes: 41 s no SQLite e 16 s na memória (a fila relida e reinterpretada a cada item)
    assert.ok(ms < 4000, `levou ${Math.round(ms)} ms`);
  });
}

// ---------------------------------------------------------------------------
// AG7 — instante comparado como texto
// ---------------------------------------------------------------------------

test('AG7: o aviso em vigor é o mais recente pelo INSTANTE', async () => {
  const arm = criarArmazenamentoEmMemoria();
  const hoje = new Date().toLocaleDateString('sv-SE');
  const aviso = (id: string, publicadoEm: string) => ({ id, academiaId: ID.academia, texto: id, publicadoEm, validadeDias: 14, comNotificacao: false, autorId: ID.sergio });
  // 23:00 em -03:00 (02:00Z de amanhã) é DEPOIS de 23:30 em +09:00 (14:30Z de hoje)
  arm.gravarNaColecao('avisos', 'depois', aviso('depois', `${hoje}T23:00:00-03:00`));
  arm.gravarNaColecao('avisos', 'antes', aviso('antes', `${hoje}T23:30:00+09:00`));
  const repo = abrir(arm);
  assert.equal((await repo.avisoDaAcademia(ID.academia))?.id, 'depois');
});

// ---------------------------------------------------------------------------
// AG8 — preferências de uma versão antiga
// ---------------------------------------------------------------------------

test('AG8: preferências gravadas sem as chaves novas voltam completas (o que falta vem do padrão)', async () => {
  const arm = criarArmazenamentoEmMemoria();
  arm.gravarNaColecao('preferencias-de-aviso', ID.ana, { cronometro: false, personal: true, mensagens: true, academia: true, lembreteDeTreino: { ligado: true, dias: ['seg'], hora: '07:00' } });
  const repo = abrir(arm);
  const p = await repo.preferenciasDeAviso(ID.ana);
  assert.equal(p.cronometro, false);
  assert.equal(p.assinatura, PREFERENCIAS_PADRAO.assinatura);
  assert.deepEqual(p.lembreteDeRefeicao, PREFERENCIAS_PADRAO.lembreteDeRefeicao);
  assert.equal(p.lembreteDeTreino.hora, '07:00');
});

// tipos usados só nos testes acima
export type { ItemDaFila };

// ---------------------------------------------------------------------------
// AG9 — preferência do aparelho com o disco cheio não derruba "Sair"
// ---------------------------------------------------------------------------

test('AG9: "Sair", "Trocar de visão" e a vibração não lançam erro com o disco cheio (a tela segue; a falha fica registrada)', async () => {
  const { gravarPreferenciaSemTravar } = await import('./preferencias.ts');
  const { banco, controle } = bancoNode();
  const arm = criarArmazenamentoSqlite(banco);
  arm.gravarPreferencia('sessao.usuarioId', ID.ana);
  controle.falhar = 'database or disk is full';
  assert.equal(gravarPreferenciaSemTravar(arm, 'sessao.usuarioId', null), false);
  controle.falhar = null;
  assert.equal(gravarPreferenciaSemTravar(arm, 'sessao.usuarioId', null), true);
  assert.equal(arm.lerPreferencia('sessao.usuarioId'), null);
});

test('AG9: o estado só do aparelho (cronômetro, aviso dispensado) com o disco cheio não lança — gravado dentro de um useEffect, derrubaria a tela', () => {
  const { banco, controle } = bancoNode();
  const repo = abrir(criarArmazenamentoSqlite(banco));
  controle.falhar = 'database or disk is full';
  assert.doesNotThrow(() => repo.gravarNoAparelho('cronometro.ana', '{"estado":"rodando"}'));
});

// ---------------------------------------------------------------------------
// AG10 — o pedido de vínculo (e a conta nova) precisa de sinal, como o pedido de treino
// ---------------------------------------------------------------------------

test('AG10: sem sinal, criar conta, pedir para entrar e cancelar o pedido recusam com ErroSemSinal e nada é gravado', async () => {
  const arm = criarArmazenamentoEmMemoria();
  const repo = abrir(arm);
  const conta = await repo.criarConta({ nome: 'Paula Gomes', email: 'paula@exemplo.com' });
  const pedido = await repo.pedirVinculo(conta.id, ID.academia, 'aluno');
  repo.destino.semRede = true;
  await assert.rejects(repo.criarConta({ nome: 'Rui', email: 'rui@exemplo.com' }), ErroSemSinal);
  await assert.rejects(repo.pedirVinculo(ID.ana, 'outra-academia', 'aluno'), ErroSemSinal);
  await assert.rejects(repo.cancelarPedidoDeVinculo(pedido.id, conta.id), ErroSemSinal);
  assert.equal(await repo.usuarioPeloEmail('rui@exemplo.com'), null);
  assert.equal((await repo.vinculosDoUsuario(conta.id))[0]?.estado, 'pendente');
  // controle: com sinal, o mesmo cancelamento passa
  repo.destino.semRede = false;
  await repo.cancelarPedidoDeVinculo(pedido.id, conta.id);
  assert.equal((await repo.vinculosDoUsuario(conta.id))[0]?.estado, 'encerrado');
});
