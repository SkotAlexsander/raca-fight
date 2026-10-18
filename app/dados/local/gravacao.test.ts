/**
 * A GRAVAÇÃO do repositório local (agente AA, P11; luta no P12, agente AM2):
 * tudo o que as telas escrevem passa pela interface de `dados/` e sobrevive a
 * fechar e abrir o app. "Reabrir" aqui é montar um repositório novo, com os
 * dados de exemplo do zero, sobre o MESMO armazenamento.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ID, montarDadosDeExemplo } from './dados-de-exemplo.ts';
import { criarRepositorioLocal, ErroSemSinal } from './RepositorioLocal.ts';
import { criarArmazenamentoEmMemoria } from '../armazenamento/memoria.ts';
import type { ArmazenamentoLocal } from '../armazenamento/tipos.ts';
import { decidirDestino, entradaDaEquipe } from '../../dominio/papel.ts';
import { editarPerfilProfissional, equipeParaMostrar, podeVerPerfil } from '../../dominio/perfil-profissional.ts';
import { PREFERENCIAS_PADRAO } from '../../dominio/avisos.ts';
import { aulasEntre, cancelarAula, passarAula } from '../../dominio/turmas/turmas.ts';
import { dataNoFuso, msNoFuso, somarDias } from '../../dominio/turmas/horario.ts';
import { fazerCheckin, fecharChamada, contarNaAula } from '../../dominio/presenca/presenca.ts';
import { graduacaoAtual, registrarGraduacao } from '../../dominio/graduacao/graduacao.ts';
import { definirAutorizacaoDeImagem } from '../../dominio/kids/kids.ts';
import { enviarFila } from '../fila.ts';
import type { RefeicaoRegistrada } from '../../dominio/tipos.ts';

const FUSO = 'America/Sao_Paulo';
/** Um relógio fixo: a terça de 13/10/2026 às 19:45 em Gravataí (a janela da aula das 20h está aberta). */
const AGORA = msNoFuso('2026-10-13', '19:45', FUSO);
const abrir = (arm: ArmazenamentoLocal, agora = AGORA) => criarRepositorioLocal(montarDadosDeExemplo({ agora: new Date(agora) }), arm, () => agora);

test('contas de exemplo: aluno, responsável, professores, recepção e dono, cada um na sua porta', async () => {
  const repo = abrir(criarArmazenamentoEmMemoria());
  const contas = repo.contasDeExemplo().map((c) => c.usuarioId);
  assert.deepEqual(contas, [ID.lucas, ID.carla, ID.diego, ID.marcio, ID.simone, ID.sergio]);
  const papeis = async (id: string) => new Set((await repo.vinculosDoUsuario(id)).filter((v) => v.estado === 'ativo').map((v) => v.papel));
  assert.equal(entradaDaEquipe(await papeis(ID.diego)), 'professor');
  assert.equal(entradaDaEquipe(await papeis(ID.simone)), 'recepcao');
  assert.equal(entradaDaEquipe(await papeis(ID.sergio)), 'admin');
  const vs = await repo.vinculosDoUsuario(ID.lucas);
  assert.deepEqual(decidirDestino({ usuarioId: ID.lucas }, vs, null), { tipo: 'visao', visao: 'aluno', vinculoId: vs[0].id });
  assert.equal(vs[0].academia.codigoDaEquipe, 'T9K2WM');
  assert.notEqual(vs[0].academia.codigoDaEquipe, vs[0].academia.codigoDeVinculo);
});

test('entrada: conta nova, código da academia e o pedido pendente sobrevivem a reabrir', async () => {
  const arm = criarArmazenamentoEmMemoria();
  const repo = abrir(arm);
  const conta = await repo.criarConta({ nome: 'Paula Gomes', email: 'paula@exemplo.com' });
  const academia = await repo.academiaPeloCodigo('rcf4k2');
  assert.equal(academia?.id, ID.academia);
  assert.equal(await repo.academiaPeloCodigo('ZZZZZZ'), null);
  const v = await repo.pedirVinculo(conta.id, academia!.id, 'aluno');
  assert.equal(v.estado, 'pendente');
  await repo.salvarPerfilDoAluno({ usuarioId: conta.id, academiaId: academia!.id, objetivo: 'defesa_pessoal', autorizaAcademia: true, atualizadoEm: '2026-10-11T10:00:00-03:00' });
  const depois = abrir(arm);
  assert.equal((await depois.usuario(conta.id))?.nome, 'Paula Gomes');
  assert.deepEqual((await depois.vinculosDoUsuario(conta.id)).map((x) => [x.papel, x.estado]), [['aluno', 'pendente']]);
  assert.equal((await depois.perfilDoAluno(conta.id))?.objetivo, 'defesa_pessoal');
});

