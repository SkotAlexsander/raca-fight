/**
 * /componentes — o catálogo de componentes do app, na mesma ordem e numeração
 * do `02-COMPONENTES.md` e da seção "Componentes e estados" do mockup
 * (mockups/index.html#componentes). Serve para comparar o app com o design
 * aprovado nos dois temas, com "reduzir movimento" e "reduzir transparência".
 *
 * Em tela larga as amostras viram colunas (mínimo 392, como o `.amostras` do
 * mockup); no celular, uma coluna.
 */
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Anel,
  Avatar,
  AvisoRapido,
  BarraDeAbas,
  BarraDoTeclado,
  Botao,
  Cabecalho,
  Campo,
  CampoDeSelecao,
  CampoNumerico,
  Cartao,
  CartaoDeNumero,
  Chip,
  Chips,
  Deslizar,
  Esqueleto,
  EstadoVazio,
  FolhaInferior,
  FotoComTexto,
  Icone,
  NOMES_DOS_ICONES,
  PilulaDeVidro,
  PontoPlus,
  SeloPlus,
  Texto,
  useAvisoRapido,
  Vidro,
} from '@/componentes';
import { useFila, useSessao } from '@/dados';
import { formatarCronometro } from '@/dominio/cronometro';
import { formatarNumero, formatarTempo, gramasParaQuilos, lerNumero, quilosParaGramas } from '@/dominio/unidades';
import { IMAGENS } from '@/imagens/indice';
import { anel, borda, espaco, layout, raio, tipografia, useControlesDoTema, useTema, VERSAO_DOS_TOKENS, type NomeDoEstiloDeTexto } from '@/tema';

const COLUNA_MINIMA = layout.colunaCelularMedio + 2 * espaco[4] + 2 * borda.fina; // 392, como o .amostras

function Amostra({ numero, nome, medidas, children, superficie }: { numero?: string; nome: string; medidas?: string; children: ReactNode; superficie?: boolean }) {
  const { cores } = useTema();
  return (
    <View style={{ gap: espaco[3] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: espaco[2] }}>
        <Texto variante="legenda" cor="textoSecundario">
          {numero ? `${numero} · ${nome}` : nome}
        </Texto>
        {medidas ? (
          <Texto variante="legenda" cor="textoSecundario">
            {medidas}
          </Texto>
        ) : null}
      </View>
      <View
        style={{
          backgroundColor: superficie ? cores.superficie : cores.fundo,
          borderWidth: borda.fina,
          borderStyle: 'dashed',
          borderColor: cores.borda,
          borderRadius: raio.grande,
          padding: espaco[4],
          gap: espaco[3],
        }}
      >
        {children}
      </View>
    </View>
  );
}

const kg = (g: number) => formatarNumero(gramasParaQuilos(g), 1);
const lerKg = (t: string) => {
  const n = lerNumero(t);
  return Number.isNaN(n) ? null : quilosParaGramas(n);
};
const lerInteiro = (t: string) => {
  const n = lerNumero(t);
  return Number.isInteger(n) ? n : null;
};

function Controles() {
  const c = useControlesDoTema();
  const fila = useFila();
  const grupo = <T extends string>(rotulo: string, atual: T, opcoes: [T, string][], definir: (v: T) => void) => (
    <View style={{ gap: espaco[2] }}>
      <Texto variante="legenda" cor="textoSecundario">
        {rotulo}
      </Texto>
      <Chips>
        {opcoes.map(([v, r]) => (
          <Chip key={v} rotulo={r} selecionado={atual === v} aoTocar={() => definir(v)} />
        ))}
      </Chips>
    </View>
  );
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco[6] }}>
      {grupo('Tema', c.escolhaDeTema, [['claro', 'Claro'], ['escuro', 'Escuro'], ['sistema', 'Sistema']], c.definirTema)}
      {grupo('Movimento', c.escolhaDeMovimento, [['desligado', 'Normal'], ['ligado', 'Reduzido'], ['sistema', 'Sistema']], c.definirMovimento)}
      {grupo('Vidro', c.escolhaDeTransparencia, [['desligado', 'Normal'], ['ligado', 'Reduzir transparência'], ['sistema', 'Sistema']], c.definirTransparencia)}
      {grupo('Rede (exemplo)', fila.semRede ? 'sem' : 'com', [['com', 'Com rede'], ['sem', 'Sem rede']], (v) => fila.definirSemRede(v === 'sem'))}
    </View>
  );
}

