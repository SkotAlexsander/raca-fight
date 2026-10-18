# recursos/

Imagens e fontes que o `app.json` referencia. **Desde 15/10/2026 (P12, agente AM2) a marca é a da Raça Fight, com o logo PROVISÓRIO** do agente AL (`../02-design/marca-e-proposta/logo-raca-fight/`, refeito a partir das fotos). Trocar quando chegar o logo original da academia:

- `icone.png`: cópia de `png/icone-app-1024.png` (1024×1024, sem transparência: a App Store recusa canal alfa).
- `icone-adaptativo.png`: cópia de `png/icone-adaptativo-primeiro-plano-1024.png`; o fundo `#1C1C1C` está no `app.json`.
- `icone-notificacao.png`: 96, branco sobre transparente, só Android; feito do `png/abertura-logo-1024.png` (a silhueta do logo compacto, em branco).
- `abertura-logo.png`: cópia de `png/abertura-logo-1024.png` (o logo branco com a ponta vermelha; o fundo `#1C1C1C` vem do `app.json`, o mesmo nos dois temas, `imageWidth` 396 ≈ 240 pt).

Não edite os PNG: troque no design e copie de novo. O ícone ainda é [decidir] com a academia (o compacto inteiro ou só "RAÇA" com a ponta).

## fontes/

As fontes da marca (`02-design/marca-e-proposta/02-IDENTIDADE-VISUAL.md`), embutidas no build pelo plugin `expo-font` do `app.json`. Nomes exatos que o `app.json` espera:

| Arquivo | Uso (tokens de `tipografia`) |
|---|---|
| `fontes/Figtree-Regular.ttf` | `corpo`, `corpoPequeno` (400) |
| `fontes/Figtree-Medium.ttf` | `legenda` (500) |
| `fontes/Figtree-SemiBold.ttf` | `titulo2`, `titulo3`, `corpoForte`, `rotuloAba` (600) |
| `fontes/Figtree-Bold.ttf` | `titulo1` (700) |
| `fontes/Archivo-Bold.ttf` | `numeroCronometro`, `numeroCarga`, `numeroMedio` (700) |
| `fontes/Archivo-ExtraBold.ttf` | número grande em 800, se o design usar |

As duas famílias são livres (SIL Open Font License) e vêm do Google Fonts. Sem esses arquivos, `expo prebuild` e o EAS Build falham. Como cada peso vira uma família no iOS, o `tema/` usa o nome do arquivo (`fontFamily: 'Figtree-SemiBold'`) em vez de `fontWeight` (ver `../../03-arquitetura/04-IPHONE.md`, seção 8).
