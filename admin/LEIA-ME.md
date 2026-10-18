# Raça Fight · Admin

O app do dono da Raça Fight: painel, pessoas, financeiro "tipo planilha", relatórios, funil, agenda, notas e histórico. É um app web instalável (PWA), feito com Vite, React e TypeScript, ao lado do `app/` (decisão A23, 15/10/2026). Usa o mesmo domínio (`../app/dominio/`) e, quando ligado, o mesmo Supabase.

## Para rodar

Precisa do Node 24.

```
cd admin
npm install
npm run dev        # http://localhost:5174 — para trabalhar (recarrega sozinho)
npm run build      # gera o tema dos tokens, confere os tipos e monta a versão final em dist/
npm run abrir      # monta (se precisar), sobe a prévia em http://localhost:4174 e abre no navegador
```

Sem o arquivo `.env.local`, o Admin abre no **modo local**: entra direto como "Alex, dono", com a Raça Fight **de exemplo** (nomes inventados, valores de exemplo). Os dados ficam só neste navegador (IndexedDB). Para voltar ao começo, use Ajustes › Academia › "Recomeçar os dados de exemplo".

`?hoje=2026-10-15` no endereço fixa o dia (para testes e capturas). `?tema=claro` ou `?tema=escuro` fixa o tema.

## Instalar no PC como app

1. Rode `npm run abrir`.
2. No Chrome ou no Edge, clique no ícone de instalar na barra de endereço (um monitor com uma seta), ou no menu ⋮ › "Instalar Raça Fight · Admin".
3. O Admin vira um app com ícone próprio no menu Iniciar e abre numa janela sem barra de endereço.

O app instalado guarda só a casca (as telas). Dado financeiro nunca fica em cache: sem internet, nada grava (no modo Supabase).

## Ligar no Supabase (quando existir o projeto)

1. Copie `.env.exemplo` para `.env.local` e preencha a URL e a chave **anon** do projeto. A `service_role` nunca entra aqui.
2. Rode as migrações de `supabase/migrations/` em ordem (o nome começa pela data). A primeira (`base_compartilhada`) é provisória: academias, vínculos e `tem_vinculo()` são do app e devem ir para `app/supabase/migracoes/`.
3. Crie o vínculo `dono` do Alex na academia e a linha de `regras_de_cobranca`.
4. Ao abrir, o Admin pede e-mail e senha e, na primeira vez, cadastra o **segundo fator** (código do aplicativo autenticador). Só quem é dono entra.

## Testes

```
npm run testar      # Vitest: telas (a planilha pelo teclado, colar, desfazer, mês fechado), repositórios, utilidades
npm run testar:e2e  # Playwright: lançar, colar, marcar como paga, fechar o mês, exportar; importar XLSX
npm run lint        # ESLint (proíbe console: dado financeiro não vai para log)
npm run capturar    # capturas em capturas/ (precisa do npm run dev rodando)
cd ../app && npm run testar:dominio   # o domínio, também com $env:TZ='Asia/Tokyo' no PowerShell
```

Nesta máquina o Chromium 1243 do Playwright dá acesso negado; a configuração usa o headless shell 1234 sozinha.

## Onde fica cada coisa

| Pasta | O que tem |
|---|---|
| `src/telas/` | Painel, Lançamentos, Cobranças, Despesas fixas, Fechamento, Importar, Exportar, Pessoas, Ficha, Funcionários, Relatórios, Funil, Agenda, Notas, Histórico, Ajustes |
| `src/componentes/` | a Grade (planilha), a gaveta de pagar, as de anotar e lembrar, gráficos, os ícones do mockup |
| `src/moldura/` | barra lateral, topo, busca global (Ctrl+K), tema |
| `src/dados/` | o contrato do repositório; `local/` (exemplo + IndexedDB) e `supabase/` (cliente, login com TOTP) |
| `src/dados/regras-provisorias.ts` | **os valores provisórios** das regras de cobrança, num lugar só |
| `src/arquivos/` | ler CSV e XLSX (`read-excel-file`, só leitura) |
| `src/estilos/` | `tokens.css` (GERADO do `tokens.json`), `admin.css` (o do mockup do AK) e `app.css` |
| `supabase/migrations/` | tabelas, histórico por gatilho, travas e regras de acesso (Parte 2 do modelo) |
| `ferramentas/` | gerar o tema, abrir, capturar, gerar a planilha de exemplo |
| `e2e/` | os fluxos do Playwright e a planilha XLSX de exemplo |
| `capturas/` | as telas construídas, com os mesmos nomes das capturas do AK |
