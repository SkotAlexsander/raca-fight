# P00 — Contexto do Academia Plus

> Este é o documento-mãe. Todo agente, prompt ou pessoa que entrar no projeto lê este arquivo primeiro. O que está aqui veio da fala do Alex em 10/10/2026; o que está marcado como **[decidir]** ainda não foi decidido por ele.

> **15/10/2026 — MUDANÇA DE RUMO:** é uma **academia de LUTA** (não musculação), e entra uma terceira visão, a do **ADMINISTRADOR (dono)**, com controle total e financeiro "tipo planilha". Ela é a **primeira entrega**. Ver `docs/decisoes.md` e `00-prompts/P12-ADMIN-E-LUTA.md`.

## O que é

**Academia Plus** é um aplicativo para celular que liga uma academia aos seus alunos. Um app só, com **duas visões** que mudam conforme quem entra:

1. **Visão da academia** — o dono da academia e os funcionários (recepção, instrutor de sala, personal).
2. **Visão do aluno** — quem treina.

O nome "Plus" tem dois sentidos que precisam conviver: o app é o "a mais" que a academia oferece, e **Plus** é também o nome do **plano pago** dentro do app.

## O que o aluno faz (visão do aluno)

- **Treino livre**: monta o próprio treino do zero, exercício por exercício (séries, repetições, carga, descanso).
- **Treinos prontos**: escolhe um treino pré-montado **de acordo com o objetivo dele** (emagrecer, ganhar massa, condicionamento, iniciante, etc.).
- **Cadastro opcional**: pode (não precisa) informar peso, altura, idade, objetivo, restrições, frequência que pretende treinar. Quanto mais informa, melhor o app e o funcionário conseguem planejar.
- **Modo Plus (pago)**: ao assinar, um **personal** passa a acompanhar o aluno pelo app, montando e ajustando **treino e alimentação (dieta)**. O aluno vê o plano, marca o que fez, conversa com o personal.
- Organizar o treino e organizar a dieta são as duas espinhas dorsais da experiência.

## O que a academia faz (visão da academia)

- **Vê o perfil dos alunos** (os que cadastraram informações): peso, altura, objetivo, histórico de treino. Com isso o funcionário **monta um treino para aquela pessoa** direto no app.
- Gerencia a **biblioteca de treinos prontos** da academia (os que o aluno escolhe por objetivo).
- No Plus: o personal acompanha os alunos assinantes (treino + dieta + conversa).
- O dono vê a academia em números: alunos ativos, assinantes Plus, frequência. **[decidir]** o quanto de gestão (mensalidade, catraca, financeiro) entra no app — a fala do Alex foi sobre treino e acompanhamento, não sobre cobrança da mensalidade.

## Decisões já tomadas

- É **app para telefone** (Android e iOS), não site.
- Duas visões no mesmo app, escolhidas pelo papel do usuário logado.
- Cadastro de dados corporais é **opcional**; nada bloqueia o aluno que não informar.
- Plus é **pago** e é o que libera o acompanhamento de personal (treino + alimentação).
- **Direção visual (10/10)**: a partir das referências do Alex (`02-design/referencias/`): escuro com foto grande, painéis de vidro sobre a imagem, números enormes; o claro segue a mesma linguagem. Cor: o **verde da marca mais vivo** (no escuro, verde-água luminoso), sem trocar para verde-limão; dourado só no Plus.
- **Abertura e entrada (10/10)**: a cor da marca com o logo, depois a entrada com duas portas, **"Sou aluno"** e **"Sou da academia"** (personal, instrutor, recepção e dono). A porta escolhe o cadastro; depois de entrar, a visão continua vindo do vínculo.
- Tudo em **português do Brasil**: nome de arquivo, variável, função, commit, texto de tela.

> **11/10/2026:** para construir, as pendências abaixo seguem com a opção recomendada, de forma PROVISÓRIA (ver `docs/decisoes.md`, "Escolhas provisórias"). O Alex pode trocar qualquer uma.

## Decisões pendentes **[decidir]**

