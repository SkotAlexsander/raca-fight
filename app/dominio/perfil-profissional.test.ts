import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import type { PerfilProfissional, Vinculo } from './tipos.ts';
import { ESPECIALIDADES } from './tipos.ts';
import {
  LIMITE_DO_SOBRE,
  LIMITE_DA_FORMACAO,
  criarPerfilProfissional,
  editarPerfilProfissional,
  equipeParaMostrar,
  especialidadesDaEquipe,
  lerCref,
  limparSobre,
  perfilVisivelAosAlunos,
  podeTerPerfil,
  podeVerPerfil,
} from './perfil-profissional.ts';

const AGORA = '2026-10-11T10:00:00-03:00';
const DEPOIS = '2026-10-11T11:00:00-03:00';

function vinculo(m: Partial<Vinculo> = {}): Vinculo {
  return { id: 'v-carlos', usuarioId: 'carlos', academiaId: 'acad-1', papel: 'instrutor', estado: 'ativo', desde: '2026-01-10', ...m };
}

function perfil(m: Partial<PerfilProfissional> = {}): PerfilProfissional {
  return {
    ...criarPerfilProfissional(vinculo(), { id: 'p-carlos', nomeExibicao: 'Carlos', formacao: 'Professor de Educação Física' }, AGORA),
    ...m,
  };
}

const ALUNA = { usuarioId: 'ana', vinculos: [vinculo({ id: 'v-ana', usuarioId: 'ana', papel: 'aluno' })] };
const DONO = { usuarioId: 'marcos', vinculos: [vinculo({ id: 'v-marcos', usuarioId: 'marcos', papel: 'dono' })] };
const CARLOS = { usuarioId: 'carlos', vinculos: [vinculo()] };

// ---------------------------------------------------------------------------
describe('perfil profissional: CREF', () => {
  test('aceita número, categoria G ou P e UF válida; devolve na forma do CONFEF', () => {
    assert.equal(lerCref('123456-G/SP'), '123456-G/SP');
    assert.equal(lerCref('CREF 012345-G/SP'), '012345-G/SP');
    assert.equal(lerCref('  012345 g sp '), '012345-G/SP');
    // sem completar zeros: o número fica como foi escrito (R11.2, "inteiro, como foi escrito")
    assert.equal(lerCref('4567-P/rj'), '4567-P/RJ');
    assert.equal(lerCref('000123-g/df'), '000123-G/DF');
  });

  test('recusa categoria, UF ou número fora do formato', () => {
    for (const ruim of ['', '123456', '123456-X/SP', '123456-G/XX', '1234567-G/SP', 'ABC-G/SP', '123456-G', '123456/SP', '12.345-G/SP', '123456-G/SP extra']) {
      assert.equal(lerCref(ruim), null, ruim);
    }
  });
});

// ---------------------------------------------------------------------------
describe('perfil profissional: "Sobre mim"', () => {
  test('limpa espaço, linha em branco demais e caractere invisível; conta caractere, não unidade UTF-16', () => {
    const { texto } = limparSobre('  Oi,   sou o Carlos.​ \n\n\n\nTreino   funcional. ‮olleh\t ');
    assert.equal(texto, 'Oi, sou o Carlos.\n\nTreino funcional. olleh');
    assert.deepEqual(limparSobre('💪'.repeat(LIMITE_DO_SOBRE)).problemas, []);
    assert.deepEqual(limparSobre('💪'.repeat(LIMITE_DO_SOBRE + 1)).problemas, ['longo_demais']);
  });

  test('aponta contato pessoal (telefone, e-mail, @, link): o perfil nunca tem contato (R11.6)', () => {
    for (const t of ['Me chama no (11) 98765-4321', 'carlos@gmail.com', 'Siga @carlos.personal', 'Agenda em wa.me/5511987654321', 'Site: https://carlos.com']) {
      assert.ok(limparSobre(t).problemas.includes('tem_contato'), t);
    }
    for (const t of ['Formado em 2010, 15 anos de sala.', 'CREF 012345-G/SP.', 'Atendo das 6h às 10h.']) {
      assert.deepEqual(limparSobre(t).problemas, [], t);
    }
  });
});

