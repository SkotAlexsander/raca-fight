/**
 * Revisão AB (P11): o ESTADO para o leitor de tela também na web. O
 * react-native-web 0.21 lê os `aria-*` (e os `accessibility*` soltos), mas
 * IGNORA os objetos `accessibilityState` e `accessibilityValue`: na web a
 * chave "Vibração" saía como `role="switch"` sem `aria-checked`, o campo de
 * carga como `role="slider"` sem valor, o chip escolhido sem `aria-selected`
 * (o axe acusou em /perfil, /perfil/avisos, /plus/dieta, /alunos/novo-aviso e
 * no Modo treino). Os `aria-*` valem nas duas plataformas (RN 0.71+); o
 * `accessibilityState` continua para o celular.
 */
import { render, screen } from '@testing-library/react-native';
import { ProvedorDeTema } from '@/tema';
import { CampoNumerico } from './CampoNumerico';
import { Chip } from './Chip';
import { LinhaComChave } from './Interruptor';
import { Botao } from './Botao';

const com = (no: React.ReactNode) => render(<ProvedorDeTema>{no}</ProvedorDeTema>);
/**
 * As props que o componente entrega ao Pressable/View (o que o react-native-web
 * transforma em atributo do DOM). No celular, o Pressable do RN junta os
 * `aria-*` ao `accessibilityState`; por isso o teste olha o elemento de cima.
 */
const propsDo = (rotulo: string, papel?: string) => {
  const achados = screen.UNSAFE_root.findAll((n: { type: unknown; props: Record<string, unknown> }) => typeof n.type !== 'string' && n.props.accessibilityLabel === rotulo && (!papel || n.props.accessibilityRole === papel));
  return (achados[0]?.props ?? {}) as Record<string, unknown>;
};

test('a chave diz se está ligada (aria-checked) e travada (aria-disabled)', () => {
  com(<LinhaComChave rotulo="Vibração" ligado travado aoMudar={() => {}} />);
  expect(propsDo('Vibração')['aria-checked']).toBe(true);
  expect(propsDo('Vibração')['aria-disabled']).toBe(true);
});

test('o campo numérico diz o valor (aria-valuetext e aria-valuenow)', () => {
  com(<CampoNumerico rotulo="Carga" valor={22500} aoMudar={() => {}} passo={2500} minimo={0} maximo={100000} formatar={(g) => String(g / 1000)} unidade="kg" />);
  const p = screen.getByRole('adjustable').props as Record<string, unknown>;
  expect(p['aria-valuetext']).toBe('22.5 kg');
  expect(p['aria-valuenow']).toBe(22500);
  expect(p['aria-valuemin']).toBe(0);
  expect(p['aria-valuemax']).toBe(100000);
});

test('o chip escolhido diz que está escolhido (aria-pressed: o aria-selected não vale em botão)', () => {
  com(<Chip rotulo="Livre" selecionado aoTocar={() => {}} />);
  expect(propsDo('Livre')['aria-pressed']).toBe(true);
  expect(propsDo('Livre')['aria-selected']).toBeUndefined();
});

test('o botão desabilitado e o carregando dizem isso (aria-disabled, aria-busy)', () => {
  com(<Botao rotulo="Enviar" desabilitado aoTocar={() => {}} />);
  expect(propsDo('Enviar', 'button')['aria-disabled']).toBe(true);
});
