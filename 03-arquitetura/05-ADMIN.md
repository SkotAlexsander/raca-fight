# 05 — Admin: o terceiro app, no mesmo banco

> Agente AI, P12, 15/10/2026. Pedido do Alex (pelo coordenador): o administrador é "um app muito específico só dele, tanto que a interface seria diferente também, mas conectado". São **três versões**: aluno, equipe e admin, ligadas pelo **mesmo backend** e pelos **mesmos dados**. A sugestão do Alex era uma segunda pasta de app, `admin/`, ao lado de `app/`, que divide `dominio/` e `dados/` e usa o mesmo Supabase. Esta seção compara essa sugestão com um painel web separado e recomenda uma das duas.

## 1. O que o Admin precisa da plataforma

| Precisa | Por quê |
|---|---|
| Tabela com edição na célula, teclado (setas, Enter, Tab, Ctrl+Z) e **colar várias linhas do Excel** | É a planilha (RA4) |
| Ler arquivo (.csv, .xlsx) e baixar arquivo (.csv) | Importar e exportar (RA8) |
| **PC primeiro** (2040 × 790), e o celular depois | O Alex revisa no ultrawide; o dono usa no balcão e em casa |
| O mesmo login e o mesmo banco dos outros dois apps | "Conectado" |
| Aviso no celular do dono (lembrete, resumo das 08:00) | RA12.6 |
| Nada offline com escrita | Dinheiro não pode ter dois "verdadeiros" (seção 5) |

## 2. As alternativas

| | **A. Segundo app Expo** (`admin/` com Expo Router, React Native e react-native-web) | **B. App web instalável** (`admin/` com Vite, React e TypeScript, como PWA) | C. Painel web em outro repositório |
|---|---|---|---|
| Grade tipo Excel | Difícil: o `TextInput` do React Native não tem seleção de células, e o colar de várias linhas só existe na web. Seria escrever para a web de qualquer jeito, só que por dentro do RN. | Nativo do navegador: `<table>`, eventos de teclado e de `paste`, e `contenteditable` ou `input` por célula | Igual ao B |
| Arquivo (ler .xlsx, baixar .csv) | Precisa de `expo-document-picker` e `expo-file-system` no celular e de outro caminho na web | `<input type=file>` e `Blob` com download, um caminho só | Igual ao B |
| Densidade para 2040 × 790 | O sistema de design do app é de celular (área de toque 48, um destaque, vidro). Seria outro sistema dentro do mesmo kit. | CSS próprio, denso, gerado dos mesmos `tokens.json` (cores e escala) | Igual ao B |
| Celular | App nativo | O mesmo site no navegador, ou **instalado na tela inicial** (PWA) | Igual ao B |
| Loja (Apple e Google) | Mais um app para revisar e publicar. App só de gestão, com login obrigatório, pede conta de teste na revisão. Mais um nome de pacote. | Não passa por loja. Publica na hora (Cloudflare Pages, que o Alex já usa). | Igual ao B |
| Aviso no celular | Notificação nativa (Expo) | Web Push: no Android direto; no iPhone desde o iOS 16.4, **só instalado na tela inicial** e com permissão pedida por um toque (WebKit). | Igual ao B |
| Dividir o domínio | Monorepo com workspaces, que o Expo SDK 52+ configura sozinho | O Vite importa `app/dominio/*.ts` direto (TypeScript puro, sem React Native) | **Duas cópias do domínio**, ou um pacote publicado só para isso |
| Custo para quem constrói | Mesmo kit do app, mas lutando contra ele na grade | Kit novo (Vite), pequeno; o domínio, os testes e o banco são os mesmos | Igual ao B, e mais um repositório |

**C sai**: dois repositórios para um domínio só fazem a regra do dinheiro divergir no primeiro ajuste.

## 3. Recomendação: B, na pasta `admin/` ao lado de `app/`

É a sugestão do Alex quanto ao **lugar** (uma segunda pasta, o mesmo repositório, o mesmo domínio e o mesmo Supabase). O que muda é a **ferramenta**: web em vez de Expo, porque o centro do Admin é uma planilha, e planilha é coisa de navegador. Decisão final do Alex: pergunta A23.