test('entrada da equipe: o código da equipe acha a academia; o dos alunos não', async () => {
  const repo = abrir(criarArmazenamentoEmMemoria());
  assert.equal((await repo.academiaPeloCodigoDaEquipe('T9K2WM'))?.id, ID.academia);
  assert.equal(await repo.academiaPeloCodigoDaEquipe('RCF4K2'), null);
  const conta = await repo.criarConta({ nome: 'Teo Alves', email: 'teo@exemplo.com' });
  const v = await repo.pedirVinculo(conta.id, ID.academia, 'instrutor');
  assert.equal(v.estado, 'pendente', 'a equipe sempre espera o dono');
  await repo.cancelarPedidoDeVinculo(v.id, conta.id);
  assert.equal((await repo.vinculosDoUsuario(conta.id))[0].estado, 'encerrado');
});

test('recepção: confirmar e encerrar vínculo gravam e voltam iguais', async () => {
  const arm = criarArmazenamentoEmMemoria();
  const repo = abrir(arm);
  await repo.confirmarVinculos(['vinculo-rita-aluno'], ID.simone);
  await repo.encerrarVinculo('vinculo-otavio-aluno', ID.sergio, 'cancelou_matricula');
  const depois = abrir(arm);
  assert.equal((await depois.vinculosDoUsuario(ID.rita))[0].estado, 'ativo');
  const otavio = (await depois.vinculosDoUsuario(ID.otavio))[0];
  assert.equal(otavio.estado, 'encerrado');
  assert.equal(otavio.motivoDeSaida, 'cancelou_matricula');
  const resumo = (await depois.alunosDaAcademia(ID.academia)).find((a) => a.ficha.alunoId === ID.otavio)!;
  assert.equal(resumo.vinculo, null, 'encerrado: sem vínculo ativo na lista');
});

test('check-in do aluno: grava NA HORA (síncrono), entra na fila e volta ao reabrir', async () => {
  const arm = criarArmazenamentoEmMemoria();
  const repo = abrir(arm);
  const luta = await repo.academiaDeLuta(ID.academia);
  const aula = aulasEntre(luta.turmas, '2026-10-13', '2026-10-13', FUSO).find((a) => a.turmaId === 'muay-thai-noite-1')!;
  const p = fazerCheckin({ aula, alunoId: ID.lucas, modalidadeId: 'muay-thai', porId: ID.lucas, agoraMs: AGORA, em: '2026-10-13T19:45:00-03:00', janela: luta.janela });
  const itens = repo.registrarPresencas([p], 'checkin', ID.lucas);
  assert.equal(itens.length, 1);
  assert.equal(itens[0].tipo, 'checkin');
  const depois = abrir(arm);
  const minhas = await depois.presencasDosAlunos([ID.lucas]);
  assert.equal(minhas.find((x) => x.aulaId === aula.id)?.estado, 'pendente');
  assert.equal(arm.fila().length, 1);
});

test('chamada do professor: confirma, retira e cria; o Hoje e a Chamada contam igual', async () => {
  const arm = criarArmazenamentoEmMemoria();
  const repo = abrir(arm);
  const luta = await repo.academiaDeLuta(ID.academia);
  const aula = aulasEntre(luta.turmas, '2026-10-13', '2026-10-13', FUSO).find((a) => a.turmaId === 'muay-thai-noite-1')!;
  const antes = await repo.presencasDaAcademia(ID.academia);
  const naAula = contarNaAula(aula.id, antes);
  assert.ok(naAula > 0, 'o exemplo já tem check-ins na aula da janela aberta');
  const pendentes = antes.filter((p) => p.aulaId === aula.id && p.estado === 'pendente').map((p) => p.alunoId);
  const presentes = new Set([...pendentes.slice(1), ID.davi]);
  const r = fecharChamada({ aula, presencas: antes, presentes, modalidadeDe: () => 'muay-thai', porId: ID.diego, em: '2026-10-13T20:10:00-03:00' });
  repo.registrarPresencas(r.mudadas, 'chamada', ID.diego);
  const depois = await abrir(arm).presencasDaAcademia(ID.academia);
  assert.equal(contarNaAula(aula.id, depois), presentes.size);
  assert.equal(depois.find((p) => p.aulaId === aula.id && p.alunoId === pendentes[0])?.estado, 'retirada');
  assert.equal(depois.find((p) => p.aulaId === aula.id && p.alunoId === ID.davi)?.origem, 'chamada');
});

