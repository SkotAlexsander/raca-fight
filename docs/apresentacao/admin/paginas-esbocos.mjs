// As páginas do PDF do admin (agente AR, 15/10/2026). Cada página é um objeto; o montar.mjs põe o rodapé, numera e imprime.
// TODO número vem de `d` (o _dados/dados.json que o dados.mjs calcula com o domínio financeiro) ou de `x.custos`
// (docs/hospedagem/custos.json, do AQ). Nada de valor digitado aqui.
//
// Os quadros de tela são esboços em HTML (o AK ainda está desenhando as telas). A função `tela()` troca o esboço pela
// captura do AK quando ela existe em _capturas/telas/<id>.png|jpg (ver capturar.mjs).

const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const neg = (t) => (String(t).startsWith('−') ? `<span class="neg">${esc(t)}</span>` : esc(t))
const lista = (xs, cls = '') => `<ul class="lista ${cls}">${xs.map((x) => `<li>${x}</li>`).join('')}</ul>`
const bloco = (titulo, xs, cls = '', lcls = '') => `<div class="bloco ${cls}"><h3>${titulo}</h3>${Array.isArray(xs) ? lista(xs, lcls) : xs}</div>`
const verFazer = (ver, fazer, extra = '') => `<div class="duas" style="margin-top:12px">${bloco('O que você vê', ver)}${bloco('O que você consegue fazer', fazer)}</div>${extra}`
const SIT = { Paga: 'selo--ok', Atrasada: 'selo--vermelho', 'Vence hoje': 'selo--atencao', 'A vencer': '', Trancado: 'selo--atencao', Matriculado: 'selo--ok', Inativo: '' }
const selo = (t) => `<span class="selo ${SIT[t] ?? ''}">${esc(t)}</span>`
const primeiro = (n) => String(n).split(' ')[0]
const MESN = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
/** "Boxe 2× — 2026-10" (como o domínio descreve a mensalidade) → "Boxe 2× · outubro" para a tela */
const descr = (t) => String(t).replace(/ — (\d{4})-(\d{2})$/, (_, a, m) => ` · ${MESN[Number(m) - 1]}`)

