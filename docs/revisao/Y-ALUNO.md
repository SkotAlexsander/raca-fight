# Y — Telas do aluno (P11, onda 2) · 11/10/2026

O agente Y escreveu as telas da visão do aluno em `app/telas/aluno/` (≈ 5.600 linhas) e as rotas em `app/navegacao/(aluno)/`. Ele não mexeu em `dominio/`, `componentes/`, `tema/` nem `dados/`. O que precisa ir para essas pastas está na seção 4, para o AA promover.

## 1. Verificações

| Verificação | Resultado |
|---|---|
| `npm run tipos` (tsc) | **0 erros** (o app inteiro, com as telas do Z) |
| `npm run testar:dominio` (domínio + dados) | **349 de 349 passam** |
| `npx expo export --platform web` | exporta (2,5 MB de JS). Saída em pasta própria no scratchpad, para não brigar com o `dist/` do Z |
| Playwright: 25 roteiros × 393×852 e 2040×790 × claro e escuro | **100 capturas, 0 erro de página, 0 erro no console, 0 rolagem horizontal**. Mais as capturas da página inteira no celular |
| Comparação com o mockup | capturas olhadas lado a lado com `index.html` (telas 1, 2, 4, 5 e 6) e `novas.html` (quadros 1, 2, 2b, 3, 3b e 4). As diferenças estão na seção 3 |

As capturas ficam em `scratchpad/y-aluno/capturas/` e as do mockup em `y-aluno/mockup/`. Os scripts são `capturar.mjs` e `mockup.mjs`, ao lado. O roteiro não depende da tela de entrada: ele grava a sessão de exemplo no `localStorage` (`academia-plus:armazenamento-local`) antes de abrir a página. Por isso a mudança do Z (`/boas-vindas` → `/contas-de-exemplo`) não o afeta. Os roteiros cobrem:
- a Ana, aluna Plus;
- o Diego, na visão de aluno e sem Plus (o convite);
- a Juliana, com vínculo pendente;
- o Lucas, sem academia;
- o caminho Começar → Série feita → descanso → Pausar → Encerrar → comemoração.

## 2. Telas feitas

**Rotas.** `(aluno)/_layout` é uma pilha com o guarda do vínculo e o `ProvedorDoAluno`. Por cima das abas ficam `modo-treino` e `comemoracao`, em tela cheia e sem abas. `(aluno)/(abas)/` tem as 4 abas, cada uma com a sua pilha. As URLs:
- Início: `/inicio`, `/inicio/cronometro`, `/inicio/historico`;
- Treinos: `/treinos`, `/treinos/[id]` (editar), `/treinos/pronto/[programa]`, `/treinos/series`, `/treinos/evolucao`;
- Plus: `/plus`, `/plus/dieta`;
- Perfil: `/perfil`, `/perfil/meus-dados`, `/perfil/quem-pode-ver`, `/perfil/avisos`, `/perfil/conta`, `/perfil/equipe`, `/perfil/profissional/[id]`.