```
Academia Plus/
  app/                    Expo: app do aluno e app da equipe (como hoje)
    dominio/              TypeScript puro, testado com node --test (como hoje)
      financeiro/         o domínio do Admin (este trabalho), também puro
    dados/                o repositório do celular (SQLite, fila offline)
  admin/                  NOVO: Vite + React + TypeScript, PWA
    src/
      telas/              Painel, Pessoas, Financeiro, Relatórios, Funil, Agenda, Histórico, Ajustes
      componentes/        Grade, Filtro, Ficha, Folha, Quadro…
      dados/              cliente Supabase, só online (seção 5)
      arquivos/           ler .xlsx e baixar .csv (a única parte com biblioteca de terceiro, seção 6)
    index.html, vite.config.ts, manifest.webmanifest
  app/supabase/migrations/   migrações e políticas: UMA fonte para os três apps (16/10/2026, 06-INTEGRACAO.md)
```

- **O domínio fica onde está.** O `admin/` importa com um apelido, `@dominio` → `../app/dominio`. O Vite precisa de `server.fs.allow: ['..']` e `allowImportingTsExtensions`, que o projeto já usa. Mover `dominio/` para uma pasta comum (`compartilhado/dominio`, com workspaces) só faz sentido se o Admin crescer a ponto de ter build próprio do domínio. É mudança mecânica, e o teste prova que nada mudou.
- **`dados/` não se divide inteiro.** O do app é de celular (SQLite, fila offline, `expo-*`). O Admin tem o seu, só online. O que os dois dividem é o **contrato**: os tipos (`dominio/tipos.ts`, `dominio/financeiro/tipos.ts`) e as tabelas.
- **A mesma conta.** O dono entra no Admin com o mesmo e-mail do app. A sessão é do Supabase Auth, e o Admin confere o vínculo `dono` (RA1.1). Recomendação: **segundo fator (TOTP)** para entrar no Admin, porque o Supabase Auth tem MFA e o dado é dinheiro de terceiros.
- **O mesmo design, outro desenho.** As cores, a fonte e a escala vêm do `tokens.json`, por um gerador irmão do `gerar-tema.mjs`, que escreve CSS. Os componentes são outros (tabela, filtro, ficha). O desenho é do agente AK.

**Mudaria se**:
- o Alex quiser o Admin na loja, com ícone de app "de verdade": aí A, aceitando a grade mais pobre no celular;
- o Web Push no iPhone não servir ao dono (por exemplo, ele não instala na tela inicial): aí o aviso vai pelo app da equipe, se ele o tiver, ou por e-mail;
- o Admin precisar funcionar sem internet no balcão: aí volta a conversa de PowerSync (decisão de 10/10).

## 4. Os três apps no mesmo banco

| Tabela | App do aluno | App da equipe | Admin |
|---|---|---|---|
| `pessoas`, `matriculas`, `planos` | lê o que é dele (matrícula, plano) se A2 | lê para o check-in (R14.6): a matrícula ativa e as modalidades do plano, **sem valor** | lê e escreve |
| `cobrancas` | lê as dele e as dos dependentes, se A2 | **não lê** (R14.6a) | lê e escreve |
| `lancamentos`, `categorias`, `despesas_fixas`, `fechamentos`, `importacoes` | — | — | lê e escreve (dono) |
| `interessados`, `aulas_experimentais` | — | recepção e professor (R19) | lê e escreve, com os números |
| `notas`, `lembretes`, `tarefas`, `filtros_salvos` | — | — | só o dono (e o responsável da tarefa vê a tarefa dele, se A1) |
| `historico` | — | — | lê (dono). Ninguém escreve: só o gatilho. |

O detalhe por tabela e as políticas estão em `01-MODELO-DE-DADOS.md`, seções 26 a 41. **16/10/2026:** a tabela completa dos três apps (todas as 49 tabelas, com vitrine, aluno, professor, recepção e dono) e o caminho da experimental ao painel estão em `06-INTEGRACAO.md`.

## 5. Sem fila offline no Admin

O app do aluno grava sem sinal porque o treino do porão não pode se perder (decisão de 10/10). No Admin é o contrário: **dinheiro não grava sem rede**. Motivos:
- duas pessoas (o dono no PC e a recepção, se A1) marcando a mesma mensalidade como paga, sem rede, gerariam dois lançamentos;
- o fechamento do mês trava linhas, e uma fila poderia subir uma linha num mês que fechou enquanto ela esperava.