// ---------------------------------------------------------------------------
describe('perfil profissional: criar e editar', () => {
  test('só vínculo de equipe ativo tem perfil (R11.1); nasce invisível e não conferido', () => {
    assert.equal(podeTerPerfil(vinculo()), true);
    assert.equal(podeTerPerfil(vinculo({ papel: 'dono' })), true);
    assert.equal(podeTerPerfil(vinculo({ papel: 'aluno' })), false);
    assert.equal(podeTerPerfil(vinculo({ estado: 'pendente' })), false);
    assert.throws(() => criarPerfilProfissional(vinculo({ papel: 'aluno' }), { id: 'x', nomeExibicao: 'A', formacao: 'B' }, AGORA), /equipe/);
    const p = perfil();
    assert.equal(p.visivelAosAlunos, false);
    assert.equal(p.ocultadoPeloDono, false);
    assert.equal(p.crefConferido, false);
    assert.equal(p.vinculoId, 'v-carlos');
    assert.equal(p.academiaId, 'acad-1');
    assert.equal(p.atualizadoEm, AGORA);
  });

  test('o profissional edita o seu; trocar o CREF desfaz a conferência; ligar a chave guarda a data (R11.8)', () => {
    const conferido = perfil({ cref: '012345-G/SP', crefConferido: true });
    const p = editarPerfilProfissional(conferido, { cref: '999999-G/SP', especialidades: ['funcional', 'musculacao'], visivelAosAlunos: true }, CARLOS, DEPOIS);
    assert.equal(p.cref, '999999-G/SP');
    assert.equal(p.crefConferido, false);
    assert.equal(p.visivelAosAlunos, true);
    assert.equal(p.visivelDesde, DEPOIS);
    assert.equal(p.atualizadoEm, DEPOIS);
    assert.equal(conferido.cref, '012345-G/SP', 'o recebido não muda');
    // mesmo CREF digitado de outro jeito não desfaz a conferência
    assert.equal(editarPerfilProfissional(conferido, { cref: 'cref 012345 g sp' }, CARLOS, DEPOIS).crefConferido, true);
  });

  test('ninguém pelo app marca o CREF como conferido; o profissional não mexe no "escondido"', () => {
    assert.throws(() => editarPerfilProfissional(perfil(), { crefConferido: true }, CARLOS, DEPOIS), /crefConferido/);
    assert.throws(() => editarPerfilProfissional(perfil(), { crefConferido: true }, DONO, DEPOIS), /crefConferido/);
    assert.throws(() => editarPerfilProfissional(perfil(), { ocultadoPeloDono: false }, CARLOS, DEPOIS), /ocultadoPeloDono/);
  });

  test('o dono só esconde ou mostra; escondido, a chave do profissional fica travada (R11.7)', () => {
    const escondido = editarPerfilProfissional(perfil({ visivelAosAlunos: true }), { ocultadoPeloDono: true }, DONO, DEPOIS);
    assert.equal(escondido.ocultadoPeloDono, true);
    assert.throws(() => editarPerfilProfissional(perfil(), { sobre: 'outro texto' }, DONO, DEPOIS), /sobre/);
    assert.throws(() => editarPerfilProfissional(escondido, { visivelAosAlunos: false }, CARLOS, DEPOIS), /escondido pelo dono/);
    // o resto do perfil continua editável por ele
    assert.equal(editarPerfilProfissional(escondido, { formacao: 'Bacharel em Educação Física' }, CARLOS, DEPOIS).formacao, 'Bacharel em Educação Física');
    // dono de OUTRA academia não esconde
    const outroDono = { usuarioId: 'z', vinculos: [vinculo({ id: 'v-z', usuarioId: 'z', papel: 'dono', academiaId: 'acad-2' })] };
    assert.throws(() => editarPerfilProfissional(perfil(), { ocultadoPeloDono: true }, outroDono, DEPOIS), /não pode editar/);
    // aluno não edita nada
    assert.throws(() => editarPerfilProfissional(perfil(), { nomeExibicao: 'X' }, ALUNA, DEPOIS), /não pode editar/);
  });

  test('campos validados: nome, formação até 60, CREF, especialidades da lista, "outra" com texto, turnos sem repetir, foto https', () => {
    const e = (m: Parameters<typeof editarPerfilProfissional>[1]) => () => editarPerfilProfissional(perfil(), m, CARLOS, DEPOIS);
    assert.throws(e({ nomeExibicao: '   ' }), /nomeExibicao/);
    assert.throws(e({ formacao: 'x'.repeat(LIMITE_DA_FORMACAO + 1) }), /formacao/);
    assert.throws(e({ cref: '123-X/ZZ' }), /CREF/);
    assert.throws(e({ especialidades: ['yoga' as never] }), /especialidade/);
    assert.throws(e({ especialidades: ['hiit', 'hiit'] }), /repetida/);
    assert.throws(e({ especialidades: ['outra'] }), /especialidadeOutra/);
    assert.equal(editarPerfilProfissional(perfil(), { especialidades: ['outra'], especialidadeOutra: ' Corrida de rua ' }, CARLOS, DEPOIS).especialidadeOutra, 'Corrida de rua');
    assert.throws(e({ turnos: [{ dia: 'seg', periodo: 'manha' }, { dia: 'seg', periodo: 'manha' }] }), /turno repetido/);
    assert.throws(e({ turnos: [{ dia: 'segunda' as never, periodo: 'manha' }] }), /turno/);
    assert.throws(e({ fotoUrl: 'javascript:alert(1)' }), /fotoUrl/);
    assert.throws(e({ fotoUrl: 'http://exemplo.com/a.jpg' }), /fotoUrl/);
    assert.throws(e({ sobre: 'Me chama: carlos@gmail.com' }), /contato/);
    assert.equal(editarPerfilProfissional(perfil(), { cref: null }, CARLOS, DEPOIS).cref, undefined, 'null apaga o CREF');
    // a lista fixa (R11.3) mais "outra"
    assert.deepEqual([...ESPECIALIDADES], ['musculacao', 'funcional', 'hiit', 'reabilitacao', 'idosos', 'iniciantes', 'outra']);
  });
});