export function paginas(d, x) {
  const p = d.painel
  const LOGO_C = x.logoCompacto ? `<img class="logo" src="${x.logoCompacto}" alt="Raça Fight">` : '<span class="logo-texto">RAÇA FIGHT</span>'
  const barra = (onde, dir = '') => `<div class="tela__barra">${LOGO_C}<span class="onde">${onde}</span><span class="dir">${dir || '<span class="busca">Buscar…  /</span>'}<span class="avatar">D</span></span></div>`
  /** Quadro de tela: a captura do AK quando houver; senão, o esboço. */
  const tela = (id, onde, corpo, { altura = 360, dir = '', legenda = '' } = {}) => {
    const cap = x.captura(id)
    const fig = cap
      ? `<img class="tela-captura" src="${cap}" alt="Tela ${esc(id)}" style="max-height:${altura}px;object-fit:contain">`
      : `<div class="tela" data-tela="${id}" style="height:${altura}px">${barra(onde, dir)}<div class="tela__corpo">${corpo}</div></div>`
    return `<figure class="quadro">${fig}${legenda ? `<figcaption class="legenda"><b>${cap ? 'Tela do Admin' : 'Esboço da tela'}.</b> ${legenda}</figcaption>` : ''}</figure>`
  }
  const tabela = (cab, linhas, { cls = '', rodape = '' } = {}) =>
    `<div class="tabela-cx"><table class="grade-t ${cls}"><thead><tr>${cab.map(([t, c]) => `<th class="${c ?? ''}">${t}</th>`).join('')}</tr></thead><tbody>${linhas.join('')}</tbody>${rodape}</table></div>`
  const tr = (cels, cls = '') => `<tr class="${cls}">${cels.map(([t, c]) => `<td class="${c ?? ''}">${t}</td>`).join('')}</tr>`

  const out = d.outubro
  const ev = d.evolucao
  const maxAbs = Math.max(...ev.map((e) => Math.abs(e.resultado)))
  const ger = d.geracaoOut
  const pul = ger.puladas
  const deFora = Object.values(pul).reduce((s, n) => s + n, 0)
  const cs = d.cobrancasOut
  const inad = d.inadimplentes
  const imp = d.importacao
  const ROT_PAPEL = { data: 'Data', descricao: 'Descrição', entrada: 'Entrada', saida: 'Saída', categoria: 'Categoria', situacao: 'Pago ou pendente', valor: 'Valor', ignorar: 'Ignorar' }
  const custos = x.custos
  const degrau = (id) => custos.degraus.find((g) => g.id === id)
  const brl = (n) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const brl0 = (n) => `R$ ${Math.round(n).toLocaleString('pt-BR')}`

  const pgs = []
  const add = (o) => pgs.push(o)

  // ───────────────────────────────────────────── 1. capa
  add({ id: 'capa', capa: true, html: `
    <div class="capa__texto">
      ${x.logoCompleto ? `<img class="capa__logo" src="${x.logoCompleto}" alt="Centro de Treinamento Raça Fight Gravataí">` : '<div class="capa__titulo">RAÇA FIGHT</div>'}
      <p class="capa__olho">Proposta · ${d.hojeBR.slice(0, 2)} de outubro de 2026</p>
      <h1 class="capa__titulo">O painel<br>do <em>dono</em></h1>
      <p class="capa__sub">Tudo o que a planilha faz hoje, e o que ela não faz: a mensalidade que se gera sozinha, quem está devendo, quanto cada modalidade rende e o mês fechado sem conta à mão.</p>
      <div class="capa__ficha">
        <div><b>Para</b>Raça Fight Gravataí</div>
        <div><b>O quê</b>O app do dono (Admin)</div>
        <div><b>Junto com</b>o app do aluno e o do professor</div>
        <div><b>Situação</b>proposta para decidir</div>
      </div>
      <p class="capa__nota">Logo provisório, redesenhado a partir das fotos da academia: entra o arquivo original assim que chegar.</p>
    </div>
    <div class="capa__foto" style="background-image:url('${x.fotoCapa}')"></div>` })

  // ───────────────────────────────────────────── 2. em uma página
  add({ id: 'resumo', olho: 'Em uma página', titulo: 'O app do dono, ligado aos outros dois',
    lide: 'O Admin é o terceiro aplicativo da Raça Fight, ao lado do app do aluno e do app do professor. Ele substitui a planilha e mostra numa tela só o que hoje leva horas de conta.',
    corpo: `<div class="duas" style="grid-template-columns:1.05fr 1fr;gap:28px">
      <div class="pilha">
        ${bloco('O que muda no seu dia', [
          `<b>A mensalidade sai sozinha.</b> No dia 1, as ${ger.mensalidades} mensalidades do mês ficam prontas. Você só marca quem pagou.`,
          `<b>Quem deve, na hora.</b> A lista de quem está atrasado, do maior atraso para o menor, com a mensagem de WhatsApp pronta.`,
          `<b>O mês fechado sem calculadora.</b> Quanto entrou, quanto saiu, o resultado, a previsão e a comissão de cada professor.`,
          `<b>A planilha cabe aqui dentro.</b> Ele lê a planilha que vocês já usam e devolve para o Excel quando você quiser.`,
          `<b>Nada some.</b> Toda mudança fica registrada: quem fez, quando e de quanto para quanto.`,
        ].map((t) => t), 'lista--16')}
        <div class="caixa caixa--vermelha"><b class="rot">Sobre os números deste documento</b>São de exemplo: nomes inventados e preços inventados. Mas não foram digitados à mão: o próprio sistema calculou tudo, simulando um ano de uma academia com ${p.alunos.matriculados} alunos matriculados. Com os preços reais de vocês, as mesmas contas saem com os números de verdade.</div>
      </div>
      <div class="bloco bloco--cinza"><h3>O que tem aqui</h3>
        <ol class="sumario" style="columns:1">
          ${[['tres-apps', 'Os três apps e o que cada um vê'], ['problema', 'Hoje a planilha, amanhã o painel'], ['painel', 'Painel: a academia numa tela'], ['alunos', 'Alunos e responsáveis do Kids'], ['funcionarios', 'Equipe e o pagamento dela'],
            ['grade', 'Financeiro: a planilha dentro do app'], ['mensalidades', 'Mensalidade gerada sozinha'], ['fechar', 'Despesa fixa e fechar o mês'], ['inadimplencia', 'Cobrança e inadimplência'], ['importar', 'Importar a planilha e exportar para o Excel'],
            ['relatorio-ano', 'Relatórios'], ['filtro', 'Filtro total'], ['funil', 'Funil da aula experimental'], ['agenda', 'Agenda, notas e lembretes'], ['historico', 'Histórico de quem mexeu'], ['permissoes', 'Quem vê o quê'],
            ['seguranca', 'Segurança e LGPD'], ['custo', 'Hospedagem e custo'], ['decidir', 'O que a academia precisa decidir'], ['passos', 'Próximos passos']]
            .map(([id, t]) => `<li><b>${t}</b><span class="p">{{p:${id}}}</span></li>`).join('')}
        </ol>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 3. os três apps
  const icone = (t) => `<span class="app__icone"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${t}</svg></span>`
  const CEL = '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>'
  const PC = '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>'
  add({ id: 'tres-apps', olho: 'Como tudo se liga', titulo: 'Três apps, um banco de dados só',
    lide: 'O aluno, o professor e você usam apps diferentes, mas todos leem e escrevem no mesmo lugar. O check-in do aluno aparece na chamada do professor; a matrícula que você faz libera o check-in do aluno.',
    corpo: `
    <div class="apps">
      <div class="app">${'<div class="app__topo">' + icone(CEL) + '<div><div class="app__nome">Aluno</div><div class="app__quem">no celular · o aluno e o responsável pelo Kids</div></div></div>'}
        ${lista(['Horários, turmas e avisos da academia', 'Check-in na aula e a própria presença', 'A própria graduação (faixa, cordão)', 'Pedir a aula experimental pelo WhatsApp', 'As próprias mensalidades, <b>se você quiser</b> (pergunta A2)'], 'lista--16')}</div>
      <div class="app">${'<div class="app__topo">' + icone(CEL) + '<div><div class="app__nome">Professor e recepção</div><div class="app__quem">no celular · a equipe</div></div></div>'}
        ${lista(['A aula do dia e a chamada', 'Presença e graduação dos alunos dele', 'Registrar quem quer fazer a aula experimental', '<b>Nunca vê valor:</b> nem mensalidade, nem atraso, nem salário', 'Aluno em atraso treina normal: quem decide é você'], 'lista--16')}</div>
      <div class="app app--admin">${'<div class="app__topo">' + icone(PC) + '<div><div class="app__nome">Admin (o seu)</div><div class="app__quem">no computador e no celular · só o dono</div></div></div>'}
        ${lista(['Todos os alunos, responsáveis e a equipe', 'Mensalidades, pagamentos e quem deve', 'Entradas, saídas, resultado e previsão', 'Comissão e salário de cada um', 'Relatórios, funil, lembretes e o histórico de tudo'], 'lista--16')}</div>
    </div>
    <div class="fios"><svg viewBox="0 0 1000 34" preserveAspectRatio="none"><path d="M166 0 V16 H834 V0 M500 16 V34" fill="none" stroke="#CFCFCF" stroke-width="2"/></svg></div>
    <div class="banco"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>
      <div><b>Um banco de dados, em São Paulo</b><div class="pequeno" style="color:#D6D6D6">Guardado no Brasil, trancado (criptografado), com cópia de segurança todo dia. A regra de quem vê o quê fica dentro dele, não só na tela.</div></div></div>
    <p class="legenda" style="text-align:center;margin-top:10px">O painel do dono sai do app da equipe e vem para o Admin. Se você também dá aula, entra no app do professor como professor.</p>` })

  // ───────────────────────────────────────────── 4. o problema
  const g5 = d.grade.slice(0, 5)
  add({ id: 'problema', olho: 'O problema', titulo: 'Hoje, a planilha. Amanhã, o painel.', exemplo: true,
    lide: 'A planilha guarda o que foi digitado. Ela não avisa quem esqueceu de pagar, não sabe quanto o mês ainda vai render e não mostra quem mudou um valor.',
    corpo: `<div class="antes-depois">
      <div class="lado-ad lado-ad--hoje">
        <h2>Hoje: a planilha</h2>
        <table class="xls"><tr><th></th><th>A</th><th>B</th><th>C</th><th>D</th></tr>
          <tr class="cab"><th>1</th><td>Data</td><td>Descrição</td><td>Entrada</td><td>Saída</td></tr>
          ${g5.map((l, i) => `<tr><th>${i + 2}</th><td>${l.data.slice(0, 5)}</td><td>${esc(l.tipo === 'Entrada' && l.pessoa ? `Mensalidade ${primeiro(l.pessoa)}` : l.descricao)}</td><td class="n">${l.tipo === 'Entrada' ? l.valor.replace('R$ ', '') : ''}</td><td class="n">${l.tipo === 'Saída' ? l.valor.replace('R$ ', '') : ''}</td></tr>`).join('')}
          <tr><th>7</th><td>…</td><td class="rabisco">quem falta pagar?</td><td></td><td></td></tr>
          <tr><th>8</th><td></td><td><b>TOTAL</b></td><td class="n rabisco">?</td><td class="n rabisco">?</td></tr></table>
        ${lista([`Cada uma das ${ger.mensalidades} mensalidades do mês é digitada à mão.`, 'Para saber quem deve, é preciso cruzar a lista de alunos com os pagamentos.', 'A comissão de cada professor sai na calculadora.', `No dia ${d.hojeBR.slice(0, 2)}, o caixa do mês parece no vermelho (<span style="white-space:nowrap">${out.resultadoTexto}</span>), e não dá para saber como o mês fecha.`, 'Se alguém apaga ou muda uma linha, ninguém fica sabendo.'], 'lista--16')}
      </div>
      <div class="seta-grande"><svg width="34" height="34" viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="#C42024" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <div class="lado-ad lado-ad--amanha">
        <h2>Amanhã: <em>o painel</em></h2>
        <div class="vem" style="margin-top:4px;font-size:16px;gap:12px 14px">
          <b>${ger.mensalidades}</b><span>mensalidades de outubro geradas sozinhas em 01/10, cada uma com o desconto certo.</span>
          <b>${p.inadimplentes.pessoas} pessoas</b><span>devem ${p.inadimplentesTexto} hoje: a lista sai pronta, do maior atraso para o menor.</span>
          <b>${d.professoresSetTotal}</b><span>é a soma do que os 4 professores ganharam em setembro, calculada pela regra de cada um.</span>
          <b>${p.previsaoTexto.resultadoPrevisto}</b><span>é como outubro deve fechar, se todos pagarem o que vence até o dia 31. O dia 15 no vermelho deixa de assustar.</span>
          <b>Tudo</b><span>o que alguém muda fica registrado: quem mudou, quando e de quanto para quanto.</span>
        </div>
        <p class="pequeno" style="color:#BDBDBD;margin-top:auto">Os números deste lado foram calculados pelo sistema com o exemplo de ${p.alunos.matriculados} alunos.</p>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 5. painel
  const barrasMini = ev.map((e) => {
    const h = Math.max(2, Math.round((Math.abs(e.resultado) / maxAbs) * 46))
    const atual = e.competencia === d.mes
    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">
      <div style="height:48px;width:100%;display:flex;align-items:flex-end;justify-content:center">${e.resultado >= 0 ? `<div style="width:70%;height:${h}px;background:${atual ? '#C42024' : '#9A9A9A'};border-radius:2px 2px 0 0"></div>` : ''}</div>
      <div style="height:14px;width:100%;display:flex;align-items:flex-start;justify-content:center">${e.resultado < 0 ? `<div style="width:70%;height:${Math.min(14, h)}px;background:#C42024;opacity:.55;border-radius:0 0 2px 2px"></div>` : ''}</div>
      <span style="font-size:13px;color:#6B6B6B">${e.nome.slice(0, 3)}</span></div>`
  }).join('')
  const hj = d.hojeLista
  add({ id: 'painel', olho: 'Parte 1 · Painel', titulo: 'A academia inteira numa tela', exemplo: true,
    lide: 'É a primeira coisa que abre. Cada número é um atalho: clicou, abre a lista que forma aquele número.',
    corpo: `${tela('painel', 'Painel <span>· outubro de 2026</span>', `
      <div style="display:grid;grid-template-columns:1fr 1.75fr 1fr;gap:10px;height:100%">
        <div style="display:flex;flex-direction:column;gap:10px">
          <div class="cx"><div class="cx__rot">Alunos matriculados <a>Ver</a></div><div class="kpi">${p.alunos.matriculados}</div>
            <div class="lin"><span>Trancados</span><b>${p.alunos.trancados}</b></div><div class="lin"><span>Novos em outubro</span><b>${p.alunos.novosNoMes}</b></div><div class="lin"><span>Crianças no Kids</span><b>${d.filtros.kids}</b></div><div class="lin"><span>Já saíram (no cadastro)</span><b>${p.alunos.inativos}</b></div></div>
          <div class="cx"><div class="cx__rot">Equipe <a>Ver</a></div><div class="kpi">${p.funcionarios.total} <small>pessoas</small></div>
            <div class="lin"><span>Professores</span><b>${p.funcionarios.porFuncao.professor}</b></div><div class="lin"><span>Recepção · limpeza</span><b>${p.funcionarios.porFuncao.recepcao} · ${p.funcionarios.porFuncao.limpeza}</b></div></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div class="cx"><div class="cx__rot">Outubro, até hoje (${d.hojeBR.slice(0, 5)})</div>
            <div style="display:grid;grid-template-columns:auto auto auto;justify-content:space-between;gap:14px;margin-top:4px">
              <div><div class="pequeno sec">Entrou</div><div class="kpi">${p.mesTexto.entradas}</div></div>
              <div><div class="pequeno sec">Saiu</div><div class="kpi">${p.mesTexto.saidas}</div></div>
              <div><div class="pequeno sec">Resultado até hoje</div><div class="kpi kpi--heroi">${neg(p.mesTexto.resultado)}</div></div>
            </div>
            <div class="frase" style="margin-top:8px">Previsto para 31/10: <b>${p.previsaoTexto.resultadoPrevisto}</b> <span class="sec">· ainda vão entrar ${p.previsaoTexto.aReceberNoMes} e sair ${p.previsaoTexto.aPagarNoMes}</span></div></div>
          <div class="cx" style="flex:1"><div class="cx__rot">Resultado dos últimos 12 meses <span class="sec" style="font-weight:400">setembro fechou em ${d.setembro.resultadoTexto}</span></div>
            <div class="barras" style="margin-top:8px">${barrasMini}</div></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div class="cx"><div class="cx__rot">Devendo <a>Ver lista</a></div><div class="kpi">${p.inadimplentes.pessoas} <small>pessoas</small></div><div class="pequeno sec">${p.inadimplentesTexto} em atraso</div></div>
          <div class="cx"><div class="cx__rot">Aula experimental em outubro</div>
            <div class="lin"><span>Chamaram no WhatsApp</span><b>${p.funil.contatos}</b></div><div class="lin"><span>Marcaram a aula</span><b>${p.funil.agendaram}</b></div><div class="lin"><span>Fizeram a aula</span><b>${p.funil.fizeramExperimental}</b></div><div class="lin"><span>Matricularam</span><b>${p.funil.matricularam}</b></div></div>
          <div class="cx" style="flex:1"><div class="cx__rot">Hoje</div>
            <div class="lin"><span class="neg">Atrasado: ${esc(hj.atrasados[0] ?? '')}</span></div>${hj.hoje.slice(0, 1).map((t) => `<div class="lin"><span>${esc(t)}</span></div>`).join('')}<div class="lin"><span class="sec">+ ${hj.hoje.length - 1} hoje · ${hj.emBreve.length} em breve · ${p.hoje.tarefasAtrasadas} tarefa atrasada</span></div></div>
        </div>
      </div>`, { altura: 428, dir: '<span class="chip" style="height:22px;background:#2C2C2C;border-color:#4A4A4A;color:#fff">Outubro 2026 ▾</span><span class="busca">Buscar…  /</span>', legenda: 'Feito para o computador; no celular, as três colunas viram uma.' })}
    <div class="duas" style="margin-top:6px;grid-template-columns:1fr 1fr 1.15fr;display:grid;gap:18px">
      ${bloco('O que você vê', ['Alunos matriculados, trancados e novos no mês', 'Entrou, saiu, resultado e previsão do mês', 'Quem deve, a aula experimental e os lembretes'])}
      ${bloco('O que você consegue fazer', ['Clicar num número e ver a lista por trás dele', 'Trocar o mês e comparar com o anterior', 'Gerar as mensalidades, se ainda não saíram'])}
      <div class="caixa caixa--atencao"><b class="rot">Negativo no dia 15?</b>Aluguel, salários e comissões saem no começo do mês; muitas mensalidades vencem depois. Por isso o painel mostra o que já aconteceu e como o mês deve fechar (${p.previsaoTexto.resultadoPrevisto}).</div>
    </div>` })

  // ───────────────────────────────────────────── 6. alunos
  const f = d.ficha
  add({ id: 'alunos', olho: 'Parte 2 · Pessoas', titulo: 'Alunos e responsáveis do Kids', exemplo: true,
    lide: 'Todo mundo que treina está aqui, mesmo quem nunca instalou o app. Criança entra com o responsável, que é quem paga e quem recebe a cobrança.',
    corpo: `${tela('alunos', 'Pessoas <span>› Alunos</span>', `
      <div style="display:grid;grid-template-columns:1.95fr 1fr;gap:10px;height:100%;min-height:0">
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0">
          <div class="bts"><span class="chip chip--on">Matriculados ${p.alunos.matriculados}</span><span class="chip">Trancados ${p.alunos.trancados}</span><span class="chip">Kids ${d.filtros.kids}</span><span class="chip">Devendo ${p.inadimplentes.pessoas}</span><span style="margin-left:auto" class="bts"><span class="bt">Exportar</span><span class="bt bt--p">+ Aluno</span></span></div>
          ${tabela([['Nome'], ['Plano'], ['Situação'], ['Responsável'], ['Em atraso', 'n']], d.alunosAmostra.map((a) => tr([[esc(a.nome)], [esc(a.planos)], [selo(a.situacao)], [esc(a.responsavel || '—')], [a.dias ? `<span class="neg">${a.atraso} (${a.dias} dias)</span>` : '—', 'n']], f.dependentes.some((x) => x.nome === a.nome) ? 'sel' : '')))}
          <p class="pequeno ter">${d.alunosAmostra.length} de ${d.alunosTotal} no cadastro · o resto da lista rola por dentro</p>
        </div>
        <div class="cx" style="display:flex;flex-direction:column;gap:6px;min-width:0">
          <div><div style="font-weight:700;font-size:16px">${esc(f.responsavel)}</div><div class="pequeno sec">Responsável · paga por 2 crianças · ${esc(f.telefone)}</div></div>
          ${f.dependentes.map((k) => `<div class="lin"><span><b style="font-variant-numeric:normal">${esc(k.nome)}</b><br><span class="sec">${esc(k.plano)} · vence dia ${k.dia}</span></span><span>${k.desconto ? `<span class="selo selo--preto">${esc(k.desconto)}</span>` : ''}</span></div>`).join('')}
          <div class="cx__rot" style="margin-top:4px">Cobranças</div>
          ${f.cobrancas.slice(0, 3).map((c) => `<div class="lin"><span>${c.mes} · ${esc(c.aluno)}</span><span>${c.valor} ${selo(c.situacao)}</span></div>`).join('')}
          <div class="bts" style="margin-top:auto"><span class="bt bt--p">Cobrar no WhatsApp</span><span class="bt">Marcar como paga</span><span class="bt">Anotar</span></div>
        </div>
      </div>`, { altura: 404, legenda: 'A ficha abre ao lado da lista. Os nomes são inventados.' })}
    ${verFazer(['Nome, plano, situação, responsável e quanto está em atraso', 'A ficha da pessoa: contato, matrículas, descontos, cobranças, notas e histórico', 'Presença e faixa em números ("12 aulas no mês · faixa azul"), vindos do app do professor'],
      ['Cadastrar aluno, criança com responsável, e matricular num plano com o dia de vencimento', 'Trancar por um período (viagem, lesão): no trancamento não sai cobrança', `Dar desconto de família, de atleta ou de indicação. O sistema <b>sugere</b> o de família quando o mesmo responsável paga duas matrículas; quem aplica é você`])}` })

  // ───────────────────────────────────────────── 7. funcionários
  const fab = d.remuneracoesSet.find((r) => r.tipo === 'fixo_mais_comissao')
  add({ id: 'funcionarios', olho: 'Parte 2 · Pessoas', titulo: 'A equipe e o pagamento dela', exemplo: true,
    lide: 'Cada pessoa da equipe tem a função, as modalidades que dá e a regra de pagamento. No começo do mês, o Admin calcula quanto cada um ganhou no mês anterior.',
    corpo: `<div class="lado lado--largo" style="grid-template-columns:minmax(0,1fr) 84mm;height:auto">
      ${tela('funcionarios', 'Pessoas <span>› Funcionários</span>', `
        <div class="bts"><span class="chip chip--on">Todos ${d.equipe.length}</span><span class="chip">Professores ${p.funcionarios.porFuncao.professor}</span><span class="chip">Recepção</span><span class="chip">Limpeza</span><span style="margin-left:auto" class="bt bt--p">+ Funcionário</span></div>
        ${tabela([['Nome'], ['Função'], ['Modalidades'], ['Como ganha'], ['Setembro', 'n']], d.equipe.map((e) => tr([[esc(e.nome)], [e.funcao], [esc(e.modalidades)], [esc(e.regra)], [`<b>${e.setembro}</b>`, 'n']], e.nome === fab.nome ? 'sel' : '')),
          { rodape: `<tfoot><tr><td colspan="4">Toda a equipe em setembro</td><td class="n">${d.folhaSet}</td></tr></tfoot>` })}
        <div class="folha" style="margin-top:auto">
          <h4>${esc(fab.nome)} · setembro</h4>
          <div class="lin"><span>Fixo</span><b>${fab.fixoTexto}</b></div>
          <div class="lin"><span>25 % de ${fab.baseTexto} (o que entrou de Jiu-Jitsu e Luta Livre)</span><b>${fab.comissaoTexto}</b></div>
          <div class="lin"><span><b>Total</b></span><b>${fab.totalTexto}</b></div>
          <div class="bts" style="margin-top:6px"><span class="bt bt--p">Lançar como saída</span><span class="bt">Ajustar antes</span></div>
        </div>`, { altura: 520, legenda: 'Nomes inventados. As regras de pagamento também são de exemplo.' })}
      <div class="pilha">
        ${bloco('O que você vê', ['Quem é da equipe, a função e desde quando', 'A regra de cada um: fixo, comissão, por aula ou fixo + comissão', 'Quanto cada um ganhou no mês, já calculado'])}
        ${bloco('O que você consegue fazer', ['Cadastrar, mudar a regra e desligar alguém', 'Conferir a conta e lançar como saída com um clique (ou ajustar antes: o Admin calcula, quem paga é você)', 'Manter no cadastro quem não usa o app'])}
        <div class="caixa"><b class="rot">Comissão justa no combo</b>O aluno do combo Muay Thai + Jiu-Jitsu conta metade para cada professor. O plano Jiu-Jitsu / Luta Livre também se divide entre as duas.</div>
        <div class="caixa caixa--vermelha"><b class="rot">A decidir</b>Como a equipe é paga hoje (pergunta A19). O Admin calcula; não faz folha de pagamento nem recolhe imposto.</div>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 8. a grade
  add({ id: 'grade', olho: 'Parte 3 · Financeiro', titulo: 'A planilha, agora dentro do app', exemplo: true,
    lide: 'Cada entrada e cada saída é uma linha, como no Excel: data, descrição, categoria, valor, forma de pagamento, pessoa e se já foi pago. Você edita direto na célula.',
    corpo: `${tela('lancamentos', 'Financeiro <span>› Lançamentos</span>', `
      <div class="bts"><span class="chip chip--on">Outubro 2026 ▾</span><span class="chip">Entradas e saídas</span><span class="chip">Todas as categorias</span><span class="chip">Pago e pendente</span>
        <span style="margin-left:auto" class="bts"><span class="bt">Desfazer</span><span class="bt">Colar do Excel</span><span class="bt">Exportar</span><span class="bt bt--p">+ Linha</span></span></div>
      ${tabela([['Data'], ['Descrição'], ['Categoria'], ['Valor', 'n'], ['Forma'], ['Pessoa'], ['Situação']],
        [...d.grade.slice(0, 6), ...d.grade.filter((l) => l.situacao === 'Pendente').slice(0, 2)].map((l, i) => tr([[l.data.slice(0, 5)], [esc(descr(l.descricao))], [esc(l.categoria.replace(/ \(.*\)$/, ''))], [l.tipo === 'Saída' ? `<span class="neg">−${l.valor}</span>` : l.valor, `n${i === 2 ? ' editando' : ''}`], [l.forma], [esc(l.pessoa) || '—'], [l.situacao === 'Pago' ? selo('Paga').replace('Paga', 'Pago') : `<span class="selo selo--atencao">Pendente${l.estimado ? ' · estimado' : ''}</span>`]], l.situacao === 'Pendente' ? 'pend' : '')),
        { rodape: `<tfoot><tr><td colspan="3">Outubro · ${out.quantidade} linhas</td><td class="n" colspan="4" style="text-align:left">Entrou <b>${out.entradasTexto}</b> · Saiu <b>${out.saidasTexto}</b> · Resultado ${neg(out.resultadoTexto)} · A pagar ${out.saidasPendentesTexto}</td></tr></tfoot>` })}`, { altura: 378, legenda: 'A linha de totais fica parada embaixo, e a lista rola por dentro. A célula com a borda vermelha está sendo editada.' })}
    ${verFazer(['As linhas do mês, com os totais sempre à vista: entrou, saiu, resultado e o que falta pagar', 'As mensalidades pagas entram sozinhas na grade, com a pessoa e a forma de pagamento', 'Os filtros em cima: mês, tipo, categoria, modalidade, forma, pessoa e situação'],
      ['Lançar uma linha nova e editar qualquer célula pelo teclado (Enter, Tab, setas)', 'Selecionar várias linhas e trocar a categoria ou a situação de uma vez', '"Apagar" é arquivar: a linha sai da conta, mas não some do histórico'])}` })

  // ───────────────────────────────────────────── 9. escrever, colar, desfazer
  const col = d.colado
  add({ id: 'colar', olho: 'Parte 3 · Financeiro', titulo: 'Escrever como se fala, colar do Excel, desfazer', exemplo: true,
    lide: 'A grade entende o jeito como a gente escreve dinheiro e data, aceita linhas copiadas do Excel e desfaz o que você fez. Nada entra errado: célula com erro não grava.',
    corpo: `<div class="tres" style="grid-template-columns:1fr 1.25fr 1fr;gap:20px">
      <div class="pilha">${bloco('Você digita, o app entende', `<table class="tabela-16" style="margin-top:4px"><thead><tr><th>Você digita</th><th>Fica</th></tr></thead><tbody>${d.edicoes.map((e) => `<tr><td><code style="font:600 16px var(--mono)">${esc(e.digitou)}</code></td><td>${e.vira.startsWith('não grava') ? `<span class="neg">${esc(e.vira)}</span>` : esc(e.vira)}</td></tr>`).join('')}</tbody></table>`)}
        <p class="pequeno sec">E também: o começo do nome da pessoa ou da categoria, quando só um bate; "pix", "crédito", "débito".</p></div>
      <div class="pilha">${bloco('Colar várias linhas do Excel', `<p class="pequeno sec" style="margin-bottom:8px">Copie as linhas no Excel e cole na grade (Ctrl+V). Antes de entrar, o Admin mostra a prévia:</p>`)}
        ${tela('colar', 'Colar <span>· prévia</span>', `
          <div class="frase"><b>${col.length} linhas coladas</b> · ${col.filter((c) => c.ok).length} prontas · <span class="neg">${col.filter((c) => !c.ok).length} com erro</span></div>
          ${tabela([['Linha'], ['Descrição'], ['Valor', 'n']], col.map((c, i) => tr([[String(i + 1)], [c.ok ? esc(c.descricao) : `<span class="neg">Data que não existe (31/09)</span>`], [c.ok ? (c.tipo === 'saida' ? `<span class="neg">−${c.valor}</span>` : c.valor) : '—', `n${c.ok ? '' : ' erro'}`]])))}
          <div class="bts" style="margin-top:auto"><span class="bt bt--p">Gravar ${col.filter((c) => c.ok).length} linhas</span><span class="bt">Corrigir a linha ${col.findIndex((c) => !c.ok) + 1}</span></div>`, { altura: 300 })}</div>
      <div class="pilha">${bloco('Desfazer e refazer', ['Ctrl+Z desfaz, Ctrl+Y refaz, até as últimas 100 ações', `Colar ${col.length} linhas conta como uma ação só: um Ctrl+Z tira as ${col.filter((c) => c.ok).length}`, 'O desfazer também fica no histórico'], 'lista--16')}
        ${bloco('Errar sem medo', ['Data que não existe, valor ilegível ou categoria de entrada numa saída: a célula fica vermelha e nada é gravado', 'Mês fechado não muda sem reabrir, e reabrir pede o motivo'], 'lista--16')}</div>
    </div>` })

  // ───────────────────────────────────────────── 10. mensalidades
  const amostra = cs.amostra
  add({ id: 'mensalidades', olho: 'Parte 3 · Financeiro', titulo: 'A mensalidade se gera sozinha', exemplo: true,
    lide: 'No dia 1, o Admin olha cada matrícula e cria a cobrança do mês, com o desconto e o dia de vencimento de cada aluno. Quando alguém paga, você marca, e a entrada aparece na grade.',
    corpo: `${tela('cobrancas', 'Financeiro <span>› Cobranças de outubro</span>', `
      <div class="frase"><b>${ger.novas} cobranças geradas em 01/10</b> (${ger.mensalidades} mensalidades e ${ger.taxas} taxas de matrícula) · ${d.geracaoOutTexto} · <span class="sec">${deFora} de fora: ${pul.nao_e_mes_de_cobranca ?? 0} trimestrais, ${pul.trancada ?? 0} trancadas, ${pul.isenta ?? 0} bolsista</span></div>
      <div class="abas"><span class="aba aba--on">Atrasadas <b>${cs.contaSit.atrasada}</b> · ${cs.somaSit.atrasada}</span><span class="aba">Vence hoje <b>${cs.contaSit.vence_hoje}</b> · ${cs.somaSit.vence_hoje}</span><span class="aba">A vencer <b>${cs.contaSit.a_vencer}</b> · ${cs.somaSit.a_vencer}</span><span class="aba">Pagas <b>${cs.contaSit.paga}</b> · ${cs.somaSit.paga}</span></div>
      <div style="display:grid;grid-template-columns:1fr 236px;gap:10px;min-height:0">
        ${tabela([['Quem paga'], ['Aluno'], ['Plano'], ['Vence'], ['Valor', 'n'], ['Situação']], amostra.slice(0, 7).map((c, i) => tr([[esc(c.nome)], [esc(c.aluno ?? '—')], [esc(c.plano) + (c.desconto !== '—' ? ` <span class="sec">· −${esc(c.desconto.replace('R$ ', 'R$ '))}</span>` : '')], [c.vencimento.slice(0, 5)], [c.valor, 'n'], [selo(c.situacao)]], i === 2 ? 'sel' : '')))}
        <div class="folha"><h4>Marcar como paga</h4><div class="pequeno sec">${esc(amostra[2].nome)} · ${esc(amostra[2].plano)}</div>
          <div class="campo"><span>Data</span><i>${d.hojeBR}</i></div><div class="campo"><span>Forma</span><i>Pix ▾</i></div><div class="campo"><span>Valor</span><i>${amostra[2].valor}</i></div>
          <div class="bts" style="margin-top:8px"><span class="bt bt--p">Confirmar</span><span class="bt">Cancelar</span></div>
          </div>
      </div>`, { altura: 372, legenda: 'As abas contam só as cobranças de outubro; a lista de quem deve junta todos os meses. Regra do primeiro mês do exemplo: mês cheio.' })}
    ${verFazer([`Cada cobrança com a situação calculada: a vencer, vence hoje, atrasada ou paga`, `No Kids, a cobrança vai para o responsável e mostra a criança (desconto de família de 10 % no segundo filho, no exemplo)`, `No combo, o valor já vem dividido entre as modalidades (${cs.combo ? cs.combo.partes.join(' + ') : ''})`],
      ['Gerar o mês no botão, ou deixar no automático do dia 1 (gerar duas vezes não duplica nada)', 'Marcar como paga com a data e a forma, e desfazer se marcou errado', 'Criar cobrança avulsa: exame de faixa, inscrição em evento, venda de luva ou kimono'])}` })

  // ───────────────────────────────────────────── 11. despesa fixa e fechar o mês
  const fechados = d.fechamentos.slice(-4)
  const pend = d.pendenciasOut
  const ROT_PEND = { mes_nao_terminou: 'O mês ainda não terminou', lancamento_pendente: 'linhas ainda não pagas', sem_categoria: 'linhas sem categoria', cobranca_em_aberto: 'cobranças em aberto' }
  add({ id: 'fechar', olho: 'Parte 3 · Financeiro', titulo: 'Despesa fixa sozinha, mês fechado com foto', exemplo: true,
    lide: 'Aluguel, salários, luz e internet viram linhas a pagar todo mês, sem ninguém lembrar. E, quando o mês acaba, você fecha: os números ficam guardados e ninguém muda sem reabrir.',
    corpo: `<div class="duas" style="grid-template-columns:1fr 1fr;gap:16px">
      <div>${tela('despesas-fixas', 'Financeiro <span>› Despesas fixas</span>', `
        <div class="frase">Em 01/11 entram sozinhas como <b>a pagar</b>: ${d.despesasNovembro.length} linhas · ${d.despesasNovembroTotal}</div>
        ${tabela([['Despesa'], ['Dia'], ['Valor', 'n']], d.despesasNovembro.map((x) => tr([[esc(x.descricao) + (x.estimado ? ' <span class="selo selo--atencao">estimado</span>' : '')], [x.dia.slice(0, 2)], [x.valor, 'n']])))}
        <p class="pequeno ter">Luz e água variam: entram pela média dos últimos 3 meses, marcadas "estimado" até você lançar o valor da conta.</p>`, { altura: 420 })}
        <div style="margin-top:10px">${bloco('O que você consegue fazer', ['Cadastrar uma despesa fixa uma vez e esquecer', 'Transformar a despesa num lembrete ("vence o aluguel dia 10")', 'Encerrar a despesa quando ela acabar'])}</div></div>
      <div>${tela('fechamento', 'Financeiro <span>› Fechamento</span>', `
        ${tabela([['Mês'], ['Fechado em'], ['Entrou', 'n'], ['Saiu', 'n'], ['Resultado', 'n']], fechados.map((m) => tr([[m.mes], [m.em.slice(0, 5)], [m.entradas, 'n'], [m.saidas, 'n'], [`<b>${m.resultado}</b>`, 'n']])))}
        <div class="folha" style="margin-top:auto"><h4>Fechar outubro?</h4><p class="pequeno sec" style="margin-bottom:4px">Antes de fechar, o Admin mostra o que está pendurado:</p>
          ${pend.map((x) => `<div class="lin"><span>${x.tipo === 'mes_nao_terminou' ? ROT_PEND[x.tipo] : `${x.quantidade} ${ROT_PEND[x.tipo]}`}</span><b>${x.tipo === 'mes_nao_terminou' ? '' : x.texto}</b></div>`).join('')}
          <div class="bts" style="margin-top:8px"><span class="bt">Voltar e resolver</span><span class="bt bt--esc">Fechar assim</span></div></div>`, { altura: 420 })}
        <div style="margin-top:10px">${bloco('O que você consegue fazer', [`Fechar o mês: a foto fica guardada (setembro: entrou ${d.setembro.entradasTexto}, saiu ${d.setembro.saidasTexto})`, 'Mandar ao contador e ter certeza de que aquele número não muda', 'Reabrir, se precisar: pede o motivo e fica no histórico'])}</div></div>
    </div>` })

  // ───────────────────────────────────────────── 12. inadimplência
  const e = d.encargos
  add({ id: 'inadimplencia', olho: 'Parte 4 · Cobrança', titulo: 'Quem deve, quanto e há quantos dias', exemplo: true,
    lide: 'A lista de quem está devendo sai pronta, do maior atraso para o menor. Cobrar é um clique: abre a conversa no WhatsApp com a mensagem escrita.',
    corpo: `<div class="lado lado--largo" style="grid-template-columns:minmax(0,1fr) 78mm;height:auto">
      ${tela('inadimplencia', 'Financeiro <span>› Quem deve</span>', `
        <div class="frase"><b>${p.inadimplentes.pessoas} pessoas devem ${p.inadimplentesTexto}</b> · ${d.maisDe30} há mais de 30 dias (${d.maisDe30Texto}) <span class="bts" style="float:right"><span class="chip">há mais de 30 dias</span><span class="chip chip--on">todos</span></span></div>
        ${tabela([['Quem paga'], ['Plano'], ['Dias', 'n'], ['Em atraso', 'n'], ['']], inad.slice(0, 11).map((i, k) => tr([[esc(i.nome) + (i.alunos.length ? `<span class="sec"> · ${i.alunos.map(primeiro).join(' e ')}</span>` : '')], [esc(i.planos.join(' + '))], [`<b class="${i.dias > 30 ? 'neg' : ''}">${i.dias}</b>`, 'n'], [i.total, 'n'], ['<span class="bt" style="height:22px">WhatsApp</span>']], k === 3 ? 'sel' : '')))}
        <p class="pequeno ter">+ ${inad.length - 11} pessoas com 1 a 5 dias de atraso</p>`, { altura: 500, legenda: 'Em cada linha: cobrar no WhatsApp, lembrar de cobrar, anotar o combinado ou marcar como paga.' })}
      <div class="pilha">
        <div class="whats"><div class="whats__topo"><i></i>${esc(primeiro(inad[3].nome))} · WhatsApp</div><div class="balao">${esc(d.whats)}</div></div>
        <p class="pequeno sec">A mensagem sai pronta, sem nenhum dado de saúde. Quem envia é você: o Admin não manda nada sozinho.</p>
        ${bloco('Para não perder o controle', [`Setembro: de ${d.taxaSet.vencido} que venceram, ${d.taxaSet.atraso} ainda estão em atraso (${d.taxaSet.texto})`, 'Atraso não bloqueia o treino nem aparece para o professor', 'Lembrete "Cobrar fulano" e nota "combinou pagar dia 20" num clique'])}
        <div class="caixa caixa--vermelha"><b class="rot">Se vocês decidirem cobrar multa e juros</b>Pergunta A3. Com 2 % de multa e 1 % ao mês (o limite da lei) e 5 dias de tolerância, uma mensalidade de ${e.valor} vencida em ${e.vencimento.slice(0, 5)} e paga hoje, ${e.dias} dias depois, fica em <b>${e.total}</b> (multa ${e.multa}, juros ${e.juros}). Valor acima do limite o sistema recusa.</div>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 13. importar
  const linhasErro = imp.erros
  add({ id: 'importar', olho: 'Parte 5 · Importar e exportar', titulo: 'A planilha de vocês entra no Admin', exemplo: true,
    lide: 'Ninguém começa do zero. Você manda o arquivo (Excel ou CSV), confere como cada coluna foi lida e só então grava. Se entrou errado, desfaz a importação inteira.',
    corpo: `${tela('importar', 'Financeiro <span>› Importar</span>', `
      <div style="display:grid;grid-template-columns:1fr 1.15fr;gap:10px;height:100%;min-height:0">
        <div class="cx" style="display:flex;flex-direction:column;gap:6px">
          <div class="cx__rot">1. As colunas que o Admin achou <span class="sec" style="font-weight:400">planilha-setembro.csv</span></div>
          ${tabela([['Na planilha'], ['Vira'], ['Exemplo']], imp.colunas.map((c) => tr([[`<b>${esc(c.cabecalho)}</b>`], [`${ROT_PAPEL[c.papel] ?? c.papel} ▾`], [`<span class="sec">${esc(c.exemplo)}</span>`]])))}
          <p class="pequeno ter">Achou o cabeçalho embaixo do título da planilha. Coluna lida errado? Troque no ▾.</p>
        </div>
        <div class="cx" style="display:flex;flex-direction:column;gap:6px">
          <div class="cx__rot">2. A prévia, antes de gravar</div>
          <div class="quatro" style="gap:6px;grid-template-columns:repeat(4,1fr)">
            <div class="cx" style="text-align:center"><div class="kpi">${imp.resumo.lidas}</div><div class="pequeno sec">lidas</div></div>
            <div class="cx" style="text-align:center"><div class="kpi pos">${imp.resumo.prontas}</div><div class="pequeno sec">prontas</div></div>
            <div class="cx" style="text-align:center"><div class="kpi">${imp.resumo.repetidas}</div><div class="pequeno sec">repetidas</div></div>
            <div class="cx" style="text-align:center"><div class="kpi neg">${imp.resumo.comErro}</div><div class="pequeno sec">com erro</div></div>
          </div>
          ${linhasErro.map((l) => `<div class="frase" style="border-left-color:#B3261E">Linha ${l.numero}: ${esc(l.erros[0].replace(/\.$/, ''))}${/31\/09/.test(l.erros[0]) ? ' (setembro tem 30 dias)' : ' ("a combinar")'}</div>`).join('')}
          ${imp.categoriasNovas.length ? `<div class="frase">Criar a categoria <b>${esc(imp.categoriasNovas[0].nome)}</b> (entrada)? <span class="bt" style="height:22px">Criar</span> <span class="bt" style="height:22px">Usar "Venda de produtos"</span></div>` : ''}
          <div class="bts" style="margin-top:auto"><span class="bt bt--p">Gravar ${imp.resumo.prontas} linhas</span><span class="bt">Corrigir as ${imp.resumo.comErro} no arquivo</span></div>
        </div>
      </div>`, { altura: 330, legenda: 'Exemplo com uma planilha no formato mais comum: título, cabeçalho, entrada e saída em colunas separadas e a linha de TOTAL.' })}
    ${verFazer(['Como cada coluna da sua planilha foi entendida, com o exemplo da primeira linha', 'Quantas linhas estão prontas, quais já existem e quais têm erro, com o número da linha no arquivo', 'As categorias da planilha que ainda não existem no Admin'],
      ['Trocar o que cada coluna quer dizer antes de gravar', 'Gravar só quando estiver certo: antes disso, nada entra', 'Desfazer a importação inteira depois, sem apagar linha por linha'],
      `<div class="caixa caixa--vermelha" style="margin-top:10px"><b class="rot">O que falta para ficar perfeito</b>A planilha que vocês usam hoje (pergunta A13). Pode ser de um mês só, ou até uma foto. Com ela, o teste passa a usar o arquivo real e a tela já vem com as colunas certas.</div>`)}` })

  // ───────────────────────────────────────────── 14. exportar
  const csv = d.exportado.map((l) => l.split(';')).map((l) => [...l.slice(0, 8), l[9]])
  add({ id: 'exportar', olho: 'Parte 5 · Importar e exportar', titulo: 'Tudo sai para o Excel quando você quiser', exemplo: true,
    lide: 'Qualquer lista do Admin vira um arquivo que abre direto no Excel, com acento certo e valor como número. É o que você leva ao contador.',
    corpo: `${tela('exportar', 'Excel <span>· lancamentos-outubro.csv</span>', `
      <table class="xls"><tr><th></th>${csv[0].map((_, i) => `<th>${String.fromCharCode(65 + i)}</th>`).join('')}</tr>
        ${csv.map((l, i) => `<tr class="${i ? '' : 'cab'}"><th>${i + 1}</th>${l.map((c, j) => `<td class="${i && (j === 4 || j === 5) ? 'n' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('')}
        <tr><th>${csv.length + 1}</th><td colspan="5" class="n" style="color:#6B6B6B">=SOMA(F2:F${csv.length}) dá o resultado direto →</td><td class="n"><b>${csv.slice(1).reduce((s, l) => s + Number(l[5].replace(/\./g, '').replace(',', '.')), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></td><td colspan="3"></td></tr>
      </table>`, { altura: 300, dir: '<span class="busca">Abriu no Excel, sem ajuste</span>', legenda: 'Linhas de outubro do exemplo, exatamente como o Admin gera o arquivo. A descrição da mensalidade ("— 2026-10") ainda vai ganhar o nome do mês.' })}
    <div class="tres" style="margin-top:14px">
      ${bloco('O que sai', ['A grade de lançamentos, do jeito que estiver filtrada', 'A lista de alunos, de devedores ou de qualquer filtro', 'Os relatórios do mês e do ano'], '', 'lista--16')}
      ${bloco('Como sai', ['Acentos certos e vírgula nos centavos', '"Valor" sempre positivo, com o tipo ao lado, e "Valor (±)" com a saída negativa: a SOMA da coluna dá o resultado', 'Protegido contra fórmula escondida em texto, um golpe conhecido em planilha'], '', 'lista--16')}
      ${bloco('E depois', ['O arquivo que sai volta igual pela importação (isso é testado)', 'Arquivo .xlsx nativo fica para depois, com uma biblioteca que passe pela revisão de segurança'], '', 'lista--16')}
    </div>` })

  // ───────────────────────────────────────────── 15. relatórios: o ano
  const maxV = Math.max(...ev.map((e) => Math.max(e.entradas, e.saidas)))
  const W = 940, H = 196, pad = 30, bw = (W - pad) / ev.length
  const svgAno = `<svg viewBox="0 0 ${W} ${H + 46}" width="100%" style="display:block">
    ${[0, 0.25, 0.5, 0.75, 1].map((t) => `<line x1="${pad}" x2="${W}" y1="${H - t * (H - 10)}" y2="${H - t * (H - 10)}" stroke="#E2E2E2"/><text x="${pad - 6}" y="${H - t * (H - 10) + 4}" font-size="13" text-anchor="end" fill="#6B6B6B">${Math.round((maxV * t) / 100000)}</text>`).join('')}
    ${ev.map((e, i) => { const x0 = pad + i * bw; const he = (e.entradas / maxV) * (H - 10); const hs = (e.saidas / maxV) * (H - 10); const atual = e.competencia === '2026-09'
      return `<rect x="${x0 + bw * 0.14}" y="${H - he}" width="${bw * 0.34}" height="${he}" fill="${atual ? '#C42024' : '#3A3A3A'}"/><rect x="${x0 + bw * 0.5}" y="${H - hs}" width="${bw * 0.34}" height="${hs}" fill="#BDBDBD"/>
        <text x="${x0 + bw / 2}" y="${H + 17}" font-size="13" text-anchor="middle" fill="#545454">${e.nome}</text>
        <text x="${x0 + bw / 2}" y="${H + 36}" font-size="13" text-anchor="middle" font-weight="700" fill="${e.resultado < 0 ? '#B3261E' : '#1C1C1C'}">${e.resultadoTexto.replace('R$ ', '').replace(/,\d\d$/, '')}</text>` }).join('')}
  </svg>`
  const melhor = [...ev].filter((e) => e.competencia !== d.mes).sort((a, b) => b.resultado - a.resultado)[0]
  const pior = [...ev].filter((e) => e.competencia !== d.mes).sort((a, b) => a.resultado - b.resultado)[0]
  add({ id: 'relatorio-ano', olho: 'Parte 6 · Relatórios', titulo: 'O ano inteiro num gráfico', exemplo: true,
    lide: 'Quanto entrou e quanto saiu em cada mês, e o resultado embaixo. Barras escuras são as entradas, as claras são as saídas; o vermelho marca o mês escolhido.',
    corpo: `${tela('relatorio-ano', 'Relatórios <span>› Ano</span>', `
      <div class="abas"><span class="aba">Mês</span><span class="aba aba--on">Ano</span><span class="aba">Categoria</span><span class="aba">Modalidade</span><span class="aba">Forma</span><span class="aba">Professor</span><span class="aba">Evento</span><span class="aba">Inadimplência</span><span class="aba">Funil</span><span style="margin-left:auto" class="bt">Exportar</span></div>
      <div class="cx" style="flex:1"><div class="cx__rot">Entradas e saídas, em mil reais · resultado do mês embaixo, em reais</div>${svgAno}</div>`, { altura: 384, legenda: 'Outubro aparece até o dia 15: o mês ainda não acabou.' })}
    <div class="tres" style="margin-top:12px">
      ${bloco('O que o exemplo mostra', [`O melhor mês foi ${melhor.nome} (${melhor.resultadoTexto}); o pior, ${pior.nome} (${pior.resultadoTexto}), quando entrou o tatame novo`, `Em janeiro e fevereiro entra menos: férias de verão`])}
      ${bloco('O que você vê', ['Cada mês com entrou, saiu e o resultado', 'Clicando num mês, as categorias daquele mês'])}
      ${bloco('Os relatórios', ['Mês, ano, categoria, modalidade, forma de pagamento, professor, evento, inadimplência e funil', 'Todo relatório escolhe o período e sai para o Excel'])}
    </div>` })

  // ───────────────────────────────────────────── 16. relatórios: modalidade, professor, evento
  const mS = d.porModalidadeSet, mT = d.porModalidadeTri
  const hb = (linhas, max, destaque) => linhas.map((l) => `<div class="hbar ${l.nome === destaque ? 'hbar--destaque' : ''}"><span>${esc(l.nome)}</span><div class="hbar__trilho"><div class="hbar__valor" style="width:${Math.round((l.centavos / max) * 100)}%"></div></div><span class="v">${l.texto}</span></div>`).join('')
  add({ id: 'relatorio-modalidade', olho: 'Parte 6 · Relatórios', titulo: 'Onde está o dinheiro', exemplo: true,
    lide: 'Qual modalidade paga o aluguel, quanto cada professor recebeu e se o evento compensou. No combo e no plano Jiu-Jitsu / Luta Livre, cada modalidade conta a sua parte.',
    corpo: `<div class="duas" style="grid-template-columns:1.1fr 1fr;gap:18px">
      <div>${tela('relatorio-modalidade', 'Relatórios <span>› Modalidade</span>', `
        <div class="cx"><div class="cx__rot">Setembro · entrou ${mS.total.texto}</div>${hb(mS.linhas, mS.linhas[0].centavos, 'Muay Thai')}
          <div class="hbar"><span class="sec">Fora de aula</span><div class="hbar__trilho"><div class="hbar__valor" style="width:${Math.round((mS.semModalidade.centavos / mS.linhas[0].centavos) * 100)}%;background:#D6D6D6"></div></div><span class="v sec">${mS.semModalidade.texto}</span></div></div>
        <div class="cx"><div class="cx__rot">Julho a setembro · entrou ${mT.total.texto}</div>${hb(mT.linhas, mT.linhas[0].centavos, 'Muay Thai')}</div>`, { altura: 470 })}
        <p class="legenda">"Fora de aula" é o que não é mensalidade de modalidade: venda de luva, bandagem, kimono, aula particular.</p></div>
      <div class="pilha">
        ${bloco('Por professor · setembro', `<table><thead><tr><th>Professor</th><th>Regra</th><th class="n">Recebeu</th></tr></thead><tbody>${d.remuneracoesSet.map((r) => `<tr><td>${esc(r.nome)}</td><td class="sec">${r.tipo === 'por_aula' ? `${r.aulas} aulas` : r.tipo === 'comissao' ? `comissão sobre ${r.baseTexto}` : `fixo + comissão sobre ${r.baseTexto}`}</td><td class="n"><b>${r.totalTexto}</b></td></tr>`).join('')}</tbody></table>`)}
        ${bloco('Por evento', `<table><thead><tr><th>Evento</th><th class="n">Entrou</th><th class="n">Saiu</th><th class="n">Resultado</th></tr></thead><tbody>${d.eventos.map((x) => `<tr><td>${esc(x.nome)}</td><td class="n">${x.entradasTexto}</td><td class="n">${x.saidasTexto}</td><td class="n"><b>${neg(x.resultadoTexto)}</b></td></tr>`).join('')}</tbody></table>`)}
        ${bloco('Por forma de pagamento · setembro', `<p class="pequeno">${d.porFormaSet.map((x) => `${{ pix: 'Pix', dinheiro: 'Dinheiro', cartao_debito: 'Débito', cartao_credito: 'Crédito' }[x.id] ?? x.id} <b>${x.texto}</b>`).join(' · ')}</p>`)}
      </div>
    </div>` })

  // ───────────────────────────────────────────── 17. filtro total
  const fz = d.filtros
  const perguntaResposta = [
    ['Alunos de Muay Thai com mais de 30 dias de atraso', `<b>${fz.mt30.n} pessoas · ${fz.mt30.total}</b><br><span class="sec">${fz.mt30.nomes.map((n) => `${esc(n.nome)}, ${n.dias} dias, ${n.total}`).join('; ')}</span>`],
    ['Quanto entrou do Jiu-Jitsu no trimestre (julho a setembro)', `<b>${fz.jjTri}</b><br><span class="sec">o combo e o plano Jiu-Jitsu / Luta Livre contam só a parte do Jiu-Jitsu</span>`],
    ['E do Boxe, no mesmo trimestre?', `<b>${fz.boxeTri}</b>`],
    ['Quantas crianças estão matriculadas no Kids', `<b>${fz.kids} crianças</b>`],
    ['Quanto gastei com equipamento este ano', `<b>${fz.equipAno.total}</b> <span class="sec">em ${fz.equipAno.n} compras</span>`],
    ['Quantos alunos tem cada modalidade', `<span class="sec">${fz.alunosPorModalidade.map((m) => `${m.nome} <b style="color:#1C1C1C">${m.n}</b>`).join(' · ')}</span><br><span class="sec">quem faz duas modalidades conta nas duas</span>`],
  ]
  add({ id: 'filtro', olho: 'Parte 7 · Filtro total', titulo: 'Pergunte, e o Admin responde', exemplo: true,
    lide: 'Os filtros se cruzam: modalidade, plano, situação, atraso, período, categoria, professor, forma de pagamento. A pergunta aparece escrita em cima da resposta, e o filtro pode ser salvo com um nome.',
    corpo: `<div class="duas" style="grid-template-columns:1.05fr 1fr;gap:18px">
      <div>${tela('filtro', 'Pessoas <span>› Alunos › filtro</span>', `
        <div class="bts"><span class="chip chip--on">Muay Thai ✕</span><span class="chip chip--on">Em atraso há mais de 30 dias ✕</span><span class="chip">+ Filtro</span></div>
        <div class="frase">Alunos · Muay Thai · em atraso há mais de 30 dias · <b>${fz.mt30.n} pessoas · ${fz.mt30.total}</b></div>
        ${tabela([['Nome'], ['Dias', 'n'], ['Em atraso', 'n']], fz.mt30.nomes.map((n) => tr([[esc(n.nome)], [`<b class="neg">${n.dias}</b>`, 'n'], [n.total, 'n']])))}
        <div class="bts"><span class="bt bt--p">Salvar este filtro</span><span class="bt">Exportar</span><span class="bt">Cobrar os ${fz.mt30.n}</span></div>
        <div class="cx" style="margin-top:auto"><div class="cx__rot">Filtros salvos</div><div class="bts" style="margin-top:6px"><span class="chip">Devendo há mais de 30 dias</span><span class="chip">Novos do mês</span><span class="chip">Kids</span><span class="chip">Trancados</span></div></div>`, { altura: 384 })}</div>
      <div>
        <table class="tabela-16"><thead><tr><th style="width:44%">Você pergunta</th><th>O Admin responde</th></tr></thead><tbody>
          ${perguntaResposta.map(([q, r]) => `<tr><td><b>${esc(q)}</b></td><td style="font-size:13px">${r}</td></tr>`).join('')}
        </tbody></table>
        <p class="legenda">Todas as respostas foram calculadas pelo sistema com os dados de exemplo.</p>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 18. funil
  const fo = d.funilOut.total, f3 = d.funil3
  const etapa = (n, t, sub = '') => `<div class="cx" style="text-align:center"><div class="kpi">${n}</div><div class="pequeno sec">${t}</div>${sub ? `<div class="pequeno ter">${sub}</div>` : ''}</div>`
  const seta = '<svg width="18" height="18" viewBox="0 0 24 24" style="align-self:center"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="#9A9A9A" stroke-width="2.4"/></svg>'
  add({ id: 'funil', olho: 'Parte 8 · Funil', titulo: 'Da mensagem no WhatsApp até a matrícula', exemplo: true,
    lide: 'A aula experimental é a porta da academia. O funil mostra quantos chamaram, quantos fizeram a aula e quantos se matricularam, e de onde veio cada um.',
    corpo: `${tela('funil', 'Funil <span>· de 01/08 a 15/10</span>', `
      <div style="display:grid;grid-template-columns:1fr auto 1fr auto 1fr auto 1fr;gap:8px">${etapa(f3.total.contatos, 'chamaram')}${seta}${etapa(f3.total.agendaram, 'marcaram a aula')}${seta}${etapa(f3.total.fizeramExperimental, 'fizeram a aula')}${seta}${etapa(f3.total.matricularam, 'se matricularam', `${f3.total.expMat} de quem fez a aula`)}</div>
      <div style="display:grid;grid-template-columns:1.25fr 1fr;gap:10px;min-height:0">
        ${tabela([['De onde veio'], ['Chamaram', 'n'], ['Fizeram a aula', 'n'], ['Matricularam', 'n'], ['Conversão', 'n']], f3.porOrigem.map((o) => tr([[esc(o.origem)], [o.contatos, 'n'], [o.fizeramExperimental, 'n'], [`<b>${o.matricularam}</b>`, 'n'], [o.contMat, 'n']], o.origem === 'Indicação' ? 'sel' : '')))}
        <div class="cx"><div class="cx__rot">Chamar de volta <span class="sec" style="font-weight:400">fizeram a aula e sumiram</span></div>
          ${d.retornos.slice(-4).reverse().map((r) => `<div class="lin"><span>${esc(r.nome)} <span class="sec">· ${esc(r.modalidade)}</span></span><span class="sec">há ${r.dias} dias</span></div>`).join('')}
          <div class="bts" style="margin-top:6px"><span class="bt bt--p">WhatsApp</span><span class="bt">Lembrar</span><span class="bt">Matricular</span><span class="bt">Não seguiu</span></div></div>
      </div>`, { altura: 330, legenda: '"Conversão" é a parte de quem chamou que virou aluno. Nomes inventados.' })}
    <div class="tres" style="margin-top:12px">
      ${bloco('O que o exemplo mostra', [`Indicação converte mais: ${f3.porOrigem.find((o) => o.origem === 'Indicação')?.contMat} de quem chegou indicado virou aluno, contra ${f3.porOrigem.find((o) => o.origem === 'Instagram')?.contMat} do Instagram`, `Em outubro, até o dia 15: ${fo.contatos} chamaram e ${fo.matricularam} já se matricularam`])}
      ${bloco('O que você consegue fazer', ['Matricular direto do funil: cria a pessoa, a matrícula e a primeira cobrança', 'Lembrar de chamar de volta quem fez a aula há 3 dias (o prazo é seu, pergunta A15)'])}
      ${bloco('"Traga um amiguinho"', [`Quem indicou e quem chegou ganham o mesmo desconto, com a origem guardada (exemplo: R$ 30 por um mês para cada, ${d.indicacoesDeOutubro.length} caso em outubro)`, 'O valor e a duração são de vocês (pergunta A9)'])}
    </div>` })

  // ───────────────────────────────────────────── 19. agenda
  add({ id: 'agenda', olho: 'Parte 9 · Anotar e lembrar', titulo: 'Agenda, notas e lembretes', exemplo: true,
    lide: 'O caderno do dono dentro do app. Lembrete com data e repetição ("todo dia 10"), tarefa com prazo e responsável, e nota ligada a uma pessoa ou a um valor.',
    corpo: `<div class="lado lado--largo" style="grid-template-columns:minmax(0,1fr) 70mm;height:auto">
      ${tela('agenda', 'Agenda <span>· quinta, 15 de outubro</span>', `
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;height:100%;min-height:0">
          <div class="cx"><div class="cx__rot">Hoje</div>
            ${hj.atrasados.map((t) => `<div class="lin"><span class="neg">● ${esc(t)}</span><span class="pequeno neg">atrasado</span></div>`).join('')}
            ${hj.hoje.map((t) => `<div class="lin"><span>● ${esc(t)}</span></div>`).join('')}
            <div class="cx__rot" style="margin-top:8px">Em breve</div>
            ${hj.emBreve.map((t) => `<div class="lin"><span>${esc(t.titulo)}</span><span class="sec">${t.data.slice(0, 5)}</span></div>`).join('')}
            <div class="bts" style="margin-top:8px"><span class="bt bt--p">+ Lembrete</span></div></div>
          <div class="cx"><div class="cx__rot">Tarefas</div>
            ${hj.tarefas.map((t) => `<div class="lin"><span>☐ ${esc(t.titulo)}${t.resp ? `<br><span class="sec">${esc(t.resp)}</span>` : ''}</span><span class="${t.atrasada ? 'neg' : 'sec'}">${t.prazo ? t.prazo.slice(0, 5) : 'sem prazo'}</span></div>`).join('')}
            <div class="bts" style="margin-top:8px"><span class="bt">+ Tarefa</span></div></div>
          <div class="cx"><div class="cx__rot">Notas</div>
            ${d.notas.map((n) => `<div class="lin" style="display:block"><span>${n.fixada ? '<b class="neg">Fixada</b> · ' : ''}${esc(n.texto)}</span><br><span class="sec">${n.data.split('-').reverse().join('/').slice(0, 5)}${n.pessoa ? ` · ${esc(n.pessoa)}` : ''}</span></div>`).join('')}
            <div class="bts" style="margin-top:8px"><span class="bt">+ Nota</span></div></div>
        </div>`, { altura: 384, legenda: 'Atalhos no teclado: N cria uma nota e L cria um lembrete, já ligados ao que estiver aberto.' })}
      <div class="pilha">
        <div class="tela tela--celular" style="height:auto;margin:0 auto"><div style="background:#1C1C1C;color:#fff;padding:14px 12px 16px;font-size:13px">
          <div style="color:#B8B8B8;margin-bottom:6px">08:00</div>
          <div style="background:#2C2C2C;border-radius:10px;padding:8px 10px"><b>Raça Fight · Admin</b><br>Você tem ${hj.hoje.length} lembretes hoje</div></div></div>
        <p class="pequeno sec">Às 8h, o seu celular avisa quantos lembretes tem no dia, <b>sem o texto e sem valor</b>: se alguém olhar a tela, não vê nada da academia.</p>
        ${bloco('Atalhos prontos', ['A despesa fixa vira lembrete mensal', 'O aluno que deve vira "Cobrar fulano"', 'Quem fez a aula experimental vira "Chamar de volta"'])}
      </div>
    </div>` })

  // ───────────────────────────────────────────── 20. histórico
  const hist = d.historico.filter((h) => !/fechou o fechamento/.test(h[0])).map((h) => [h[0], h.slice(1).filter((l) => /^[A-ZÁÉÍÓÚ]/.test(l))])
    .map((h) => { const m = h[0].match(/em (\d\d)\/(\d\d)\/(\d{4}) às (\d\d:\d\d)/); return { h, k: m ? `${m[3]}${m[2]}${m[1]}${m[4]}` : '' } }).sort((a, b) => b.k.localeCompare(a.k)).map((x) => x.h)
  add({ id: 'historico', olho: 'Parte 10 · Histórico', titulo: 'Quem mexeu, no quê, e quando', exemplo: true,
    lide: 'Toda criação, mudança e arquivamento fica registrado, em frase. Quem grava é o próprio banco de dados, não a tela: ninguém pula o registro, e ninguém apaga, nem o dono.',
    corpo: `<div class="lado lado--largo" style="grid-template-columns:minmax(0,1fr) 82mm;height:auto">
      ${tela('historico', 'Histórico', `
        <div class="bts"><span class="chip chip--on">Tudo</span><span class="chip">Lançamentos</span><span class="chip">Cobranças</span><span class="chip">Matrículas</span><span class="chip">Pessoas</span><span class="chip">Por quem ▾</span><span class="chip">Período ▾</span></div>
        <div class="cx" style="flex:1;display:flex;flex-direction:column;gap:2px">
          ${hist.map(([t, ls]) => `<div style="padding:8px 0;border-bottom:1px solid #E2E2E2"><div style="font-weight:600">${esc(t)}</div>${ls.map((l) => `<div class="sec">${esc(l)}</div>`).join('')}</div>`).join('')}
        </div>`, { altura: 380, legenda: 'Os registros mais novos primeiro. "Tatiane" é a recepção do exemplo, registrando quem chamou no WhatsApp.' })}
      <div class="pilha">
        ${bloco('O que você vê', ['Cada mudança em frase, com o antes e o depois', 'O histórico de uma linha, de uma pessoa ou de um mês, ou de tudo', 'Filtro por tipo, por quem mexeu e por período'])}
        ${bloco('Por que isso importa', ['Um pagamento não some sem deixar rastro', 'Se o valor da mensalidade de alguém mudou, você sabe quem mudou e quando', 'Mês fechado, reaberto e fechado de novo: fica tudo anotado, com o motivo'])}
        <div class="caixa caixa--vermelha"><b class="rot">A decidir</b>Guardar o histórico para sempre ou por 5 anos, o prazo comum para documento fiscal (pergunta A14, confirmar com o contador).</div>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 21. permissões
  const S = '<span class="selo selo--ok">vê</span>', N = '<span class="ter">—</span>', D = '<span class="selo">só o dele</span>', Q = '<span class="selo selo--atencao">se você decidir</span>'
  const linhasPerm = [
    ['Horários, turmas, avisos', S, S, S, S],
    ['Presença e graduação', D, S, S, S],
    ['Cadastro e telefone do aluno', D, '<span class="selo">só da turma dele</span>', S, S],
    ['Registrar quem quer a aula experimental', N, S, S, S],
    ['Mensalidade de um aluno e se está paga', `${D} ${Q}`, N, Q, S],
    ['Quem está devendo', N, N, Q, S],
    ['Entradas, saídas e resultado do mês', N, N, N, S],
    ['Salário e comissão da equipe', N, N, N, S],
    ['Notas, lembretes e relatórios do dono', N, N, N, S],
    ['Histórico de quem mexeu', N, N, N, S],
  ]
  add({ id: 'permissoes', olho: 'Parte 11 · Permissões', titulo: 'Quem vê o quê',
    lide: 'Cada pessoa vê só o que precisa para o trabalho dela. A regra fica dentro do banco de dados: mesmo que alguém tente abrir pelo caminho errado, o banco não entrega.',
    corpo: `<div class="lado lado--largo" style="grid-template-columns:minmax(0,1fr) 80mm;height:auto">
      <table class="tabela-16"><thead><tr><th style="width:38%"></th><th>Aluno</th><th>Professor</th><th>Recepção</th><th>Dono (Admin)</th></tr></thead>
        <tbody>${linhasPerm.map((l) => `<tr><td><b>${l[0]}</b></td>${l.slice(1).map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>
      <div class="pilha">
        <div class="caixa caixa--preta"><b class="rot" style="color:#FF8A8C">A regra principal</b>O professor nunca vê valor: nem mensalidade, nem atraso, nem salário de ninguém. O aluno em atraso treina normalmente; se a academia quiser bloquear, a decisão é sua.</div>
        <div class="caixa caixa--vermelha"><b class="rot">A decidir: a recepção lança pagamento?</b>Pergunta A1. Se sim, a recepção marca a mensalidade como paga e cadastra aluno, mas <b>não vê</b> o resultado do mês, salários, despesas, relatórios nem as suas notas. Nossa recomendação: só o dono na primeira entrega.</div>
        <div class="caixa"><b class="rot">Sócio</b>Se houver mais de um dono, os dois entram com a mesma visão, e o histórico separa o que cada um fez (pergunta A22).</div>
        <div class="caixa"><b class="rot">O aluno vê a própria mensalidade?</b>Recomendamos que sim: só as dele (ou dos filhos), sem multa e sem histórico de cobrança. Diminui o "quanto eu devo?" no balcão (pergunta A2).</div>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 22. segurança e LGPD
  add({ id: 'seguranca', olho: 'Segurança e LGPD', titulo: 'O dado da academia, bem guardado',
    lide: 'Dinheiro e dado de criança pedem cuidado de banco. Em linguagem simples: onde fica, quem vê, o que acontece se der problema e o que a lei pede da academia.',
    corpo: `<div class="quatro lista--16" style="grid-template-columns:repeat(3,1fr);gap:14px 18px">
      ${bloco('Onde fica', ['No Brasil: banco de dados em São Paulo, e a cópia extra também', 'Trancado: guardado criptografado e viajando criptografado entre o celular e o servidor. Quem roubasse o disco não leria nada'])}
      ${bloco('Quem vê', ['Cada um só o que é dele (página anterior), com a regra dentro do banco', 'Para entrar no Admin, duas chaves: a senha e um código de 6 números que muda a cada 30 segundos, no seu celular'])}
      ${bloco('Se der problema', ['Cópia de segurança automática todo dia', 'No plano recomendado, mais uma cópia nossa, guardada 30 dias: um erro descoberto duas semanas depois ainda tem volta', 'O histórico mostra o que foi mudado e por quem'])}
      ${bloco('Dinheiro não fica pela metade', ['Sem internet, o Admin não grava pagamento: avisa "Sem conexão: nada foi gravado" e guarda o que você digitou na tela', 'Assim dois aparelhos não marcam o mesmo pagamento duas vezes'])}
      ${bloco('Nada vaza pelo aviso', ['Aviso no celular nunca leva nome nem valor: "Você tem 3 lembretes hoje", "2 pessoas com mensalidade atrasada"', 'O sistema não grava valor em nenhum registro técnico'])}
      ${bloco('O que a LGPD pede da academia', ['A academia é a dona dos dados; o fornecedor só guarda', 'Ter uma pessoa de contato para privacidade (o "encarregado")', 'Criança só com o responsável, e foto de menor só com autorização escrita', 'Pedir só o necessário: o CPF fica de fora até uma cobrança exigir'])}
    </div>
    <div class="caixa caixa--vermelha" style="margin-top:14px"><b class="rot">Um cuidado antes de pôr os dados reais</b>O contrato de dados do fornecedor (Supabase) foi escrito para a lei europeia e não cita a LGPD. O dado fica em São Paulo, mas a empresa é de fora. Vale um advogado olhar antes.</div>` })

  // ───────────────────────────────────────────── 23. custo (os três degraus)
  const dg = ['comecar', 'recomendado', 'crescer'].map(degrau)
  const COPIA = { comecar: '1 por dia, guardada 7 dias', recomendado: '1 por dia (7 dias) + cópia nossa de 30 dias', crescer: 'volta a qualquer minuto dos últimos 7 dias + cópia de 30 dias' }
  const PERDE = { comecar: 'até 1 dia de lançamentos', recomendado: 'até 1 dia de lançamentos', crescer: 'uns 2 minutos' }
  const MAQ = { comecar: 'básica (1 GB)', recomendado: 'o dobro (2 GB)', crescer: 'o dobro (2 GB)' }
  add({ id: 'custo', olho: 'Hospedagem e custo', titulo: 'Quanto custa manter no ar',
    lide: `O que a academia paga aos fornecedores para os três apps funcionarem: o banco de dados, as lojas do iPhone e do Android e o endereço próprio. Preços de ${custos.moeda.data.split('-').reverse().join('/')}, com o dólar a ${brl(custos.moeda.cambio_usado).replace('R$ ', 'R$ ')} (já com o IOF do cartão).`,
    corpo: `<div class="degraus">
      ${dg.map((g) => `<div class="degrau ${g.recomendado ? 'degrau--rec' : ''}">
        <div class="degrau__nome">${esc(g.nome)}${g.recomendado ? '<span class="selo selo--vermelho" style="font-family:var(--texto);text-transform:none">o que recomendamos</span>' : ''}</div>
        <div class="degrau__para">${esc(g.publico)}</div>
        <div class="degrau__preco">${brl0(g.totais.mensal_brl)}<small> por mês</small></div>
        <div class="lin"><span>Por ano, com Apple e domínio</span><b>${brl0(g.totais.ano_corrente_brl)}</b></div>
        <div class="lin"><span>No primeiro ano (+ Google, uma vez)</span><b>${brl0(g.totais.primeiro_ano_brl)}</b></div>
        <div class="lin"><span>Média por mês no ano</span><b>${brl0(g.totais.media_mensal_no_ano_brl)}</b></div>
        <div class="lin"><span>Cópia de segurança</span><span style="text-align:right">${COPIA[g.id]}</span></div>
        <div class="lin"><span>Se der problema, perde</span><span style="text-align:right">${PERDE[g.id]}</span></div>
        <div class="lin"><span>Folga de máquina</span><span>${MAQ[g.id]}</span></div>
      </div>`).join('')}
    </div>
    <div class="duas" style="margin-top:12px;gap:18px">
      <div class="caixa"><b class="rot">Por que o do meio</b>Custa ${brl0(dg[1].totais.mensal_brl - dg[0].totais.mensal_brl)} a mais por mês que o Começar e resolve o ponto fraco dele: se alguém apaga um lançamento e você só percebe 15 dias depois, a cópia de 30 dias traz de volta. O Crescer custa cinco vezes mais pela "volta no tempo", que só compensa com duas unidades, e pode ser ligado depois.</div>
      <div class="caixa"><b class="rot">Por que não o plano grátis</b>O plano gratuito do banco <b>pausa depois de uma semana sem uso</b> e <b>não faz cópia de segurança nenhuma</b>. Serve para teste, não para o financeiro de uma academia. Um servidor próprio barato (R$ 30 a R$ 60) parece economia, mas alguém tem de cuidar dele toda semana.</div>
    </div>` })

  // ───────────────────────────────────────────── 24. o que se paga e para quem
  const rec = degrau('recomendado')
  const REC_NOME = { supabase_pro: 'Banco de dados, login e fotos (Supabase Pro, em São Paulo)', supabase_small: 'Máquina um tamanho acima (folga e base para a "volta no tempo")', copia_externa: 'Cópia de segurança extra, guardada 30 dias, em São Paulo', apple: 'Conta Apple, para o app estar na loja do iPhone', google: 'Conta Google Play, para a loja do Android', dominio: 'Endereço próprio .com.br (Registro.br)', eas: 'Montar o app para as lojas', push: 'Avisos no celular', email: 'E-mail de cadastro e de troca de senha', homologacao: 'Banco de testes, sem dado real' }
  const QUANDO = { mensal: 'todo mês', anual: 'todo ano', unico: 'uma vez só' }
  add({ id: 'custo-itens', olho: 'Hospedagem e custo', titulo: 'O que se paga, e para quem',
    lide: 'O plano recomendado, item por item. Quase tudo é cobrado em dólar no cartão; se o dólar muda, a conta muda junto.',
    corpo: `<div class="lado lado--largo" style="grid-template-columns:minmax(0,1fr) 84mm;height:auto">
      <table class="tabela-16"><thead><tr><th>O quê</th><th class="n">Em dólar</th><th class="n">Em reais</th><th>Quando</th></tr></thead><tbody>
        ${rec.itens.map((i) => `<tr><td>${esc(REC_NOME[i.id] ?? i.nome)}</td><td class="n">${i.usd == null ? '—' : `US$ ${i.usd}`}</td><td class="n"><b>${i.brl ? brl(i.brl) : 'grátis'}</b></td><td>${i.brl ? QUANDO[i.recorrencia] : '—'}</td></tr>`).join('')}
      </tbody><tfoot><tr><td>Total por mês</td><td class="n">US$ ${rec.totais.mensal_usd}</td><td class="n">${brl(rec.totais.mensal_brl)}</td><td></td></tr>
        <tr><td style="font-weight:400">Por ano (12 meses + Apple + domínio)</td><td></td><td class="n">${brl(rec.totais.ano_corrente_brl)}</td><td></td></tr></tfoot></table>
      <div class="pilha">
        <div class="caixa caixa--preta"><b class="rot" style="color:#FF8A8C">Duas contas diferentes</b><b>Infraestrutura</b> é o que está nesta página: o que a academia paga todo mês e todo ano aos fornecedores.<br><br><b>Desenvolvimento e manutenção</b> (construir, corrigir, atualizar, acompanhar o sistema) <b>é outra conta, a combinar com o Alex</b>. Ela não está em nenhum número deste documento.</div>
        <div class="caixa"><b class="rot">Os grátis têm limite</b>E-mail: até 3.000 por mês. Avisos no celular: sem custo. Montar o app: 15 vezes por mês para cada loja. Folgado para uma academia.</div>
        <p class="pequeno ter">Preços pesquisados nos sites dos fornecedores em ${custos.moeda.data.split('-').reverse().join('/')}. O valor da Apple em reais só aparece na hora da inscrição.</p>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 25. decidir (travam)
  const q = (cod, pergunta, rec) => `<div class="pergunta"><div class="pergunta__q"><span class="cod">${cod}</span>${pergunta}</div><div class="pergunta__r">${rec}</div></div>`
  add({ id: 'decidir', olho: 'O que a academia precisa decidir', titulo: 'Sete respostas que destravam a construção',
    lide: 'Sem elas, o Admin anda com valores de exemplo. Cada uma tem a nossa sugestão; a decisão é de vocês.',
    corpo: `<div class="perguntas">
      ${q('A13', 'Podem mandar a planilha que vocês usam hoje?', 'Pode ser de um mês só, em Excel, ou até uma foto se for de papel. <b>É a mais útil de todas:</b> com ela, a importação é testada com o arquivo de verdade.')}
      ${q('A18', 'Quais planos vocês vendem, e por quanto?', 'Por modalidade, vezes na semana, combo, Kids, trimestral, e se existe taxa de matrícula. <b>Os preços deste documento são inventados.</b>')}
      ${q('A19', 'Como a equipe é paga hoje?', 'Fixo, comissão sobre a modalidade, por aula, ou uma mistura? Quem é CLT, MEI ou autônomo? <b>O Admin calcula; não faz folha de pagamento.</b>')}
      ${q('A7', 'Quem entra no dia 21 paga o mês cheio?', 'Ou só a parte do mês, ou começa a pagar no mês seguinte? <b>Sugestão:</b> mês cheio, e o vencimento passa a ser o dia da matrícula. É o mais fácil de explicar no balcão.')}
      ${q('A3', 'Vocês cobram multa e juros de quem atrasa?', 'Se sim, quanto e com quantos dias de tolerância? <b>Sugestão:</b> 2 % de multa e 1 % ao mês, o limite da lei, com 5 dias de tolerância, confirmado com o contador.')}
      ${q('A1', 'A recepção pode marcar mensalidade como paga?', 'Se sim, ela não vê resultado, salários nem despesas. <b>Sugestão:</b> só o dono na primeira entrega; a porta fica pronta para depois.')}
      ${q('A23', 'O Admin pode ser um app que abre no navegador?', 'Abre no computador e no celular, com ícone na tela inicial, <b>sem passar pela loja</b>. É o melhor jeito de ter uma planilha de verdade dentro dele. <b>Sugestão:</b> sim.')}
      <div class="pergunta" style="background:var(--fundo)"><div class="pergunta__q">E outras, sem pressa</div><div class="pergunta__r">Desconto de família e do "Traga um amiguinho", reajuste de preço, pagamento parcial, Pix e boleto automáticos (sugestão: depois), guardar CPF (sugestão: não). São 24 ao todo, todas com sugestão.</div></div>
    </div>` })

  // ───────────────────────────────────────────── 26. decidir (hospedagem e dados)
  add({ id: 'decidir-2', olho: 'O que a academia precisa decidir', titulo: 'Contas, contrato e privacidade',
    lide: 'Antes de pôr os dados reais no ar: em nome de quem ficam as contas, quem olha o contrato e quem responde pela privacidade.',
    corpo: `<div class="perguntas">
      ${q('1', 'Em nome de quem ficam as contas?', 'Banco de dados, Apple, Google e o endereço .com.br: da academia, com CNPJ, ou do Alex? A Apple pede um número de cadastro da empresa (D-U-N-S) para conta de empresa.')}
      ${q('2', 'Um advogado pode olhar o contrato de dados?', 'O contrato do fornecedor do banco foi escrito para a lei europeia e não cita a LGPD. O dado fica em São Paulo, mas a empresa é de fora do país.')}
      ${q('3', 'Quem será o encarregado de privacidade?', 'Pode ser o dono ou alguém da recepção, com um e-mail público para os alunos. Empresa pequena às vezes é dispensada, mas dado de criança costuma tirar a dispensa.')}
      ${q('4', 'Quando ligar a "volta no tempo"?', 'Só faz sentido com duas unidades ou muita gente lançando ao mesmo tempo. Liga pelo painel, sem mudar o app.')}
      ${q('A24', 'Professores e atletas aceitam aparecer com o nome real?', 'Até cada um autorizar, os exemplos usam nomes inventados. Foto de criança só com autorização escrita do responsável.')}
      ${q('Marca', 'Podem mandar o logo em alta resolução?', 'O logo deste documento foi redesenhado a partir das fotos do Instagram e é provisório. O arquivo original da academia entra no lugar.')}
    </div>` })

  // ───────────────────────────────────────────── 27. próximos passos
  add({ id: 'passos', olho: 'Próximos passos', titulo: 'Do sim até o Admin no ar',
    lide: 'O Admin é a primeira entrega. O prazo de cada etapa se combina com o Alex quando as respostas das páginas anteriores chegarem: elas é que destravam a construção.',
    corpo: `<div class="passos">
      ${[['Vocês respondem', 'As sete perguntas, a planilha atual e os preços reais.', 'Academia', true],
        ['Telas desenhadas', 'O desenho final das telas do Admin, na marca da Raça Fight. Já está em andamento.', 'Alex', false],
        ['Admin construído', 'Com a sua planilha importada e os seus planos e preços.', 'Alex', false],
        ['Um mês em paralelo', 'Vocês usam o Admin e a planilha juntos por um mês, para conferir que os números batem.', 'Academia e Alex', false],
        ['No ar', 'A planilha se aposenta. Depois vêm o app do aluno e o do professor, ligados ao mesmo banco.', 'Todos', false]]
        .map(([t, txt, quem, agora], i) => `<div class="passo ${agora ? 'passo--agora' : ''}"><div class="passo__n">${i + 1}</div><h4>${t}</h4><p>${txt}</p><p class="quem">${quem}</p></div>`).join('')}
    </div>
    <div class="duas" style="margin-top:22px;grid-template-columns:1fr 92mm;gap:20px;align-items:stretch">
      <div class="pilha">
        ${bloco('O que já está pronto', ['A especificação completa do Admin: as telas, as regras e o caminho de cada tarefa', 'O motor do financeiro, testado: gera mensalidade, calcula comissão, fecha o mês, lê a planilha. Foi ele que calculou os números deste documento', 'A escolha da hospedagem, com o custo de cada degrau'], '', 'lista--16')}
        <div class="caixa caixa--vermelha"><b class="rot">O pedido de hoje</b>Se a proposta faz sentido, o primeiro passo é mandar a planilha atual e a lista de planos e preços. Com isso, a próxima versão deste documento já sai com os números de vocês.</div>
      </div>
      <div style="border-radius:12px;background:#000 50% 30% / cover no-repeat url('${x.fotoAcademia}');min-height:250px"></div>
    </div>` })

  return pgs
}