| Tela | O que tem |
|---|---|
| **Início** | Saudação e sino. Aviso da academia, que se dispensa. "Seu treino está na hora de trocar" (R12.5). Sua semana com as 7 bolinhas e o "N de 4" em 31. **Herói**: a capa do treino de hoje, com o painel de vidro e "Começar", "Trocar dia" e "Voltar ao treino" quando há um treino aberto. Dieta de hoje (Plus) e 4 atalhos. O estado vazio mostra "Monte seu primeiro treino" |
| **Treinos** | Duas sub-abas. **Meus treinos**: a capa do treino em uso com "Deslize para começar" (o treino nasce no soltar), os guardados, Evolução, Histórico, "Pedir treino novo" (R12.2, folha com o recado de 140 e Cancelar) e "+ Novo treino" (folha do F2). **Prontos**: o filtro de objetivo, que começa no objetivo do aluno; "Para você" com o treino em uso primeiro; a grade em duas capas e a lista com miniatura; busca; "Outros objetivos" |
| **Ver treino pronto** | Foto do programa, objetivos, descrição e cada dia com os exercícios (ilustração 48). "Usar este treino" abre a folha da cópia (R1.4): cria a cópia, ativa e abre o Editar (F3.5) |
| **Editar treino** | "Baseado em…" ou "Montado por X", que vira link quando o perfil está visível (R11.12). Só leitura no treino do personal com o Plus ativo (R1.7). "Usar este treino". Dias em chips com "+ Dia", Renomear e Apagar dia. Exercícios do dia. "+ Exercício" abre a folha Escolher exercício (busca e grupos) |
| **Séries** | Por série: repetições ou tempo, carga e descanso no Campo numérico; aquecimento; apagar. "+ Série", "Copiar a série 1 para as outras", observação, tirar o exercício e "Pronto". Salva a cada toque |
| **Modo treino** | Sempre escuro, em tela cheia. Minimizar, "Treino A · exercício 2 de 7" com os segmentos, e Pausar. O palco tem grupo e carga, o nome e o **número enorme em 61** (herói). O painel de vidro tem: série N de M com as bolinhas (o check entra com a mola 0,6/400 ms), carga e repetições +/− (R12.1: a carga vem da última vez ou da planejada nova), "Última vez" e "Plano", **Série feita**, "Última série gravada no celular às HH:MM" e o Próximo. Na série por tempo, o botão vira "Iniciar · 0:30"; o fim marca sozinho e "Parar" marca com o tempo feito (R9.10). **Descanso**: anel de 248 que esvazia em linha reta, recalibrado só quando o estado muda e laranja nos últimos 10 s; −30 s · Pular · +30 s; "Série N feita · Desfazer" e "A seguir" no painel. **Pausa**: Continuar · Pular este exercício · Cronômetro · Encerrar · Descartar. A última série pergunta "Encerrar treino?" (F4.6) |
| **Comemoração** | Verde vivo nos dois temas. O círculo cresce na mola e o check se desenha. O resumo entra escalonado em 60 ms. "Treino fechado." em 39 ExtraBold, os 3 números e o destaque de carga quando houve aumento. "Pronto" escuro e "Como foi?", com a nota gravada no treino realizado. Com movimento reduzido, tudo esmaece em 160 ms |
| **Cronômetro** | Foto, os chips Livre · Regressivo · Intervalado, a configuração (atalhos 1–10 min, "Outro", ±30 s; predefinições, os 4 números e o total) e "Iniciar". O **mostrador** é pintado pela fase, sempre com o nome dela escrito, número em 61, barra da fase e as rodadas. Controles de cada modo. "Terminou" com "Registrar como série" (folha só com os exercícios por tempo), "De novo" e "Fechar". Pergunta antes de parar o descanso do treino (R9.9). Tela acesa enquanto roda (`expo-keep-awake`) |
| **Evolução** | Foto, Voltar e o período (4 sem. · 3 meses). **Herói**: a maior carga da semana em 49, num vidro sobre a foto, com o seletor de exercício e "+X kg desde…". Depois: linha da carga, mapa do mês, treinos por semana (meta tracejada, semana em andamento hachurada) e rosca de volume por grupo, com o grupo tocável. "Ver em tabela" em cada gráfico. Estado vazio com os contornos tracejados. Sem kcal e sem peso do corpo |
| **Histórico** | Os treinos fechados, com duração, séries, volume e "aguardando sinal" quando ainda não subiu. Atalho "Treino passado" |
| **Plus** | **Convite**: foto, selo, as 3 linhas e "Conhecer o Plus", que explica que é a academia quem liga (escolha provisória "via academia"). Sem academia, o convite explica que o Plus é da academia. **Ativo**: Meu personal (abre o perfil se estiver visível, R11.11) com Conversar, Dieta de hoje, Meu treino, Minha dieta e a linha da assinatura. Sem personal: "Aguardando seu personal" |
| **Dieta do dia** | Data navegável para trás; resumo na ilha escura com o anel; uma refeição por cartão com a borda Plus, os itens e a troca da Júlia; marcar feita, desmarcar e "Não segui" com o motivo |
| **Perfil** | Conta com o selo Plus; academia; **"Equipe da Academia do Marcos" logo abaixo** (só com vínculo ativo); Meus dados, Quem pode ver, Avisos e Conta; chave de Vibração; Trocar de visão (quem tem outro papel); Catálogo de componentes; Sair |
| Meus dados · Quem pode ver · Avisos · Conta | Peso e pesagens com "Registrar peso", altura, idade, objetivo, dias por semana e restrições. Chave da academia, com confirmação ao desligar, e a linha do personal. Chaves da Parte 4, dias e hora do lembrete, "Usar minha frequência", refeição do Plus e a frase do silêncio. E-mail, trocar senha, exportar e apagar conta com confirmação dupla (simulados e avisados como tal) |
| **Equipe** (nova) | Ver a seção 3.4 |
| **Perfil do profissional** (novo) | Ver a seção 3.4 |

