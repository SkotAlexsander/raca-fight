/**
 * Filtro de registro: tira dado de saúde de tudo que vai para console, Sentry
 * ou analytics (03-arquitetura/03-DECISOES-TECNICAS.md, seção 5; R6.1, R6.2).
 *
 * Vira `[redigido]`:
 * 1. campo cujo nome termina em `Gramas`, `Milimetros`, `Decimos` ou `Kcal`;
 * 2. os campos `restricoes`, `dataNascimento`, `objetivo` (e `objetivos`);
 * 3. TODO campo de um objeto que vem de `PlanoDeDieta`, `Refeicao`,
 *    `ItemDeRefeicao`, `RefeicaoRegistrada`, `HistoricoDeObjetivo` ou
 *    `Mensagem` — uma lista só de nomes deixaria passar `motivo`,
 *    `trocaPermitida`, `observacao` do plano e `nome` da refeição;
 * 4. o `recado` (texto livre que pode trazer "dor no joelho") e a `saude` do
 *    dependente Kids (R20.5: alergia, asma);
 * 5. DINHEIRO e contato (pedido do AM1, RA1.5): campo que termina em
 *    `Centavos` ou `PontosBase`, que começa com `valor` ou `aReceber`, e os
 *    campos `telefone`, `whatsapp`, `documento`, `observacao`, `mudancas`,
 *    `totais`, `porCategoria`, `remuneracao`, `descontos`, `reparticao` e
 *    `motivoDaReabertura` (os nomes de `dominio/financeiro/tipos.ts` e das
 *    migrações do Admin; a lista do Admin é `admin/src/util/registrar.ts`).
 *
 * O objeto é reconhecido pelo FORMATO (os campos que só ele tem) ou pelo tipo
 * dito por quem chama (`redigir(valor, 'Mensagem')`). O teste
 * (`redigir.test.ts`) lê `dominio/tipos.ts` e confere cada campo de cada tipo,
 * para a lista não envelhecer quando o modelo crescer.
 *
 * Texto de erro também (revisão T, S1/S2): `redigirErro` guarda status, código
 * e nome; corta o `details` do PostgREST e tira da mensagem a linha recusada
 * ("Failing row contains (…)") e qualquer número.
 *
 * Roda no Node sem compilar (sem imports): `npm run testar:dominio`.
 */

export const REDIGIDO = '[redigido]';

/** Os tipos de `dominio/tipos.ts` cujo objeto inteiro é dado de saúde (R6.1). */
export const TIPOS_INTEIROS_DE_SAUDE = ['PlanoDeDieta', 'Refeicao', 'ItemDeRefeicao', 'RefeicaoRegistrada', 'HistoricoDeObjetivo', 'Mensagem'] as const;
export type TipoInteiroDeSaude = (typeof TIPOS_INTEIROS_DE_SAUDE)[number];

const SUFIXOS = ['Gramas', 'Milimetros', 'Decimos', 'Kcal'];
const CAMPOS = new Set(['restricoes', 'dataNascimento', 'objetivo', 'objetivos', 'recado', 'saude']);
/** Dinheiro e contato (AM1, RA1.5): nunca em log. */
const CAMPOS_FINANCEIROS = new Set(['telefone', 'whatsapp', 'documento', 'observacao', 'mudancas', 'totais', 'porCategoria', 'remuneracao', 'descontos', 'reparticao', 'motivoDaReabertura']);

/**
 * Pedido do AU (revisão AN): o motivo da anulação, a criança da experimental,
 * o código de indicação e o token do aparelho. Também na forma snake_case,
 * para o que for registrado depois do mapeador do Supabase.
 */
const CAMPOS_DE_PESSOA = new Set(['motivoDaAnulacao', 'crianca', 'codigoDeIndicacao', 'token', 'motivo_da_anulacao', 'codigo_de_indicacao']);

export function campoFinanceiro(nome: string): boolean {
  return CAMPOS_FINANCEIROS.has(nome) || /(Centavos|PontosBase)$/.test(nome) || /^valor/i.test(nome) || /^aReceber/.test(nome);
}

/**
 * Os campos que só aquele tipo tem, juntos. Basta um conjunto bater para o
 * objeto ser tratado como dado de saúde inteiro.
 */
