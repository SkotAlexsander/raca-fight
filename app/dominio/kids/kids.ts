/**
 * Kids: o responsável e o dependente (R20).
 *
 * - Na v1 a criança NÃO tem conta (R20.1): quem entra é o responsável, com um
 *   ou mais dependentes. O dependente é um aluno sem login.
 * - A AUTORIZAÇÃO DE IMAGEM nasce DESLIGADA (R20.6) e é por dependente, com a
 *   data guardada. Sem ela, nenhuma foto do dependente aparece no app.
 * - A saúde do dependente é opcional, preenchida só pelo responsável, e a
 *   equipe só vê se ele autorizar (R20.5, a mesma chave do R6.4).
 * - Base: LGPD art. 14 e Enunciado CD/ANPD nº 1/2023 (melhor interesse).
 *
 * O que é [decidir] chega por parâmetro: a conta própria de 16 e 17 anos (L27).
 */
import type { DataISO, Id, InstanteISO } from '../tipos.ts';

export interface AutorizacaoDeImagem {
  ligada: boolean;
  /** Quando foi ligada ou desligada pela última vez (o consentimento, R20.6). */
  em?: InstanteISO;
}

export interface Dependente {
  id: Id;
  responsavelId: Id;
  academiaId: Id;
  nome: string;
  dataNascimento?: DataISO;
  /** Dado de saúde (R20.5): alergia, asma, restrição. Nunca em log nem notificação. */
  saude?: string;
  /** A equipe só vê a saúde se o responsável ligou (R20.5). */
  saudeVisivelParaEquipe: boolean;
  autorizacaoDeImagem: AutorizacaoDeImagem;
  criadoEm: InstanteISO;
}

/** R20.2: até 15 anos o aluno é sempre dependente. */
export const IDADE_SEMPRE_DEPENDENTE = 15;
export const MAIORIDADE = 18;
export const LIMITE_DA_SAUDE = 280;

export function idadeEmAnos(nascimento: DataISO, hoje: DataISO): number {
  const anos = +hoje.slice(0, 4) - +nascimento.slice(0, 4);
  return hoje.slice(5) >= nascimento.slice(5) ? anos : anos - 1;
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? '';
}

export class ErroDoDependente extends Error {
  readonly codigo: 'nome_vazio' | 'nascimento_futuro' | 'maior_de_idade' | 'saude_longa';
  constructor(codigo: ErroDoDependente['codigo'], mensagem: string) {
    super(mensagem);
    this.codigo = codigo;
  }
}

/** Cadastra a criança: a autorização de imagem e a visibilidade da saúde nascem DESLIGADAS. */
export function novoDependente(d: { id: Id; responsavelId: Id; academiaId: Id; nome: string; dataNascimento?: DataISO; saude?: string; hoje: DataISO; em: InstanteISO }): Dependente {
  const nome = d.nome.trim();
  if (!nome) throw new ErroDoDependente('nome_vazio', 'Escreva o nome da criança.');
  if (d.dataNascimento && d.dataNascimento > d.hoje) throw new ErroDoDependente('nascimento_futuro', 'A data de nascimento não pode ser no futuro.');
  if (d.dataNascimento && idadeEmAnos(d.dataNascimento, d.hoje) >= MAIORIDADE) throw new ErroDoDependente('maior_de_idade', 'Com 18 anos ou mais, a pessoa tem a própria conta.');
  const saude = d.saude?.trim();
  if (saude && [...saude].length > LIMITE_DA_SAUDE) throw new ErroDoDependente('saude_longa', `Até ${LIMITE_DA_SAUDE} caracteres.`);
  return {
    id: d.id,
    responsavelId: d.responsavelId,
    academiaId: d.academiaId,
    nome,
    ...(d.dataNascimento ? { dataNascimento: d.dataNascimento } : {}),
    ...(saude ? { saude } : {}),
    saudeVisivelParaEquipe: false,
    autorizacaoDeImagem: { ligada: false },
    criadoEm: d.em,
  };
}

/** R20.6: o responsável liga e desliga quando quiser; a data fica guardada. */
export function definirAutorizacaoDeImagem(dep: Dependente, ligada: boolean, em: InstanteISO): Dependente {
  return { ...dep, autorizacaoDeImagem: { ligada, em } };
}

/** Sem a autorização, nenhuma foto do dependente aparece (Atletas, eventos, técnicas). */
export function podeMostrarFoto(dep: Pick<Dependente, 'autorizacaoDeImagem'>): boolean {
  return dep.autorizacaoDeImagem.ligada === true;
}

/** R18.6 + R20.6: o menor só aparece em Atletas com a autorização do responsável. */
export function podeAparecerEmAtletas(dep: Pick<Dependente, 'autorizacaoDeImagem'>, querAparecer: boolean): boolean {
  return querAparecer && podeMostrarFoto(dep);
}

/** R20.7: o professor da turma kids vê o primeiro nome e, se autorizado, a saúde. Nunca o telefone na chamada. */
export function oQueOProfessorVe(dep: Dependente): { nome: string; saude?: string } {
  return { nome: primeiroNome(dep.nome), ...(dep.saudeVisivelParaEquipe && dep.saude ? { saude: dep.saude } : {}) };
}

/**
 * [decidir] L27: de 16 a 17 anos, conta própria ou dependente? A regra chega
 * por parâmetro. Até 15, sempre dependente; com 18, nunca.
 */
export type RegraDos16e17 = 'dependente' | 'conta_propria';

export function precisaSerDependente(nascimento: DataISO, hoje: DataISO, regraDos16e17: RegraDos16e17): boolean {
  const idade = idadeEmAnos(nascimento, hoje);
  if (idade <= IDADE_SEMPRE_DEPENDENTE) return true;
  if (idade >= MAIORIDADE) return false;
  return regraDos16e17 === 'dependente';
}