**Regra de gravar antes de animar.** "Série feita" segue esta ordem:
1. chama `marcarSerie`, que monta o `TreinoRealizado` e chama `useFila().registrarTreinoRealizado` (SQLite síncrono e fila de envio);
2. vibra (`marcarSerie`);
3. começa o descanso pelo motor;
4. só então a tela muda e o check anima, pela mudança do dado.

O treino nasce gravado no "Começar". Encerrar grava o fim antes de abrir a comemoração. Desfazer regrava sem a série. Se o app fechar no meio, o treino aberto de hoje é retomado na volta.

## 3. O que diverge do mockup, e por quê

### 3.1 Por regra do projeto ou do mapa (de propósito)
- **Sem o "+" central na barra** (os mockups ainda mostram). A escolha provisória de 11/10 é de 4 abas.
- **Treino pronto arquivado não aparece para o aluno.** O mockup mostra "Intervalado 25 · Arquivado" esmaecido, mas a R1.5 diz que o arquivado sai das listas.
- **Dieta contada por refeição**, não por item. O mockup diz "4 de 11 itens". O modelo registra por refeição (R3.6) e o Início do mockup diz "3 de 5", então a tela segue o modelo e os itens mostram a marca da refeição.
- **Foto do exercício só quando ela é daquele exercício.** O mockup usa a foto do crucifixo no cabo, mas a regra é "imagem coerente com o assunto". Só o supino inclinado tem foto própria. Os outros exercícios ficam na ilha escura com a luz lateral e a ilustração de 64.
- **Pausar abre o menu do treino** (Continuar, Pular exercício, Cronômetro, Encerrar, Descartar) e pausa o descanso, se ele estiver rodando. O mapa pede o ⋯ com essas ações, e o mockup só tem o Pausar.
- **"Treino fechado." em 39 (`tituloEntrada`)**, o maior título da escala abaixo dos números, como no `novas.css`.

### 3.2 Por usar os componentes que existem (nada de tamanho novo)
- **Carga e repetições no Modo treino** usam o `CampoNumerico`, com botões de contorno de 36. O mockup tem uma pílula translúcida (`.p-passo`).
- **"Começar"** fica com a seta à esquerda do rótulo, porque o `Botao` só põe ícone antes. O mockup tem a seta num círculo à direita.
- **Botões de 48**: "Série feita" e "Iniciar" são `Botao` grande (48). O mapa cita 64, mas o componente não tem esse tamanho.
- **Avatar com 2 letras ("AS")**. O mockup mostra "A".
- **Número do descanso em 49** (`numeroCronometro`) com Archivo ExtraBold. É o mesmo do `.p-anel__tempo`.
- **Convite ao Plus**: o halo e o reflexo dourado ("uma vez por visita") não foram feitos. Não há componente para isso; o `Botao` plus é chapado.
- **Faixa do cronômetro**: tem a barra de progresso de 4 em cima, em `vidroBarra` sólido. O `sistema.css` desfoca; aqui não, porque é uma faixa opaca acima da barra.

### 3.3 Achados que não são meus (para o AA)
- **`FotoComTexto` em 2040 px**: na capa do Início, a imagem `-capa@1x` (358 px) não cobre o cartão de 600. Ela fica com a largura natural e o resto é a ilha escura (captura `inicio-ultrawide-*`). O `Image` do react-native-web com `absoluteFill` e `cover` não esticou. Precisa de conferência no componente. Em 393 está certo.
- O cabeçalho pequeno com voltar fica com o título um pouco abaixo do ícone (é do `Cabecalho`).

### 3.4 As telas novas (Equipe e Perfil do profissional)
Feitas só com o que existe, sem tamanho fora da escala:
- **Equipe**: cabeçalho pequeno com a academia; frase curta; Chips com "Todos" e só as especialidades marcadas (`especialidadesDaEquipe`); cartões em ordem alfabética (`equipeParaMostrar`), cada um com Avatar 40, nome em `titulo3`, formação em `corpoPequeno` e até 3 especialidades. Sem nota, estrela ou contagem. O estado vazio usa a frase do mapa. Quem não tem vínculo ativo vê a explicação.
- **Perfil do profissional**: a ilha escura do "Perfil do aluno" (`FotoComTexto` capa sem foto) com Avatar 64 e nome em `titulo1`. Depois:
  - "CREF 012345-G/SP · Informado pelo profissional" (escrito inteiro; "verificado" só aparece com a conferência, que é [decidir]);
  - chips das especialidades e "Sobre mim";
  - a grade **"Na academia"** (dias × manhã, tarde e noite) nas cores do mapa de frequência da Evolução;
  - a frase "não mostra telefone, e-mail nem preço".

  Sem botão de contato. Nenhum dos dois tem herói numérico: são listas.

