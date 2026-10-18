# O — Abertura e entrada (P09, 10/10/2026)

Agente O. Escrevi só onde a tabela do P09 manda:
- `02-design/sistema-de-design/mockups/entrada.html` e `entrada.css`;
- `02-design/imagens/entrada/` e `02-design/imagens/CREDITOS-entrada.md`;
- seções novas em `01-especificacao/02-FLUXOS.md` (F13) e `04-MAPA-DE-TELAS.md` (Parte 1b);
- seção nova em `02-design/marca-e-proposta/04-APLICACAO.md`;
- este relatório.

O `sistema.css` e o `tokens.json` do N (1.6.0) são carregados e não foram editados. Nenhum **[decidir]** foi resolvido.

## 1. As telas

`entrada.html` abre por `file://`. No topo há seletores de tema (claro, escuro, sistema), aparelho (iPhone SE, 16, 16 Pro Max, Android 390), movimento, transparência e foto (principal ou alternativa). `?moldura=real`, `?aparelho=`, `?tema=`, `?foto=alternativa` e `?transparencia=reduzida` funcionam pela URL. As chaves de tema, aparelho e movimento são as mesmas do `index.html`, então a escolha vale nas duas páginas.

São 15 telas em três seções.

**1 · Abertura e boas-vindas**
- **Abertura → boas-vindas**: a demo animada, com o botão "Repetir abertura".
- **Abertura estática**: o que o `expo-splash-screen` mostra.
- **Boas-vindas**: foto nítida, o selo do logo em vidro, o título "Seu treino e sua academia no mesmo lugar." e as duas portas em vidro.

**2 · Porta "Sou aluno"**
- **Como entrar**: Apple, Google e e-mail.
- **Entrar com e-mail**.
- **Criar conta**.
- **Esqueci a senha**: o passo do código de 6 números e da nova senha.
- **Sua academia**: o código da academia, opcional.
- **Objetivo**: opcional, a lista fixa.
- **Dias por semana**: opcional, com o número enorme entre − e +.
- **Quem pode ver**: o passo 6 do F1.

**3 · Porta "Sou da academia"**
- **Entrar**: as três contas, mais "Tenho um convite ou código" e "Vou abrir minha academia".
- **Convite ou código**: o código da equipe e o papel esperado.
- **Pedido pendente**.
- **Dono abre a academia**, com a caixa **[decidir] uma academia ou várias**.

**Linguagem de todas as telas**:
- tudo em vidro sobre a mesma foto, desfocada, como na referência 02;
- pílulas de 56 e 64;
- verde vivo (`--cor-viva`) no botão principal, no ícone da porta, no check e nos traços do passo;
- "Pular" em pílula de vidro no alto, à direita;
- rótulo sempre visível acima dos campos;
- alvos de 48, 56 e 64.

**Capturas olhadas** (Playwright, Chromium do `.ferramentas`):
- 2040 × 790 e 393 × 852, nos dois temas;
- quadros da abertura com movimento normal e reduzido;
- sem rolagem horizontal e sem erro de console nas quatro combinações.

O que corrigi depois de olhar:
- a marca da opção esticava em pílula;
- o símbolo da demo ficava sobreposto ao selo (o `fill` da WAAPI vencia o estilo);
- no movimento reduzido, a abertura aparecia sem o símbolo;
- a tabela da abertura fazia rolagem lateral a 393 px;
- o texto de apoio do claro reprovava no contraste (seção 5).

## 2. O fluxo das duas portas

Está escrito em `01-especificacao/02-FLUXOS.md`, **F13** (acrescentado; o F1 continua como estava), e resumido em `04-MAPA-DE-TELAS.md`, **Parte 1b**.

- **Abertura**: sem sessão, vai para as boas-vindas. Com sessão, vai direto para a visão do vínculo.
- **Sou aluno**: conta (Apple, Google ou e-mail) → código da academia (opcional, R8.1; pendente até a recepção) → objetivo (opcional) → dias por semana (opcional) → "Quem pode ver" (só com academia e objetivo respondido) → Início.
- **Sou da academia**: conta → convite por e-mail (já vem com o papel e nasce `ativo`) **ou** código da equipe (6 caracteres, diferente do código dos alunos) → pedido `pendente` até o **dono** confirmar e escolher o papel. Enquanto espera, a pessoa pode "Treinar como aluno enquanto isso". A outra saída é "Vou abrir minha academia", que é **[decidir]**: só existe se forem várias academias.
- **Como casa com "o papel decide a visão"**: a porta escolhe só o caminho do cadastro, e nada dela vira papel. A visão continua vindo do vínculo. Quem errou a porta usa a mesma conta e corrige pelo Perfil ("Entrar na equipe de uma academia"). Quem dá o papel é sempre o dono.

**Proposta que mexe no F1 e ficou [decidir]**: na entrada ficam só objetivo e dias, uma pergunta por tela. Peso, altura, data de nascimento e restrições vão para Perfil → Meus dados, com um convite único no Início. Se o Alex quiser a tela única "Sobre você" do F1, troca-se as duas telas por uma.

