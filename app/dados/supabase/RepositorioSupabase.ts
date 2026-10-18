/**
 * O repositório do Supabase: por enquanto, SÓ A FORMA (escolha provisória de
 * 11/10/2026: "dados de exemplo locais atrás de app/dados/ até existir a conta
 * Supabase"). Nenhuma chamada de rede; nenhum import do `@supabase/supabase-js`
 * ainda, para o cliente não entrar no pacote do app à toa.
 *
 * Quando a conta existir:
 * 1. `supabase.ts` cria UMA instância com `EXPO_PUBLIC_SUPABASE_URL` e
 *    `EXPO_PUBLIC_SUPABASE_CHAVE_ANONIMA`, sessão no expo-secure-store;
 * 2. cada método abaixo vira a consulta da tabela, com a tradução
 *    snake_case ↔ camelCase em `mapeadores.ts` (só aqui);
 * 3. `destinoDaFila.enviar` chama `rpc('registrar_presencas', { p_presencas })`
 *    com `presencaParaOServidor` (`mapeadores.ts`: sem o id `aula|aluno`,
 *    com `pessoa_id` e `horario_id` + `data`); erro de regra
 *    (`ehErroDeRegraDoServidor`) sai da fila como falhou, só rede repete
 *    (pedidos do AU, revisão AN). Ids de texto viram os uuid do seed em
 *    `idNoServidor`; colunas sempre explícitas (nunca o asterisco) em vinculos, academias e usuarios;
 * 4. erros passam por `redigirErro` antes de qualquer log;
 * 5. as escritas (agente AA) viram `insert`/`update` com a RLS e os gatilhos do
 *    modelo (01-MODELO-DE-DADOS.md); o que é da academia sem rede lança `ErroSemSinal`;
 *    `lerDoAparelho`/`gravarNoAparelho` reaproveitam o armazenamento local.
 */
import type { Repositorio } from '../repositorio.ts';
import type { DestinoDaFila } from '../fila.ts';

const naoConfigurado = (): never => {
  throw new Error('Supabase ainda não configurado: o app usa o repositório local de exemplo.');
};

export function criarRepositorioSupabase(): Repositorio & { destinoDaFila: DestinoDaFila } {
  return {
    nome: 'supabase',
    destinoDaFila: { enviar: async () => naoConfigurado() },
    contasDeExemplo: () => [],
    usuario: async () => naoConfigurado(),
    usuarioPeloEmail: async () => naoConfigurado(),
    vinculosDoUsuario: async () => naoConfigurado(),
    criarConta: async () => naoConfigurado(),
    academiaPeloCodigo: async () => naoConfigurado(),
    academiaPeloCodigoDaEquipe: async () => naoConfigurado(),
    pedirVinculo: async () => naoConfigurado(),
    cancelarPedidoDeVinculo: async () => naoConfigurado(),
    academiaDeLuta: async () => naoConfigurado(),
    academiaDaVitrine: async () => naoConfigurado(),
    ajustesDeAula: async () => naoConfigurado(),
    cancelarAula: async () => naoConfigurado(),
    passarAula: async () => naoConfigurado(),
    fichasDaAcademia: async () => naoConfigurado(),
    fichasDoUsuario: async () => naoConfigurado(),
    marcarAtleta: async () => naoConfigurado(),
    alunosDaAcademia: async () => naoConfigurado(),
    presencasDaAcademia: async () => naoConfigurado(),
    presencasDosAlunos: async () => naoConfigurado(),
    graduacoesDaAcademia: async () => naoConfigurado(),
    graduacoesDosAlunos: async () => naoConfigurado(),
    salvarGraduacao: async () => naoConfigurado(),
    exames: async () => naoConfigurado(),
    salvarExame: async () => naoConfigurado(),
    eventos: async () => naoConfigurado(),
    salvarEvento: async () => naoConfigurado(),
    lutas: async () => naoConfigurado(),
    salvarLuta: async () => naoConfigurado(),
    participantes: async () => naoConfigurado(),
    alternarParticipacao: async () => naoConfigurado(),
    consentimentosDeAtleta: async () => naoConfigurado(),
    definirAparecerEmAtletas: async () => naoConfigurado(),
    tecnicas: async () => naoConfigurado(),
    perguntasFrequentes: async () => naoConfigurado(),
    dependentes: async () => naoConfigurado(),
    salvarDependente: async () => naoConfigurado(),
    interessados: async () => naoConfigurado(),
    salvarInteressado: async () => naoConfigurado(),
    experimentais: async () => naoConfigurado(),
    salvarExperimental: async () => naoConfigurado(),
    indicacoesDoAluno: async () => naoConfigurado(),
    perfilDoAluno: async () => naoConfigurado(),
    salvarPerfilDoAluno: async () => naoConfigurado(),
    medicoesDoAluno: async () => naoConfigurado(),
    registrarMedicao: async () => naoConfigurado(),
    preferenciasDeAviso: async () => naoConfigurado(),
    salvarPreferenciasDeAviso: async () => naoConfigurado(),
    assinaturaPlus: async () => naoConfigurado(),
    planoDeDieta: async () => naoConfigurado(),
    refeicoesRegistradas: async () => naoConfigurado(),
    avisoDaAcademia: async () => naoConfigurado(),
    avisosDaAcademia: async () => naoConfigurado(),
    publicarAviso: async () => naoConfigurado(),
    retirarAviso: async () => naoConfigurado(),
    equipe: async () => naoConfigurado(),
    salvarPerfilProfissional: async () => naoConfigurado(),
    preferenciasDaEquipe: async () => naoConfigurado(),
    salvarPreferenciasDaEquipe: async () => naoConfigurado(),
    confirmarVinculos: async () => naoConfigurado(),
    recusarVinculo: async () => naoConfigurado(),
    encerrarVinculo: async () => naoConfigurado(),
    // gravam no aparelho primeiro (a presença entra na fila, R15.9); o que é só do aparelho continua no SQLite local
    registrarPresencas: () => naoConfigurado(),
    registrarRefeicao: () => naoConfigurado(),
    desfazerRefeicao: () => naoConfigurado(),
    lerDoAparelho: () => naoConfigurado(),
    gravarNoAparelho: () => naoConfigurado(),
  };
}
