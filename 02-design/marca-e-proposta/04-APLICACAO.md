# 04 — Aplicação: onde a marca aparece

> O que cada superfície mostra, com o texto já escrito no tom do `01-TOM-DE-VOZ.md`. Medidas de componente (altura, raio, espaçamento) ficam com o sistema de design; aqui é o que vai dentro.

## Dentro do app

### Tela de abertura (splash)

- Fundo `marca` inteiro. Símbolo em branco no centro, 96 px. Nada mais: sem slogan, sem versão, sem barra de progresso.
- Dura o tempo que o app leva para carregar, nunca mais de 1,5 s "por efeito". Se o carregamento demora mais, o símbolo some e entra a tela inicial com esqueleto.
- Movimento reduzido ligado: sem animação. Com movimento: o braço vertical do "+" desce sobre a barra (200 ms, saída suave), uma vez.
- **Tela de boas-vindas (primeira abertura, antes do login)**: fundo `fundo`, wordmark no topo, uma frase: *"A sua academia no bolso."*, um campo de telefone ou e-mail e um botão `marca` "Entrar". Abaixo, pequeno: "Ainda não tem conta? A recepção da sua academia libera o acesso." (ajustar quando a especificação definir como o aluno entra).

### Abertura e entrada com duas portas (P09, agente O, 10/10/2026)

Vale no lugar do item "Tela de boas-vindas" acima, que era anterior às duas portas. O resto da tela de abertura acima continua valendo (só o símbolo, nada de slogan, nunca mais de 1,5 s "por efeito"). Mockup: `02-design/sistema-de-design/mockups/entrada.html`. Fluxo: `01-especificacao/02-FLUXOS.md`, F13.

**A abertura em duas camadas**

1. **A estática**, que o sistema mostra enquanto o app carrega (`expo-splash-screen`, plugin do Expo SDK 54, no lugar do `splash` do topo do `app.json`, que o Expo chama de legado):

   | Chave do plugin | Claro (padrão) | Escuro (`dark`) |
   |---|---|---|
   | `backgroundColor` | `#007761`, a `marca` do claro (tokens 1.6.0) | `#0A332C`, a `marcaSuave` do escuro |
   | `image` | `02-design/imagens/entrada/abertura-simbolo-claro.png` (símbolo branco) | `…/abertura-simbolo-escuro.png` (símbolo `#39F0CD`, o verde vivo) |
   | `imageWidth` | `154` | o mesmo |
   | `resizeMode` | `contain` | o mesmo |

   - **Arquivo**: PNG 1024 × 1024 com fundo transparente, como o Expo pede (só PNG; outro formato quebra o build de produção). O símbolo tem 637 px de largura e cabe inteiro no círculo central de 2/3 da arte, a área que o Android 12+ mostra.
   - **Tamanho na tela**: com `imageWidth` 154, o símbolo aparece com 96 pt de largura (154 × 637 / 1024), o tamanho combinado acima.
   - **Por que o escuro não é a marca cheia**: um verde vivo de tela inteira às 6 da manhã, no quarto escuro, ofusca. O escuro usa o verde profundo com o símbolo em verde vivo, o efeito "neon" das referências. O claro usa a mesma cor do ícone, então o salto do ícone para a abertura não tem costura.
   - **O ícone acompanha**: desde a junção do P09 (agente Q, 10/10/2026) os arquivos do caminho A em `logo/` estão em `#007761`, a mesma cor da abertura. Os dois nunca ficam diferentes.
   - **Conferir no aparelho**: o Expo avisa que o Expo Go e o build de desenvolvimento não mostram a abertura igual à de produção. O tamanho real no Android 12+ se confere no build `previa`.