**Para o Q registrar em `docs/decisoes.md`** (não é arquivo meu):
- o código da equipe é separado do código dos alunos;
- o convite por e-mail entra sem pendência;
- o pedido por código sempre passa pelo dono;
- a abertura no escuro usa verde profundo, e não a marca cheia.

## 3. A abertura estática (expo-splash-screen, Expo SDK 54)

| Chave do plugin | Claro | Escuro (`dark`) |
|---|---|---|
| `backgroundColor` | `#007761` (`marca` claro 1.6.0) | `#0A332C` (`marcaSuave` escuro) |
| `image` | `imagens/entrada/abertura-simbolo-claro.png` (branco) | `imagens/entrada/abertura-simbolo-escuro.png` (`#39F0CD`) |
| `imageWidth` | `154` | `154` |
| `resizeMode` | `contain` | `contain` |

- **Os PNG**: 1024 × 1024, fundo transparente, como o guia do Expo pede ("Use a 1024x1024 image", "only .png", "transparent background"; conferido na documentação do SDK 54). O símbolo tem 637 px e cabe no círculo central de 2/3, a área visível do Android 12+.
- **O tamanho**: com `imageWidth` 154, o símbolo sai com 96 pt.
- **O contraste**: branco sobre `#007761` dá 5,5:1, medido na captura.
- **O que conferir no build `previa`**: o tamanho real no Android 12+. O Expo avisa que o Expo Go e o build de desenvolvimento não reproduzem a abertura.
- **O que trocar no `app.json`**: tirar o `splash` legado do topo e pôr o plugin `expo-splash-screen` com a tabela acima. O app não é meu: fica para quem programa.
- **Atenção**: os arquivos de `logo/` (o ícone) ainda estão em `#006B5F`. O ícone e a abertura têm de usar a mesma cor. Se a `marca` ficar `#007761`, o ícone passa junto; se não, a abertura volta a `#006B5F`.

**A passagem animada** (detalhe em `04-APLICACAO.md`):
1. o símbolo desce 14 px e aparece (200 ms);
2. o símbolo encolhe de 96 para 32 e sobe até o selo (320 ms, curva padrão), enquanto a cor esmaece;
3. a foto entra de 1,04 para 1;
4. selo, título e portas sobem 8 px, com 60 ms entre um e outro.

Com movimento reduzido, a abertura só esmaece em 160 ms. Só `transform` e `opacity` se movem.

## 4. As fotos usadas

O detalhe está em `02-design/imagens/CREDITOS-entrada.md`. As duas são do Unsplash, com `premium: false` e `plus: false` conferidos na API, baixadas para uma quarentena fora do projeto e olhadas uma a uma em 1600 px.

- **Principal**: `9D_rUDe7xvA` (LOGAN WEAVER). Uma moça rindo num treino de luva. Borrei o texto do saco de pancada.
- **Alternativa**: `5Rm-EapWm7M` (Gard Pro). Um senhor de meia-idade sentado no banco. Borrei o logo da camiseta, os dois tênis e o texto do banco.

**Arquivos**: 16 WebP. Para cada foto, as versões escura e clara, cada uma nítida e desfocada, em 1× e 2× (440 × 956 e 880 × 1912). São 201,8 KB no total; a principal escura tem 7 KB em 1× e 17 KB em 2×.

**Tratamento**: escurecer, luz lateral, vinheta e gradiente até o fundo do app, feitos na edição. O script está em `imagens/entrada/ferramentas/`.

**Descartadas**: a lista está nos créditos, com o motivo de cada uma. A primeira escolha, a moça de hijab (`lvu2SWRyFxQ`), saiu do ar na API.

## 5. Contraste medido contra o pior pixel

**Método** (`imagens/entrada/ferramentas/medir.mjs` + `medir.py`):
1. guarda a caixa de cada linha de texto e de cada ícone das 15 telas, com a cor;
2. apaga texto e ícones e fotografa só o fundo, já com o vidro e a camada de contraste, na moldura real (iPhone 16, sem zoom);
3. mede a cor do texto contra **cada pixel** da caixa e fica com o pior.

O mínimo é 4,5:1 para texto e 3:1 para texto grande e ícone.

| Combinação | Medidos | Abaixo do mínimo | Pior caso |
|---|---|---|---|
| claro · foto principal | 191 | 0 | 5,51 (símbolo branco na abertura) |
| claro · alternativa | 191 | 0 | 4,77 (título de 36 sobre a foto nítida; grande, mínimo 3) |
| claro · transparência reduzida | 191 | 0 | 5,51 |
| escuro · foto principal | 191 | 0 | 7,08 (apoio sobre a foto desfocada) |
| escuro · alternativa | 191 | 0 | 7,74 |
| escuro · transparência reduzida | 191 | 0 | 7,08 |