const ASSINATURAS: Record<TipoInteiroDeSaude, string[][]> = {
  PlanoDeDieta: [['refeicoes', 'personalId'], ['refeicoes', 'assinaturaId']],
  Refeicao: [['planoId', 'itens'], ['horarioSugerido', 'opcional']],
  ItemDeRefeicao: [['refeicaoId', 'descricao'], ['trocaPermitida']],
  RefeicaoRegistrada: [['refeicaoId', 'estado'], ['planoId', 'refeicaoId']],
  HistoricoDeObjetivo: [['objetivo', 'em']],
  Mensagem: [['conversaId', 'texto'], ['conversaId', 'autorId']],
};

export function campoSensivel(nome: string): boolean {
  return CAMPOS.has(nome) || CAMPOS_DE_PESSOA.has(nome) || SUFIXOS.some((s) => nome.endsWith(s)) || campoFinanceiro(nome);
}

export function reconhecerTipo(objeto: Record<string, unknown>): TipoInteiroDeSaude | null {
  for (const tipo of TIPOS_INTEIROS_DE_SAUDE) {
    if (ASSINATURAS[tipo].some((campos) => campos.every((c) => c in objeto))) return tipo;
  }
  return null;
}

function redigirObjetoInteiro(objeto: Record<string, unknown>): Record<string, unknown> {
  const saida: Record<string, unknown> = {};
  for (const chave of Object.keys(objeto)) saida[chave] = REDIGIDO;
  return saida;
}

/**
 * Devolve uma cópia sem dado de saúde. Não muda o original. Aguenta ciclos,
 * listas, `Map`/`Set` (viram listas) e `Error` (vira `redigirErro`).
 */
export function redigir<T>(valor: T, tipo?: TipoInteiroDeSaude): unknown {
  const vistos = new WeakSet<object>();
  const passar = (v: unknown, tipoDito?: TipoInteiroDeSaude): unknown => {
    if (v === null || typeof v !== 'object') return v;
    if (v instanceof Error) return redigirErro(v);
    if (v instanceof Date) return v;
    if (vistos.has(v)) return '[ciclo]';
    vistos.add(v);
    if (Array.isArray(v)) return v.map((x) => passar(x, tipoDito));
    if (v instanceof Map) return [...v.values()].map((x) => passar(x));
    if (v instanceof Set) return [...v.values()].map((x) => passar(x));
    const objeto = v as Record<string, unknown>;
    if (tipoDito || reconhecerTipo(objeto)) return redigirObjetoInteiro(objeto);
    const saida: Record<string, unknown> = {};
    for (const [chave, x] of Object.entries(objeto)) {
      saida[chave] = campoSensivel(chave) ? REDIGIDO : passar(x);
    }
    return saida;
  };
  return passar(valor, tipo);
}

/** O que sobra de um erro do Supabase/PostgREST para log: status, código e uma mensagem sem dado. */
export interface ErroRedigido {
  nome?: string;
  status?: number;
  codigo?: string;
  mensagem?: string;
}

const LINHA_RECUSADA = /(Failing row contains|Key)\s*\(.*?\)(=\(.*?\))?/gis;

export function redigirMensagem(texto: string): string {
  return texto
    .replace(LINHA_RECUSADA, '$1 ([redigido])')
    .replace(/\d+([.,]\d+)?/g, '#')
    .slice(0, 200);
}

export function redigirErro(erro: unknown): ErroRedigido {
  if (erro === null || typeof erro !== 'object') return { mensagem: typeof erro === 'string' ? redigirMensagem(erro) : undefined };
  const e = erro as { name?: unknown; status?: unknown; code?: unknown; codigo?: unknown; message?: unknown; mensagem?: unknown };
  const status = typeof e.status === 'number' ? e.status : undefined;
  const codigo = typeof e.code === 'string' ? e.code : typeof e.codigo === 'string' ? e.codigo : undefined;
  const mensagem = typeof e.message === 'string' ? e.message : typeof e.mensagem === 'string' ? e.mensagem : undefined;
  // `details` e `hint` do PostgREST são cortados de propósito: podem repetir a linha inteira.
  return {
    nome: typeof e.name === 'string' ? e.name : undefined,
    status,
    codigo,
    mensagem: mensagem === undefined ? undefined : redigirMensagem(mensagem),
  };
}

/** O único jeito de escrever no console a partir de `dados/` e das telas. */
export const registro = {
  info(mensagem: string, dados?: unknown): void {
    console.info(mensagem, dados === undefined ? '' : redigir(dados));
  },
  erro(mensagem: string, erro?: unknown): void {
    console.error(mensagem, erro === undefined ? '' : redigirErro(erro));
  },
};
