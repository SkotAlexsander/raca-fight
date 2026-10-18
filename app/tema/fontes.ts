/**
 * As fontes da marca (SIL OFL 1.1) que o tema chama pelo NOME DO ARQUIVO
 * (`tipografia.familiaPorPeso`: no iOS cada peso é uma família).
 *
 * No build (EAS) o plugin `expo-font` do app.json embute os arquivos e eles já
 * existem quando a primeira tela abre. No Expo Go e no navegador o plugin não
 * vale: o `_layout.tsx` da raiz carrega este mapa com `useFonts()`
 * (03-arquitetura/04-IPHONE.md, seção 7). Os nomes são os mesmos nos dois casos.
 */
export const FONTES_DA_MARCA = {
  'Figtree-Regular': require('../recursos/fontes/Figtree-Regular.ttf'),
  'Figtree-Medium': require('../recursos/fontes/Figtree-Medium.ttf'),
  'Figtree-SemiBold': require('../recursos/fontes/Figtree-SemiBold.ttf'),
  'Figtree-Bold': require('../recursos/fontes/Figtree-Bold.ttf'),
  'Archivo-Bold': require('../recursos/fontes/Archivo-Bold.ttf'),
  'Archivo-ExtraBold': require('../recursos/fontes/Archivo-ExtraBold.ttf'),
} as const;
