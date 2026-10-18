import { describe, expect, test } from 'vitest';
import { resumoDoPainel } from '@dominio/financeiro/painel.ts';
import { lancamentoDeExemplo } from '@dominio/financeiro/exemplo.ts';
import { armazenamentoNaMemoria } from './armazenamento.ts';
import { gerarExemplo } from './exemplo.ts';
import { criarRepositorioLocal } from './repositorio-local.ts';
import { ErroDeRegra } from '../tipos.ts';

const HOJE = '2026-10-15';
let n = 0;
const repo = () => criarRepositorioLocal({ armazenamento: armazenamentoNaMemoria(), hoje: () => HOJE, agora: () => `${HOJE}T10:42:00-03:00`, gerarId: () => `novo-${++n}` });

describe('a academia de exemplo', () => {
  test('é sempre a mesma para o mesmo dia, e tem cara de academia', () => {
    const a = gerarExemplo(HOJE);
    expect(JSON.stringify(gerarExemplo(HOJE))).toBe(JSON.stringify(a));
    const p = resumoDoPainel({ ...a, despesasFixas: a.despesasFixas, competencia: '2026-10', hoje: HOJE });
    expect(p.alunos.matriculados).toBeGreaterThan(50);
    expect(p.funcionarios.total).toBe(9);
    expect(p.inadimplentes.pessoas).toBeGreaterThan(2);
    expect(p.mesAnterior.totais.entradas).toBeGreaterThan(0);
    expect(a.fechamentos.some((f) => f.competencia === '2026-09')).toBe(true);
    expect(a.fechamentos.some((f) => f.competencia === '2026-10')).toBe(false);
    // nada de mês cru na descrição (achado do AR)
    expect(a.cobrancas.every((c) => !/\d{4}-\d{2}/.test(c.descricao))).toBe(true);
  });
});

describe('o repositório local se comporta como o servidor', () => {
  test('mês fechado recusa a linha, nos dois lados da mudança, e nada é gravado', async () => {
    const r = repo();
    const d = await r.carregar();
    const set = d.lancamentos.find((l) => l.data.startsWith('2026-09') && !l.arquivado)!;
    await expect(r.gravarLancamentos([{ antes: set, depois: { ...set, valorCentavos: set.valorCentavos + 1 } }])).rejects.toThrow('Setembro de 2026 está fechado');
    const out = d.lancamentos.find((l) => l.data.startsWith('2026-10') && l.origem === 'manual')!;
    await expect(r.gravarLancamentos([{ antes: out, depois: { ...out, data: '2026-09-30' } }])).rejects.toBeInstanceOf(ErroDeRegra);
    const depois = await r.carregar();
    expect(depois.lancamentos.find((l) => l.id === set.id)!.valorCentavos).toBe(set.valorCentavos);
  });

  test('várias linhas: se uma é inválida, nenhuma entra', async () => {
    const r = repo();
    const antes = (await r.carregar()).lancamentos.length;
    const boa = lancamentoDeExemplo({ id: 'boa', data: HOJE, tipo: 'entrada', valorCentavos: 1000, descricao: 'Luvas' });
    const ruim = lancamentoDeExemplo({ id: 'ruim', data: HOJE, tipo: 'entrada', valorCentavos: 0, descricao: 'x' });
    await expect(r.gravarLancamentos([{ depois: boa }, { depois: ruim }])).rejects.toThrow(/valor/);
    expect((await r.carregar()).lancamentos.length).toBe(antes);
    const d = await r.gravarLancamentos([{ depois: boa }]);
    expect(d.lancamentos.length).toBe(antes + 1);
    expect(d.historico[0]!.acao).toBe('criou');
  });

  test('marcar como paga cria a linha da planilha; desfazer arquiva; parcial é recusado', async () => {
    const r = repo();
    const d = await r.carregar();
    const c = d.cobrancas.find((x) => x.estado === 'aberta' && x.competencia === '2026-10')!;
    await expect(r.marcarComoPaga(c.id, { data: HOJE, forma: 'pix', valorPagoCentavos: c.valorCentavos - 1 })).rejects.toThrow(/parcial/);
    const pago = await r.marcarComoPaga(c.id, { data: HOJE, forma: 'pix' });
    const cobranca = pago.cobrancas.find((x) => x.id === c.id)!;
    expect(cobranca.estado).toBe('paga');
    const linha = pago.lancamentos.find((l) => l.id === cobranca.lancamentoId)!;
    expect(linha.valorCentavos).toBe(c.valorCentavos);
    expect(linha.categoriaId).toBe('mensalidades');
    const desfeito = await r.desfazerPagamento(c.id);
    expect(desfeito.cobrancas.find((x) => x.id === c.id)!.estado).toBe('aberta');
    expect(desfeito.lancamentos.find((l) => l.id === linha.id)!.arquivado).toBe(true);
  });

  test('fechar e reabrir: o histórico diz o mês e o motivo', async () => {
    const r = repo();
    await r.carregar();
    await expect(r.reabrirMes('2026-09', '  ')).rejects.toThrow(/motivo/);
    const d = await r.reabrirMes('2026-09', 'Faltou a venda de luvas');
    expect(d.historico[0]!.acao).toBe('reabriu');
    expect(d.historico[0]!.motivo).toBe('Faltou a venda de luvas');
    const f = await r.fecharMes('2026-09');
    expect(f.fechamentos.filter((x) => x.competencia === '2026-09' && !x.reabertoEm)).toHaveLength(1);
    await expect(r.fecharMes('2026-09')).rejects.toThrow(/já está fechado/);
  });

  test('gerar mensalidades duas vezes não duplica', async () => {
    const r = repo();
    await r.carregar();
    const a = await r.gerarMensalidades('2026-11');
    expect(a.resultado.novas.length).toBeGreaterThan(30);
    const b = await r.gerarMensalidades('2026-11');
    expect(b.resultado.novas).toHaveLength(0);
  });
});