test('cancelar a aula (com sinal) retira os check-ins; passar a aula muda o professor', async () => {
  const arm = criarArmazenamentoEmMemoria();
  const cedo = msNoFuso('2026-10-13', '10:00', FUSO);
  const repo = abrir(arm, cedo);
  const luta = await repo.academiaDeLuta(ID.academia);
  const [mma, boxe] = ['mma', 'boxe-noite'].map((t) => aulasEntre(luta.turmas, '2026-10-13', '2026-10-13', FUSO).find((a) => a.turmaId === t)!);
  repo.destino.semRede = true;
  await assert.rejects(repo.cancelarAula(cancelarAula(mma!, 'feriado', ID.marcio, cedo, '2026-10-13T10:00:00-03:00')), ErroSemSinal);
  repo.destino.semRede = false;
  await repo.cancelarAula(cancelarAula(mma!, 'feriado', ID.marcio, cedo, '2026-10-13T10:00:00-03:00'));
  await repo.passarAula(passarAula(boxe!, ID.diego, ID.renato, cedo, '2026-10-13T10:01:00-03:00'));
  const ajustes = await abrir(arm, cedo).ajustesDeAula(ID.academia);
  assert.deepEqual(ajustes.map((a) => a.tipo).sort(), ['cancelada', 'substituto']);
});

test('graduação: o professor registra (com sinal) e o aluno vê a nova depois de reabrir', async () => {
  const arm = criarArmazenamentoEmMemoria();
  const repo = abrir(arm);
  const luta = await repo.academiaDeLuta(ID.academia);
  const ibjjf = luta.sistemas.find((s) => s.id === 'ibjjf-adulto')!;
  const g = registrarGraduacao({ id: 'g-nova', academiaId: ID.academia, alunoId: ID.lucas, modalidadeId: 'jiu-jitsu', sistema: ibjjf, passo: { nivelId: 'branca', grau: 3 }, data: '2026-10-13', hoje: '2026-10-13', graduadoPorId: ID.marcio, origem: 'promocao', registradaPorId: ID.marcio, em: '2026-10-13T21:00:00-03:00' });
  repo.destino.semRede = true;
  await assert.rejects(repo.salvarGraduacao(g), ErroSemSinal);
  repo.destino.semRede = false;
  await repo.salvarGraduacao(g);
  const depois = await abrir(arm).graduacoesDosAlunos([ID.lucas]);
  assert.equal(graduacaoAtual(depois, ID.lucas, 'jiu-jitsu')?.grau, 3);
});

test('atleta, Atletas e "vou participar" gravam', async () => {
  const arm = criarArmazenamentoEmMemoria();
  const repo = abrir(arm);
  await repo.marcarAtleta(ID.ana, ID.academia, 'muay-thai', true);
  await repo.definirAparecerEmAtletas(ID.lucas, ID.academia, true);
  const vai = await repo.alternarParticipacao('evento-noite-de-lutas', ID.lucas);
  assert.ok(vai.includes(ID.lucas));
  const depois = abrir(arm);
  assert.deepEqual((await depois.fichasDaAcademia(ID.academia)).find((f) => f.alunoId === ID.ana)?.atletaEm, ['muay-thai']);
  assert.equal((await depois.consentimentosDeAtleta(ID.academia)).find((c) => c.alunoId === ID.lucas)?.ligado, true);
  assert.ok((await depois.participantes('evento-noite-de-lutas')).includes(ID.lucas));
});