// ---------------------------------------------------------------------------
describe('perfil profissional: quem vê (espelho da RLS, R11.4 e R11.5)', () => {
  const visivel = perfil({ visivelAosAlunos: true });
  const vDoCarlos = vinculo();

  test('aluno com vínculo ativo na mesma academia vê só o perfil visível, não escondido, de vínculo ativo', () => {
    assert.equal(podeVerPerfil(visivel, ALUNA, vDoCarlos), true);
    assert.equal(podeVerPerfil(perfil(), ALUNA, vDoCarlos), false, 'chave desligada');
    assert.equal(podeVerPerfil({ ...visivel, ocultadoPeloDono: true }, ALUNA, vDoCarlos), false, 'escondido pelo dono');
    assert.equal(podeVerPerfil(visivel, ALUNA, vinculo({ estado: 'encerrado' })), false, 'profissional saiu da academia');
    assert.equal(perfilVisivelAosAlunos(visivel, vDoCarlos), true);
  });

  test('aluno pendente, sem academia ou de outra academia não vê', () => {
    const pendente = { usuarioId: 'bia', vinculos: [vinculo({ usuarioId: 'bia', papel: 'aluno', estado: 'pendente' })] };
    const semAcademia = { usuarioId: 'caio', vinculos: [] };
    const deOutra = { usuarioId: 'duda', vinculos: [vinculo({ usuarioId: 'duda', papel: 'aluno', academiaId: 'acad-2' })] };
    for (const quem of [pendente, semAcademia, deOutra]) {
      assert.equal(podeVerPerfil(visivel, quem, vDoCarlos), false, quem.usuarioId);
    }
  });

  test('o próprio vê sempre; o dono vê todos da academia dele; a equipe vê os visíveis', () => {
    assert.equal(podeVerPerfil(perfil(), CARLOS, vDoCarlos), true);
    assert.equal(podeVerPerfil({ ...perfil(), ocultadoPeloDono: true }, CARLOS, vinculo({ estado: 'encerrado' })), true);
    assert.equal(podeVerPerfil(perfil(), DONO, vDoCarlos), true);
    const colega = { usuarioId: 'rita', vinculos: [vinculo({ usuarioId: 'rita', papel: 'recepcao' })] };
    assert.equal(podeVerPerfil(visivel, colega, vDoCarlos), true);
    assert.equal(podeVerPerfil(perfil(), colega, vDoCarlos), false);
    const donoEncerrado = { usuarioId: 'marcos', vinculos: [vinculo({ usuarioId: 'marcos', papel: 'dono', estado: 'encerrado' })] };
    assert.equal(podeVerPerfil(perfil(), donoEncerrado, vDoCarlos), false);
  });

  test('o vínculo passado tem de ser o do perfil (senão é erro de programação, não "pode ver")', () => {
    assert.throws(() => podeVerPerfil(visivel, ALUNA, vinculo({ id: 'outro' })), /vínculo/);
  });
});