export function TelaCatalogoDeComponentes() {
  const { cores } = useTema();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const aviso = useAvisoRapido();
  const sessao = useSessao();
  const fila = useFila();

  const [texto, setTexto] = useState('');
  const [carga, setCarga] = useState(22500);
  const [reps, setReps] = useState(12);
  const [series, setSeries] = useState(1);
  const [descanso, setDescanso] = useState(720);
  const [nivel, setNivel] = useState('iniciante');
  const [objetivo, setObjetivo] = useState<'ganhar_massa' | 'emagrecer' | 'condicionamento' | 'iniciante' | 'saude_e_manutencao'>('ganhar_massa');
  const [folha, setFolha] = useState<null | 'confirmacao' | 'lista'>(null);
  const [aba, setAba] = useState('inicio');
  const [abaAcademia, setAbaAcademia] = useState('alunos');
  const [feitas, setFeitas] = useState(1);

  const conteudo = Math.min(width, 2040) - 2 * layout.margemLateral;
  const colunas = Math.max(1, Math.floor((conteudo + espaco[6]) / (COLUNA_MINIMA + espaco[6])));
  const larguraDaColuna = colunas === 1 ? conteudo : (conteudo - espaco[6] * (colunas - 1)) / colunas;

  const amostras: ReactNode[] = [
    <Amostra key="1" numero="1" nome="Botão" medidas="48 · 40 · toque 48">
      <Botao rotulo="Iniciar treino" tamanho="grande" brilho />
      <Botao rotulo="Salvar treino" />
      <Botao rotulo="Ver histórico" variante="secundario" />
      <Botao rotulo="Fechar treino" variante="perigo" />
      <Botao rotulo="Remover exercício" variante="perigoDiscreto" tamanho="pequeno" />
      <View style={{ flexDirection: 'row', gap: espaco[3] }}>
        <View style={{ flex: 1 }}>
          <Botao rotulo="Cancelar" variante="secundario" />
        </View>
        <View style={{ flex: 1 }}>
          <Botao rotulo="Confirmar" />
        </View>
      </View>
      <Botao rotulo="Desabilitado" desabilitado />
      <Botao rotulo="Salvar" carregando />
      <View style={{ flexDirection: 'row', gap: espaco[2], alignItems: 'center' }}>
        <Botao variante="neutro" tamanho="icone" icone="menu" rotuloAcessivel="Menu" />
        <Botao variante="neutro" tamanho="icone" icone="buscar" rotuloAcessivel="Buscar" />
        <Botao variante="texto" rotulo="Desfazer" intrinseco />
      </View>
    </Amostra>,

    <Amostra key="2" numero="2" nome="Campo de texto" medidas="48">
      <Campo rotulo="Nome do treino" placeholder="Ex.: Treino A — peito" value={texto} onChangeText={setTexto} />
      <Campo rotulo="Em foco" value="Treino A — peito e tríceps" focoForcado />
      <Campo rotulo="Peso (opcional)" value="950" keyboardType="decimal-pad" erro="Informe um peso entre 20 e 300 kg" />
      <Campo rotulo="Buscar aluno" icone="buscar" placeholder="Nome ou matrícula" limpavel value={texto} onChangeText={setTexto} />
      <Campo rotulo="Desabilitado" value="Somente leitura" desabilitado />
    </Amostra>,

    <Amostra key="3" numero="3" nome="Campo numérico +/−" medidas="botões 36 · toque 48">
      <CampoNumerico rotulo="Carga" valor={carga} aoMudar={setCarga} passo={2500} minimo={0} maximo={999500} formatar={kg} unidade="kg" lerTexto={lerKg} falar={(v) => `${kg(v)} quilos`} />
      <CampoNumerico rotulo="Repetições" valor={reps} aoMudar={setReps} passo={1} minimo={0} maximo={99} lerTexto={lerInteiro} teclado="number-pad" focoForcado />
      <CampoNumerico rotulo="Séries" valor={series} aoMudar={setSeries} passo={1} minimo={1} maximo={20} variante="edicao" />
      <CampoNumerico rotulo="Descanso" valor={descanso} aoMudar={setDescanso} passo={15} minimo={0} maximo={600} formatar={formatarTempo} variante="edicao" erro="Entre 0 e 10:00" />
      <BarraDoTeclado aoProximo={() => {}} aoOk={() => {}} />
      <Texto variante="legenda" cor="textoSecundario">
        iPhone: a barra de 48 fica colada em cima do teclado numérico. No Android o teclado já tem a tecla e a barra não aparece.
      </Texto>
    </Amostra>,

    <Amostra key="4" numero="4" nome="Seleção e chips" medidas="32 · toque 48 · informativo 24">
      <CampoDeSelecao
        rotulo="Objetivo"
        valor={objetivo}
        aoEscolher={setObjetivo}
        opcoes={[
          { valor: 'ganhar_massa', rotulo: 'Ganhar massa' },
          { valor: 'emagrecer', rotulo: 'Perder peso' },
          { valor: 'condicionamento', rotulo: 'Condicionamento' },
          { valor: 'iniciante', rotulo: 'Começar a treinar' },
          { valor: 'saude_e_manutencao', rotulo: 'Manter' },
        ]}
      />
      <Chips>
        {[
          ['iniciante', 'Iniciante'],
          ['intermediario', 'Intermediário'],
          ['avancado', 'Avançado'],
        ].map(([v, r]) => (
          <Chip key={v} rotulo={r} selecionado={nivel === v} aoTocar={() => setNivel(v)} />
        ))}
        <Chip rotulo="Indisponível" desabilitado />
      </Chips>
      <Chips>
        <Chip rotulo="Ganhar massa" variante="info" />
        <Chip rotulo="45 min" variante="info" />
        <Chip rotulo="Iniciante" variante="info" />
        <Chip rotulo="Em uso" variante="marca" />
      </Chips>
    </Amostra>,

    <Amostra key="5" numero="5" nome="Cartão" medidas="raio 24 · afunda no toque">
      <Cartao>
        <Texto variante="titulo3">Cartão em repouso</Texto>
        <Texto variante="corpoPequeno" cor="textoSecundario">
          Sombra 2: seis camadas a 5 % no claro; contorno e fio de luz no escuro.
        </Texto>
      </Cartao>
      <Cartao aoTocar={() => aviso.mostrar({ texto: 'Cartão tocado' })} rotuloAcessivel="Cartão tocável">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
          <Icone nome="luva" tamanho="grande" cor="marca" />
          <View style={{ flex: 1 }}>
            <Texto variante="titulo3">Muay Thai — noite</Texto>
            <Texto variante="corpoPequeno" cor="textoSecundario">
              20:00 · 12 check-ins · Prof. Diego
            </Texto>
          </View>
          <Anel progresso={1 / 3} rotuloAcessivel="Round 1 de 3">
            <Texto variante="corpoPequeno" style={{ fontFamily: tipografia.escala.titulo1.fontFamily }}>
              1
            </Texto>
          </Anel>
        </View>
      </Cartao>
      <Cartao atual>
        <Texto variante="corpoForte">Atual: o único que salta</Texto>
      </Cartao>
      <Cartao plus>
        <Texto variante="corpoForte">Plus: borda dourada à esquerda</Texto>
      </Cartao>
    </Amostra>,

    <Amostra key="19" numero="19" nome="Foto com texto" medidas="capa 240 · herói 340">
      <FotoComTexto
        imagem={IMAGENS['raca-fight/inicio-capa-capa']}
        descricao="Dois alunos fazem sparring no tatame"
        variante="capa"
        aoTocar={() => {}}
        rotuloAcessivel="Muay Thai, próxima aula"
        escolhido
        topo={
          <>
            <PilulaDeVidro>
              <Texto variante="corpoPequeno" style={{ fontFamily: tipografia.escala.titulo2.fontFamily }}>
                Próxima aula
              </Texto>
            </PilulaDeVidro>
            <PilulaDeVidro>
              <Texto variante="corpoPequeno" style={{ fontFamily: tipografia.escala.titulo2.fontFamily }}>
                60 min
              </Texto>
            </PilulaDeVidro>
          </>
        }
      >
        <Texto variante="titulo2">Muay Thai</Texto>
        <Texto variante="corpoPequeno" cor="textoSecundario">
          Hoje, 20:00 · Todos os níveis · Prof. Diego
        </Texto>
      </FotoComTexto>
      <FotoComTexto imagem={IMAGENS['raca-fight/evento-entrada-do-atleta-capa']} descricao="Atleta entra na área de luta" variante="baixo" altura={300}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: espaco[2] }}>
          <Texto variante="numeroGigante">2:47</Texto>
          <Texto variante="titulo3">luta</Texto>
        </View>
        <Texto variante="titulo2">Round 2 de 3</Texto>
        <Texto variante="corpoPequeno" cor="textoSecundario">
          Muay Thai · 3 × 3 min · 1 min de intervalo
        </Texto>
      </FotoComTexto>
      <FotoComTexto variante="capa" altura={160}>
        <Texto variante="titulo3">Sem foto: a ilha escura</Texto>
        <Texto variante="corpoPequeno" cor="textoSecundario">
          A mesma linguagem, sem imagem de corpo.
        </Texto>
      </FotoComTexto>
    </Amostra>,

    <Amostra key="20" numero="20" nome="Vidro" medidas="desfoque 24 · borda 1 · sólido sem transparência">
      <FotoComTexto imagem={IMAGENS['raca-fight/cronometro-fundo-tela']} descricao="" variante="capa" altura={260}>
        <Vidro estilo={{ padding: espaco[4], gap: espaco[2] }}>
          <Texto variante="corpoForte">Round 2 de 3</Texto>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: espaco[1] }}>
            <Texto variante="numeroMedio">1:00</Texto>
            <Texto variante="legenda" cor="textoSecundario">
              intervalo
            </Texto>
          </View>
          <Texto variante="corpoPequeno" cor="textoSecundario">
            Vidro do tema (claro no claro, escuro no escuro)
          </Texto>
        </Vidro>
        <View style={{ flexDirection: 'row', gap: espaco[2], alignItems: 'center' }}>
          <Vidro variante="escuroFixo" raio={raio.redondo} semSombra estilo={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
            <Icone nome="voltar" />
          </Vidro>
          <PilulaDeVidro variante="escuroFixo">
            <Texto variante="corpoPequeno">Vidro escuro fixo</Texto>
          </PilulaDeVidro>
        </View>
      </FotoComTexto>
    </Amostra>,

    <Amostra key="21" numero="21" nome="Deslizar para começar" medidas="trilho 56 · botão 48">
      <Deslizar rotuloAcessivel="Começar os rounds" aoConcluir={() => aviso.mostrar({ texto: 'Rounds começaram', tipo: 'sucesso' })} />
      <FotoComTexto imagem={IMAGENS['raca-fight/modalidade-boxe-cartao']} descricao="" variante="capa" altura={200}>
        <Texto variante="titulo3">Sobre a foto</Texto>
        <Deslizar sobreFoto rotuloAcessivel="Começar o boxe" aoConcluir={() => {}} />
      </FotoComTexto>
    </Amostra>,

    <Amostra key="anel" nome="Anel de progresso" medidas="44 · 72 · 160">
      <View style={{ flexDirection: 'row', gap: espaco[4], alignItems: 'center', flexWrap: 'wrap' }}>
        {[0, 1, 2, 3].map((n) => (
          <Anel key={n} progresso={n / 3} cor={n === 3 ? 'sucesso' : 'progresso'} rotuloAcessivel={`${n} de 3 séries feitas`}>
            <Texto variante="corpoPequeno" style={{ fontFamily: tipografia.escala.titulo1.fontFamily }}>
              {n}
            </Texto>
          </Anel>
        ))}
        <Anel progresso={feitas / 5} tamanho={anel.treino} traco={6} rotuloAcessivel={`${feitas} de 5 refeições`}>
          <Texto variante="corpoForte">{feitas}/5</Texto>
        </Anel>
        <Botao rotulo="+1" variante="secundario" tamanho="pequeno" intrinseco aoTocar={() => setFeitas((f) => (f + 1) % 6)} />
      </View>
      <View style={{ alignItems: 'center' }}>
        <Anel progresso={0.4} modo="esvazia" tamanho={160} traco={8} restanteMs={72000} rotuloAcessivel="Descanso, faltam 1 minuto e 12 segundos">
          <Texto variante="numeroCronometro">{formatarCronometro(72)}</Texto>
        </Anel>
      </View>
    </Amostra>,

    <Amostra key="10" numero="10" nome="Selo Plus" medidas="24 · 20 · ponto 8">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco[3], alignItems: 'center' }}>
        <SeloPlus />
        <SeloPlus variante="contorno" />
        <SeloPlus tamanho="pequeno" />
        <SeloPlus comRelogio texto="Plus · 3 dias" />
        <SeloPlus variante="atencao" texto="Plus vencido" />
        <PontoPlus />
      </View>
    </Amostra>,

    <Amostra key="12" numero="12" nome="Barra de abas" medidas="56 + área segura · 4 ou 5 abas">
      <View style={{ marginHorizontal: -espaco[4], gap: espaco[4] }}>
        <BarraDeAbas
          semAreaSegura
          ativa={aba}
          aoEscolher={setAba}
          abas={[
            { chave: 'inicio', rotulo: 'Início', icone: 'inicio' },
            { chave: 'horarios', rotulo: 'Horários', icone: 'horarios', aviso: true },
            { chave: 'treinos', rotulo: 'Treinos', icone: 'faixa' },
            { chave: 'academia', rotulo: 'Academia', icone: 'academia' },
            { chave: 'perfil', rotulo: 'Perfil', icone: 'perfil' },
          ]}
        />
        <BarraDeAbas
          semAreaSegura
          ativa={abaAcademia}
          aoEscolher={setAbaAcademia}
          abas={[
            { chave: 'hoje', rotulo: 'Hoje', icone: 'hoje' },
            { chave: 'turmas', rotulo: 'Turmas', icone: 'tatame' },
            { chave: 'alunos', rotulo: 'Alunos', icone: 'alunos' },
            { chave: 'graduacao', rotulo: 'Graduação', icone: 'faixa' },
            { chave: 'perfil', rotulo: 'Perfil', icone: 'perfil' },
          ]}
        />
      </View>
    </Amostra>,

    <Amostra key="13" numero="13" nome="Cabeçalho" medidas="56 · grande 96">
      <View style={{ marginHorizontal: -espaco[4], gap: espaco[2] }}>
        <Cabecalho comAreaSegura={false} titulo="Chamada" subtitulo="Raça Fight Gravataí" aoVoltar={() => {}} acao={{ icone: 'menu', rotuloAcessivel: 'Opções', aoTocar: () => {} }} />
        <Cabecalho comAreaSegura={false} titulo="Horários" variante="grande" />
      </View>
    </Amostra>,

    <Amostra key="14" numero="14" nome="Folha inferior" medidas="curta · lista (média e grande)">
      <Botao rotulo="Abrir confirmação" variante="secundario" aoTocar={() => setFolha('confirmacao')} />
      <Botao rotulo="Abrir lista" variante="secundario" aoTocar={() => setFolha('lista')} />
      <FolhaInferior
        visivel={folha === 'confirmacao'}
        aoFechar={() => setFolha(null)}
        titulo="Fechar a chamada com 2 check-ins sem marcar?"
        rodape={
          <>
            <Botao rotulo="Cancelar" variante="secundario" aoTocar={() => setFolha(null)} />
            <Botao rotulo="Fechar a chamada" aoTocar={() => setFolha(null)} />
          </>
        }
      >
        <Texto variante="corpo" cor="textoSecundario">
          Quem não foi marcado sai da aula. Dá para corrigir até o fim do dia.
        </Texto>
      </FolhaInferior>
      <FolhaInferior visivel={folha === 'lista'} aoFechar={() => setFolha(null)} titulo="Passar a outro professor" tipo="lista">
        <ScrollView>
          {['Diego Moura', 'Márcio Teles', 'Renato Lopes'].map((n) => (
            <View key={n} style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
              <Avatar nome={n} tamanho={40} />
              <Texto variante="corpo">{n}</Texto>
            </View>
          ))}
        </ScrollView>
      </FolhaInferior>
    </Amostra>,

    <Amostra key="15" numero="15" nome="Estado vazio" medidas="ilustração 120 · erro · compacta">
      <EstadoVazio titulo="Nenhum treino ainda" texto="Monte o seu ou escolha um pronto da academia." ilustracao="primeiro-treino">
        <Botao rotulo="Montar treino livre" intrinseco />
        <Botao rotulo="Ver treinos prontos" variante="secundario" intrinseco />
      </EstadoVazio>
      <EstadoVazio variante="erro" titulo="Não deu para carregar" texto="Confira a internet e tente de novo.">
        <Botao rotulo="Tentar de novo" variante="secundario" intrinseco />
      </EstadoVazio>
      <Cartao padding={0}>
        <EstadoVazio variante="compacta" icone="prato" titulo="Sem refeições hoje" texto="O plano começa amanhã." />
      </Cartao>
    </Amostra>,

    <Amostra key="16" numero="16" nome="Aviso rápido" medidas="48 · 5 s · um por vez">
      <AvisoRapido texto="Série 2 feita" tipo="sucesso" acao={{ rotulo: 'Desfazer', aoTocar: () => {} }} />
      <AvisoRapido texto="Não salvou. O treino continua no aparelho." tipo="erro" acao={{ rotulo: 'Tentar de novo', aoTocar: () => {} }} />
      <Botao rotulo="Mostrar aviso de verdade" variante="secundario" aoTocar={() => aviso.mostrar({ texto: 'Série 1 feita', tipo: 'sucesso', acao: { rotulo: 'Desfazer', aoTocar: () => {} } })} />
    </Amostra>,

    <Amostra key="17" numero="17" nome="Auxiliares" medidas="avatar · cartão de número · esqueleto">
      <View style={{ flexDirection: 'row', gap: espaco[3], alignItems: 'center' }}>
        <Avatar nome="Ana Souza" tamanho={32} />
        <Avatar nome="Rafael Martins" />
        <Avatar nome="Beatriz Lima" tamanho={64} />
      </View>
      <View style={{ flexDirection: 'row', gap: espaco[3] }}>
        <CartaoDeNumero rotulo="Peso" valor="68,4" unidade="kg" />
        <CartaoDeNumero rotulo="Altura" valor="1,65" unidade="m" />
        <CartaoDeNumero rotulo="Idade" />
      </View>
      <Esqueleto altura={22} largura="60%" />
      <Esqueleto />
      <Esqueleto altura={72} raioDoBloco={raio.medio} />
    </Amostra>,

    <Amostra key="icones" nome="Ícones" medidas={`${NOMES_DOS_ICONES.length} · traço 2,25 · 24`}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco[4] }}>
        {NOMES_DOS_ICONES.map((n) => (
          <View key={n} style={{ width: 24, height: 24 }} accessibilityLabel={n}>
            <Icone nome={n} />
          </View>
        ))}
      </View>
    </Amostra>,

    <Amostra key="escala" nome="Escala tipográfica" medidas="13 · 16 · 20 · 25 · 31 · 39 · 49 · 61">
      {(Object.keys(tipografia.escala) as NomeDoEstiloDeTexto[]).map((nome) => (
        <View key={nome} style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: espaco[2] }}>
          <Texto variante={nome} numberOfLines={1} style={{ flexShrink: 1 }}>
            {tipografia.escala[nome].numerico ? '1:30' : 'Treino'}
          </Texto>
          <Texto variante="legenda" cor="textoSecundario">
            {nome} {tipografia.escala[nome].fontSize}
          </Texto>
        </View>
      ))}
    </Amostra>,

    <Amostra key="dados" nome="Dados de exemplo e fila" medidas="SQLite no aparelho · localStorage na web">
      <Texto variante="corpoPequeno" cor="textoSecundario">
        {sessao.usuario ? `Conta: ${sessao.usuario.nome}.` : 'Sem conta: entre por uma conta de exemplo.'} Fila: {fila.pendentes.length} pendente(s){fila.enviando ? ', enviando…' : ''}.
        {fila.ultimoResultado ? ` Último envio: ${fila.ultimoResultado.enviados} enviado(s)${fila.ultimoResultado.semRede ? ', sem rede' : ''}.` : ''}
      </Texto>
      <Botao rotulo={sessao.usuario ? 'Voltar ao app' : 'Entrar com uma conta de exemplo'} variante="texto" aoTocar={() => router.replace('/')} />
    </Amostra>,
  ];

  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      <Cabecalho titulo="Componentes" subtitulo={`Tokens ${VERSAO_DOS_TOKENS}`} aoVoltar={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: layout.margemLateral, paddingBottom: insets.bottom + espaco[16], gap: espaco[6] }}>
        <View style={{ gap: espaco[1] }}>
          <Texto variante="titulo2" accessibilityRole="header">
            Componentes e estados
          </Texto>
          <Texto variante="corpoPequeno" cor="textoSecundario">
            Numeração igual à do 02-COMPONENTES.md. Pressione os botões para ver o estado pressionado.
          </Texto>
        </View>
        <Controles />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco[6] }}>
          {amostras.map((a, i) => (
            <View key={i} style={{ width: larguraDaColuna }}>
              {a}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