2. **A passagem para a entrada**, desenhada pelo app quando ele termina de carregar (`SplashScreen.hideAsync()` só depois que a primeira tela pintou):
   - o símbolo aparece descendo 14 px (`duracao.media`, 200 ms, curva `entrada`);
   - quando o app fica pronto, o símbolo encolhe de 96 para 32 e sobe até o selo do logo (`duracao.lenta`, 320 ms, curva `padrao`), enquanto a cor da abertura esmaece;
   - a foto entra por baixo, de 1,04 para 1;
   - o selo, o título e as duas portas sobem 8 px (`movimento.deslocamentoEntrada`), com 60 ms entre um e outro (`movimento.atraso.escalonamento`);
   - com "reduzir movimento": nada desliza nem encolhe. A abertura esmaece em 160 ms e as boas-vindas já estão lá.
   - Na demo, o símbolo fica parado 700 ms antes de subir (`--o-abertura-espera`). No app essa espera é o tempo real de carregar, e nunca se segura a tela para "mostrar o efeito".
   - Quem já tem sessão não vê as boas-vindas: a abertura dá direto na visão do vínculo, com o mesmo esmaecer.

**Boas-vindas**

- A foto da entrada (`02-design/imagens/entrada/`, créditos em `imagens/CREDITOS-entrada.md`) ocupa a tela inteira, com a camada de contraste na metade de baixo.
- No topo, o **selo do logo**: o símbolo de 32 e "Academia **Plus**" numa pílula de vidro. É como a regra "sobre foto, nunca direto" de `03-LOGO.md` se cumpre aqui: o vidro faz o papel da faixa de `superficie`.
- Título: *"Seu treino e sua academia no mesmo lugar."* (a frase do F1), 36/42, Figtree 700. Embaixo: *"Escolha por onde você entra."*
- As duas portas, cartões de vidro de 88 com o ícone num círculo de verde vivo:
  - **Sou aluno** · *Treino, histórico e o Plus*
  - **Sou da academia** · *Personal, instrutor, recepção e dono*
- Nada de "Já tenho conta": cada porta serve para entrar e para criar conta.

**Passos depois da porta**

- **A mesma foto, desfocada**, no fundo de todos os passos, como na referência 02. É um arquivo já desfocado (`…-desfocado@1x/2x.webp`), e não um desfoque ao vivo da tela inteira, que pesaria nos Android mais simples. O desfoque ao vivo fica só nos painéis de vidro.
- Os botões das contas: **"Continuar com a Apple"** e **"Continuar com o Google"**, os dois do mesmo tamanho e no mesmo estilo (preto no claro, branco no escuro), um embaixo do outro. "Continuar com e-mail" vem depois, em verde vivo. No iPhone, o da Apple é o botão nativo (`AppleAuthenticationButton`) no estilo equivalente.
- Os textos dos passos seguem o tom de voz: título curto ("Entrar", "Criar conta", "Nova senha", "Qual é a sua academia?"), uma frase de apoio, um botão. As perguntas opcionais sempre têm "Pular" no alto, à direita.

### Ícone

- Caminho escolhido em `03-LOGO.md`, fundo `marca` claro (`#007761`; era `#006B5F`) nos dois temas do sistema (o ícone não muda com o tema do celular; é o mesmo em todo lugar).
- Android adaptativo: camada de fundo `#007761` sólida, camada de frente com o símbolo branco dentro de 66 % da área.
- iOS: 1024 × 1024 sem arredondamento; o sistema aplica a máscara. Versão "tinted" do iOS: usar o monocromático.
- Ícone de notificação (Android, status bar): o monocromático em branco.

### Cabeçalho

- Visão do aluno, tela inicial: **nome da academia** à esquerda em Figtree 600 ("Academia do Marcos"), símbolo do Academia Plus à direita, 24 px, na cor `marca`. O aluno é da academia; o app é o "a mais". Nas telas internas, o cabeçalho é só o título da tela e a seta de voltar, sem logo.
- Visão da academia: o mesmo, com uma linha `textoSecundario` abaixo do nome: "Visão da academia · Dani". É assim que o app diz em qual visão a pessoa está sem parecer dois apps (regra do `04-COERENCIA-ENTRE-VISOES.md` do sistema de design).
- Nunca o wordmark inteiro no cabeçalho: ocupa espaço de título.

