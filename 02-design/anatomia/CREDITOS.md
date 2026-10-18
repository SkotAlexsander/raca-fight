# Créditos: mapa muscular

## Base em uso

| O quê | De onde | Licença | Conferido |
| --- | --- | --- | --- |
| Paths do corpo masculino, frente e costas (o "MuscleMap") | [melihcolpan/MuscleMap](https://github.com/melihcolpan/MuscleMap), `Sources/MuscleMap/Data/MaleFrontPaths.swift` e `MaleBackPaths.swift`, commit `cdcecf72` (09/10/2026) | MIT, © 2026 Melih Colpan | LICENSE do repositório e campo `license` da API do GitHub, 11/10/2026 |
| Os mesmos paths, na origem | [HichamELBSI/react-native-body-highlighter](https://github.com/HichamELBSI/react-native-body-highlighter), `assets/bodyFront.ts` e `bodyBack.ts`, commit `8ed39ac` (v3.2.0) | MIT, © 2022 ELABBASSI Hicham | idem |

**Por que as duas.** Comparei os dois repositórios path por path. Os 89 paths da frente e os 70 das costas do react-native-body-highlighter estão **idênticos** no MuscleMap. O MuscleMap acrescenta 8 na frente e 6 nas costas, as subdivisões que usamos:
- deltoide anterior e posterior;
- peitoral de cima e de baixo;
- trapézio de cima e de baixo;
- romboides e infraespinal;
- quadríceps interno e externo;
- abdômen de cima e de baixo;
- serrátil e flexor do quadril.

O LICENSE do MuscleMap traz só o nome do Melih e não cita o projeto do Hicham. A MIT de origem pede que o aviso dele acompanhe as cópias, então mantemos as **duas** licenças (`fonte/licencas/`).

**O que a MIT pede de nós.** O texto da licença e o aviso de copyright acompanham o app, na tela "Licenças de código aberto" ou no arquivo de licenças do pacote. **Crédito na tela de uso não é exigido.** Nada de compartilhar igual.

**O que mudou em relação à base:**
- convertemos os paths para absolutos, deslocamos a vista para começar em 0 e arredondamos para 1 casa;
- tiramos o cabelo da cabeça (ele entra só na silhueta);
- a silhueta é a união das peças com um traço de 14;
- recoloração e borda próprias;
- regiões renomeadas em português e agrupadas em músculos do app;
- recortes de miniatura;
- o corpo feminino da base não foi usado.

A extração está em `fonte/extrair-base.py`. Ela leu os `.swift` como texto, de um clone em quarentena fora do projeto, sem rodar nada do repositório. A varredura não achou `<script>`, `href`, `on*=`, `foreignObject`, `data:`, `url(` nem `javascript` nos paths, e o gerador repete essa conferência a cada extração.

## Pesquisadas e não usadas

| Base | Licença | Por que ficou de fora |
| --- | --- | --- |
| [giavinh79/react-body-highlighter](https://github.com/giavinh79/react-body-highlighter) | MIT | O próprio README diz que os polígonos vieram do react-native-body-highlighter: é a mesma base, com menos regiões. |
| [vulovix/body-muscles](https://github.com/vulovix/body-muscles) | Apache-2.0 (exige levar o NOTICE junto) | Tem mais regiões (70+), mas o desenho é poligonal, de traço reto. Ao lado dos ícones redondos do app parece outro sistema, e o corpo de costas ficou em blocos. |
| [suryamolly/muscle_mapper](https://github.com/suryamolly/muscle_mapper), estilo `advanced` | CC BY 4.0 (Ryan Graves, Figma Community) | Exige atribuição na tela do app. |
| suryamolly/muscle_mapper, estilo `minimal` | MIT no pacote | O SVG traz a classe `text-mw-gray`, prefixo `mw` como o do MuscleWiki. A origem do desenho não está declarada; não dá para garantir o direito, então ficou de fora. |
| Wikimedia Commons (diagramas musculares) | em geral CC BY-SA | Exige atribuição e compartilhar igual, o que contamina o derivado. Não foi baixado. |

## Fonte de cinesiologia

Os músculos de cada exercício (`fonte/musculos-por-exercicio.json`) foram conferidos no **ExRx.net** (Exercise Prescription on the Internet), página por página, em 11/10/2026. O ExRx barra robôs comuns; as páginas foram lidas com `curl` e o texto da seção "Muscles" está copiado em cada exercício, no campo `exrx`. O ExRx é só referência, não conteúdo copiado para o app: no app entram os nomes dos músculos em português.

Quatro exercícios não têm página de músculos no ExRx e estão marcados como `convencao`, para a revisão do profissional com CREF: esteira, bicicleta, corda naval e polichinelo.

## Caminho B (IA)

**Nenhuma imagem de IA foi gerada nem está em uso.** O modelo previsto era o `@cf/black-forest-labs/flux-1-schnell` do Workers AI. Os pesos são Apache-2.0 (Hugging Face, `license:apache-2.0`), e a página do modelo na Cloudflare aponta para os termos da Black Forest Labs. Se o B for usado um dia, cada imagem entra aqui com o modelo, a semente, o prompt e a data. Esses dados ficam em `ia/registro.json`, que o `fonte/testar-ia.py` escreve.
