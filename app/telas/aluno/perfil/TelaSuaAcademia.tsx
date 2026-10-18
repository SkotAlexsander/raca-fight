/**
 * Sua academia (perfil) — mapa, Parte 2: "ver e mudar o vínculo". Aberta pela
 * linha da academia no Perfil e pelo botão "Tenho um código" do Início, dos
 * Prontos e do Plus (R13.4, revisão AE). Três estados:
 * - sem academia: o código (as mesmas caixas e o mesmo cartão do F13.3) e
 *   "É esta, pedir para entrar" → vínculo pendente (R12.9, R13.5). O QR do
 *   cartaz (R12.8) abre o app já aqui pela câmera do celular;
 * - pendente: o pedido, com "Cancelar o pedido";
 * - ativo: a academia e desde quando.
 * "Desvincular" e várias academias ficam fora: é [decidir] no mapa.
 */
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Botao, Cartao, Texto, useAvisoRapido, useUmPorVez } from '@/componentes';
import { ErroSemSinal, useGravar, useRepositorio, useSessao } from '@/dados';
import { espaco } from '@/tema';
import { dataCurta } from '@/componentes/formatos';
import { CaixasDeCodigo, CartaoDaAcademia } from '@/telas/entrada/pecas';
import { TelaComRolagem } from '../comum/Tela';

export function TelaSuaAcademia() {
  const router = useRouter();
  const aviso = useAvisoRapido();
  const repo = useRepositorio();
  const gravar = useGravar();
  const { usuario, vinculoAtivo, vinculos } = useSessao();
  const [codigo, setCodigo] = useState('');
  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/perfil'));
  const ativo = vinculoAtivo?.estado === 'ativo' ? vinculoAtivo : null;
  const pendente = vinculos.find((v) => v.papel === 'aluno' && v.estado === 'pendente') ?? null;

  const busca = useQuery({ queryKey: ['academia-pelo-codigo', codigo], queryFn: () => repo.academiaPeloCodigo(codigo), enabled: codigo.length === 6 });
  const achada = codigo.length === 6 ? (busca.data ?? null) : null;

  const pedir = useUmPorVez(async () => {
    if (!achada || !usuario) return;
    try {
      await gravar.pedirVinculo(usuario.id, achada.id, 'aluno');
      aviso.mostrar({ texto: achada.entrarSemConfirmacao ? `Você entrou na ${achada.nome}` : 'Pedido enviado à recepção', tipo: 'sucesso' });
      setCodigo('');
      voltar();
    } catch (e) {
      // o pedido de vínculo precisa de sinal, como o pedido de treino (agente AG)
      aviso.mostrar({ texto: e instanceof ErroSemSinal ? 'Sem sinal. O pedido precisa de internet.' : 'Não deu para enviar o pedido. Tente de novo.', tipo: 'erro' });
    }
  });
  const cancelar = useUmPorVez(async () => {
    if (!pendente || !usuario) return;
    try {
      await gravar.cancelarPedidoDeVinculo(pendente.id, usuario.id);
      aviso.mostrar({ texto: 'Pedido cancelado.' });
    } catch (e) {
      aviso.mostrar({ texto: e instanceof ErroSemSinal ? 'Sem sinal. Cancelar precisa de internet.' : 'Não deu para cancelar. Tente de novo.', tipo: 'erro' });
    }
  });

  return (
    <TelaComRolagem titulo="Sua academia" aoVoltar={voltar} vao={espaco[5]}>
      {ativo ? (
        <CartaoDaAcademia nome={ativo.academia.nome} legenda={`Aluno desde ${dataCurta(ativo.desde)}`} />
      ) : pendente ? (
        <>
          <CartaoDaAcademia nome={pendente.academia.nome} legenda={`Pedido enviado em ${dataCurta(pendente.desde)}`}>
            <Texto variante="corpoPequeno" cor="textoSecundario">
              A recepção confirma o seu pedido. Até lá, você já vê os horários, os professores, os eventos e as técnicas.
            </Texto>
          </CartaoDaAcademia>
          <Botao variante="perigoDiscreto" rotulo="Cancelar o pedido" carregando={cancelar.ocupado} aoTocar={() => void cancelar.executar()} />
        </>
      ) : (
        <>
          <Texto variante="corpo" cor="textoSecundario">
            O código está no cartaz da recepção. Pelo QR do cartaz, a câmera do celular abre o app já aqui.
          </Texto>
          <CaixasDeCodigo rotulo="Código da academia" valor={codigo} aoMudar={setCodigo} />
          {achada ? (
            <CartaoDaAcademia nome={achada.nome} legenda={`Achamos pelo código ${achada.codigoDeVinculo}.`}>
              <Texto variante="corpoPequeno" cor="textoSecundario">
                {achada.entrarSemConfirmacao ? 'Você entra na hora: esta academia não pede confirmação.' : 'A recepção confirma o seu pedido. Até lá, você já vê os horários e os professores.'}
              </Texto>
            </CartaoDaAcademia>
          ) : codigo.length === 6 && busca.isError ? (
            // revisão AN: sem sinal, a busca falha; antes a tela dizia "não achamos academia"
            <Texto variante="corpoPequeno" cor="erro">
              Não deu para procurar o código agora. Confira a internet e tente de novo.
            </Texto>
          ) : codigo.length === 6 && !busca.isLoading ? (
            <Texto variante="corpoPequeno" cor="erro">
              Não achamos academia com o código {codigo}. Confira no cartaz da recepção.
            </Texto>
          ) : null}
          <View style={{ gap: espaco[2] }}>
            <Botao variante="primario" tamanho="grande" rotulo="É esta, pedir para entrar" desabilitado={!achada} carregando={pedir.ocupado} aoTocar={() => void pedir.executar()} />
          </View>
          <Cartao>
            <Texto variante="corpoPequeno" cor="textoSecundario">
              Sem academia, o cronômetro de rounds continua funcionando igual.
            </Texto>
          </Cartao>
        </>
      )}
    </TelaComRolagem>
  );
}
