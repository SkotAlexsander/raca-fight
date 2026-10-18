# AT — PDF do aluno (P13, 15/10/2026)

> Agente AT. Entrega: `docs/apresentacao/aluno/saida/Raça Fight — Aluno.pdf` (**18 páginas, 2,7 MB, A4 deitado**), com cópia em `A:\Projetos\Academia Plus\Raça Fight — Aluno.pdf` (nada que já estava lá foi apagado). Para o dono da Raça Fight entender o que os alunos e os pais do Kids recebem. Mesmo visual, mesma escala e mesmo roteiro do PDF do admin (AR). Não mexi em `app/`, `01-especificacao/`, `02-design/`, `docs/apresentacao/admin/` nem `docs/apresentacao/professor/`.

## 1. As páginas

| p. | Página | Telas |
|---|---|---|
| 1 | Capa: "O app do aluno" | foto `raca-54` (capacete sobre o kimono, sem rosto), logo provisório |
| 2 | Em uma página: o que muda para o aluno, aviso sobre os exemplos, sumário | — |
| 3 | Três apps, um banco só (o do aluno em destaque) | — |
| 4 | A abertura e as duas portas | abertura, boas-vindas (claro), objetivo |
| 5 | A aula experimental grátis, pelo WhatsApp: 4 passos, a mensagem pronta e o número real | boas-vindas (escuro) + **esboço** "Qual modalidade?" |
| 6 | Início: a próxima aula e o "Estou na aula" | antes do toque, depois do toque (presença marcada), rolado no escuro |
| 7 | Horários, com a grade real (seg–qui, OPEN, competição) | claro e escuro |
| 8 | Treinos: a faixa, a presença e o caminho até aqui; caixa "O que o aluno não vê" (sem "pronto para graduar", L20) | claro e escuro |
| 9 | Cronômetro de rounds, com as 5 predefinições do R17.2 | o cronômetro em tela cheia |
| 10 | A academia no bolso: professores, atletas, eventos, técnicas, Raça Responde | aba Academia + **esboço** Raça Responde |
| 11 | "Traga um amiguinho", com código e a mensagem que o aluno manda | **esboço** Indicar um amigo |
| 12 | Avisos e notificações, e as regras (silêncio 22h–7h, até 3 por dia) | **esboços** tela bloqueada e Perfil › Avisos |
| 13 | Perfil e os dados opcionais | **esboços** Perfil e Meus dados + "Quem pode ver" (pronta) |
| 14 | Kids: a conta é dos pais; autorização de imagem desligada | **esboços** Início da responsável (2 filhos) e o dependente |
| 15 | Privacidade, em linguagem simples (6 blocos) | — |
| 16 | O que sai do app antigo (sai · fica e muda · espera a decisão) | — |
| 17 | Cinco respostas: Plus e dieta (L12/L13), as 5 abas (L32), atraso bloqueia check-in (L8), conta aos 16–17 (L27), termo da experimental (L25); e as outras | — |
| 18 | Próximos passos (5 etapas, prazo a combinar: não inventei prazo) | foto `raca-01` |

Cada página de tela tem "O que o aluno vê", "O que o aluno consegue fazer" (no Kids, "os pais") e "O que isso traz para a academia".

## 2. Como foi feito

Pasta `docs/apresentacao/aluno/`, copiada e adaptada do admin:

```
node capturar.mjs   # fotos, logo, 18 telas do AL e 12 esboços em _capturas/
node montar.mjs     # gera aluno.html e o PDF, confere e copia para A:\Projetos\Academia Plus\  (SEM_COPIA=1 não copia)
node folhear.mjs    # cada página em PNG em _capturas/_pdf/ (e contato.png)
```

- **Telas prontas**: o `capturar.mjs` serve a raiz do projeto, abre `mockups/luta.html` e `entrada.html` no Android 390, movimento reduzido, claro ou escuro, e fotografa cada `.celular[aria-label="Tela: …"]` (JPEG, escala 2). Para o "depois do toque", clica no "Estou na aula"; para o "rolado", rola a tela. A barra de controles da página é desgrudada antes da foto (ela cobria o topo das telas da entrada).
- **Esboços**: `aluno/esbocos.html` usa as **mesmas classes e tokens 2.0.0** dos mockups (`sistema.css`, `novas.css`, `luta.css`) e o sprite do `luta.html`, injetado na hora. A página é servida por `page.route` no endereço de `mockups/`, então nada é gravado em `02-design`. Todos levam a legenda **"Esboço da tela"** em vermelho; as prontas, "Tela pronta".
- **Conferência**: o `montar.mjs` é o do AR (corpo passando da página, quadro cortando texto, letra fora da escala 13·16·20·25·31·39·49·61, imagem que não abre, número de páginas, limite de 20 MB). A versão entregue sai **sem nenhum aviso**. Conferi as 18 páginas em PNG; corrigi os rótulos do Kids, o título da p. 17 (eram cinco perguntas, não seis), a tabela do cronômetro e a p. 16, que estava vazia embaixo.
- Chromium: o 1243 abriu nesta rodada; o `navegador.mjs` cai no 1234 se não abrir.

## 3. O que é provisório

- **9 esboços** (o AL ainda não desenhou): Qual modalidade? (vitrine), Indicar um amigo, tela bloqueada, Avisos, Perfil, Meus dados, Kids (Início da responsável e o dependente), Raça Responde.
- **Logo** provisório do AL.
- **Textos de exemplo**: as perguntas e a resposta do Raça Responde, o código de indicação, a mensagem do amigo, os avisos. Quem escreve o Raça Responde é a academia, no Admin.
- **Nomes inventados**: Lucas Andrade, Prof. Diego, Prof. Marina, Carla com Theo e Bia, Rafa, Bruno. Nenhum nome real de atleta ou professor.
- **Kids sem foto**: os filhos aparecem só com as iniciais. Nenhuma foto com criança foi usada (a capa é o `raca-54`, sem rosto).
- A régua do Muay Thai continua "a confirmar" (L3), como no mockup.

## 4. Achados para outros agentes

1. **AL**: as telas de `entrada.html` ficam por baixo da barra de controles grudada no topo quando a janela é baixa. Na página dá para rolar, mas numa captura de elemento a barra sai na foto. Não é defeito para quem usa, só para quem fotografa.
2. **AL**: faltam no desenho, pela ordem do PDF: a vitrine "Conheça a Raça Fight" com a folha "Qual modalidade?", Indicar um amigo, Avisos, Perfil, Meus dados, Meus dependentes / Dependente, Raça Responde. Os esboços em `docs/apresentacao/aluno/esbocos.html` podem servir de ponto de partida (usam as classes de vocês, mais uma chave `.e-chave` que os mockups ainda não têm).
3. **Para trocar um esboço pela tela pronta**: quando o AL desenhar, ponha a linha na tabela `TELAS` do `capturar.mjs` (o rótulo do `aria-label`) e troque, em `paginas.mjs`, o `cel('e:…')` por `cel('t:…')`. A legenda muda sozinha para "Tela pronta".
4. **Coerência com o admin**: o PDF do admin diz que mostrar ao aluno as mensalidades dele é a pergunta A2; a p. 13 daqui aponta para lá, sem repetir a pergunta.