test('Kids: o responsável liga a autorização de imagem do dependente e ela volta igual', async () => {
  const arm = criarArmazenamentoEmMemoria();
  const repo = abrir(arm);
  const [pedro] = await repo.dependentes(ID.carla);
  assert.equal(pedro!.autorizacaoDeImagem.ligada, false, 'nasce desligada');
  await repo.salvarDependente(definirAutorizacaoDeImagem(pedro!, true, '2026-10-13T10:00:00-03:00'));
  const depois = abrir(arm);
  assert.equal((await depois.dependentes(ID.carla))[0]!.autorizacaoDeImagem.ligada, true);
  // as fichas da Carla: a dela e a do Pedro
  assert.deepEqual((await depois.fichasDoUsuario(ID.carla)).map((f) => f.alunoId).sort(), [ID.carla, ID.pedro].sort());
});

test('experimental: a recepção registra (na grade) e o estado muda', async () => {
  const arm = criarArmazenamentoEmMemoria();
  const repo = abrir(arm);
  const luta = await repo.academiaDeLuta(ID.academia);
  const aula = aulasEntre(luta.turmas, '2026-10-14', '2026-10-20', FUSO).find((a) => a.turmaId === 'boxe-noite')!;
  await repo.salvarInteressado({ id: 'i-novo', academiaId: ID.academia, nome: 'Rui Matos', whatsapp: '5551900000099', modalidadeId: 'boxe', criadoEm: 'x', criadoPorId: ID.simone });
  await repo.salvarExperimental({ id: 'e-novo', academiaId: ID.academia, interessadoId: 'i-novo', aulaId: aula.id, turmaId: aula.turmaId, data: aula.data, modalidadeId: 'boxe', estado: 'agendada', marcadaPorId: ID.simone, criadaEm: 'x', atualizadaEm: 'x' });
  await assert.rejects(repo.salvarExperimental({ id: 'e-ruim', academiaId: ID.academia, interessadoId: 'i-novo', aulaId: 'nao@2026-10-14', turmaId: 'x', data: '2026-10-14', modalidadeId: 'boxe', estado: 'agendada', marcadaPorId: ID.simone, criadaEm: 'x', atualizadaEm: 'x' }), /grade/);
  const depois = abrir(arm);
  assert.ok((await depois.experimentais(ID.academia)).some((e) => e.id === 'e-novo'));
  assert.ok((await depois.interessados(ID.academia)).some((i) => i.id === 'i-novo'));
});

test('avisos da academia: publicar (com a regra do domínio), retirar, e o aluno só vê o em vigor', async () => {
  const arm = criarArmazenamentoEmMemoria();
  const repo = abrir(arm);
  await assert.rejects(() => repo.publicarAviso({ academiaId: ID.academia, texto: 'veja em www.exemplo.com', validadeDias: 3, comNotificacao: false, autorId: ID.simone }));
  const novo = await repo.publicarAviso({ academiaId: ID.academia, texto: 'Sábado tem aulão de Muay Thai às 10h.', validadeDias: 7, comNotificacao: true, autorId: ID.simone });
  const daTurma = await repo.publicarAviso({ academiaId: ID.academia, turmaId: 'muay-thai-kids', texto: 'Tragam a caneleira na quinta.', validadeDias: 3, comNotificacao: true, autorId: ID.diego });
  assert.equal(daTurma.turmaId, 'muay-thai-kids');
  assert.equal((await repo.avisoDaAcademia(ID.academia))?.id, novo.id, 'o aviso de turma não ocupa o lugar do aviso para todos');
  await repo.retirarAviso(novo.id, ID.simone);
  const depois = abrir(arm);
  assert.equal((await depois.avisosDaAcademia(ID.academia)).length, 3);
  assert.equal((await depois.avisoDaAcademia(ID.academia))?.id, 'aviso-open', 'o retirado sai do Início');
});

