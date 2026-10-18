/**
 * Ponto de entrada do tema. Tudo vem do tokens.json por `npm run gerar:tema`
 * (ferramentas/gerar-tema.mjs → tema/gerado/tokens.ts).
 *
 * `tokens` é o arquivo gerado inteiro; os blocos mais usados saem também com
 * o próprio nome. `duracao`, `curva` e `movimento` vêm de `movimento.ts`, já
 * na forma do Reanimated.
 */
export * as tokens from './gerado/tokens';
export {
  VERSAO_DOS_TOKENS,
  abas,
  alvo,
  anel,
  borda,
  camada,
  controle,
  cronometro,
  deslizar,
  espaco,
  folha,
  foto,
  icone,
  ilustracao,
  imagem,
  layout,
  raio,
  tipografia,
  vidro,
} from './gerado/tokens';
export type { CoresDoTema, DegradeLinear, DegradeRadial, DegradesDoTema, NomeDoEstiloDeTexto, SombrasDoTema } from './gerado/tokens';
export * from './ProvedorDeTema';
export * from './tipografia';
export * from './movimento';
export * from './vibracao';
export * from './ProvedorDeVibracao';
export { FONTES_DA_MARCA } from './fontes';
