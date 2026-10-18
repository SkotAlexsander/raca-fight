/**
 * O símbolo da marca e o selo do logo: desde a virada de luta (AM2), o logo
 * PROVISÓRIO da Raça Fight (`LogoRacaFight`, do agente AL). `tamanho` é a
 * medida de referência da abertura (96 na tela cheia, 32 no selo): o logo
 * ocupa 0,75 × tamanho de altura e a largura segue a proporção dele.
 * O desenho da Academia Plus (barra e anilhas) saiu com a musculação.
 */
import { View } from 'react-native';
import { controle, espaco, raio, tokens, useTema } from '@/tema';
import { LogoRacaFight } from './LogoRacaFight';
import { Vidro } from './Vidro';

const PROPORCAO = 3.5461;

export function Simbolo({ tamanho, cor }: { tamanho: number; cor?: string }) {
  const { cores } = useTema();
  return <LogoRacaFight largura={tamanho * 0.75 * PROPORCAO} cor={cor ?? cores.texto} rotuloAcessivel="" />;
}

/** O selo do logo: o logo numa pílula de vidro (o logo nunca fica direto na foto). */
export function SeloDoLogo({ refDoSimbolo }: { refDoSimbolo?: React.Ref<View> }) {
  return (
    <Vidro raio={raio.redondo} semSombra estilo={{ alignSelf: 'flex-start', minHeight: controle.secundario, paddingHorizontal: espaco[4], flexDirection: 'row', alignItems: 'center' }}>
      <View ref={refDoSimbolo} collapsable={false} accessible accessibilityRole="header" accessibilityLabel="Raça Fight">
        <SimboloDoSelo />
      </View>
    </Vidro>
  );
}

function SimboloDoSelo() {
  const { cores } = useTema();
  return <Simbolo tamanho={tokens.abertura.simboloSelo} cor={cores.texto} />;
}
