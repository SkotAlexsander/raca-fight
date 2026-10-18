/**
 * `dados/` é a ÚNICA fronteira com o backend (hoje, o repositório local de
 * exemplo; depois, o Supabase). Telas importam daqui.
 */
export * from './consultas';
export { useGravar } from './escrita';
export { ProvedorDeDados, useFila, usePreferencias, useRepositorio, useSessao, type EstadoDaFila, type Preferencias, type Sessao } from './ProvedorDeDados';
export { registro, redigir, redigirErro } from './redigir';
export { ErroDeArmazenamento, textoDoErroDeGravacao, tipoDoErroDeGravacao, type MotivoDoArmazenamento, type TipoDoErroDeGravacao } from './erros';
export { ErroSemSinal, type AcademiaDeLuta, type AvisoDaAcademia, type ContaDeExemplo, type ContatoDaAcademia, type FichaDeLuta, type MembroDaEquipe, type Repositorio, type ResumoDoAluno, type VinculoComAcademia } from './repositorio';
export { decidirDestino, entradaDaEquipe, visaoDoPapel, type Destino, type EntradaDaEquipe } from '../dominio/papel';
