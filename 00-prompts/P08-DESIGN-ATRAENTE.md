# P08 — Design mais atraente e clean, com efeitos e imagens (roda depois do P07)

Pedido do Alex em 10/10/2026: "o app pode ser bem mais atraente e clean ao mesmo tempo, com efeitos, imagens relacionadas ao assunto". Todos leem antes `00-prompts/P00-CONTEXTO.md`, `CLAUDE.md`, `02-design/marca-e-proposta/` (proposta, tom, identidade) e `02-design/sistema-de-design/` (tokens, componentes, `06-IPHONE.md`, `auditoria/`).

**O que não muda**: as regras de uso de academia do `00-PRINCIPIOS.md` (mão suada, alvo grande, número grande, contraste alto), os tamanhos de toque, a estrutura de abas e a medição de `auditar.mjs` com **0 achados**. Atraente não pode custar legibilidade no meio da série.

| Agente | Escreve em | Entrega |
|---|---|---|
| I — Direção de arte | `02-design/direcao-de-arte/` | moodboard descrito, 2 ou 3 direções lado a lado, recomendação |
| J — Imagens | `02-design/imagens/` | banco de imagens do app com licença registrada |
| K — Movimento e efeitos | `02-design/sistema-de-design/movimento/` + tokens | catálogo de efeitos com demonstração |
| L — Aplicação | `02-design/sistema-de-design/mockups/` | mockup novo com a marca aplicada (sai do cinza) |

I, J e K rodam em paralelo; L roda **depois** e junta os três.

## I — Direção de arte
- Comece pela **paleta da marca aplicada** (`tokens-marca.json`), que hoje ainda não foi usada no mockup.
- Proponha 2 ou 3 direções, como "clean claro com foto grande", "escuro esportivo com brilho na marca" e "editorial com tipografia forte".
- Para cada direção, mostre as 4 telas-chave e o cartão de treino pronto com imagem.
- Use as skills `frontend-design`, `apple-design`, `better-ui` e `beautiful-shadows`.
- Recomende uma direção. Ela vira [decidir] do Alex.

## J — Imagens relacionadas ao assunto
Fotos ou ilustrações de treino, aparelhos, grupos musculares, alimentação e pessoas reais e diversas em academia, sem o "corpo ideal" (regra de `01-TOM-DE-VOZ.md`). As imagens têm três usos:
- capa de cada treino pronto, por objetivo;
- ilustração dos estados vazios;
- miniatura de exercício.

Fonte das imagens: geradas (skill `ai-image-generator`, se houver chave em `A:\Claude\.env`) ou banco com licença de uso comercial (Unsplash ou Pexels). Para cada imagem, registre num `CREDITOS.md`: arquivo, fonte, autor, licença e link. Nada sem licença clara, nada de marca registrada de aparelho. Entregue em WebP otimizado, em 1× e 2×, com o tamanho de cada uso.

## K — Movimento e efeitos
Catálogo de efeitos, cada um com duração e curva vindas dos tokens. Entram:
- **série marcada**: o check com mola e uma vibração leve;
- **fechar treino**: comemoração curta e um resumo que aparece em sequência;
- o anel do cronômetro;
- transição entre abas e telas;
- **cartão de treino**: afunda de leve no toque;
- **carregando**: esqueleto com brilho;
- **convite ao Plus**: brilho dourado sutil;
- **puxar para atualizar**;
- título grande que encolhe no iOS.

Regras:
- Respeitar o "reduzir movimento" do sistema; com ele ligado, todo efeito vira um esmaecer.
- Nenhum efeito atrasa o registro da série.
- No app: Reanimated e, se precisar, `expo-haptics`. No mockup: CSS e WAAPI.

Use as skills `animation-systems`, `apple-design`, `react-spring-physics` e `make-interfaces-feel-better`.

## L — Aplicação
O mockup novo junta três entregas:
- a direção recomendada pelo I, ou a escolhida pelo Alex se ele já tiver decidido;
- as imagens do J;
- os efeitos do K.

Entram as 4 telas-chave, o cronômetro e o convite ao Plus, em claro e escuro, nas molduras de iPhone e de Android. Depois rode `auditar.mjs` até dar 0 achados e refaça o PDF (`docs/apresentacao/`: `capturar.mjs`, depois `montar.mjs`, depois `folhear.mjs`), conferindo as páginas de design.
