/**
 * Academia (mockup `luta.html`, tela 4; mapa de luta, Parte B): o que a
 * academia mostra, na ordem dos destaques do Instagram. A foto do salão vazio
 * (sem ninguém), o logo PROVISÓRIO num selo de vidro (nunca direto na foto) e a
 * frase da academia. Linhas: Professores · Atletas · Eventos · Técnicas ·
 * Raça Responde · Endereço e WhatsApp.
 */
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Linking, View } from 'react-native';
import { Cartao, FolhaInferior, FotoComTexto, Linha, Lista, Texto, Vidro } from '@/componentes';
import { LogoRacaFight } from '@/componentes/LogoRacaFight';
import { useEventos } from '@/dados';
import { proximosEventos } from '@/dominio/eventos/eventos';
import { linkDoWhatsApp, mensagemDaExperimental } from '@/dominio/experimental/experimental';
import { espaco, raio, tokens, useTema } from '@/tema';
import { dataCurta } from '@/componentes/formatos';
import { BotaoSobreFoto, TelaComRolagem, TopoDaFoto } from '../comum/Tela';
import { FOTO_DO_SALAO } from '../../luta/imagens';
import { useAcademia } from '../../luta/dados';

/** Na vitrine (`base = '/conheca'`), `antes` entra acima das linhas (os horários) e `rodape` fixa o botão da experimental. */
export function TelaAcademia({ base = '/academia', aoVoltar, antes, rodape }: { base?: '/academia' | '/conheca'; aoVoltar?: () => void; antes?: ReactNode; rodape?: ReactNode } = {}) {
  const router = useRouter();
  const { cores } = useTema();
  const { luta, hoje } = useAcademia();
  const eventos = useEventos().data ?? [];
  const [contato, setContato] = useState(false);
  const proximo = hoje ? proximosEventos(eventos, hoje)[0] : undefined;
  const modalidades = luta?.modalidades.map((m) => m.nome) ?? [];
  const ir = (rota: string) => router.push(`${base}/${rota}` as never);

  return (
    <TelaComRolagem
      semCabecalho
      rodape={rodape}
      topoSangrado={
        <FotoComTexto
          imagem={FOTO_DO_SALAO}
          descricao="O salão da academia vazio, com o ringue, os sacos e a luz da janela"
          variante="baixo"
          altura={tokens.telas.fotoTopoDono + 40}
          topo={
            aoVoltar ? (
              <TopoDaFoto>
                <BotaoSobreFoto icone="voltar" rotuloAcessivel="Voltar" aoTocar={aoVoltar} />
              </TopoDaFoto>
            ) : undefined
          }
        >
          <Vidro variante="escuroFixo" raio={raio.grande} semSombra estilo={{ alignSelf: 'flex-start', paddingVertical: espaco[2], paddingHorizontal: espaco[3] }}>
            <LogoRacaFight largura={128} cor={cores.fotoTexto} />
          </Vidro>
          <Texto variante="titulo1" accessibilityRole="header">
            {luta?.contato.frase ?? 'A academia'}
          </Texto>
        </FotoComTexto>
      }
    >
      {antes}
      <Cartao padding={0}>
        <Lista>
          <Linha icone="alunos" titulo="Professores" apoio={modalidades.join(', ')} aoTocar={() => ir('professores')} />
          <Linha icone="luva" titulo="Atletas" apoio="Só quem aceitou aparecer" aoTocar={() => ir('atletas')} />
          <Linha icone="trofeu" titulo="Eventos" apoio={proximo ? `${proximo.nome} · ${dataCurta(proximo.data)} · ${proximo.local}` : 'Os próximos e os que passaram'} aoTocar={() => ir('eventos')} />
          <Linha icone="tatame" titulo="Técnicas" apoio="Golpes básicos e de curta distância" aoTocar={() => ir('tecnicas')} />
          <Linha icone="conversa" titulo="Raça Responde" apoio="Perguntas frequentes" aoTocar={() => ir('responde')} />
          <Linha icone="academia" titulo="Endereço e WhatsApp" apoio={luta ? `${luta.contato.endereco} · ${luta.contato.cidade.replace(/ \(RS\)/, '')}` : undefined} aoTocar={() => setContato(true)} />
        </Lista>
      </Cartao>
      <FolhaInferior visivel={contato} aoFechar={() => setContato(false)} titulo="Endereço e WhatsApp">
        {luta ? (
          <View style={{ gap: espaco[2] }}>
            <Texto variante="corpo">
              {luta.contato.endereco}, {luta.contato.cidade}
            </Texto>
            <Linha icone="academia" titulo="Abrir no mapa" aoTocar={() => void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${luta.contato.endereco}, ${luta.contato.cidade}`)}`)} />
            <Linha icone="conversa" titulo={`WhatsApp ${luta.contato.whatsapp}`} apoio="Agende a aula experimental grátis" aoTocar={() => void Linking.openURL(linkDoWhatsApp(luta.contato.whatsapp, mensagemDaExperimental(null, luta.contato.nomeCurto)))} />
          </View>
        ) : null}
      </FolhaInferior>
    </TelaComRolagem>
  );
}
