# 00 — Stack: com o que o Academia Plus é feito

Este arquivo diz qual tecnologia o app usa, por que ela e não outra, e o que faria mudar. A decisão está registrada também em `docs/decisoes.md` (10/10/2026).

## Resumo em uma linha

**App em Expo (React Native) + TypeScript; backend Supabase (Postgres + autenticação + tempo real + arquivos); testes do domínio com `node:test`.**

## O que o app precisa

Antes de escolher, o que o P00 pede da tecnologia:

1. **Android e iOS** com um código só, publicado nas duas lojas.
2. **Duas visões no mesmo app**, trocadas pelo papel — é lógica de navegação, qualquer stack faz.
3. **Funcionar sem sinal na academia** (o aluno registra o treino no porão sem Wi-Fi) e sincronizar depois.
4. **Dado de saúde** com acesso por papel: só o aluno, a academia dele e o personal (no Plus) enxergam peso, altura, restrições. Isso pede controle de acesso **no servidor**, não só na tela.
5. **Tempo real** em pelo menos um lugar: conversa aluno↔personal (se for chat próprio — [decidir]) e o personal vendo o treino do aluno aparecer.
6. **Pagamento do Plus** (loja ou Pix/cartão — [decidir]) com um webhook que liga a assinatura.
7. Equipe pequena (o Alex e agentes), orçamento de começo de projeto, prazo de MVP.

## Aplicativo: Expo (React Native) + TypeScript

### Por quê

- **Um código, duas lojas**, em TypeScript — a mesma língua do domínio, dos testes e do que o resto dos projetos do Alex já usa (Astro, React, Tauri). Não se aprende uma língua nova (Dart, Kotlin, Swift) para começar.
- **Expo cuida do nativo** que a gente não quer tocar: build nas nuvens (EAS Build) sem Mac para gerar o iOS, atualização por cima da loja (EAS Update) para corrigir texto e tela sem esperar revisão, notificações, armazenamento seguro, SQLite, câmera, tudo com um `npx expo install`.
- **Expo Router** dá navegação por arquivo com grupos de rota — encaixa direto nas duas visões: `(aluno)/` e `(academia)/`, com um `_layout.tsx` que decide pelo papel.
- O domínio fica em **TypeScript puro**, roda e se testa no Node 24 sem compilar. A parte que mais importa (treino, dieta, unidades) não depende do React nem do telefone.

### Alternativas comparadas

| | Expo (React Native) | Flutter | Nativo (Kotlin + Swift) |
|---|---|---|---|
| Língua | TypeScript (já usada no projeto) | Dart (nova) | Duas línguas, dois códigos |
| Build iOS sem Mac | Sim (EAS Build) | Precisa de Mac ou CI com Mac | Precisa de Mac |
| Corrigir sem passar pela loja | Sim (EAS Update) | Não (só com Shorebird, pago) | Não |
| Interface | Componentes nativos de verdade | Desenha tudo (fiel, mas "parece Flutter") | Nativa |
| Desempenho em lista longa/animação | Bom (Nova Arquitetura, Hermes) | Muito bom | O melhor |
| Reaproveita o domínio em TS no servidor (Edge Functions) | Sim, o mesmo arquivo | Não | Não |
| Risco | Dependência de pacotes nativos de terceiros às vezes atrasa a atualização de SDK | Menor ecossistema para Supabase/pagamento BR | Custo dobrado para equipe de um |

**Flutter** foi a alternativa séria: é excelente para app com muita animação e visual próprio. Perdeu porque o custo de uma língua nova e de precisar de Mac para iOS pesa mais, para esta equipe, do que o ganho visual — e porque o domínio em TS vai rodar também no servidor.

**Nativo** foi descartado de saída: dois códigos para uma equipe de um.

### O que faria mudar

- Se o app precisar de **gráficos pesados ou animação em 60 fps o tempo todo** (não é o caso: listas, formulários e um cronômetro) → Flutter.
- Se um pacote nativo essencial (pagamento in-app, por exemplo) não tiver suporte decente em Expo → ainda dá para usar **Expo com prebuild** (código nativo editável) antes de trocar de stack.
- Se as lojas obrigarem **dois apps** (ver decisão "duas visões num app só") → nada muda na stack, só na navegação.

## Backend: Supabase

### Por quê

