# Ícones de luta: origem e licença

Agente AL, P12, 15/10/2026. Gerados por `gerar_luta.py` (não edite os `.svg`: edite o script e rode `python -I gerar_luta.py`). Prévia em `galeria.html`, sprite em `sprite-luta.svg`.

## Licenças (conferidas em 15/10/2026, no arquivo LICENSE publicado de cada pacote)

| Biblioteca | Versão consultada | Licença | Arquivo | Crédito na tela |
|---|---|---|---|---|
| Lucide | `lucide-static@0.460.0` (unpkg) | ISC (partes herdadas do Feather: MIT) | `../licencas/LICENSE-lucide.txt` | não; o aviso vai junto do código |
| Tabler Icons | `@tabler/icons@3.19.0` (unpkg) | MIT | `../licencas/LICENSE-tabler.txt` | não; o aviso vai junto do código |

A busca pelos desenhos de luta foi feita nas etiquetas das duas bibliotecas (`tags.json` do Lucide, `icons.json` do Tabler): **nenhuma das duas tem luva de boxe, faixa, tatame, saco de pancada, gongo, kimono nem caneleira**. O Tabler tem `karate` (uma pessoa chutando) e `stopwatch`; o Lucide tem `timer`, `calendar-check`, `calendar-clock` e `house`. O que falta é desenho próprio, na mesma grade e no mesmo traço.

## Cada ícone

| Ícone | Origem | O que mudou |
|---|---|---|
| `inicio`, `inicio-cheio` | Lucide `house` | Traço 2,25; o cheio é próprio (porta vazada). **Substitui o haltere** da aba Início. |
| `horarios`, `horarios-cheio` | Lucide `calendar-clock` | Relógio de r 5,5; o cheio é próprio. Aba Horários. |
| `hoje`, `hoje-cheio` | Lucide `clock` | Traço 2,25; o cheio é próprio. Aba Hoje do professor. |
| `check-in` | Lucide `calendar-check` | Traço 2,25. "Estou na aula" e presença. |
| `modalidade` | Tabler `karate` | Traço 2,25; cabeça maior. |
| `cronometro-round` | próprio, a partir do Tabler `stopwatch` | O mostrador em 3 arcos (3 rounds). |
| `luva` | próprio | Luva de boxe de lado. |
| `faixa`, `faixa-cheio` | próprio | Faixa amarrada; aba Graduação. |
| `tatame` | próprio | Placas em perspectiva. |
| `saco` | próprio | Saco de pancada com a corrente. |
| `gongo` | próprio | Disco na moldura. |
| `kimono` | próprio | Gi com a gola cruzada e a faixa. |
| `caneleira` | próprio | Placa, tiras e peito do pé. |

Os outros ícones do app (voltar, fechar, sino, perfil, alunos, academia, treinos, relógio, calendário, troféu…) continuam os de `../contorno/` e `../cheio/` (agente R, `../CREDITOS.md`).

## O que sai do design (musculação), e quando apagar

Saem de **tela nova e de token**: o haltere da aba Início (`contorno/inicio.svg`, `cheio/inicio.svg`), `anilha`, `barra`, `esteira`, `bicicleta`, `musculo`, o "+" de anilhas da aba Plus (`plus`, o símbolo do Academia Plus; o Plus é [decidir] L12) e as 16 ilustrações de `exercicios/`. Nenhum mockup de luta (`luta.html`, `entrada.html`) usa esses desenhos.

**Os arquivos continuam no lugar** (pedido do coordenador, 15/10): `app/dominio/catalogo/catalogo.test.ts` confere que cada ilustração citada no catálogo de musculação existe em `exercicios/`, e `app/ferramentas/gerar-icones.mjs` lê `../sprite.svg`. Apagar só **depois que o agente AM tirar o catálogo de musculação do app** (onda 3). Lista para apagar nessa hora: `exercicios/` inteira; `contorno/` e `cheio/` `inicio`, `anilha`, `plus`; `contorno/` `barra`, `esteira`, `bicicleta`, `musculo`; as entradas correspondentes em `fonte/lista.json` e `fonte/gerar.py` (e rodar de novo o gerar.py, que refaz `sprite.svg` e `galeria.html`); `02-design/imagens/treinos/`, `capas/` e `exercicios/` (fotos de musculação).

**Feito em 15/10/2026 (agente AM2, P12):** o app tirou o catálogo de musculação, e a lista acima foi apagada: `exercicios/` inteira; `contorno/` e `cheio/` `inicio`, `anilha` e `plus`; `contorno/` `barra`, `esteira`, `bicicleta` e `musculo`; as entradas no `fonte/gerar.py` (o `lista.json`, o `sprite.svg` e a `galeria.html` foram refeitos por ele: 52 ícones, 0 ilustrações); e as fotos `02-design/imagens/treinos/`, `capas/` e `exercicios/`. O app lê o sprite geral (sem os de musculação) junto com o `sprite-luta.svg` (`app/ferramentas/gerar-icones.mjs`). Ficou para o dono do arquivo: `../CREDITOS.md` (do agente R) ainda cita esses desenhos.

