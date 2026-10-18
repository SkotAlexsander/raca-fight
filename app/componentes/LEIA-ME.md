# componentes/

Os componentes base, iguais aos do `02-COMPONENTES.md` e do `mockups/sistema.css`. Todos juntos na rota **/componentes**. Importe de `@/componentes`.

Texto · Icone (sprite convertido: `npm run gerar:icones`) · IlustracaoExercicio · Botao (toque 48 por hitSlop) · Campo · CampoDeSelecao · CampoNumerico (+/−, barra do teclado no iPhone) · Chip/Chips · Cartao (afunda) · SeloPlus · Vidro/PilulaDeVidro (sólido com "reduzir transparência") · FotoComTexto · Anel · Deslizar · BarraDeAbas · Cabecalho (grande que encolhe) · FolhaInferior · AvisoRapido (+ ProvedorDeAvisoRapido/useAvisoRapido) · EstadoVazio · Avatar, Divisor, CartaoDeNumero, Esqueleto.

Promovidos das telas pelo agente AA (P11): Interruptor e LinhaComChave · Lista, Linha e GrupoDeLinhas · Quadro, GradeDeQuadros, Medidor e GraficoDeBarrasDosDias · Gráficos da Evolução (GraficoDeLinha, GraficoDeBarras, MapaDoMes, Rosca, Tabela) · Simbolo e SeloDoLogo (o logo em SVG) · AbasDaVisao com FaixaDoCronometro e FaixaDoTreino · CartaoDoProfissional e ListaDaEquipe. E `formatos.ts`: os nomes e formatos de tela das duas visões, num arquivo só (importe de `@/componentes/formatos`).

Testes de tela (jest-expo, `npm run testar:telas`): Botao, CampoNumerico, AvisoRapido (Desfazer) e Deslizar.

Regras: sem acesso a `dados/`; cor só por papel do tema; texto só pela escala; o dado grava antes da animação (quem usa grava, o componente anima pela mudança).