**O que precisou mudar para chegar a zero.** Na primeira medida, o texto de apoio do claro, direto sobre a foto desfocada, dava de 1,5 a 2,8:1: a foto desfocada clara ainda tinha cinzas médios (a calça escura e a parede em sombra). Três ajustes resolveram:
- a foto desfocada clara clareia mais 35 % na edição;
- a camada de contraste do claro subiu de 34 % para 45 %;
- o secundário sobre a foto, no claro, é `#2E3B3A` (no vidro continua o do N).

No escuro, o texto sobre a foto usa o grupo `foto` do N (`#FFFFFF` e `#D5DEDD`), e o `textoSecundario` comum (`#A3B1B0`) dava 4,38.

O check das opções não marcadas é transparente de propósito e ficou fora da medida.

## 6. Tokens que o Q precisa consolidar (`--o-` em `entrada.css`)

**Já vêm do N e não são meus**:
- `--vidro-*`, `--raio-vidro`, `--raio-pilula`;
- `--cor-viva` e `--cor-viva-texto`;
- `--tipo-numero-gigante`;
- `--foto-texto` e `--foto-texto-secundario`.

**Valores fixos (iguais nos dois temas)**:

| Variável | Valor | Proposta no `tokens.json` |
|---|---|---|
| `--o-raio-campo` | 16 px | `raio.campo` (campo de vidro) |
| `--o-tipo-titulo-entrada` / `--o-linha-titulo-entrada` | 36 / 42 | `tipografia.tituloEntrada` (o maior título de texto; só nas boas-vindas) |
| `--o-abertura-simbolo` | 96 px | `abertura.simbolo` |
| `--o-boasvindas-simbolo` | 32 px | `abertura.simboloSelo` |
| `--o-abertura-espera` | 700 ms | `abertura.esperaDemo` (só na demo; no app é o tempo de carregar) |
| `--o-porta-altura` | 88 px | `componente.porta.altura` |
| `--o-codigo-caixa` | 48 px (altura 60) | `componente.codigo.caixa` |

**Valores por tema**:

| Variável | Claro | Escuro | Proposta no `tokens.json` |
|---|---|---|---|
| `--o-foto-veu` | gradiente claro: 55 % no topo, 0 de 16 % a 38 %, 80 % em 62 %, 94 % na base (`#F4F8F7`) | o mesmo desenho em `#070C0C` (55 / 0 / 72 / 92 %) | `foto.veuEntrada` (a camada de contraste da foto de tela cheia) |
| `--o-foto-veu-desfocada` | `rgba(244,248,247,0.45)` | `rgba(7,12,12,0.30)` | `foto.veuDesfocada` |
| `--o-foto-texto` / `--o-foto-texto-secundario` | `#131D1C` / `#2E3B3A` | `var(--foto-texto)` / `var(--foto-texto-secundario)` | `foto.claro.texto` / `foto.claro.textoSecundario`. O grupo `foto` do N só tem a versão escura. |
| `--o-vidro-selecionado` | `color-mix(marca 14 %, vidro.fundo)` | `color-mix(marca 22 %, vidro.fundo)` | `vidro.selecionado` |
| `--o-social-fundo` / `--o-social-texto` | `#000000` / `#FFFFFF` | `#FFFFFF` / `#000000` | `contaSocial.fundo` / `contaSocial.texto` (Apple e Google iguais, diretriz 4.8) |
| `--o-abertura-fundo` | `var(--cor-marca)` | `var(--cor-marca-suave)` | `abertura.fundo` |
| `--o-abertura-simbolo-cor` | `#FFFFFF` | `var(--cor-viva)` | `abertura.simbolo` |
| `--o-foto` / `--o-foto-desfocada` | `image-set(...)` das fotos claras | o das escuras | caminho de imagem, não token: fica no CSS ou no manifesto de imagens |

## 7. Pontos para o Q e o Alex

1. **A foto no claro.** Nas capas do N, a foto fica escura nos dois temas, com texto branco. Na entrada, a foto **é a tela**: no claro, ela clareia e o vidro é claro, com texto escuro. Se o Q preferir a regra única do N (foto sempre escura), troca-se o tratamento claro pelo escuro e o `--o-foto-texto` claro pelo `--foto-texto`. O resto não muda.
2. **O logo sobre a foto.** `03-LOGO.md` diz "sobre foto, nunca direto". Aqui o logo fica numa pílula de vidro. Proponho acrescentar à regra "ou numa pílula de vidro com contraste medido".
3. **Ícones provisórios.** Os ícones de `entrada.html` (incluindo a maçã e o "G") estão num sprite local. O Q troca pelos do R.
4. **Pasta temporária compartilhada.** A pasta temporária da sessão é dividida entre os agentes. Eu apaguei por engano o conteúdo de `scratchpad/capturas/` uma vez, antes de perceber que outro agente usava a mesma pasta. O agente P regerou as capturas dele logo depois (19:06). Daqui em diante, cada agente deveria usar uma subpasta com o próprio nome; as minhas ficaram em `scratchpad/o-entrada/`.
5. **[decidir] em aberto que esta entrega toca**: uma academia ou várias (tela do dono); os nomes dos objetivos; perguntas da entrada separadas ou a tela única do F1 (nova, F13.3).
