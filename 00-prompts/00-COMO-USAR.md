# Como usar estes prompts

Cada arquivo `P0x` é um prompt completo: dá para um agente (ou uma pessoa) e ele produz uma pasta do projeto. A ordem é a numeração, mas P01 a P04 são independentes e podem rodar **em paralelo** — foi assim na primeira rodada, em 10/10/2026, com quatro subagentes.

| Prompt | Produz | Depende de |
|---|---|---|
| `P00-CONTEXTO.md` | nada: é o que todos leem primeiro | a fala do Alex |
| `P01-FUNCIONALIDADES.md` | `01-especificacao/` | P00 |
| `P02-ARQUITETURA.md` | `03-arquitetura/` + esqueleto de `app/` | P00 |
| `P03-SISTEMA-DE-DESIGN.md` | `02-design/sistema-de-design/` | P00 |
| `P04-MARCA-E-PROPOSTA.md` | `02-design/marca-e-proposta/` | P00 (e os nomes de token do P03) |

## Regras

- Quando o Alex decidir uma pendência, **primeiro atualize o P00** (tira da tabela de [decidir], entra em "decisões já tomadas", registra em `docs/decisoes.md`), depois rode de novo só o prompt afetado.
- Um prompt nunca escreve fora da pasta dele. O que precisar de outra pasta vira pedido no relatório final.
- Fila depois da primeira rodada (10/10/2026): `P05-REVISAO.md` (feito: bugs, melhorias, responsividade, PDF) → `P06-IPHONE.md` (rodando) → `P07-NOTIFICACOES-E-CRONOMETRO.md` → `P08-DESIGN-ATRAENTE.md` (direção de arte, imagens, efeitos, e por último a aplicação no mockup e o PDF refeito).
- Prompts que ficaram para depois: `P05-CONSTRUCAO.md` (implementar telas a partir da especificação + tokens) e `P06-REVISAO.md` (auditoria visual e funcional antes de mostrar ao Alex). Só são escritos depois que as pendências estiverem fechadas.
