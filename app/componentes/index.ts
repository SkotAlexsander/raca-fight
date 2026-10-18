/**
 * Componentes base do Academia Plus — iguais aos de
 * 02-design/sistema-de-design/02-COMPONENTES.md e do mockups/sistema.css
 * (tokens 2.0.0). Sem acesso a dados: recebem valores prontos ou formatam pelo
 * domínio. Veja todos juntos na rota /componentes.
 *
 * `formatos.ts` (nomes e formatos de tela das duas visões) é importado direto:
 * `@/componentes/formatos`.
 */
export { AbasDaVisao, FaixaDoCronometro, type AbaDaVisao } from './AbasDaVisao';
export { Anel } from './Anel';
export { Avatar, CartaoDeNumero, Divisor, Esqueleto } from './Auxiliares';
export { AvisoRapido, ProvedorDeAvisoRapido, useAvisoRapido, type DadosDoAviso, type TipoDoAviso } from './AvisoRapido';
export { BarraDeAbas, type AbaDaBarra } from './BarraDeAbas';
export { Botao, type TamanhoDoBotao, type VarianteDoBotao } from './Botao';
export { Cabecalho, type AcaoDoCabecalho } from './Cabecalho';
export { Campo, CampoDeSelecao } from './Campo';
export { BarraDoTeclado, CampoNumerico } from './CampoNumerico';
export { Cartao } from './Cartao';
export { Chip, Chips } from './Chip';
export { DegradeLinearDoToken, DegradeRadialDoToken } from './Degrade';
export { Deslizar } from './Deslizar';
export { CartaoDoProfissional, ListaDaEquipe } from './Equipe';
export { EstadoVazio, type IlustracaoDoVazio } from './EstadoVazio';
export { FolhaInferior } from './FolhaInferior';
export { FotoComTexto, type VarianteDaFoto } from './FotoComTexto';
export { Icone, type NomeDoIcone } from './Icone';
export { NOMES_DAS_ILUSTRACOES, NOMES_DOS_ICONES, type NomeDaIlustracao } from './icones/gerado';
export { GraficoDeBarras, GraficoDeLinha, MapaDoMes, Rosca, Tabela } from './Graficos';
export { Interruptor, LinhaComChave, type PropsDaLinhaComChave } from './Interruptor';
export { GrupoDeLinhas, Linha, Lista, type PropsDaLinha } from './Lista';
export { GradeDeQuadros, GraficoDeBarrasDosDias, Medidor, Quadro } from './Quadro';
export { PontoPlus, SeloPlus } from './SeloPlus';
export { SeloDoLogo, Simbolo } from './Simbolo';
export { Texto, type PapelDeCor } from './Texto';
export { usePressionado } from './usePressionado';
export { useUmPorVez } from './useUmPorVez';
export { useGravarComAviso, type ResultadoDaGravacao } from './useGravarComAviso';
export { PilulaDeVidro, Vidro } from './Vidro';