describe('AO — escritas ao mesmo tempo e importação repetida', () => {
  const comLatencia = () => criarRepositorioLocal({ armazenamento: armazenamentoNaMemoria(), hoje: () => HOJE, agora: () => `${HOJE}T10:42:00-03:00`, gerarId: () => `ao-${++n}`, latenciaMs: 5 });

  test('duas gravações juntas: as duas ficam (antes a segunda apagava a primeira)', async () => {
    const r = comLatencia();
    const antes = (await r.carregar()).lancamentos.length;
    const a = lancamentoDeExemplo({ id: 'junto-a', data: HOJE, tipo: 'entrada', valorCentavos: 1000, descricao: 'Luvas 14 oz' });
    const b = lancamentoDeExemplo({ id: 'junto-b', data: HOJE, tipo: 'saida', valorCentavos: 2500, descricao: 'Bandagens' });
    await Promise.all([r.gravarLancamentos([{ depois: a }]), r.gravarLancamentos([{ depois: b }])]);
    const d = await r.carregar();
    expect(d.lancamentos.length).toBe(antes + 2);
    expect(d.lancamentos.some((l) => l.id === 'junto-a') && d.lancamentos.some((l) => l.id === 'junto-b')).toBe(true);
  });

  test('"Confirmar pagamento" duas vezes: uma linha só, e a segunda diz que já está paga', async () => {
    const r = comLatencia();
    const d = await r.carregar();
    const c = d.cobrancas.find((x) => x.estado === 'aberta' && x.competencia === '2026-10')!;
    const linhasAntes = d.lancamentos.filter((l) => l.cobrancaId === c.id).length;
    const [um, dois] = await Promise.allSettled([r.marcarComoPaga(c.id, { data: HOJE, forma: 'pix' }), r.marcarComoPaga(c.id, { data: HOJE, forma: 'pix' })]);
    expect(um.status).toBe('fulfilled');
    expect(dois.status).toBe('rejected');
    expect(String((dois as PromiseRejectedResult).reason)).toMatch(/já está paga/);
    expect((await r.carregar()).lancamentos.filter((l) => l.cobrancaId === c.id).length).toBe(linhasAntes + 1);
  });

  test('a mesma importação mandada duas vezes grava uma vez só', async () => {
    const r = comLatencia();
    await r.carregar();
    const rascunho = { data: HOJE, descricao: 'Venda de faixa (teste AO)', tipo: 'entrada' as const, valorCentavos: 9000, situacao: 'pago' as const };
    const pedido = { arquivoNome: 'planilha.csv', formato: 'csv' as const, colunas: [], linhas: [{ numero: 2, rascunho, erros: [], avisos: [], repetida: false }], categoriasNovas: [], incluirRepetidas: false };
    const [a, b] = await Promise.all([r.importar(pedido), r.importar(pedido)]);
    expect(a.gravadas + b.gravadas).toBe(1);
    expect((await r.carregar()).lancamentos.filter((l) => l.descricao === 'Venda de faixa (teste AO)')).toHaveLength(1);
  });
});