| Pergunta | Opções em jogo | Quem decide |
|---|---|---|
| Uma academia só ou várias (SaaS que qualquer academia assina)? | Uma (mais simples) · Várias, cada uma com seus alunos e funcionários | Alex |
| Quem paga o Plus: o aluno direto, ou a academia repassa? | Aluno assina no app · Academia cobra junto da mensalidade | Alex |
| Dieta: o personal escreve livre, ou há um banco de alimentos com calorias/macros? | Texto livre (v1) · Banco de alimentos (v2) | Alex |
| Chat entre aluno e personal dentro do app, ou link para WhatsApp? | Chat próprio · WhatsApp | Alex |
| Marca: o app tem a cara do Academia Plus ou a cara de cada academia (logo e cor da academia)? | Marca própria · Marca da academia (white-label) | Alex |
| Primeira academia a usar (existe cliente real?) | — | Alex |
| **Dieta no Plus: quem prescreve?** Prescrever dieta é privativo de nutricionista (Lei 8.234/91, CFN) — achado da revisão de 10/10 (`docs/revisao/B-MELHORIAS.md`, R1) | Nutricionista parceiro da academia prescreve, personal acompanha · Personal só orienta hábitos, sem plano · Tirar dieta do Plus na v1 | Alex, com advogado/nutricionista |
| **Revisão dos treinos prontos** (`01-especificacao/treinos-prontos/`, 11 programas modelo) — exigência da Lei 9.696/1998 | Profissional de Educação Física com CREF da academia parceira · contratado pelo projeto | Alex |
| **CREF no perfil do professor**: o app confere ou só mostra o que a pessoa digitou? Não há consulta pública nacional fácil de usar pelo app (pergunta 28) | Só mostrar, com aviso "informado pelo profissional" · Conferir manualmente pelo dono · Integrar se surgir API | Alex |
| **Avaliação de profissional** pelo aluno (nota, estrela) — risco de expor o profissional (pergunta 27) | Não ter (recomendado) · Só elogio sem nota · Nota | Alex |
| **Mapa muscular** (`02-design/anatomia/comparativo.html`): vetor com o corpo cinza e o músculo vermelho (recomendado) ou imagem de IA (precisa liberar o Workers AI no token da Cloudflare); na Evolução, o corpo pintado no lugar da rosca ou junto com ela | A vetor · B IA · corpo no lugar da rosca · os dois | Alex |
| **Treino descartado** vai para o servidor ou sai da fila? (AB) | Sai da fila · Sobe marcado como descartado | Alex |
| **Aluno pendente**: a academia já pode abrir o perfil e mandar treino antes de confirmar? (AB) | Esconder até confirmar · Permitir | Alex |
| **Aviso da academia**: o instrutor também escreve? (hoje: dono e recepção) | Só dono e recepção · Instrutor também | Alex |
| **Recepção na entrada da equipe**: opção própria ou "instrutor" e o dono ajusta? (AA) | Opção própria · Como está | Alex |
| **Escritas sem sinal** (AG, 12/10): a arquitetura diz que montar e editar treino e as ações da academia exigem rede, mas hoje funcionam sem sinal e vão para a fila | Seguir a arquitetura (exigir rede) · Liberar tudo na fila (mudar a arquitetura) | Alex |
| **Banco que não abre no aparelho** (disco cheio logo depois de uma atualização): o app não abre; precisa de uma tela própria de "liberar espaço" | Criar a tela (quebra o congelamento do design só nela) · Deixar para depois | Alex |
| **Circuito conduzido pelo app** (uma volta de cada exercício) ou só descrito no texto do dia | Só texto na v1 · Regra nova de circuito | Alex |
| **Nomes dos objetivos** | Perder peso · Ganhar massa · Condicionamento · Começar a treinar · Manter (proposta da marca) · outros | Alex |
| **Nome do pacote do app** (não muda depois do 1º envio às lojas) | `com.pixelmartins.academiaplus` (proposto, está no `app.json`) · outro domínio do Alex | Alex |
| **Conta Apple Developer**: pessoa física ou empresa? A diretriz 5.1.1(ix) pede pessoa jurídica para app com dado sensível | Empresa (CNPJ + D-U-N-S grátis; recomendado) · Pessoa física | Alex |
| **Plus nas lojas**: Apple 3.1.3(b)/(d) arriscam até o caminho "via academia" (R2) | Plus como serviço da academia com parte presencial · Assinatura pela loja · Plus só na web | Alex |

## Como o projeto está organizado

```
00-prompts/          prompts estruturados por etapa (este arquivo é o P00)
01-especificacao/    o que o app faz: papéis, histórias, fluxos, regras, telas (sem código)
02-design/
  sistema-de-design/ tokens, componentes, responsividade, coerência entre as duas visões
  marca-e-proposta/  identidade do Academia Plus: nome, tom, cor, tipografia, o "Plus"
03-arquitetura/      stack, modelo de dados, estrutura de pastas do código, decisões técnicas
app/                 o código do aplicativo
docs/                decisoes.md (registro de cada decisão com data e motivo) e apresentação
```

## Regras para quem escreve aqui

- Português do Brasil em tudo. Termo técnico fica em inglês só quando não há tradução em uso (`token`, `commit`, `hook`).
- O que o Alex não decidiu fica marcado **[decidir]** e vai para a tabela acima — nunca se inventa uma resposta e se segue como se fosse dele.
- Toda decisão técnica ou de design registra **critério, alternativa descartada e o que faria mudar** em `docs/decisoes.md`.
- Especificação e design são escritos para o Alex ler e aprovar: frases curtas, sem jargão de produto quando há palavra comum.
