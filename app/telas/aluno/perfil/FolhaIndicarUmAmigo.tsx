/**
 * "Traga um amiguinho" (R19.9, F25): o código de 6 caracteres do aluno, a
 * mensagem pronta com o WhatsApp da academia e as indicações (só o primeiro
 * nome e o estado). O benefício é do Admin (L26): aqui nenhum valor aparece.
 */
import { Platform, Share, View } from 'react-native';
import { Botao, FolhaInferior, Linha, Texto, useAvisoRapido } from '@/componentes';
import { useIndicacoesDoAluno, useSessao } from '@/dados';
import { codigoDeIndicacao, linkDoWhatsApp, mensagemDaExperimental, mensagemDeIndicacao, resumoDaIndicacao } from '@/dominio/experimental/experimental';
import { espaco, estiloDeTexto, raio, useTema } from '@/tema';
import { useAcademia } from '../../luta/dados';

const NUMERO = estiloDeTexto('numeroMedio').estilo.fontFamily;

export function FolhaIndicarUmAmigo({ visivel, aoFechar }: { visivel: boolean; aoFechar: () => void }) {
  const { usuario } = useSessao();
  const { luta } = useAcademia();
  const indicacoes = useIndicacoesDoAluno(usuario?.id).data ?? [];
  const aviso = useAvisoRapido();
  const { cores } = useTema();
  if (!usuario || !luta) return null;
  const codigo = codigoDeIndicacao(usuario.id);
  const link = linkDoWhatsApp(luta.contato.whatsapp, mensagemDaExperimental(null, luta.contato.nomeCurto));
  const mensagem = mensagemDeIndicacao(codigo, luta.contato.nomeCurto, link);

  const compartilhar = async () => {
    try {
      if (Platform.OS === 'web') {
        const nav = globalThis.navigator as Navigator | undefined;
        if (nav?.share) await nav.share({ text: mensagem });
        else if (nav?.clipboard) {
          await nav.clipboard.writeText(mensagem);
          aviso.mostrar({ tipo: 'sucesso', texto: 'Mensagem copiada.' });
        }
        return;
      }
      await Share.share({ message: mensagem });
    } catch {
      // a pessoa fechou o compartilhar: nada a fazer
    }
  };

  return (
    <FolhaInferior visivel={visivel} aoFechar={aoFechar} titulo="Indicar um amigo" rodape={<Botao variante="primario" rotulo="Compartilhar" icone="convite" aoTocar={() => void compartilhar()} />}>
      <View style={{ gap: espaco[4] }}>
        <Texto variante="corpo">Seu amigo agenda a aula experimental grátis pelo WhatsApp e diz o seu código na recepção.</Texto>
        <View accessible accessibilityLabel={`Seu código: ${codigo.split('').join(' ')}`} style={{ alignSelf: 'flex-start', paddingVertical: espaco[3], paddingHorizontal: espaco[4], borderRadius: raio.grande, backgroundColor: cores.marcaSuave }}>
          <Texto variante="titulo1" style={{ fontFamily: NUMERO, letterSpacing: 4 }}>
            {codigo}
          </Texto>
        </View>
        <Texto variante="corpoPequeno" cor="textoSecundario">
          {mensagem}
        </Texto>
        {indicacoes.length ? (
          <View>
            <Texto variante="titulo3" accessibilityRole="header">
              Suas indicações
            </Texto>
            {indicacoes.map(({ indicacao, interessado }) => {
              const r = interessado ? resumoDaIndicacao(indicacao, interessado) : null;
              return r ? <Linha key={indicacao.id} titulo={r.nome} apoio={r.texto} semSeta compacta /> : null;
            })}
          </View>
        ) : null}
      </View>
    </FolhaInferior>
  );
}
