# Academia Plus — o aplicativo

App para celular (Android e iOS) em **Expo (React Native) + TypeScript**, com backend **Supabase** (Postgres, autenticação, tempo real). O que o app é e o que já foi decidido está em `../00-prompts/P00-CONTEXTO.md`; a arquitetura, em `../03-arquitetura/`.

Estado em 11/10/2026 (agente X, P11): **a base roda**. Dependências instaladas (SDK 54), tema gerado do `tokens.json`, os componentes base (rota `/componentes`), a navegação por vínculo com as abas das duas visões, e os dados de exemplo (Ana, Academia do Marcos, catálogo real) com o treino realizado e a fila no SQLite. As telas de cada aba são provisórias até a onda 2. Relatório: `../docs/revisao/X-BASE.md`.

## Antes de começar

- **Node 24 ou mais novo** (roda `.ts` direto, sem compilar — é o que os testes do domínio usam).
- **npm** (vem com o Node).
- Para rodar no telefone: o app **Expo Go** (Android/iOS) na mesma rede Wi-Fi, ou um emulador Android (Android Studio) / simulador iOS (só em Mac). Para gerar o app de iPhone sem Mac, veja "Gerar a versão de iPhone sem ter um Mac", mais abaixo.

## Instalar

```bash
cd app
npm install
npx expo install --fix     # alinha as versões nativas com o SDK do Expo
cp .env.exemplo .env       # e preencha a URL e a chave anônima do Supabase
```

Enquanto não houver conta do Supabase o `.env` não é usado: o app roda com o repositório local de exemplo.

Depois de mudar o design: `npm run gerar` (tema do tokens.json, ícones do sprite, cópia das imagens).

## Rodar

```bash
npm run iniciar:expo-go    # abre o Metro em modo Expo Go; escaneie o QR com o Expo Go
npm run web                # no navegador do PC
npm run android            # direto no emulador/aparelho Android
npm run ios                # simulador iOS (Mac)
```

**No celular com o Expo Go** (sem conta Apple paga): instale o **Expo Go** da loja (a versão para o SDK 54), ponha o celular e o PC na **mesma rede Wi-Fi**, rode `cd app` e `npm run iniciar:expo-go`. Aparece um QR no terminal: no Android, leia com o próprio Expo Go; no iPhone, com a Câmera. O `--go` é necessário porque o projeto tem o `expo-dev-client` (sem ele o `expo start` espera um build de desenvolvimento). Se o QR não abrir (Wi-Fi da academia, rede de visitante, firewall do Windows), use `npx expo start --go --tunnel`. Para entrar, escolha uma conta de exemplo (Ana, Diego, Marcos…).

## Testar

```bash
npm run testar:dominio     # node --test: domínio e dados (redigir, fila, visão, dados de exemplo)
npm run testar:telas       # jest-expo + Testing Library (depois do npm install)
npm run tipos              # tsc --noEmit: confere os tipos de tudo
```

O domínio roda com `node --test` puro, antes mesmo do `npm install`:

```bash
node --test "dominio/**/*.test.ts"
```

## Gerar a versão de iPhone sem ter um Mac

O Xcode só roda em Mac, mas quem compila é o **EAS Build**, na nuvem da Expo (máquina Mac deles, já com o Xcode 26 que a Apple exige desde 28/04/2026). Do Windows, você só manda o código e recebe o aplicativo pronto. O **EAS Submit** entrega esse aplicativo ao **TestFlight** (o canal de teste da Apple) e, depois, à App Store. O que é próprio do iPhone (área segura, teclado, gestos, notificações, regras da loja) está em `../03-arquitetura/04-IPHONE.md`.

### O que o Alex precisa ter

| O quê | Para quê | Custo |
|---|---|---|
| **Conta Apple Developer** (Apple Developer Program) | assinar o app, TestFlight, publicar | US$ 99 por ano |
| De preferência como **organização** (CNPJ + número D-U-N-S, que é gratuito) | a diretriz 5.1.1(ix) pede que app com dado de saúde seja enviado por uma **empresa**, não por pessoa física; o nome que aparece na loja é o da conta | — |
| **Um iPhone** com iOS atualizado | testar de verdade (vibração, notificação, Dynamic Island) — o simulador só existe no Mac | — |
| **Conta na Expo** (expo.dev) | rodar o EAS Build e o EAS Submit | o plano gratuito tem uma cota mensal de builds; fila mais lenta |
| **Nome do pacote** decidido **[decidir]** | `com.pixelmartins.academiaplus` está no `app.json`; depois do primeiro envio à loja **não muda mais** | — |

