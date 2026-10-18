# Logo da Raça Fight — PROVISÓRIO

> **PROVISÓRIO.** Reconstrução em vetor feita pelo agente AL em 15/10/2026 a partir das fotos do Instagram, porque o logo em alta resolução ainda não chegou. **Trocar tudo desta pasta pelo arquivo original da academia** assim que ele chegar (de preferência SVG, PDF ou AI). Não usar em material impresso nem na loja antes disso.

## De onde veio

| Fonte | O que mostra |
|---|---|
| `02-design/referencias/raca-fight/fotos/raca-37.jpg` (rodapé da grade de horários) | o logo inteiro, em branco sobre o preto, com a ponta vermelha |
| `raca-01.jpg` (o letreiro na parede) | as formas das letras grandes, de perto |
| `logo-perfil-instagram-100px.jpg` | a disposição (a foto de perfil é rosa: Outubro Rosa, não é a marca) |

## O que foi refeito e como

- **"RAÇA"**: desenho geométrico à mão (`fonte/gerar_logo.py`): o R aberto em cima à esquerda, os dois A em triângulo com o miolo triangular, o Ç com a cedilha caindo dentro da faixa. É a parte menos fiel: no original as letras têm cortes próprios que só o arquivo da academia vai mostrar.
- **"FIGHT", "CENTRO DE TREINAMENTO" e "GRAVATAÍ"**: Archivo (SIL OFL 1.1, `fonte/OFL-Archivo.txt`) na largura 125 e peso 800, convertida em contorno. O original usa uma letra larga parecida; a Archivo é a aproximação livre mais perto.
- **A faixa**: contorno com a ponta esquerda cortada em diagonal e, à direita, a ponta vermelha `#C42024` antes do fim da faixa.
- Nenhum SVG depende de fonte instalada; tudo é contorno.

## Arquivos

| Arquivo | Uso |
|---|---|
| `raca-fight-completo-escuro.svg` / `-claro.svg` | o logo inteiro (com "CENTRO DE TREINAMENTO" e "GRAVATAÍ"), para fundo escuro (branco) e para fundo claro (preto `#1C1C1C`) |
| `raca-fight-compacto-escuro.svg` / `-claro.svg` | "RAÇA" + a faixa com "FIGHT": cabeçalho, selo sobre foto, abertura |
| `raca-fight-compacto-uma-cor.svg` | uma cor só (`currentColor`), para carimbo, marca d'água e o mockup |
| `raca-fight-icone-app.svg` | ícone do app (iOS e lojas), 1024 × 1024, preto da marca, o compacto com 84 % da largura |
| `raca-fight-icone-app-primeiro-plano.svg` | primeiro plano do ícone adaptativo do Android (fundo `#1C1C1C`); os cantos do logo ficam dentro do círculo seguro de 2/3 |
| `png/icone-app-1024.png`, `png/icone-adaptativo-primeiro-plano-1024.png` | os mesmos em PNG |
| `png/abertura-logo-1024.png` | a imagem do `expo-splash-screen` (fundo transparente; o fundo `#1C1C1C` vem do `backgroundColor`) |
| `png/completo-escuro-1600.png`, `png/completo-claro-1600.png` | para PDF e apresentação |
| `fonte/gerar_logo.py` | o gerador (`python -I fonte/gerar_logo.py`); `fonte/simbolo-mockup.svg.txt` é o `<symbol id="s-simbolo">` que os mockups usam |

Proporção do compacto: **3,55 : 1** (largura : altura). Na abertura ele aparece com 240 pt; no selo, com 96 pt.

## Regras de uso (até chegar o original)

- Sobre foto, o logo vai sempre num **selo de vidro**, nunca direto na foto (a mesma regra do `03-LOGO.md`).
- Fundo escuro: logo branco. Fundo claro: logo `#1C1C1C`. A ponta é sempre `#C42024`; na versão de uma cor, ela é cheia na mesma cor.
- Tamanho mínimo do compacto: 96 pt de largura (abaixo disso o "FIGHT" some). No ícone de 48 px o "FIGHT" não se lê; o que se lê é "RAÇA" e a ponta vermelha, e isso é aceitável para um ícone.
- **[decidir]** com a academia: o ícone do app pode ser só "RAÇA" + a ponta, ou um símbolo que eles já usem. O emblema redondo "Cyborg Martial Arts" que aparece em algumas camisetas e cartazes (`raca-07`, `raca-46`) parece ser de uma equipe parceira: não usar sem perguntar de quem é.