### Estado vazio

Ilustração de traço na cor `marca` (objeto da sala, 64 px), título de uma linha, uma frase, um botão.

| Tela | Ilustração | Título | Frase | Botão |
| --- | --- | --- | --- | --- |
| Treino livre, sem exercício | barra vazia | Seu treino começa aqui | Adicione o primeiro exercício. | Adicionar exercício |
| Histórico, nada fechado | caderno fechado | Nenhum treino fechado ainda | O primeiro aparece aqui. | Ver treinos prontos |
| Treinos prontos, academia não cadastrou | prateleira vazia | A academia ainda não montou treinos prontos | Enquanto isso, dá para montar o seu. | Montar treino livre |
| Lista de alunos (visão academia), filtro sem resultado | lupa | Ninguém com esse filtro | Tenta outro nome ou limpa o filtro. | Limpar filtro |
| Conversa com o personal, vazia (Plus) | balão | Fale com a Dani | Ela vê suas séries e seu plano alimentar por aqui. | Escrever |

### Selo Plus e tela de convite

**Selo** (`logo/selo-plus.svg`): pílula dourada, palavra "Plus", 24 px de altura, canto superior direito do cartão ou ao lado do título. Regras no `02-IDENTIDADE-VISUAL.md`.

**Cartão de convite na tela inicial** (só para quem não assina, só uma vez por dia, com "Agora não" que o esconde por 30 dias):
- Fundo `plusSuave`, selo no canto.
- Título: *Quer alguém montando o seu treino?*
- Frase: *No Plus, um personal da academia acompanha você pelo app: treino, alimentação e conversa.*
- Botões: "Saber mais" (`marca`) e "Agora não" (texto).

**Tela de convite** (ao tocar "Saber mais"):
- Topo: selo grande (28 px) e título *Treine com um personal da academia.*
- Três linhas com ícone de traço, nada de lista de 12 benefícios:
  - **Treino ajustado para você.** O personal monta e muda conforme você evolui.
  - **Plano alimentar.** Refeições organizadas, sem proibição.
  - **Conversa pelo app.** Dúvida de série, de carga, de comida: pergunta ali.
- Quem é o personal: foto e nome (humaniza; é gente da academia).
- Preço e botão: **[decidir]** depende de quem paga. Se o aluno assina no app: "R$ X por mês · Assinar". Se a academia cobra: "Fale na recepção para ativar" e botão "Avisar a recepção" (manda mensagem para a academia).
- Rodapé pequeno: *Dá para cancelar quando quiser. Seu treino livre continua igual.*
- O que **não** tem: contador regressivo, "oferta por tempo limitado", comparação "grátis vs. Plus" com X vermelhos, cadeado.

### Notificação

Título curto, corpo de uma frase, sem emoji por padrão (**[decidir]** se o Alex quiser, um por notificação, no fim).

| Quando | Título | Corpo |
| --- | --- | --- |
| Lembrete de treino (horário que o aluno escolheu) | Treino B pronto | Quando você quiser, ele está aqui. |
| Personal ajustou o treino (Plus) | Dani mudou seu treino | Toque para ver o que mudou. |
| Nova mensagem (Plus) **[decidir]** chat | Dani | Mensagem nova. Toque para abrir. (nunca a prévia) |
| Instrutor montou treino para o aluno | Treino novo da academia | A Dani montou um treino para você. |
| Sem treino há 10 dias **[decidir G4]** | Seu treino está guardado | Quando quiser voltar, ele está aqui. |
| Para a academia: aluno novo entrou | Juliana entrou na academia pelo app | Toque para ver o perfil. |

O que nunca vai em notificação: peso, medida, objetivo, restrição, exercício e carga, nome de refeição, prévia de mensagem — qualquer dado de saúde (LGPD e regra de marca; a notificação aparece na tela bloqueada e passa por Apple, Google e Expo). A tabela completa dos 20 avisos está em `03-arquitetura/03-DECISOES-TECNICAS.md`, seção 3. "Dani mudou seu plano alimentar" sim; o conteúdo do plano, não.