test('perfil profissional: o professor liga a chave e o dono esconde; a aluna vê o que deve', async () => {
  const arm = criarArmazenamentoEmMemoria();
  const repo = abrir(arm);
  const equipe = await repo.equipe(ID.academia);
  const renato = equipe.find((m) => m.usuario.id === ID.renato)!;
  const sergio = await repo.vinculosDoUsuario(ID.sergio);
  await repo.salvarPerfilProfissional(editarPerfilProfissional(renato.perfil!, { ocultadoPeloDono: true }, { usuarioId: ID.sergio, vinculos: sergio }, '2026-10-11T10:00:00-03:00'));
  const depois = abrir(arm);
  const ana = { usuarioId: ID.ana, vinculos: await depois.vinculosDoUsuario(ID.ana) };
  const membros = await depois.equipe(ID.academia);
  const vistos = equipeParaMostrar(membros.filter((m) => m.perfil && podeVerPerfil(m.perfil, ana, m.vinculo)).map((m) => m.perfil!)).map((p) => p.nomeExibicao);
  assert.ok(vistos.includes('Diego Moura'));
  assert.ok(!vistos.includes('Renato Lopes'), 'o dono escondeu');
});

test('preferências: avisos do aluno e da equipe, com o padrão na primeira vez', async () => {
  const arm = criarArmazenamentoEmMemoria();
  const repo = abrir(arm);
  assert.deepEqual(await repo.preferenciasDeAviso(ID.lucas), PREFERENCIAS_PADRAO);
  await repo.salvarPreferenciasDeAviso(ID.lucas, { ...PREFERENCIAS_PADRAO, academia: false });
  const depois = abrir(arm);
  assert.equal((await depois.preferenciasDeAviso(ID.lucas)).academia, false);
});

test('aluno: peso e a autorização voltam depois de reabrir', async () => {
  const arm = criarArmazenamentoEmMemoria();
  const repo = abrir(arm);
  await repo.registrarMedicao({ id: 'medicao-nova', alunoId: ID.lucas, academiaId: ID.academia, data: '2026-10-11', pesoGramas: 68000, registradoPorId: ID.lucas });
  const perfil = (await repo.perfilDoAluno(ID.lucas))!;
  await repo.salvarPerfilDoAluno({ ...perfil, autorizaAcademia: true });
  const depois = abrir(arm);
  assert.equal((await depois.medicoesDoAluno(ID.lucas)).at(-1)?.pesoGramas, 68000);
  assert.equal((await depois.perfilDoAluno(ID.lucas))?.autorizaAcademia, true);
});

test('refeição (dieta desligada na v1, a mecânica fica): marcar entra na fila e sobe', async () => {
  const arm = criarArmazenamentoEmMemoria();
  const repo = abrir(arm);
  const r: RefeicaoRegistrada = { id: 'r-1', alunoId: ID.lucas, academiaId: ID.academia, planoId: 'p', refeicaoId: 'jantar', data: '2026-10-11', estado: 'nao_segui', motivo: 'Jantei fora', registradaEm: '2026-10-11T21:00:00-03:00' };
  const item = repo.registrarRefeicao(r, ID.lucas);
  assert.equal(item.tipo, 'refeicao_registrada');
  const res = await enviarFila(arm, { enviar: async () => {} }, { usuarioId: ID.lucas, valida: true }, () => '2026-10-11T21:05:00-03:00');
  assert.equal(res.enviados, 1);
  assert.equal((await abrir(arm).refeicoesRegistradas(ID.lucas, '2026-10-11'))[0]?.sincronizadoEm, '2026-10-11T21:05:00-03:00');
});

test('aparelho: o que fica só no celular (cronômetro, aviso dispensado) volta ao reabrir', () => {
  const arm = criarArmazenamentoEmMemoria();
  abrir(arm).gravarNoAparelho('cronometro.usuario-lucas', '{"x":1}');
  assert.equal(abrir(arm).lerDoAparelho('cronometro.usuario-lucas'), '{"x":1}');
  abrir(arm).gravarNoAparelho('cronometro.usuario-lucas', null);
  assert.equal(abrir(arm).lerDoAparelho('cronometro.usuario-lucas'), null);
});

test('a vitrine sem conta: a grade real e os professores, sem dado de aluno', async () => {
  const repo = abrir(criarArmazenamentoEmMemoria());
  const v = await repo.academiaDaVitrine();
  assert.equal(v.contato.whatsapp, '(51) 98196-2077');
  assert.equal(v.turmas.length, 11);
  assert.equal(dataNoFuso(AGORA, v.fuso), '2026-10-13');
  assert.equal(somarDias('2026-10-13', 1), '2026-10-14');
});