## 4. Peças para o AA promover (criadas aqui porque não posso escrever fora de `telas/aluno/`)

| Peça | Onde está | Para onde |
|---|---|---|
| **Escrita de treino no repositório** (salvar, ativar, usar pronto, criar). Hoje fica em memória no `ProvedorDoAluno`, só nesta abertura | `estado/ProvedorDoAluno.tsx` (`useTreinosDoAlunoLocal`) | `dados/repositorio.ts`, com `salvarTreino`, `ativarTreino` e `copiarPronto`, e persistência |
| **Refeição registrada na fila** (o domínio já tem o tipo `refeicao_registrada`; o `ProvedorDeDados` só expõe treino) | `marcarRefeicao` em `ProvedorDoAluno` | `useFila().registrarRefeicao` |
| Pedido de treino, peso registrado, autorização da academia, chaves de avisos e lembrete: hoje só em memória | `useDadosLocais` | escrita no repositório (pedido precisa de sinal, R12.2) |
| **Persistir o cronômetro** a cada toque (R9.4). Hoje ele vive na memória; o treino aberto já é retomado pelo treino realizado | `ProvedorDoAluno` | `dados/` (por exemplo, `gravarPreferencia('cronometro', JSON)` exposto) |
| Consultas `useMedicoesDoAluno`, `useRefeicoesRegistradas`, `usePedidosDaAcademia` | `estado/consultas.ts` | `dados/consultas.ts` |
| **Prontos para o vínculo pendente (R12.9)**. O `useTreinosProntos` usa só o vínculo ativo; aqui a consulta usa `academiaDosTreinosProntos()` (ativo, senão a academia do pedido pendente) | `estado/ProvedorDoAluno.tsx` | `dados/consultas.ts` (corrigido no aluno, a pedido do Z: a Juliana já vê os prontos, com a frase "Enquanto a Academia do Marcos confirma…") |
| **Nomes dos objetivos, níveis, grupos, especialidades e turnos**. O Z tem uma cópia nos formatos dele; do lado do aluno ficou **um só**, `telas/aluno/comum/formatos.ts` | `comum/formatos.ts` | `tema/` ou `dados/`, um só para as duas visões ([decidir] nomes dos objetivos) |
| `AbasDoAluno` (as abas com a faixa do cronômetro em cima) | `comum/AbasDoAluno.tsx` | `AbasDaVisao` ganha `acimaDaBarra` |
| `Chave` (Switch nas cores do tema), `Linha` (56/72), `GrupoDeLinhas`, `TelaComRolagem`/`Coluna`, `BotaoSobreFoto` | `comum/Tela.tsx` | `componentes/` |
| Gráficos: linha, barras com meta e hachura, mapa do mês, rosca e tabela | `comum/Graficos.tsx` | `componentes/` (o painel do dono, do Z, usa as mesmas barras) |
| `useEquipeDoAluno` (perfis visíveis, o nome de quem montou e o link) | `comum/equipe.ts` | `dados/` |
| `testID="marcar-serie"` no botão "Série feita" | `TelaModoTreino.tsx` | para o teste de tela do AA |

## 5. Pendências e o que ficou de fora

- **Registrar treino passado (H36)**, **Plano de dieta (ver)**, **Gerenciar assinatura** e **Sua academia (perfil)**: sem tela. As linhas existem e dizem o estado.
- **Conversa com o personal** ([decidir], provisório "chat só texto"): "Conversar" mostra o aviso "chega na próxima versão".
- **Trocar exercício na hora (R1.19)** e **reordenar arrastando (H18)**: não feitos.
- **Lembrete no primeiro treino fechado** (convite da Parte 4 na comemoração): não feito.
- Na carga planejada vazia, a tela de Séries mostra 0 com o rótulo "Carga (sem carga definida)": o `CampoNumerico` não tem estado vazio.
- No aparelho, não testei vibração, `keep-awake`, folha nativa nem desfoque da foto no descanso (`blurRadius`; no navegador funcionou).