describe('AO/AU — uma transação para o lote e para matricular do funil; a grade de aulas', () => {
  test('"marcar as N como pagas": todas ou nenhuma (antes uma por uma; a do meio falhava e as primeiras ficavam pagas)', async () => {
    const r = repo();
    const d = await r.carregar();
    const abertas = d.cobrancas.filter((x) => x.estado === 'aberta' && x.competencia === '2026-10').slice(0, 3);
    const paga = d.cobrancas.find((x) => x.estado === 'paga')!;
    await expect(r.marcarComoPagas([abertas[0]!.id, paga.id, abertas[1]!.id], { data: HOJE, forma: 'pix' })).rejects.toThrow(/já está paga/);
    const depois = await r.carregar();
    expect(depois.cobrancas.find((x) => x.id === abertas[0]!.id)!.estado).toBe('aberta');
    const ok = await r.marcarComoPagas(abertas.map((x) => x.id), { data: HOJE, forma: 'dinheiro' });
    expect(abertas.every((a) => ok.cobrancas.find((x) => x.id === a.id)!.estado === 'paga')).toBe(true);
    expect(ok.lancamentos.filter((l) => abertas.some((a) => a.id === l.cobrancaId) && !l.arquivado)).toHaveLength(3);
  });

  test('matricular do funil grava a pessoa, a matrícula, o interessado e a experimental juntos', async () => {
    const r = repo();
    const d = await r.carregar();
    const i = d.interessados.find((x) => !x.matriculadoEm && !x.desistiuEm)!;
    const pessoa = { id: 'p-funil', academiaId: d.academia.id, nome: 'Rafaela Teste Funil', ehAluno: true, ehFuncionario: false, criadaEm: 'x', atualizadaEm: 'x' };
    const matricula = { id: 'm-funil', academiaId: d.academia.id, pessoaId: pessoa.id, pagadorPessoaId: pessoa.id, planoId: d.planos[0]!.id, inicio: HOJE, estado: 'ativa' as const, diaDeVencimento: 15, descontos: [] };
    // matrícula inválida (plano que não existe): nada entra, nem a pessoa
    await expect(r.matricularInteressado({ interessado: { ...i, matriculadoEm: HOJE, pessoaId: pessoa.id }, experimentais: [], pessoa, matricula: { ...matricula, planoId: 'nao-existe' } })).rejects.toThrow();
    expect((await r.carregar()).pessoas.some((p) => p.id === pessoa.id)).toBe(false);
    const dd = await r.matricularInteressado({ interessado: { ...i, matriculadoEm: HOJE, pessoaId: pessoa.id }, experimentais: [], pessoa, matricula });
    expect(dd.pessoas.some((p) => p.id === pessoa.id)).toBe(true);
    expect(dd.matriculas.some((m) => m.id === matricula.id)).toBe(true);
    expect(dd.interessados.find((x) => x.id === i.id)!.matriculadoEm).toBe(HOJE);
  });

  test('a grade de aulas vem no exemplo, e a turma inválida não grava', async () => {
    const r = repo();
    const d = await r.carregar();
    expect(d.turmas.length).toBeGreaterThan(5);
    const t = d.turmas[0]!;
    await expect(r.salvar('turmas', { ...t, horarios: [{ id: 'x', dia: 'seg', inicio: '25:00', duracaoMinutos: 60 }] })).rejects.toThrow(/Hora inválida/);
    const ok = await r.salvar('turmas', { ...t, capacidade: 20 });
    expect(ok.turmas.find((x) => x.id === t.id)!.capacidade).toBe(20);
    expect(ok.historico[0]!.tabela).toBe('turmas');
  });
});