## Fora do app

### Cartaz na recepção (A3 vertical, 297 × 420 mm; versão A4)

- Fundo `#F4F8F7`. Topo: logo da academia (co-branding) e wordmark do Academia Plus, mesma altura.
- Meio: um celular de traço (ilustração) mostrando a tela de treino do dia, ou uma foto da própria sala com a faixa de texto.
- Título, Figtree 700, grande: **Seu treino, no seu celular.**
- Frase: *Monte o seu ou escolha um treino pronto. Peça na recepção para liberar o acesso.*
- QR code para a loja (um para Android, um para iOS, ou um link que escolhe), com a legenda "Baixe o Academia Plus".
- Rodapé, pequeno: selo Plus e *"Quer um personal acompanhando pelo app? Pergunte sobre o Plus."* É a única menção ao pago no cartaz.
- Nenhuma foto de corpo. Nenhum "transforme-se".

### Story do Instagram (1080 × 1920)

Três modelos, sempre fundo `marca` ou `fundo`, Figtree, texto curto, selo só no terceiro:

1. **Lançamento**: fundo `marca`, símbolo branco grande no topo, texto branco: *"Chegou o app da academia."* / *"Treino do dia, treinos prontos, sua carga guardada."* / sticker de link para a loja.
2. **Treino pronto da semana**: fundo `fundo`, cartão branco com o nome do treino ("Iniciante · 35 min · 6 exercícios"), captura real da tela em moldura de celular, texto: *"Novo treino pronto na academia."*
3. **Plus**: fundo `plusSuave`, selo em cima, foto do personal (gente real, na sala), texto: *"A Dani acompanha você pelo app."* / *"Treino, alimentação e conversa. Pergunte na recepção."*

Nunca: antes e depois, balança, "projeto verão", desconto com contador.

### Página na loja (Google Play e App Store)

**Nome:** Academia Plus
**Subtítulo (30 caracteres):** Seu treino, no seu celular
**Descrição curta (80 caracteres):** O app da sua academia: treino do dia, treinos prontos e sua carga guardada.

**Descrição longa:**

> O Academia Plus é o app da sua academia. Abra e veja o treino de hoje, série por série. Monte o seu do zero ou escolha um treino pronto pelo seu objetivo: começar a treinar, ganhar massa, condicionamento, perder peso, manter. Marque o que fez, guarde a carga e veja quanto evoluiu.
>
> Quer informar peso, altura e objetivo? Ajuda o instrutor a montar o treino para você. Não quer? Tudo funciona do mesmo jeito.
>
> **Plus.** Para quem quer alguém olhando de perto: um personal da academia monta e ajusta seu treino e seu plano alimentar, e conversa com você pelo app.
>
> Para usar, sua academia precisa estar no Academia Plus. Pergunte na recepção.

**Capturas (6, em moldura de celular, 1290 × 2796 ou o tamanho que a loja pedir, cada uma com título de 3 ou 4 palavras no topo):**

1. Treino do dia (aluno) — "O treino de hoje"
2. Linha de série com +/- de carga e cronômetro — "Carga e descanso na mão"
3. Escolher treino pronto por objetivo — "Treinos prontos da academia"
4. Histórico com evolução de carga — "Veja quanto evoluiu"
5. Perfil do aluno visto pelo instrutor (visão academia) — "A academia monta para você"
6. Plano alimentar e conversa (Plus), com o selo — "No Plus, um personal acompanha"

Tema claro nas capturas (lê melhor na loja); a sexta pode ser no escuro para mostrar que existe.

**Classificação e dados:** as lojas vão perguntar sobre dados de saúde. Declarar que o app coleta peso, altura e restrições **opcionalmente**, que ficam visíveis só para a academia e o personal autorizado, e que não vão para analytics. Isso é a convenção do `CLAUDE.md` e precisa estar na política de privacidade antes de publicar.