A tela avisa "Sem conexão: nada foi gravado" e mantém o que a pessoa digitou. A leitura pode vir do cache do React Query enquanto a rede volta.

**Gravações de várias linhas são uma transação no servidor** (função `security definer`, ou RPC):
- marcar como paga (cobrança + lançamento);
- importar (importação + linhas);
- gerar mensalidades;
- fechar o mês (fechamento + trava);
- matricular do funil (pessoa + matrícula + descontos + cobranças).

Ou tudo entra, ou nada entra.

**A geração de mensalidades no servidor** usa o mesmo `gerarMensalidadesDoMes`, numa Edge Function (o domínio é TypeScript puro de propósito, decisão de 10/10). A unicidade é garantida também no banco: índice único em `(matricula_id, competencia, tipo)` para mensalidade e matrícula.

## 6. Ler e escrever planilha: a biblioteca

- **CSV** é do domínio (`importacao.ts`, `exportacao.ts`), sem biblioteca, e com teste.
- **XLSX para ler**: a camada `admin/src/arquivos/` transforma o arquivo em grade (`(string | number | null)[][]`) e entrega a `conferirImportacao`. A data chega como número de série, e o domínio já entende.
- **Não usar `xlsx` 0.18.5 do npm** (o que o Valores usa). Ele tem a CVE-2023-30533 (poluição de protótipo, corrigida na 0.19.3) e a CVE-2024-22363 (ReDoS, corrigida na 0.20.2), e as versões corrigidas só existem no `cdn.sheetjs.com`. As opções são:
  - SheetJS ≥ 0.20.3 pelo tarball do CDN, com a versão travada;
  - uma biblioteca só de leitura e mantida (`read-excel-file`, MIT).

  As duas pedem a skill `auditar-seguranca` antes de instalar, porque o arquivo vem de fora e é lido no navegador do dono.
- **XLSX para escrever**: v2 (RA8.7). O CSV com BOM abre no Excel em português.

**Recomendação para o Valores** (fora desta pasta, vai no relatório): trocar o `xlsx` 0.18.5 pela versão do CDN.

## 7. Histórico de tudo no banco

- Uma tabela `historico`, com a forma de `RegistroDoHistorico`. Ela é gravada por um **gatilho `after insert or update`** em cada tabela do Admin, que calcula as diferenças em JSONB e guarda `auth.uid()` e `now()`. É o desenho do `supa_audit` do Supabase, só que com a ação em português e o `academia_id` para a RLS.
- Sem política de `update` ou `delete` para ninguém (nem o dono). O `insert` só vem do gatilho (`security definer`).
- "Apagar" no Admin é arquivar (`arquivado = true`), e o gatilho grava `arquivou`.
- Fechar, reabrir e importar gravam com o **motivo**, que a função passa por `set_config('app.motivo', …)` dentro da transação.

## 8. Avisos do Admin

- **Resumo das 08:00** ("Você tem 3 lembretes hoje · 2 mensalidades venceram ontem") e **lembrete com hora**, pela mesma Edge Function `enviar-aviso` (`03-DECISOES-TECNICAS.md`, seção 3), com um tipo novo.
- **Canal**:
  - Web Push do Admin instalado (PWA), com a assinatura guardada em `dispositivos`, `plataforma = 'web'`;
  - ou o push do app da equipe, se o dono o tiver.
- **Texto sem conteúdo**: nem o título do lembrete, nem nome, nem valor (RA1.5). Tocar abre a Agenda.

## 9. O que o próximo agente (AM, construção) precisa saber

1. O domínio está pronto e testado: 86 testes em `app/dominio/financeiro/`, e o projeto inteiro roda com `node --test "dominio/**/*.test.ts"`. A tela chama as funções e não refaz a conta.
2. Os [decidir] entram como **configuração da academia** (`regras_de_cobranca`, seção 34 do modelo), nunca como constante.
3. `exemplo.ts` tem a Raça Fight com nomes fictícios, para o modo "Ver com dados de exemplo".
4. Falta, fora do domínio:
   - a lista do `redigir.ts` com os campos financeiros (valor, descrição, nota, lembrete, telefone);
   - o gerador de CSS dos tokens para o Admin;
   - a leitura de XLSX (seção 6);
   - as migrações das seções 26 a 41.
