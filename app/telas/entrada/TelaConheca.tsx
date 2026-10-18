/**
 * "Quero conhecer" (vitrine, sem conta; mapa de luta, Parte A; F17, R14.11).
 *
 * A mesma Academia do aluno, com os horários (só leitura) em cima e o botão
 * fixo "Agendar aula experimental grátis", que abre "Qual modalidade?" e
 * leva ao WhatsApp da academia com a modalidade já escrita na mensagem.
 * Sem conta, nada é gravado: o agendamento é a conversa no WhatsApp.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';
import { Botao, Cartao, FolhaInferior, Linha, Lista, Texto } from '@/componentes';
import { linkDoWhatsApp, mensagemDaExperimental, opcoesDaExperimental } from '@/dominio/experimental/experimental';
import { espaco } from '@/tema';
import { TelaAcademia } from '../aluno/academia/TelaAcademia';
import { useAcademia } from '../luta/dados';

/** A folha "Qual modalidade?" (F17): as modalidades, as turmas Kids e "Ainda não sei". */
export function FolhaQualModalidade({ visivel, aoFechar }: { visivel: boolean; aoFechar: () => void }) {
  const { luta } = useAcademia();
  if (!luta) return null;
  const kids = luta.turmas.filter((t) => t.ativa && t.publico === 'kids').map((t) => t.nome);
  const opcoes = opcoesDaExperimental(
    luta.modalidades.map((m) => m.nome),
    [...new Set(kids)],
  );
  return (
    <FolhaInferior visivel={visivel} aoFechar={aoFechar} titulo="Qual modalidade?" tipo="lista">
      <View style={{ gap: espaco[2] }}>
        <Texto variante="corpoPequeno" cor="textoSecundario">
          A conversa abre no WhatsApp da academia ({luta.contato.whatsapp}) com a mensagem pronta. A aula experimental é grátis.
        </Texto>
        <Lista>
          {opcoes.map((o) => (
            <Linha
              key={o ?? 'nao-sei'}
              icone={o ? 'luva' : 'conversa'}
              titulo={o ?? 'Ainda não sei'}
              testID={`experimental-${o ?? 'nao-sei'}`}
              aoTocar={() => {
                aoFechar();
                void Linking.openURL(linkDoWhatsApp(luta.contato.whatsapp, mensagemDaExperimental(o, luta.contato.nomeCurto)));
              }}
            />
          ))}
        </Lista>
      </View>
    </FolhaInferior>
  );
}

export function TelaConheca() {
  const router = useRouter();
  const [folha, setFolha] = useState(false);
  return (
    <>
      <TelaAcademia
        base="/conheca"
        aoVoltar={() => (router.canGoBack() ? router.back() : router.replace('/boas-vindas'))}
        antes={
          <Cartao padding={0}>
            <Lista>
              <Linha icone="horarios" titulo="Horários" apoio="A grade da semana, de todas as modalidades" aoTocar={() => router.push('/conheca/horarios')} />
            </Lista>
          </Cartao>
        }
        rodape={<Botao rotulo="Agendar aula experimental grátis" icone="conversa" tamanho="grande" aoTocar={() => setFolha(true)} testID="agendar-experimental" />}
      />
      <FolhaQualModalidade visivel={folha} aoFechar={() => setFolha(false)} />
    </>
  );
}
