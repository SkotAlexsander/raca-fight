# Z — Entrada e telas da academia (P11, onda 2) · 11/10/2026

O agente Z escreveu a entrada (abertura, duas portas, login e cadastro simulados, perguntas opcionais, código da equipe e pedido pendente) e a visão da academia inteira, em `app/telas/entrada/`, `app/telas/academia/`, `app/navegacao/(entrada)/` e `app/navegacao/(academia)/`. Não mexi em `componentes/`, `tema/`, `dados/` nem `dominio/`: o que falta lá está na seção 4, para o AA promover.

## 1. Resultado das verificações

| Verificação | Resultado |
|---|---|
| `npm run tipos` (tsc) | **0 erros** no projeto inteiro (com as telas do Y já no lugar) |
| `npm run testar:dominio` (domínio + dados) | **349 testes, 349 passam** |
| `npx expo export --platform web` | **exporta** (saída em `--output-dir` do meu scratch, para não pisar no `dist/` dos outros). Enquanto o Y ainda escrevia, o export do app real quebrava em rotas dele sem tela (`@/telas/aluno/TelaCronometro`, `perfil/TelaAvisos`…); validei antes numa cópia sem as rotas do aluno e, no fim, no app real |
| Playwright (Chromium padrão abriu) | **140 capturas** (35 roteiros × 393×852 e 2040×790 × claro e escuro), **0 erros de página, 0 erros no console, 0 rolagem horizontal** |
| Fluxos percorridos de ponta a ponta | conta nova pela Apple → código MRC4K2 → pular → pular → cai no Início do aluno (Juliana, pendente); instrutor abre Bruno (que pediu treino) → Montar treino → do zero → busca "leg" → Leg press 45° → Enviar → o pedido some e o treino aparece "Em uso, montado por Carlos"; dono esconde o perfil da Carla na Equipe |

