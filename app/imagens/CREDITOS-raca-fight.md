# Fotos da Raça Fight — índice por uso

Agente AL, P12, 15/10/2026. Fonte: as 54 imagens do Instagram em `02-design/referencias/raca-fight/fotos/` (a academia autorizou o uso). Gerado por `gerar.py` (`python -I gerar.py`); a lista exata de arquivos e recortes está em `manifesto.json`. 84 arquivos, cerca de 1 MB.

Formatos: **WebP** (o app) e **JPEG** (PDF e o que não lê WebP), em `@1x` e, quando a foto tem resolução, `@2x`. Nenhuma foto nítida foi aumentada: o Instagram entrega fotos de 480 a 1440 px de largura, então **a maioria dos usos só tem `@1x`** (ver a coluna). Pedir os originais à academia resolve.

## Regras

- **Nenhum rosto de criança em uso público.** As fotos com criança estão na lista "só com autorização" abaixo e não foram recortadas para uso.
- **Nenhum nome real** de atleta em texto de exemplo (os cartazes com nome e idade ficam de fora).
- Nenhum texto de cartaz, marca d'água ou seta de edição dentro do recorte (a seta verde do `raca-40` ficou fora).
- Sobre foto, o texto vai com o véu do sistema (`tokens.json › foto`) e é medido no pior pixel pela auditoria.

## Escolhidas

| Uso | Arquivo (prefixo) | Foto | Tamanhos | @2x | Por quê |
|---|---|---|---|---|---|
| Abertura e entrada (fundo de tela cheia) | `entrada-fundo-tela`, `-desfocado` | `raca-54` | 390 × 844 | não | O capacete vermelho sobre o kimono: luta, a cor da marca e **nenhum rosto**. A versão desfocada é o fundo dos passos da entrada. |
| Herói do Início (sem foto da modalidade) | `inicio-capa-capa`, `-cartao` | `raca-14` | 358 × 300, 358 × 200 | não | Mãos amarrando a bota de boxe vermelha: pronto para a aula, sem rosto. |
| Aula (Hoje do professor, chamada) | `aula-capa-capa`, `-cartao` | `raca-09` | 358 × 300, 358 × 200 | não | Sparring no tatame da academia, de longe (rostos pequenos, adultos). |
| Modalidade · Muay Thai | `modalidade-muay-thai-cartao`, `-mini` | `raca-40` | 358 × 200, 96 × 96 | só o mini | Chute no saco de pancada, no salão da academia. |
| Modalidade · Boxe | `modalidade-boxe-cartao`, `-mini` | `raca-20` | 358 × 200, 96 × 96 | sim | A luva de boxe de perto, sem rosto. |
| Modalidade · Jiu-Jitsu / Luta Livre | `modalidade-jiu-jitsu-cartao`, `-mini` | `raca-54` | 358 × 200, 96 × 96 | só o mini | O kimono (recorte de baixo da foto da abertura). |
| Modalidade · MMA | `modalidade-mma-cartao`, `-mini` | `raca-02` | 358 × 200, 96 × 96 | só o mini | Dois adultos com bandagem e luva de MMA, em guarda. |
| Modalidade · Kids (Muay Thai e Jiu-Jitsu) | `modalidade-kids-cartao`, `-mini` | `raca-11` | 358 × 200, 96 × 96 | só o mini | O cordão amarelo: Kids **sem foto de criança**. |
| Graduação (comemoração, régua) | `graduacao-cordao-capa`, `-cartao` | `raca-11` | 358 × 300, 358 × 200 | sim | O cordão (kruang/prajied) da própria academia. |
| Cronômetro de rounds (tela cheia) | `cronometro-fundo-tela`, `-desfocado` | `raca-40` | 390 × 844 | não | O saco de pancada; desfocado atrás do anel. Também é a foto "alternativa" da entrada. |
| Professor (retrato e avatar) | `professor-a-retrato`, `-avatar` | `raca-45` | 240 × 320, 96 × 96 | sim | Professor de camiseta da academia, foto limpa (sem texto). |
| Professor (retrato e avatar) | `professor-b-retrato`, `-avatar` | `raca-12` | 240 × 320, 96 × 96 | só o avatar | Professor em preto e branco. **O recorte tira a criança** que aparece no canto da foto original. |
| Eventos | `evento-noite-de-luta-cartao` | `raca-47` | 358 × 200 | sim | Atleta e corners na noite de luta (adultos). |
| Eventos | `evento-entrada-do-atleta-cartao`, `-capa` | `raca-52` | 358 × 200, 358 × 300 | não | A entrada do atleta descendo a escada para o ringue. |
| Fundo do Admin | `admin-fundo-faixa-admin`, `admin-fundo-cartao` | `raca-01` | 2040 × 320 (desfocado), 358 × 200 | a faixa sim (desfocada pode crescer) | O salão vazio com o ringue e a luz da janela, **sem ninguém**, abaixo do logo do letreiro. É também a foto da aba Academia. |

Os nomes dos professores nas fotos não são usados: nos mockups eles aparecem com nomes fictícios até a academia confirmar quem aceita aparecer (L34).

## Só com autorização (não usar em tela pública)

| Foto | O que tem |
|---|---|
| `raca-04` | cartaz "Muay Thai Kids" (desenho de criança, mais o treinador) |
| `raca-12` | criança no canto direito (só o recorte do professor foi usado) |
| `raca-15` | atleta que pode ser menor de idade, com os corners |
| `raca-25`, `raca-33`, `raca-27` | fotos de grupo; pode haver menores |
| `raca-32` | cartaz com atleta de 13 anos, com nome e idade |
| `raca-39` | turma Kids de Muay Thai (criança de rosto visível) |
| `raca-49` | cartaz do Dia das Crianças com crianças |
| `raca-50` | grupo com criança na frente |
| `raca-10` | turma cheia, com crianças |

## Fora por outro motivo

- **Cartazes com nome e idade de atleta** (`raca-28`, `30`, `31`, `34`, `35`, `46`, `36`): nome real em texto, não entra.
- **Cartazes com texto** (`raca-03`, `06`, `07`, `08`, `19`, `21`–`24`, `29`, `37`, `38`, `41`–`44`): servem de referência de marca, não de foto.
- **Evento com nomes** (`raca-26`, "Caio vs Norton"): nomes reais.
- `raca-05`, `raca-13`, `raca-16`, `raca-17`, `raca-18`, `raca-48`, `raca-51`, `raca-53`: escuras, tremidas, com seta de edição, comentário de rede social ou repetidas.

## Quando chegarem os originais

Rodar `gerar.py` de novo com as fotos grandes no lugar das do Instagram (mesmo nome de arquivo): os `@2x` saem sozinhos.
