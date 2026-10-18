# 02 — Estrutura do código

Este arquivo explica a árvore de pastas do `app/`, o que vai em cada uma e as camadas que não se misturam. A regra que resume tudo: **se dá para fazer em TypeScript puro, fica no domínio.**

## A árvore

```
app/
├── package.json          scripts (iniciar, testar:dominio, testar:telas, tipos) e dependências
├── tsconfig.json         strict + erasableSyntaxOnly + verbatimModuleSyntax (ver "Por que o domínio roda no Node")
├── app.json              configuração do Expo; expo-router com raiz em ./navegacao; bloco ios (ver 04-IPHONE.md)
├── eas.json              perfis de build e envio: desenvolvimento, previa (TestFlight), producao
├── .env.exemplo          URL e chave anônima do Supabase (o .env de verdade não vai para o git)
├── .gitignore
├── LEIA-ME.md            como instalar, rodar e testar
│
├── dominio/              ← CAMADA 1: regras, em TypeScript puro
│   ├── tipos.ts          todas as entidades do modelo de dados (só tipos)
│   ├── unidades.ts       gramas↔kg, mm↔cm/m, segundos↔mm:ss, formatação PT-BR, IMC
│   ├── unidades.test.ts
│   ├── treino.ts         criar treino, dia, exercício, série; remover; volume; duração estimada
│   │                     (e em minutos da tela); carga sugerida ao abrir a série (R12.1); trocar em (R12.5)
│   ├── treino.test.ts
│   ├── cronometro.ts     o cronômetro (livre, regressivo, intervalado), avisos dele e restaurarCronometro()
│   ├── cronometro.test.ts
│   ├── avisos.ts         agenda semanal das notificações locais, horário de silêncio, limite por dia,
│   │                     tipo de aviso → chave da tela Avisos, validação do aviso da academia
│   ├── avisos.test.ts
│   ├── perfil-profissional.ts  perfil profissional e Equipe (R11): CREF, "sobre", quem vê, quem edita
│   ├── pedidos.ts        pedir treino novo (R12.2)
│   ├── sincronizacao.ts  fila offline: dono de cada item, o que sobe, leitura do erro, conflito (R1.24, R12.3)
│   ├── catalogo/         treinos-prontos.json, exercicios.json e catalogo.ts (validar o JSON e montar o pronto)
│   ├── revisao-t*.test.ts, propriedades.test.ts   testes da revisão T (P10); propriedades com semente fixa
│   ├── package.json      só `{ "type": "module" }`: o Node lê os .ts como ESM sem aviso; o Metro ignora
│   └── (a vir)           dieta.ts, assinatura.ts (Plus liga/desliga), papel.ts (papel → visão)
│
├── dados/                ← CAMADA 2: única fronteira com o backend
│   ├── (a vir)           supabase.ts (cliente, uma instância), sessao.ts (login, token no SecureStore),
│   │                     repositorios/ um arquivo por entidade (treinos.ts, alunos.ts, medicoes.ts…),
│   │                     cache/ (expo-sqlite: leitura offline), fila/ (mutações pendentes),
│   │                     consultas/ (hooks do React Query por tela: useTreinosDoAluno…)
│   └── LEIA-ME.md
│
├── telas/                ← CAMADA 3: o que a pessoa vê, separado por visão
│   ├── aluno/            inicio/, treinos/, treino-do-dia/, perfil/, plus/ (dieta, personal, conversa)
│   ├── academia/         alunos/, montar-treino/, biblioteca/ (treinos prontos, exercícios), plus/, numeros/
│   ├── compartilhado/    entrar, criar conta, escolher academia/visão, configurações, privacidade
│   └── LEIA-ME.md
│
├── componentes/          peças reutilizáveis nas duas visões (botão, campo de medida, lista de séries…)
├── tema/                 tokens do sistema de design em código + useTema()
├── navegacao/            rotas do Expo Router: _layout.tsx decide a visão; (entrada)/ (aluno)/ (academia)/
├── recursos/             ícone, abertura, fontes/ (.ttf embutidos pelo expo-font; vêm do design)
└── supabase/
    └── migracoes/        SQL numerado: tabelas, índices, RLS — versionado junto do app
```

## As camadas e o que cada uma pode importar

```
telas/ ──► componentes/, tema/, dados/, dominio/
dados/ ──► dominio/, @supabase/supabase-js, expo-sqlite, expo-secure-store
dominio/ ──► nada (só a biblioteca padrão do JavaScript)
componentes/ ──► tema/, dominio/ (para formatar)
navegacao/ ──► telas/, dados/ (sessão e vínculos), dominio/ (papel → visão)
```

Setas só para baixo. Em especial:

- **`dominio/` não importa nada.** Nem React, nem Supabase, nem Expo. É por isso que roda com `node --test` sem instalar nada, e é por isso que pode rodar também numa Edge Function do Supabase.
- **Só `dados/` importa `@supabase/supabase-js`.** Tela que precisa de dado chama um hook de `dados/consultas/` ou um repositório. Se amanhã o backend mudar, muda uma pasta.
- **Tela não tem regra de negócio.** "Quantos quilos é o volume deste dia?" é `dominio/treino.ts`. "Plus está ativo?" é `dominio/assinatura.ts`. A tela chama e mostra.

### Como se decide onde uma coisa vai

| Pergunta | Resposta | Pasta |
|---|---|---|
| Dá para escrever sem React e sem rede? | Sim | `dominio/` |
| Fala com Supabase, SQLite ou o cofre do sistema? | Sim | `dados/` |
| Desenha algo que as duas visões usam igual? | Sim | `componentes/` |
| É uma tela inteira de uma visão? | Sim | `telas/aluno/` ou `telas/academia/` |
| É uma tela que as duas visões usam (entrar, configurações)? | Sim | `telas/compartilhado/` |
| É cor, fonte, espaçamento? | Sim | `tema/` |
| Decide para onde ir? | Sim | `navegacao/` |

## Camada 1 — `dominio/`

**O que já existe (com testes):**

- `tipos.ts` — todas as entidades de `01-MODELO-DE-DADOS.md` como `interface` e uniões de texto, com a regra (R1.2, R5.1…) citada no comentário de cada campo. Zero código executável, exceto as listas fixas `PAPEIS_DA_ACADEMIA` e `OBJETIVOS`.
- `unidades.ts` — a ponte entre o dado inteiro e a tela (seção 7 das regras): `formatarPeso(72400) → "72,4 kg"` e `formatarPeso(80000) → "80,0 kg"` (peso corporal: sempre uma casa), `formatarCarga(22500) → "22,5 kg"`, `formatarAltura(1750) → "1,75 m"`, `formatarTempo(90) → "01:30"` e `formatarTempo(3725) → "1:02:05"`, `minutosSegundosParaSegundos("1:30") → 90`, `formatarReais(4990) → "R$ 49,90"`, `formatarData("2026-10-10") → "10/10/2026"` (recusa data que não existe, como 31/02), `instanteComFuso(new Date())` (R7.4: `2026-10-10T22:30:00-03:00`, nunca `Z`), `lerNumero("72,5")` (vírgula ou ponto — R7.1), `arredondarCargaParaIncremento` (0,5 kg — R7.2), `calcularIdade`, `calcularImc`. Toda conversão para a unidade de armazenamento arredonda para inteiro e recusa negativo; toda formatação arredonda meio para cima no decimal (1450 g → "1,5 kg"), não no binário.
- `treino.ts` — a estrutura treino → dia → exercício do dia → série (seção 1 das regras) em funções **puras e imutáveis**: cada `adicionar*`/`alterar*`/`remover*` devolve um treino novo e carimba `atualizadoEm`. Cobre: criar vazio (`guardado`, R1.6), `copiarTreinoPronto` com ids novos e `copiadoDe` (R1.4), `ativarTreino` com um ativo por vez (R1.3), 1 a 7 dias (R1.9), séries padrão 3×12 ou 3×30 s (R1.15), validação por tipo de medida (R1.14), `calcularVolume*` sem aquecimento nem tempo (R1.20), `estimarDuracao*` (séries + descanso de cada uma menos a última + troca entre exercícios, parâmetros em `ESTIMATIVA`), `sugerirProximoDia` (R1.10). Id e relógio são **injetáveis** (`Ambiente`), por isso os testes são determinísticos. O padrão gera UUID v4 mesmo sem `crypto.randomUUID` (o Hermes não traz) e grava o instante com o fuso do aparelho.

**Por que o domínio roda no Node sem compilar.** O Node 24 executa `.ts` apagando os tipos (type stripping), sem transformar nada. Isso só funciona com sintaxe "apagável", então no domínio:

- **sem `enum`** → união de texto (`type Papel = 'aluno' | 'dono'`);
- **sem parameter properties** (`constructor(private x)`) → nem há classes no domínio, só funções e dados;
- **sem `namespace`**;
- **`import type { ... }`** para tipos — um `import { Treino }` comum, sem `type`, quebra em tempo de execução, porque `tipos.ts` não exporta nada em JavaScript;
- **todo `import` com `.ts` no fim** — o Node não adivinha extensão.

O `tsconfig.json` trava isso para o projeto inteiro com `erasableSyntaxOnly: true` e `verbatimModuleSyntax: true`: o `tsc` reclama antes de o Node quebrar. O Metro (bundler do Expo) aceita os mesmos arquivos sem ajuste.

