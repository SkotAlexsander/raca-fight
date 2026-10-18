# telas/academia/

Visão da academia (agente Z, P11). Rotas em `navegacao/(academia)/`: cada aba é uma pilha (`PilhaDaAba`), e a barra de abas fica visível nas telas de dentro.

| Arquivo | Telas |
|---|---|
| `TelaAlunos` | Alunos: busca, 8 filtros (R12.6, R12.7), confirmar/recusar pendente e "Confirmar todos (N)" |
| `TelaPerfilDoAluno` | Perfil do aluno (mockup index.html, tela 3): ilha escura, dados de saúde só com autorização, Montar treino, Dar treino pronto, histórico, Encerrar vínculo |
| `TelaMontarTreino` | Montar treino para o aluno (do zero, de um pronto, do treino atual) e "Enviar para o aluno" |
| `envio.tsx` | Folha dos prontos e folha de envio (tornar ativo, Trocar em, recado); `enviarTreino` fecha o pedido aberto |
| `TelasDeAviso` | Avisos da academia e Novo aviso (F10, R10.10–R10.13) |
| `TelasDeProntos` | Treinos prontos da academia, exercícios, ver pronto (arquivar/publicar) |
| `TelaMeusAlunosPlus` | Plus do personal, por ordem de atenção (R12.14) |
| `TelaPainelDoDono` | Academia em números (mockup novas.html, tela 5) e designar personal |
| `TelasDaEquipe` | Perfil (academia), Meu perfil profissional (F14.1), Equipe do dono (F14.3), Avisos da equipe |

Apoio: `dados-da-academia.ts` (leituras e regras de tela: saúde só com autorização, novo = 90 dias, sumido 14/7), `envio.tsx` (dar e enviar treino, pelo repositório), `pecas.tsx` (a tela da academia, Seção, Rótulo, Privacidade). O que esta visão escreve é gravado pelo `useGravar()` de `dados/` (agente AA: antes era `estado-local.ts`, na memória); Lista, Linha, Quadro, Medidor, as barras e os formatos estão em `componentes/`.
