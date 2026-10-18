/**
 * O logo da Raça Fight, PROVISÓRIO (agente AL, `02-design/marca-e-proposta/
 * logo-raca-fight/`, refeito das fotos até chegar o arquivo da academia): o
 * "RAÇA" e a faixa com "FIGHT", com a ponta vermelha. Gerado do
 * `fonte/simbolo-mockup.svg.txt` (o mesmo `<symbol id="s-simbolo">` dos
 * mockups); se o logo mudar, gere de novo. Proporção 3,55 : 1.
 *
 * Regras do AL: sobre foto, sempre num selo de vidro; no escuro, branco; no
 * claro, `#1C1C1C`; a ponta é sempre `#C42024`.
 */
import Svg, { Path } from 'react-native-svg';
import { SVG_DECORATIVO } from './svgDecorativo';

const VIEWBOX = '-54 -24 1078 304';
const PROPORCAO = 3.5461;

export function LogoRacaFight({ largura, cor, ponta = '#C42024', rotuloAcessivel = 'Raça Fight' }: { largura: number; cor: string; ponta?: string; rotuloAcessivel?: string }) {
  return (
    <Svg width={largura} height={largura / PROPORCAO} viewBox={VIEWBOX} accessibilityRole="image" accessibilityLabel={rotuloAcessivel} {...(rotuloAcessivel ? {} : SVG_DECORATIVO)}>
      <Path d="M30 0H182A40 40 0 0 1 222 40V44A40 40 0 0 1 182 84H0V52H182A8 8 0 0 0 190 44V40A8 8 0 0 0 182 32H14ZM0 52H32V140H0ZM120 84H162L234 140H192ZM256 140L380 0H416L492 140ZM322 108H440L394 46ZM738 0H566A46 46 0 0 0 520 46V94A46 46 0 0 0 566 140H738V108H566A14 14 0 0 1 552 94V46A14 14 0 0 1 566 32H738ZM754 140L878 0H914L990 140ZM820 108H938L892 46ZM622 150H642L636 190H616Z" fill={cor} />
      <Path d="M-30 168H1000V256H58ZM-10.69 176H992V248H61.31Z" fillRule="evenodd" fill={cor} />
      <Path d="M108.93 230V189.91H148.39V198.71H120.8V206.8H145.34V215.6H120.8V230ZM161.52 230V189.91H173.39V230ZM211.9 230.7Q199.74 230.7 193.64 225.57Q187.55 220.44 187.55 209.97Q187.55 203.11 190.72 198.49Q193.89 193.88 199.89 191.54Q205.89 189.21 214.31 189.21Q219.52 189.21 223.97 190.15Q228.42 191.08 231.76 192.95Q235.1 194.82 236.94 197.65Q238.79 200.48 238.79 204.27H227.25Q227.25 202.65 226.24 201.44Q225.24 200.24 223.49 199.49Q221.74 198.74 219.51 198.37Q217.29 198.01 214.82 198.01Q211.31 198.01 208.51 198.71Q205.71 199.4 203.74 200.82Q201.78 202.24 200.75 204.35Q199.72 206.45 199.72 209.24V210.64Q199.72 214.59 201.37 217.07Q203.02 219.56 206.17 220.73Q209.32 221.9 213.84 221.9Q217.95 221.9 220.96 221.16Q223.96 220.42 225.59 218.99Q227.21 217.55 227.21 215.58V215.24H213.19V207.61H238.85V230H231.91L230.79 225.2Q228.54 227.07 225.64 228.31Q222.75 229.54 219.31 230.12Q215.86 230.7 211.9 230.7ZM254.27 230V189.91H266.15V204.83H290.21V189.91H302.08V230H290.21V214.39H266.15V230ZM331.81 230V199.47H314.44V189.91H361.05V199.47H343.68V230Z" fill={cor} />
      <Path d="M832 178H966V246H832ZM838 184V240H960V184Z" fillRule="evenodd" fill={cor} />
      <Path d="M838 184H960V240H838Z" fill={ponta} />
    </Svg>
  );
}
