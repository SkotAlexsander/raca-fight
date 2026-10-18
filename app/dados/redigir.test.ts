/**
 * O filtro de registro não pode envelhecer: este teste LÊ `dominio/tipos.ts` e
 * confere cada campo de cada tipo que a regra R6.1 trata como dado de saúde
 * (03-DECISOES-TECNICAS.md, seção 5). Campo novo num desses tipos entra sozinho
 * no teste; se o formato mudar a ponto de o objeto não ser mais reconhecido,
 * o teste quebra.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REDIGIDO, TIPOS_INTEIROS_DE_SAUDE, campoSensivel, reconhecerTipo, redigir, redigirErro } from './redigir.ts';

const aqui = dirname(fileURLToPath(import.meta.url));
const fonte = readFileSync(resolve(aqui, '../dominio/tipos.ts'), 'utf8');

/** Campos de uma `export interface Nome { … }`: [nome, opcional]. */
function camposDe(nome: string): [string, boolean][] {
  const inicio = fonte.indexOf(`export interface ${nome} {`);
  assert.ok(inicio >= 0, `tipos.ts não tem a interface ${nome}`);
  const fim = fonte.indexOf('\n}', inicio);
  const corpo = fonte.slice(inicio, fim);
  return [...corpo.matchAll(/^ {2}(\w+)(\?)?:/gm)].map((m) => [m[1], m[2] === '?']);
}

const exemplo = (campos: [string, boolean][], so: 'todos' | 'obrigatorios') =>
  Object.fromEntries(campos.filter(([, opcional]) => so === 'todos' || !opcional).map(([c]) => [c, `valor-de-${c}`]));

for (const tipo of TIPOS_INTEIROS_DE_SAUDE) {
  test(`${tipo}: todo campo vira [redigido], reconhecido pelo formato`, () => {
    const campos = camposDe(tipo);
    assert.ok(campos.length > 0);
    for (const so of ['todos', 'obrigatorios'] as const) {
      const objeto = exemplo(campos, so);
      assert.equal(reconhecerTipo(objeto), tipo, `${tipo} (${so}) não foi reconhecido`);
      const saida = redigir({ registro: objeto }) as { registro: Record<string, unknown> };
      for (const [c] of campos.filter(([, opcional]) => so === 'todos' || !opcional)) {
        assert.equal(saida.registro[c], REDIGIDO, `${tipo}.${c} passou sem redigir`);
      }
    }
  });
}

test('a saúde do dependente Kids (R20.5) some do log; o nome fica', () => {
  const dependente = { id: 'pedro', responsavelId: 'carla', nome: 'Pedro', saude: 'asma', autorizacaoDeImagem: { ligada: false } };
  assert.deepEqual(redigir(dependente), { id: 'pedro', responsavelId: 'carla', nome: 'Pedro', saude: REDIGIDO, autorizacaoDeImagem: { ligada: false } });
});

test('PerfilDoAluno, MedicaoCorporal e Circunferencias: medidas, restrições, nascimento e objetivo', () => {
  for (const tipo of ['PerfilDoAluno', 'MedicaoCorporal', 'Circunferencias']) {
    const campos = camposDe(tipo);
    const objeto = exemplo(campos, 'todos');
    const saida = redigir(objeto) as Record<string, unknown>;
    for (const [c] of campos) {
      const deveSumir = campoSensivel(c);
      assert.equal(saida[c] === REDIGIDO || (typeof saida[c] === 'object' && saida[c] !== null), deveSumir || typeof objeto[c] === 'object', `${tipo}.${c}`);
    }
    // os de unidade sempre somem
    for (const [c] of campos.filter(([c]) => /(Gramas|Milimetros|Decimos|Kcal)$/.test(c))) assert.equal(saida[c], REDIGIDO, `${tipo}.${c}`);
  }
  const perfil = redigir({ usuarioId: 'u1', restricoes: 'joelho', dataNascimento: '1990-01-01', objetivo: 'perder_peso', autorizaAcademia: true }) as Record<string, unknown>;
  assert.deepEqual(perfil, { usuarioId: 'u1', restricoes: REDIGIDO, dataNascimento: REDIGIDO, objetivo: REDIGIDO, autorizaAcademia: true });
});

test('carga e peso em qualquer lugar (séries, treino realizado) somem; o resto fica', () => {
  const realizado = { id: 't1', alunoId: 'ana', series: [{ id: 's1', cargaGramas: 22500, repeticoesFeitas: 12, estado: 'feita' }] };
  assert.deepEqual(redigir(realizado), { id: 't1', alunoId: 'ana', series: [{ id: 's1', cargaGramas: REDIGIDO, repeticoesFeitas: 12, estado: 'feita' }] });
});

test('tipo dito por quem chama vence o formato', () => {
  assert.deepEqual(redigir({ texto: 'oi', id: 'm1' }, 'Mensagem'), { texto: REDIGIDO, id: REDIGIDO });
});

test('não muda o original e aguenta ciclo', () => {
  const a: Record<string, unknown> = { pesoGramas: 72000 };
  a.eu = a;
  const saida = redigir(a) as Record<string, unknown>;
  assert.equal(a.pesoGramas, 72000);
  assert.equal(saida.pesoGramas, REDIGIDO);
  assert.equal(saida.eu, '[ciclo]');
});

test('erro do PostgREST: sem a linha recusada, sem número, sem details', () => {
  const erro = { name: 'PostgrestError', code: '23514', status: 400, message: 'new row violates check constraint. Failing row contains (abc, 72450, dor no joelho).', details: 'Failing row contains (abc, 72450, dor no joelho)' };
  const r = redigirErro(erro);
  assert.equal(r.codigo, '23514');
  assert.equal(r.status, 400);
  assert.ok(!JSON.stringify(r).includes('72450'));
  assert.ok(!JSON.stringify(r).includes('joelho'));
  assert.ok(!('details' in r));
});

test('Error dentro do objeto vira erro redigido', () => {
  const saida = redigir({ falha: new Error('peso 72,5 kg inválido') }) as { falha: { mensagem: string } };
  assert.ok(!saida.falha.mensagem.includes('72'));
});

test('AM1 (RA1.5): dinheiro e contato nunca vão para log', () => {
  const cobranca = { id: 'c1', valorCentavos: 18000, valorPagoCentavos: 0, descontoCentavos: 2000, multaPontosBase: 200, aReceberEmAberto: 5, whatsapp: '5551900000001', telefone: '51 3333', observacao: 'paga em dinheiro', estado: 'aberta' };
  assert.deepEqual(redigir(cobranca), { id: 'c1', valorCentavos: REDIGIDO, valorPagoCentavos: REDIGIDO, descontoCentavos: REDIGIDO, multaPontosBase: REDIGIDO, aReceberEmAberto: REDIGIDO, whatsapp: REDIGIDO, telefone: REDIGIDO, observacao: REDIGIDO, estado: 'aberta' });
});