Capturas e scripts (temporários): `C:\Users\alexs\AppData\Local\Temp\claude\a--Claude\40b1ec06-06e4-4f50-b321-b3e3c5f7f9d5\scratchpad\z-academia\` (`capturar.mjs`, `capturas/`, `mockup/` com os quadros do mockup capturados para comparar, `mockup.mjs`).

## 2. Telas feitas

### Entrada (`navegacao/(entrada)/`)
| Rota | Tela | Mockup |
|---|---|---|
| `/boas-vindas` | Abertura animada (símbolo desce e aparece, espera, encolhe de 96 a 32 e viaja até o selo, a cor da marca some, foto 1,04→1, texto e portas sobem 8 com 60 ms entre eles; reduzido = esmaecer de 160) + as duas portas | entrada.html A1–A3 |
| `/como-entrar?porta=aluno\|academia` | Aluno · como entrar / Academia · entrar (Apple e Google iguais, um embaixo do outro; "primeira vez?" com convite e abrir academia) | B1, C1 |
| `/entrar-com-email`, `/criar-conta`, `/confirmar-contato`, `/esqueci-a-senha` | E-mail, criar conta (aviso de 8 caracteres antes do erro), código de 6 caixas, nova senha com reenviar em 0:42 | B2–B4 |
| `/sua-academia`, `/objetivo`, `/dias-por-semana`, `/quem-pode-ver` | Passos 1–3 com "Pular"; quem pode ver só com academia E objetivo respondido | B5–B8 |
| `/codigo-da-equipe`, `/pedido-pendente`, `/abrir-academia` | Código T9K2WM + papel esperado; pedido "Esperando o dono" com "Treinar como aluno enquanto isso" e "Cancelar o pedido"; abrir academia com a nota [decidir] | C2–C4 |
| `/contas-de-exemplo` | Atalho de demonstração (a tela provisória do X) | — |

### Academia (`navegacao/(academia)/`, cada aba virou uma pasta com pilha própria)
| Rota | Tela | Mockup |
|---|---|---|
| `/alunos` | Alunos: busca, filtros (14+ dias, sem treino ativo, Plus, pendente, Novos 90 dias com "sem treino ativo"/"7+ dias", Pediu treino, Treino para trocar), Confirmar/Recusar e "Confirmar todos (N)"; sino = Aviso para todos (dono e recepção) | sem mockup próprio (lista do index.html) |
| `/alunos/[id]` (e `/acompanhamento/[id]`) | Perfil do aluno visto pela academia | index.html tela 3 |
| `/alunos/montar/[id]?origem=` | Montar treino para o aluno (zero, pronto, atual) + "Enviar para o aluno" | sem mockup |
| folhas no perfil | **Dar treino pronto em dois toques** (lista dos prontos → "Enviar X para Y": tornar ativo, Trocar em 4·6·8·12, recado); Começar de onde?; Encerrar vínculo com motivo; histórico; ver treino | sem mockup |
| `/alunos/avisos`, `/alunos/novo-aviso` | Aviso da academia (em vigor, antigos, retirar; novo com 160/3 linhas pelo domínio, 1·3·7·14 dias, notificação travada se já houve hoje, prévia do cartão) | sem mockup |
| `/biblioteca`, `/biblioteca/[id]` | Treinos prontos da academia (catálogo real, quantos alunos usam, publicados/arquivados) e Exercícios; ver pronto com arquivar/publicar | capa do index.html tela 2 |
| `/acompanhamento` | Plus do personal, por ordem de atenção com o motivo em cada linha | sem mockup |
| `/painel`, `/painel/equipe` | Painel do dono + quadros novos de R12.12 + designar personal; Equipe com esconder/mostrar | novas.html tela 5 |
| `/perfil-da-equipe`, `/meu-perfil-profissional`, `/avisos-da-equipe` | Perfil (academia), Meu perfil profissional com a chave "Mostrar aos alunos" (prévia ao ligar, travada se escondido), Avisos da equipe | sem mockup |

## 3. Divergências do mockup e por quê

1. **Botão "Contas de exemplo"** nas boas-vindas (texto, discreto, abaixo das portas). Não está no mockup; é o atalho de demonstração enquanto não há servidor (e o que os scripts do Y/AA usam para entrar). Sai com uma linha quando houver login de verdade.
2. **Login simulado**: Apple e Google abrem uma folha "Continuar com a Apple" que faz o papel da janela do sistema (contas de exemplo + "Conta nova"); o e-mail aceita o e-mail de uma conta de exemplo com qualquer senha. Telas com código mostram uma linha "Simulação: o código é MRC4K2 / T9K2WM". A conta nova entra como **Juliana** (pediu academia) ou **Lucas** (sem academia), com um aviso rápido dizendo isso.
3. **Tela larga (2040 × 790)**: a foto das boas-vindas é retrato (440 × 956); com `cover` sobrava só a camiseta. No largo, o fundo vira a foto desfocada e a nítida fica numa faixa central na altura da tela (memória "Monitor ultrawide"). Os passos usam a foto desfocada inteira. A coluna é sempre de 600 no meio.
4. **Perfil do aluno**: o mockup traz o chip "Academia" (trocar visão) no cabeçalho e a seção "Outros alunos"; no app o cabeçalho tem o menu ⋯ (Encerrar vínculo, R12.11 — a única ação por cabeçalho) e "Trocar de visão" fica no Perfil; "Outros alunos" era recheio do mockup. Entraram "Dar treino pronto" (R12.4) abaixo dos dois botões do mockup, o cartão do pedido de treino no topo (R12.2) e a seção Frequência (4 semanas, F5). Sem autorização, a ilha diz "não liberou os dados corporais" e o objetivo some (R6.5).
5. **Painel do dono**: números calculados dos dados de exemplo (5 de 6, não 214 de 350); entraram os três quadros de R12.12 (com treino ativo, novos 90 dias, saídas no mês) e as linhas Equipe / Avisos. A barra dos 7 dias é feita de Views (sem biblioteca de gráfico), com "Ver em tabela". O véu da foto da sala usa uma camada `rgba(4, 8, 8, 0.3)` por cima do `foto.gradiente` (o `novas.css` tem um véu próprio da sala que não está no `tokens.json`).
6. **Montar treino**: não é o editor completo (reordenar, aquecimento, copiar série) — esse é o "Editar treino" compartilhado do Y. Aqui: dias, adicionar exercício com busca, séries/repetições/carga/descanso em bloco, remover. O AA pode trocar pelo editor do Y com a faixa "Montando para".
7. **Treinos prontos (academia)**: "+ Novo treino pronto" e "Editar exercício" não entraram (pedem o editor e o servidor); a lista diz que os exercícios próprios entram com o servidor.
8. **Avisos da equipe**: as chaves ficam só na memória do aparelho.
9. **Meus alunos Plus**: com os dados de exemplo a lista do Diego fica vazia (a Júlia, que tem a Ana, não é conta de exemplo). O estado vazio aparece; ver seção 4.

## 4. Peças para o AA promover

### Para `componentes/`
| Peça (onde está) | Por quê |
|---|---|
| `Interruptor` e `LinhaComChave` (`telas/entrada/pecas.tsx`) | Não existe chave no catálogo base; uso em quem pode ver, envio, aviso, perfil profissional, avisos da equipe (e o Y deve precisar também) |
| `Lista` e `Linha` (`telas/academia/pecas.tsx`) | O `.lista` + `.linha` do sistema.css, com divisor recuado e camada de toque |
| `Quadro`, `GradeDeQuadros`, `Medidor`, `GraficoDeBarras` (idem) | `.p-quadro`, `.p-medidor`, `.p-grafico` barras com "Ver em tabela" |
| `Simbolo` e `SeloDoLogo` (`telas/entrada/pecas.tsx`) | O símbolo da marca em react-native-svg (hoje só nos PNG) |
| Peças da entrada (`TelaDaEntrada`, `Pilula`, `Porta`, `CampoDeVidro`, `CaixasDeCodigo`, `Opcao`, `Passos`) | Ficam bem em `telas/entrada/`; promover só se outra tela usar |
| **Bug no `Campo`** | No navegador o `TextInput` mostra o contorno preto do foco por dentro do nosso (falta `outlineStyle: 'none'`; o `outlineWidth: 0` não basta, principalmente no multilinha). Na entrada corrigi no meu campo de vidro |
| `Icone`/vidro | Mesmo caso que o X achou com o SVG: um `<input>` solto dentro do `Vidro` pinta ABAIXO das camadas absolutas (o texto digitado não aparecia). Resolvi envolvendo o input numa View; vale uma nota no `Vidro` |

### Para `dados/` (o `Repositorio` não tem escrita para nada disto; hoje está em `telas/academia/estado-local.ts`, na memória)
- `confirmarVinculo(ids[])`, `recusarVinculo(id)`, `encerrarVinculo(id, motivo?)` (R8.1, R12.10, R12.11);
- `enviarTreinoAoAluno(treino, { tornarAtivo, trocarEm, recado })` fechando o pedido aberto (F5, R12.4, R12.5);
- `publicarAviso`, `retirarAviso`, `avisosDaAcademia(academiaId)` com o histórico (hoje só há `avisoDaAcademia`, um só, sem autor/validade/notificação);
- `arquivarPronto(programaId, arquivado)`;
- `designarPersonal(alunoId, personalId)` (R5.5);
- `salvarPerfilProfissional(perfil)` (o domínio valida; a tela já chama `editarPerfilProfissional`);
- `preferenciasDaEquipe` (Avisos da equipe);
- `criarConta`, `pedirVinculo(codigo)`, `pedirEntradaNaEquipe(codigoDaEquipe, papel)`, `salvarRespostasDaEntrada(objetivo, dias, autorizaAcademia)` — a entrada não grava nada;
- `contasDeExemplo`: acrescentar a **Júlia** (personal da Ana) para o Plus do personal ter conteúdo; incluir o e-mail na `ContaDeExemplo`;
- a chave de consulta `['realizados'|'treinos'|'plus', academiaId, alunoId]` é a mesma dos hooks de `consultas.ts`; as que criei (`['pedidos', academiaId]`, `['medicoes', …]`, `['dieta', …]`, `['refeicoes-14', …]`, `['entrada', …]`) podem virar hooks lá.

### Para `dominio/` (não mexi)
- `Academia` não tem o **código da equipe** (F13.4 pede um diferente do dos alunos); a simulação usa `T9K2WM` em `telas/entrada/simulacao.ts`.

### Para o design / tokens
- Véu da foto da sala do dono (`novas.css › .p-foto--dono::before`) não está no `tokens.json`.

### Para o Y / AA
- `telas/academia/formatos.ts` e `telas/aluno/comum/formatos.ts` duplicam os nomes dos objetivos: juntar.
- O Início da Juliana (vínculo pendente) diz "Os prontos aparecem quando você entrar numa academia"; pela R12.9 o pendente **já vê** os treinos prontos.
- `navegacao/LEIA-ME.md` (do X) ainda descreve as rotas da academia como arquivos soltos; agora são pastas com `_layout` (pilha por aba). `ROTA_INICIAL_DA_VISAO` (`/alunos`) continua valendo.
- Scripts que entravam por `/boas-vindas` clicando no nome: usar `/contas-de-exemplo`.

## 5. Regras que a tela segue (e onde)
- Dado de saúde só com autorização (R6.4) ou para o personal do Plus (R6.6): `useAluno` devolve `perfil` e `medicoes` vazios sem isso; a lista de alunos nunca mostra objetivo; a lista de prontos só começa filtrada pelo objetivo se ele autorizou (R12.4).
- O funcionário nunca edita o treino do aluno: monta um novo (cópia com ids novos).
- O dado grava antes do aviso/animação em todo envio, confirmação e esconder.
- Painel: só números somados; a frase de privacidade no pé (R6.7).
- Perfil profissional: tudo pelo `editarPerfilProfissional` (CREF no formato do CONFEF, "Sobre" sem contato, o dono só esconde); "informado pelo profissional" ao lado do CREF (escolha provisória); sem nota, sem preço.
- Escala fechada: todo texto pela `Texto`; um herói por tela (o "5" do painel, o número dos dias); toque ≥ 48 por `hitSlop`.

## 6. O que não deu para ver no navegador
Desfoque do vidro no Android, a abertura saindo exatamente do `expo-splash-screen` num aparelho, o teclado sobre "Entrar" no iPhone e a janela nativa da Apple (que aqui é simulada).