// ---------------------------------------------------------------------------
describe('perfil profissional: a lista da Equipe', () => {
  const p = (id: string, nome: string, especialidades: PerfilProfissional['especialidades']): PerfilProfissional =>
    perfil({ id, nomeExibicao: nome, especialidades, visivelAosAlunos: true });
  const equipe = [p('1', 'Úrsula', ['idosos']), p('2', 'ana', ['hiit', 'funcional']), p('3', 'Álvaro', ['musculacao']), p('4', 'Bruno', ['hiit'])];

  test('ordem alfabética do nome de exibição, sem acento nem maiúscula mudarem a ordem (R11.9)', () => {
    assert.deepEqual(equipeParaMostrar(equipe).map((x) => x.nomeExibicao), ['Álvaro', 'ana', 'Bruno', 'Úrsula']);
    assert.deepEqual(equipe.map((x) => x.id), ['1', '2', '3', '4'], 'a lista recebida não muda');
  });

  test('filtro por especialidade; os chips são só as que alguém marcou, na ordem da lista (R11.13)', () => {
    assert.deepEqual(equipeParaMostrar(equipe, { especialidade: 'hiit' }).map((x) => x.id), ['2', '4']);
    assert.deepEqual(especialidadesDaEquipe(equipe), ['musculacao', 'funcional', 'hiit', 'idosos']);
    assert.deepEqual(especialidadesDaEquipe([]), []);
  });

  test('perfil invisível ou escondido que chegou por engano não entra na lista', () => {
    const lista = [...equipe, perfil({ id: '5', nomeExibicao: 'Zé' }), perfil({ id: '6', nomeExibicao: 'Yara', visivelAosAlunos: true, ocultadoPeloDono: true })];
    assert.deepEqual(equipeParaMostrar(lista).map((x) => x.id), ['3', '2', '4', '1']);
  });
});

describe('perfil profissional: luta (R16.14)', () => {
  test('o professor informa as modalidades e a graduação dele; o texto vazio some', async () => {
    const { criarPerfilProfissional, editarPerfilProfissional } = await import('./perfil-profissional.ts');
    const v: Vinculo = { id: 'v-diego', usuarioId: 'diego', academiaId: 'raca-fight', papel: 'instrutor', estado: 'ativo', desde: '2025-01-01' };
    const p = criarPerfilProfissional(v, { id: 'p', nomeExibicao: 'Diego', formacao: 'Professor de Muay Thai' }, '2026-10-15T10:00:00-03:00');
    const e = editarPerfilProfissional(p, { modalidadeIds: ['muay-thai', 'muay-thai'], graduacaoInformada: [{ modalidadeId: 'muay-thai', texto: ' Kruang preto ' }, { modalidadeId: 'boxe', texto: ' ' }] }, { usuarioId: 'diego', vinculos: [v] }, '2026-10-15T11:00:00-03:00');
    assert.deepEqual(e.modalidadeIds, ['muay-thai']);
    assert.deepEqual(e.graduacaoInformada, [{ modalidadeId: 'muay-thai', texto: 'Kruang preto' }]);
    assert.throws(() => editarPerfilProfissional(p, { graduacaoInformada: [{ modalidadeId: 'muay-thai', texto: 'x'.repeat(41) }] }, { usuarioId: 'diego', vinculos: [v] }, 'x'), /40/);
  });
});