**Convenção dos testes:** `nome.test.ts` ao lado de `nome.ts`, com `node:test` e `node:assert/strict`. Rodar: `npm run testar:dominio` (ou `node --test "dominio/**/*.test.ts"`).

## Camada 2 — `dados/`

- `supabase.ts` — cria **uma** instância do cliente com a URL e a chave anônima do `.env`, sessão guardada no `expo-secure-store` (não em AsyncStorage: é token).
- `sessao.ts` — entrar, sair, sessão atual, **vínculos do usuário logado** (a lista que a navegação usa para decidir a visão).
- `repositorios/` — um arquivo por entidade, funções com nome do domínio: `listarTreinosDoAluno(alunoId)`, `salvarTreino(treino)`, `registrarTreinoRealizado(sessao)`. Recebem e devolvem os tipos de `dominio/tipos.ts`; a tradução de `snake_case` do banco para `camelCase` do código acontece **aqui e só aqui** (`mapeadores.ts`).
- `cache/` — leitura offline em `expo-sqlite`: treinos do aluno, biblioteca de exercícios, último plano de dieta.
- `fila/` — mutações feitas sem sinal (sobretudo `TreinoRealizado`), guardadas e reenviadas em ordem. A regra de **o que entra na fila e como se resolve conflito** é `dominio/sincronizacao.ts`; aqui só a mecânica (ver `03-DECISOES-TECNICAS.md`).
- `consultas/` — hooks do React Query por caso de uso (`useTreinosDoAluno`, `useAlunosDaAcademia`), com chave de cache que inclui `academiaId`.

## Camada 3 — `telas/`, `componentes/`, `tema/`, `navegacao/`

- **`telas/aluno/` e `telas/academia/`** — uma subpasta por área da visão, uma tela por arquivo (`TelaMeusTreinos.tsx`). Nome de tela começa com `Tela`. A tela recebe tudo por hooks de `dados/consultas/` e props; não monta consulta Supabase, não calcula volume.
- **`telas/compartilhado/`** — entrar, criar conta, **escolher academia e visão** (quando a pessoa tem mais de um vínculo), configurações, privacidade e termos.
- **`componentes/`** — o que o sistema de design define (`02-design/sistema-de-design/`): `Botao`, `CampoDeTexto`, `CampoDeMedida` (sabe kg/cm/mm:ss via `unidades.ts`), `Cartao`, `ListaDeSeries`, `Cronometro`, `EstadoVazio`, `Carregando`. Sem acesso a dados.
- **`tema/`** — tokens (`cores.ts`, `tipografia.ts`, `espacos.ts`) e `useTema()` com claro/escuro. As duas visões usam o mesmo tema; o que muda é conteúdo e navegação. [decidir] white-label: a cor da academia entraria como sobreposição em `useTema()`.
- **`navegacao/`** — raiz do Expo Router (`app.json` → `["expo-router", { "root": "./navegacao" }]`). Grupos: `(entrada)/` sem sessão, `(aluno)/` e `(academia)/` com abas próprias. O `_layout.tsx` da raiz lê a sessão, os vínculos e o último papel escolhido, e redireciona (detalhes em `03-DECISOES-TECNICAS.md`). Arquivos de rota são finos: importam a tela de `telas/` e a devolvem.

## `supabase/migracoes/`

SQL numerado (`0001_...sql`), uma migração por grupo de entidades, na ordem do modelo de dados. Cada tabela nasce com RLS ligada, `academia_id` quando é raiz de algo da academia (as filhas herdam a política do pai; `usuarios` não tem — ver modelo de dados, "Como isso vira RLS") e as políticas **no mesmo arquivo**: tabela sem política não entra. As funções `tem_vinculo()` e `e_personal_de()` ficam em `0000_funcoes.sql`. Rodam pela CLI do Supabase (`supabase db push`); nunca se edita tabela pelo painel sem gerar migração.

## Nomes

- Pasta e arquivo: minúsculas, hífen (`treino-do-dia/`), exceto componentes e telas React em `PascalCase.tsx`.
- Tipo e interface: `PascalCase` (`TreinoRealizado`). Função e variável: `camelCase` (`calcularVolumeDoDia`). Constante fixa: `MAIUSCULAS_COM_SUBLINHADO` (`DESCANSO_PADRAO_SEGUNDOS`).
- Campo com unidade **carrega a unidade no nome**: `pesoGramas`, `alturaMilimetros`, `descansoSegundos`. Nunca `peso` solto.
- Banco: `snake_case` (`peso_gramas`). A tradução é só em `dados/mapeadores.ts`.
- Português do Brasil em tudo. Termo técnico fica em inglês só sem tradução em uso (`token`, `hook`, `commit`).
