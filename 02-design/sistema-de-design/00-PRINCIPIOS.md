# 00 — Princípios do sistema de design

O que este arquivo é: as 7 regras que decidem qualquer dúvida de tela no Academia Plus. Quando dois caminhos parecem bons, vence o que obedece mais princípios desta lista.

Cenário que guia tudo: o aluno está **em pé, entre duas séries, com a mão suada, o celular numa mão só, a tela refletindo a luz da academia, com 40 a 90 segundos de descanso**. O funcionário está **andando pela sala, com o celular numa mão, atendendo alguém com a outra**.

## Os 7 princípios

1. **Dedo, não cursor — e tamanho visual não é área de toque.** Toda área tocável tem no mínimo 48 × 48 (44 pt é o piso no iOS), conseguida com área invisível (hitSlop) quando o desenho é menor. O desenho segue o grupo `controle` (botão primário 48, secundário 40, ícone 40, marcar série 40, +/− 36, chip 32; nada interativo passa de 56). Alvos vizinhos ficam a 8 px um do outro, nunca colados. *(Revisto em 10/10/2026: antes o desenho do marcar série e do +/− tinha 56 e 64.)*

2. **Proporção planejada; legível a um braço de distância sem gritar.** A escala tipográfica é fechada (base 16, razão 1,25: 13 · 16 · 20 · 25 · 31 · 39 · 49 · 61) e cada tela tem **um herói**: um só número ou título grande (49, ou 61 no modo treino e no cronômetro). O resto desce na escala: linha de série 20, valor sendo editado 25, título de tela 25. Número e unidade ficam em no máximo 2,5 : 1, na mesma linha de base. *(Revisto em 10/10/2026 a pedido do Alex: "número grande / alvo grande em tudo" deixava a tela com cara de zoom e sem hierarquia.)*

3. **Um gesto, uma ação.** Marcar uma série é um toque. Ajustar carga é um toque no + ou no −. Nada de segurar, arrastar com precisão ou abrir menu para fazer o que se faz 20 vezes por treino. Gesto de arrastar só como atalho, nunca como único caminho.

4. **Contraste para tela com reflexo.** Texto comum em 4,5:1 ou mais, número grande e ícone em 3:1 ou mais, nos dois temas. Nenhuma informação depende só de cor: estado tem ícone ou texto junto.

5. **Uma mão alcança.** O que se usa com frequência fica na metade de baixo da tela (barra de abas, botão principal, folha inferior). O topo guarda contexto e leitura, não ação repetida.

6. **Erro é raro e reversível.** Ação destrutiva (apagar exercício, encerrar treino) pede confirmação em folha inferior ou oferece "desfazer" no toast por 5 segundos. Nenhuma ação de treino se perde por toque errado.

7. **Um app, duas visões.** Aluno e academia usam os mesmos tokens, componentes e gestos. O que muda é o conteúdo, as abas e a densidade. Quem passa de uma visão para a outra não reaprende nada.

## Como os princípios viram decisão

| Dúvida comum | Princípio que resolve | Decisão |
|---|---|---|
| "Cabe mais uma coluna no cartão de exercício?" | 2 e 1 | Sim, se o número da série continuar em 20 e a área de toque em 48 (o desenho do controle pode ser menor) |
| "Botão de marcar série em cima ou embaixo da linha?" | 5 | À direita da linha, alinhado ao polegar: desenho de 40, área de toque de 48 |
| "Este número pode ser grande também?" | 2 | Só se for o herói da tela. Se já existe um, este desce um ou dois degraus da escala |
| "Confirmar antes de marcar série feita?" | 3 e 6 | Não confirma; oferece desfazer no toast |
| "Visão da academia pode ter lista mais apertada?" | 7 | Pode: densidade compacta (linha de 56 px) com os mesmos componentes |
| "Mostrar status só pela cor do selo?" | 4 | Não: cor + texto ("Plus", "Pago", "Pendente") |
| "Vale um gesto de deslizar para apagar?" | 3 | Só como atalho; o botão visível continua existindo |
