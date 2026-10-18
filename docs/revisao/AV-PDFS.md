# AV — Os três PDFs com as telas reais (P12, onda 5, 16/10/2026)

> Agente AV. Escrevi só em `docs/apresentacao/` (admin, professor, aluno e a pasta nova `app-capturas/`), neste relatório e em `A:\Projetos\Academia Plus\`. **Não mexi em `app/` nem em `admin/`**: só copiei o `dist/` de cada um para o meu rascunho e servi de lá para capturar.

## 1. Entrega

| PDF | Páginas | Tamanho | Antes (15/10) |
|---|---|---|---|
| `Raça Fight — Admin.pdf` | **35** | 12,4 MB | 29 p., 2,9 MB, telas desenhadas pelo AK |
| `Raça Fight — Professor.pdf` | **25** | 5,8 MB | 25 p., 2,4 MB, 9 telas desenhadas + 23 esboços |
| `Raça Fight — Aluno.pdf` | **18** | 5,2 MB | 18 p., 2,7 MB, telas desenhadas + 9 esboços |

Os três estão em `A:\Projetos\Academia Plus\`. Os de 15/10 estão guardados em `A:\Projetos\Academia Plus\versões anteriores\` com "(15-10)" no nome. O `montar.mjs` de cada PDF sai **sem nenhum aviso** (página que estoura, quadro que corta texto, letra fora da escala 13·16·20·25·31·39·49·61, imagem que não abre, número de páginas).

## 2. Como foi feito

- **Admin**: `docs/apresentacao/admin/capturar-admin.mjs` (novo) serve o `admin/dist` (build de 14:38 de 16/10, depois das correções do AO) no modo local, fixa `?hoje=2026-10-15`, tema escuro, 2040 × 790 em escala 1,5 (e 390 × 844 em escala 2 no celular), e grava 37 capturas em `_capturas/admin/`. Além das telas que o AM1/AO já capturavam, monta os estados da onda 4: colar uma coluna, Ctrl+D, filtro por pessoa e valor (gaveta e resultado), importar "Data · Aluno · Valor", Turmas e horários (com a gaveta), a família paga de uma vez (antes e depois), a busca Ctrl+K e o histórico depois de mudanças feitas na sessão. O `montar.mjs` prefere `_capturas/admin/` e só cai nas telas do AK se faltar captura. O roteiro antigo (telas do AK) ficou em `paginas-telas-ak.mjs`.
- **Professor e aluno**: `docs/apresentacao/app-capturas/capturar-app.mjs` (novo), a partir do roteiro do AM2: serve o `app/dist` (export web), relógio parado na quinta 15/10/2026 20:05 em Gravataí, entra pelas contas de exemplo (Lucas, Carla, Diego, Márcio, Simone, Sérgio) e grava 58 telas em 390 × 844, escala 2. Grava também `_textos.md` com o texto de cada tela, para conferir legenda. O professor usa essas capturas pelo mesmo id do quadro (`montar.mjs`, `MOCKUPS=1` volta às desenhadas); o aluno, pelo prefixo `a:` no `cel()`.
- Para refazer: `npm run build` em `admin/` e `npx expo export --platform web` em `app/`; depois `node capturar-admin.mjs`, `node app-capturas/capturar-app.mjs` e `node montar.mjs` + `node folhear.mjs` em cada pasta.

## 3. O que mudou

**Admin (35 p.)** — todas as telas agora são o Admin construído. Páginas novas: **A família paga tudo de uma vez** (antes/depois, tudo ou nada, clique duplo), **Os atalhos do Excel funcionam aqui** (colar coluna, Ctrl+D, Delete, Ctrl+C com sinal, Ctrl+A; o que ainda não tem), **Achar qualquer linha: por pessoa, por valor** (gaveta, etiquetas, Ctrl+K), **Até a planilha de três colunas entra** (a pergunta "entradas ou saídas", aluno fora do cadastro vai na observação, extrato e maquininha), **Turmas e horários, a grade do cartaz**, **O mesmo Admin, no bolso** (4 telas do celular). A página "o motor" virou **"O Admin já roda. O servidor ainda não existe."**: tabela do que está pronto (telas, 500 testes de domínio, 40 + 5 de tela e fluxo), escrito e testado só num banco de teste (RLS), e o que **não existe** (o servidor, a mensalidade sozinha no dia 1, o aviso das 8h), mais a faixa "PROVISÓRIOS" de Ajustes. Saiu a caixa "os números não são os das telas": agora as telas mostram o que o domínio calcula. Hospedagem (custo e itens), permissões, segurança, as perguntas e os próximos passos continuam no fim; os passos agora dizem "Admin construído: feito" e "Servidor no ar" como etapa. Capa: "Situação: construído, com dados de exemplo; falta o servidor". Rodapé "versão de 16/10/2026".

**Professor (25 p.)** — 28 telas do app construído no lugar de 9 desenhadas e 19 esboços. Ficaram **dois esboços**, de propósito, com legenda dizendo por quê: "Nova técnica" (não existe no app) e "Novo aviso" da turma (o botão do professor ainda não abre a tela; ver achados). Ajustes de texto ao que o app faz: "Sou da equipe"; o passo 4 da entrada virou "o dono é mandado para o Admin"; 4 check-ins (não 9); a graduação mostrada é a do Prof. Márcio (Jiu-Jitsu, régua IBJJF), porque a do Muay Thai está "a confirmar"; ficha com "aulas nos últimos 30 dias"; "trocar a modalidade na chamada ainda não está no app"; a experimental de criança com o aviso "esse WhatsApp já fez"; o Pedro do Kids visto só pelo primeiro nome.

**Aluno (18 p.)** — 25 telas do app construído. Ficou **um esboço**: a notificação na tela bloqueada (não dá para fotografar no navegador). Entraram a vitrine sem conta e "Qual modalidade?", o check-in sem internet, a grade "minhas" e "todas", o Treinos do Jiu-Jitsu e o do Muay Thai (régua a confirmar), o cronômetro com a escolha do formato, o Raça Responde aberto, a indicação com o código real do exemplo (UWQJL9), Avisos, Meus dados, Quem pode ver, e o Kids da Carla com o Pedro. A página "o que sai" diz que a musculação **já saiu** do app e o Plus e a dieta ficaram desligados.

**Provisório, dito nos três**: preços, planos, regras de cobrança e de pagamento da equipe (de exemplo), o logo, e que o servidor ainda não existe.

## 4. O que folheei

Cada página dos três PDFs renderizada em PNG (`_capturas/_pdf/`) e vista como imagem, em pares. Corrigi no caminho:
- Admin p. 2: o corpo passava 15 px; encurtei o texto.
- Admin p. 11: a coluna colada não aparecia (a ordem colada era igual à que estava); troquei a ordem e espero o aviso "Colada a coluna" antes da foto.
- Admin p. 12: o filtro com a gaveta aberta escurecia a grade; capturei o resultado com a gaveta fechada à parte.
- Admin p. 22: a lista atrás da gaveta do filtro saía escura; clareei a captura (a legenda diz).
- Admin p. 24: a grade de turmas reduzida ficava ilegível; recortei segunda a quinta.
- Admin p. 28: a tabela "onde estamos" ficava espremida ao lado de Ajustes; virou tabela inteira e só a faixa "PROVISÓRIOS".
- Admin p. 33: título "destravam a construção" virou "trocam o exemplo pelo real".
- Nomes: o exemplo do Admin usa "Bruno Hoffmann", "Gustavo Duarte" e "Leonardo Teles", que batem com nomes reais do Instagram (a lista do app e do AS). Troquei **só na cópia aberta no navegador**, na hora da foto (Breno, Dutra, Leandro…), como o AS fez com os mockups. O admin/ não mudou. Na p. 4, "Mensal Bruno" virou "Mensal Breno".
- Professor/aluno: as telas que falharam no primeiro roteiro (pedido pendente, aviso da turma, a criança na recepção) foram refeitas ou trocadas.

## 5. Achados para outros agentes (não corrigi: não é minha pasta)

1. **App, professor — "Aviso para a turma" não abre**: o botão na turma e o atalho do Hoje levam a `/alunos/novo-aviso`, que `telas/rotas.ts:60` só libera para dono e recepção; o professor volta ao Hoje. O PDF mostra o esboço e diz que é defeito.
2. **App — "Pedir para entrar" da equipe**: com o código T9K2WM digitado no export web, não achei como chegar à tela de pedido pendente pelo roteiro (o botão não respondeu ao toque simulado). Vale conferir no aparelho.
3. **App — publicar técnica** não existe para o professor (o PDF diz).
4. **App — "Passar a outro professor"** no exemplo diz "Nenhum outro professor desta modalidade" para o Muay Thai Kids (só o Diego dá Muay Thai). Não é erro, mas o exemplo não mostra a função.
5. **Admin — exemplo com nomes reais do Instagram** (Bruno, Duarte, Leonardo) em `admin/src/dados/local/exemplo.ts`. Sugestão ao dono do admin: usar a lista `NOMES_REAIS_PROIBIDOS` do app no gerador do exemplo.
6. **Admin — filtro por pessoa** acha pelo começo em palavra inteira ("Gustavo Dua" não acha "Gustavo Duarte"). Funciona como projetado; só registro que o PDF descreve assim.

## 6. Arquivos

- Novos: `docs/apresentacao/admin/capturar-admin.mjs`, `docs/apresentacao/admin/paginas-telas-ak.mjs` (cópia do roteiro de 15/10), `docs/apresentacao/app-capturas/capturar-app.mjs`, `_textos.md` e as 58 PNG.
- Mudados: `admin/paginas.mjs` e `montar.mjs` (de `docs/apresentacao/`), `professor/paginas.mjs`, `montar.mjs`, `professor.css`, `aluno/paginas.mjs`, `montar.mjs`, `aluno.css`.
