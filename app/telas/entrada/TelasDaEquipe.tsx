/**
 * Porta "Sou da academia", primeira vez (F13.4; mockups/entrada.html, quadros
 * C2–C4): o código da equipe com o papel esperado, o pedido pendente e "Abrir
 * a sua academia" ([decidir] uma academia ou várias).
 *
 * Quem dá o papel é o DONO, ao confirmar: o pedido só sugere ("Dono" não é
 * opção). Enquanto espera, "Treinar como aluno enquanto isso" usa a visão do
 * aluno com a mesma conta. "Pedir para entrar" GRAVA a conta nova e o
 * vínculo pendente (agente AA, P11); "Cancelar o pedido" encerra o pendente.
 * Os papéis são os do mockup de luta (`entrada.html`, C3): "Recepção" vira
 * `recepcao` e "Professor" vira `instrutor` no pedido; o dono confirma ou
 * ajusta no Admin. O "Personal" saiu com a musculação (revisão AN).
 */
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { Icone, Texto, useAvisoRapido, Vidro } from '@/componentes';
import { controle, espaco, estiloDeTexto, raio, useTema } from '@/tema';
import { hora } from '@/componentes/formatos';
import { mudarEntrada, useEntrada, type PapelPedido } from './fluxo';
import { BarraDoPasso, CaixasDeCodigo, CartaoDaAcademia, Etiqueta, Mola, Opcao, Pilula, TelaDaEntrada, TituloDoPasso } from './pecas';
import { acharPeloCodigoDaEquipe, contaNovaSimulada, useAcademias } from './simulacao';
import { ErroSemSinal, useGravar } from '@/dados';
import type { Usuario } from '@/dominio/tipos';
import { useEntrarComConta } from './TelasDeConta';

const voltar = (router: ReturnType<typeof useRouter>) => () => (router.canGoBack() ? router.back() : router.replace('/boas-vindas'));

const NOME_DO_PEDIDO: Record<PapelPedido, string> = { recepcao: 'recepção', professor: 'professor' };

export function TelaCodigoDaEquipe() {
  const router = useRouter();
  const gravar = useGravar();
  const aviso = useAvisoRapido();
  const contaCriada = useRef<Usuario | null>(null);
  const { contaNova } = useEntrada();
  const academias = useAcademias();
  const [codigo, setCodigo] = useState('');
  const [papel, setPapel] = useState<PapelPedido | null>(null);
  const achada = codigo.length === 6 ? acharPeloCodigoDaEquipe(academias.data ?? [], codigo) : null;
  return (
    <TelaDaEntrada barra={<BarraDoPasso aoVoltar={voltar(router)} />}>
      <TituloDoPasso titulo="Código da equipe" apoio="O dono passa esse código. Se ele mandou um convite por e-mail, é só abrir o link de lá." />
      <CaixasDeCodigo rotulo="Código da equipe" valor={codigo} aoMudar={setCodigo} />
      {achada ? (
        <CartaoDaAcademia nome={achada.nome} legenda={`Equipe · código ${achada.codigoDaEquipe}`}>
          <Texto variante="corpoPequeno" style={{ fontFamily: estiloDeTexto('titulo2').estilo.fontFamily }}>
            Qual é o seu papel?
          </Texto>
          <View style={{ gap: espaco[3] }} accessibilityRole="radiogroup" accessibilityLabel="Papel na academia">
            <Opcao semVidro rotulo="Recepção" marcada={papel === 'recepcao'} aoTocar={() => setPapel('recepcao')} />
            <Opcao semVidro rotulo="Professor" marcada={papel === 'professor'} aoTocar={() => setPapel('professor')} />
          </View>
        </CartaoDaAcademia>
      ) : codigo.length === 6 && !academias.isLoading ? (
        <Texto variante="corpoPequeno" cor="erro">
          Esse código não é de nenhuma equipe. O código dos alunos é outro: peça ao dono o da equipe.
        </Texto>
      ) : (
        <Texto variante="corpoPequeno" cor="textoSecundario">
          Simulação: o código da equipe da Raça Fight é T9K2WM.
        </Texto>
      )}
      <Mola />
      <Pilula
        rotulo="Pedir para entrar"
        desabilitado={!achada || !papel}
        aoTocar={async () => {
          if (!achada || !papel) return;
          try {
            // grava primeiro: a conta nova e o vínculo pendente com o papel esperado
            // a conta de uma tentativa anterior que parou no pedido (sem sinal) é reaproveitada (agente AG)
            const conta = contaCriada.current ?? (await gravar.criarConta(contaNova ?? contaNovaSimulada()));
            contaCriada.current = conta;
            const v = await gravar.pedirVinculo(conta.id, achada.id, papel === 'recepcao' ? 'recepcao' : 'instrutor');
            mudarEntrada({ pedidoDaEquipe: { academia: achada, papel, em: new Date(), usuarioId: conta.id, vinculoId: v.id } });
            router.replace('/pedido-pendente');
          } catch (e) {
            aviso.mostrar({ texto: e instanceof ErroSemSinal ? 'Sem sinal. O pedido precisa de internet.' : 'Não deu para enviar o pedido. Tente de novo.', tipo: 'erro' });
          }
        }}
      />
    </TelaDaEntrada>
  );
}