### Os três perfis do `eas.json`

| Perfil | Para quê | iPhone | Android |
|---|---|---|---|
| `desenvolvimento` | build de desenvolvimento (o "Expo Go" do próprio app, com os módulos nativos dele) | instala direto no iPhone **cadastrado** (`eas device:create`) | `.apk` instalável |
| `desenvolvimento-simulador` | o mesmo, para o simulador | só serve para quem tem Mac | — |
| `previa` | teste interno | vai para o **TestFlight** (envio automático) | trilha "teste interno" da Play |
| `producao` | loja | App Store (envio manual, depois do checklist) | Play, como rascunho |

O número de build sobe sozinho a cada `previa`/`producao` (`appVersionSource: "remote"` + `autoIncrement`): ninguém edita `buildNumber` à mão. A versão que o usuário vê (`0.1.0`) continua no `app.json`.

### Passo a passo (uma vez)

```bash
npm install -g eas-cli          # a ferramenta da Expo
eas login                       # conta da Expo
eas init                        # liga o projeto à conta (preenche extra.eas.projectId no app.json)
eas device:create               # gera um link; abra no iPhone para cadastrá-lo (para o perfil desenvolvimento)
```

No **App Store Connect** (site da Apple), crie o app com o mesmo nome do pacote do `app.json`. O EAS pede o login da Apple no primeiro build e cria sozinho certificados e perfis de assinatura — não é preciso mexer em nada disso no site da Apple.

### No dia a dia

1. **Começo (telas, sem módulo nativo novo):** `npm run iniciar` e abrir no **Expo Go** do iPhone. Não precisa de conta Apple paga.
2. **Quando entrarem notificação, Sign in with Apple, fontes embutidas:** o Expo Go não basta. `npm run build:ios:desenvolvimento` → instala no iPhone cadastrado → `npm run iniciar` e o app abre ligado ao seu computador, como no Expo Go.
3. **Para outras pessoas testarem:** `npm run build:ios:previa` → o build cai no TestFlight em uns 15–30 minutos (a Apple processa) → quem está na equipe interna recebe pelo app TestFlight. Testador externo (fora da equipe) exige uma revisão rápida da Apple.
4. **Loja:** `npm run build:producao` → `npm run enviar:ios` → no App Store Connect, preencher os textos, as capturas, os rótulos de privacidade e a conta de demonstração, e mandar para a revisão (checklist em `../03-arquitetura/04-IPHONE.md`, seção 11).

Variáveis do Supabase por perfil (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_CHAVE_ANONIMA`) ficam nos **ambientes do EAS** (`development`, `preview`, `production`, no site expo.dev), não no `eas.json`. A chave da Play (`segredos/chave-google-play.json`) nunca vai para o git.

## Regras do código (resumo; o completo está em `../03-arquitetura/02-ESTRUTURA-DO-CODIGO.md`)

- **Português do Brasil** em nome de pasta, arquivo, tipo, função, variável, comentário e texto de tela.
- **Se dá para fazer em TypeScript puro, fica em `dominio/`** — sem React, sem Supabase, testável com `node:test`.
- `dominio/` só pode ser rodado pelo Node sem compilar, então: **sem `enum`** (use união de texto), **sem parameter properties** em classe, **`import type` para tipos**, e **todo import com extensão `.ts`**. O `tsconfig.json` trava isso com `erasableSyntaxOnly` e `verbatimModuleSyntax`.
- **Unidades inteiras no dado**: gramas, milímetros, segundos. Formatação só na tela, via `dominio/unidades.ts`.
- `dados/` é a **única** pasta que fala com o Supabase. Tela nunca importa `@supabase/supabase-js`.
- Dado de saúde (peso, altura, restrições, medições) **nunca em log, nunca em analytics**.

## Pastas

```
dominio/        regras e tipos em TypeScript puro (+ testes *.test.ts)
ferramentas/    gerar-tema.mjs, gerar-icones.mjs, copiar-imagens.mjs (npm run gerar)
imagens/        cópia gerada das fotos e ilustrações aprovadas (02-design/imagens)
dados/          acesso ao Supabase, cache local e fila offline — única fronteira com o backend
telas/          telas por visão: aluno/, academia/, compartilhado/
componentes/    peças de interface reutilizáveis (botão, campo, cartão, lista de séries)
tema/           tokens do sistema de design (cor, tipografia, espaço) nas duas visões
navegacao/      rotas do Expo Router (raiz configurada em app.json); decide a visão pelo papel
recursos/       ícone, tela de abertura, fontes
supabase/       migrações SQL, políticas RLS e funções do banco (versionadas junto do app)
```