- **Postgres** de verdade, com **RLS (Row Level Security)**: a regra "só o aluno, a academia dele e o personal enxergam o peso" vira uma política no banco, que vale para qualquer cliente — app, painel, script. É o que o LGPD pede: o controle no servidor, não na tela.
- **Autenticação pronta** (e-mail/senha, link mágico, Google/Apple) ligada ao RLS pelo `auth.uid()`.
- **Tempo real** (Realtime) por tabela — conversa e acompanhamento do personal sem montar servidor de WebSocket.
- **Armazenamento** de arquivos (foto do aluno, vídeo de exercício da academia) com as mesmas políticas.
- **Edge Functions** em TypeScript/Deno: o webhook do pagamento do Plus e qualquer regra que não pode rodar no telefone — e pode importar o mesmo `dominio/` do app.
- **Plano gratuito** generoso para a v1 e preço previsível depois; e é Postgres: se um dia sair, leva o banco.

### Alternativas comparadas

| | Supabase | Firebase (Firestore) | Servidor próprio (Node + Postgres) |
|---|---|---|---|
| Banco | Relacional (Postgres) — treino→dia→exercício→série é relacional por natureza | Documentos — relações viram cópia ou subcoleção | Relacional |
| Regra de acesso por papel | RLS em SQL, testável | Security Rules, outra linguagem, difícil com "papel por academia" | No código, feita à mão |
| Tempo real | Sim | Sim (ponto forte) | Precisa montar (Socket.io) |
| Offline no cliente | Não embutido — precisa cache + fila (ver `03-DECISOES-TECNICAS.md`) | Embutido e muito bom | Não embutido |
| Sair depois | Leva o Postgres | Preso ao Google | Já é seu |
| Custo de começo | Zero | Zero | Hospedagem + tempo de montar |
| Equipe de um | Ótimo | Ótimo | Pesado |

**Firebase** ganha em offline embutido e perde no modelo de dados (treino aninhado e consultas por papel/academia são relacionais) e nas regras de acesso complexas. Como o offline do Academia Plus é restrito (ver decisões técnicas: cache de leitura + fila de treino realizado), dá para fazer por cima do Supabase sem perder a RLS.

**Servidor próprio** fica como caminho de saída, não como começo: a v1 não tem gente para operar servidor.

### O que faria mudar

- Se o offline crescer para "tudo editável sem sinal com conflito a resolver" → avaliar **PowerSync** ou **ElectricSQL** em cima do mesmo Postgres do Supabase (não é trocar backend, é acrescentar camada).
- Se o custo do Realtime ou das Edge Functions disparar com muitas academias (SaaS — [decidir]) → migrar funções para um servidor Node pequeno, mantendo o Postgres.
- Se a decisão de chat for **WhatsApp** → o Realtime perde o uso principal e passa a ser só conveniência.

## Peças menores (já no `package.json`)

| Peça | Para quê | Versão de partida |
|---|---|---|
| `expo` | SDK 54 (React Native 0.81, React 19.1, Nova Arquitetura) | `~54.0.0` |
| `expo-router` | Rotas por arquivo; raiz em `navegacao/` | `~6.0.0` |
| `@supabase/supabase-js` | Cliente do backend (só em `dados/`) | `^2.58` |
| `@tanstack/react-query` | Cache de leitura, repetição e estado de carregamento | `^5.90` |
| `expo-sqlite` | Cache local e fila offline | `~16.0.0` |
| `expo-secure-store` | Token da sessão no cofre do sistema (nunca em AsyncStorage) | `~15.0.0` |
| `expo-notifications` | Lembrete de treino, aviso do personal, fim do descanso com o app fechado | `~0.32.0` |
| `expo-haptics` | Vibração ao marcar série, no fim do descanso e ao encerrar o treino | `~15.0.8` |
| `expo-font` | Fontes da marca (Figtree, Archivo) embutidas no build | `~14.0.12` |
| `expo-image-picker` | Foto de perfil e do aparelho (câmera e galeria, sem microfone) | `~17.0.11` |
| `expo-apple-authentication` | Sign in with Apple nativo (diretriz 4.8 da App Store) | `~8.0.8` |
| `expo-system-ui` | Modo escuro do sistema no Android (`userInterfaceStyle: automatic`) | `~6.0.9` |
| `expo-dev-client` | Build de desenvolvimento (perfil `desenvolvimento` do `eas.json`) | `~6.0.21` |
| `typescript` | 5.9 com `erasableSyntaxOnly` — garante que o domínio roda no Node sem compilar | `~5.9.2` |
| `jest-expo` + Testing Library | Testes de tela | `~54.0.0` |

As versões são as do Expo SDK 54 (setembro de 2025) e são travadas por `npx expo install --fix` na hora de instalar. Pagamento (RevenueCat, Mercado Pago, Stripe) **não** entra até o [decidir] de quem paga o Plus ser resolvido.

## Fora da v1 (de propósito)

Gerenciador de estado global (Zustand/Redux) — o React Query mais o estado local bastam até prova em contrário. Reanimated — só quando houver animação que peça. Sentry — entra antes de publicar, com filtro para dado de saúde (ver `03-DECISOES-TECNICAS.md`).