export function TelaPedidoPendente() {
  const router = useRouter();
  const { pedidoDaEquipe } = useEntrada();
  const { cores } = useTema();
  const entrarCom = useEntrarComConta();
  const aviso = useAvisoRapido();
  const gravar = useGravar();
  if (!pedidoDaEquipe) {
    return (
      <TelaDaEntrada barra={<BarraDoPasso aoVoltar={voltar(router)} />} centralizar>
        <TituloDoPasso titulo="Nenhum pedido" apoio="O pedido foi cancelado." centro />
        <Mola />
        <Pilula rotulo="Voltar ao início" aoTocar={() => router.replace('/boas-vindas')} />
      </TelaDaEntrada>
    );
  }
  const { academia, papel, em } = pedidoDaEquipe;
  return (
    <TelaDaEntrada centralizar>
      <View style={{ gap: espaco[3], alignItems: 'center' }}>
        <View style={{ width: controle.primario, height: controle.primario, borderRadius: raio.redondo, backgroundColor: cores.viva, alignItems: 'center', justifyContent: 'center' }}>
          <Icone nome="relogio" cor={cores.vivaTexto} />
        </View>
        <TituloDoPasso titulo="Pedido enviado" apoio="O dono confirma pelo app Admin. Você recebe um aviso quando ele confirmar." centro />
      </View>
      <CartaoDaAcademia nome={academia.nome} legenda={`Pedido como ${NOME_DO_PEDIDO[papel]} · hoje, ${hora(em)}`}>
        <Etiqueta icone="relogio" texto="Esperando o dono" />
      </CartaoDaAcademia>
      <Mola />
      <Pilula
        variante="vidro"
        icone="inicio"
        rotulo="Treinar como aluno enquanto isso"
        aoTocar={() => {
          aviso.mostrar({ texto: 'O pedido continua esperando o dono.' });
          void entrarCom(pedidoDaEquipe.usuarioId);
        }}
      />
      <Pilula
        variante="texto"
        rotulo="Cancelar o pedido"
        aoTocar={async () => {
          // cancelar precisa de sinal (agente AG): sem ele, avisa em vez de virar promessa solta
          try {
            await gravar.cancelarPedidoDeVinculo(pedidoDaEquipe.vinculoId, pedidoDaEquipe.usuarioId);
          } catch (e) {
            aviso.mostrar({ texto: e instanceof ErroSemSinal ? 'Sem sinal. Cancelar precisa de internet.' : 'Não deu para cancelar. Tente de novo.', tipo: 'erro' });
            return;
          }
          mudarEntrada({ pedidoDaEquipe: null });
          aviso.mostrar({ texto: 'Pedido cancelado.' });
          router.replace('/boas-vindas');
        }}
      />
    </TelaDaEntrada>
  );
}

/**
 * "Sou o dono" (luta, AM2): a gestão da academia é o app Admin (`admin/`, do
 * agente AM1). Aqui o dono só fica sabendo para onde ir; se ele dá aula,
 * entra pela equipe com o código, como professor.
 */
export function TelaAbrirAcademia() {
  const router = useRouter();
  return (
    <TelaDaEntrada barra={<BarraDoPasso aoVoltar={voltar(router)} />}>
      <TituloDoPasso titulo="O dono usa o app Admin" apoio="Turmas, réguas, matrículas e mensalidades ficam no Admin. Este app é dos alunos, dos professores e da recepção." />
      <Vidro raio={raio.medio} estilo={{ padding: espaco[4] }}>
        <Texto variante="corpoPequeno">Se você também dá aula, entre com o código da equipe: o app abre no Hoje, com a chamada das suas turmas.</Texto>
      </Vidro>
      <Mola />
      <Pilula rotulo="Tenho o código da equipe" aoTocar={() => router.push('/codigo-da-equipe')} />
    </TelaDaEntrada>
  );
}
