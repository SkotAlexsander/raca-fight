/**
 * A lista da equipe (agente AG, P11, pedido do AH): o axe acusava
 * `aria-required-children` — a lista tinha cartões tocáveis direto dentro,
 * sem item de lista. Cada cartão agora fica num item.
 */
import { render, screen } from '@testing-library/react-native';
import type { PerfilProfissional } from '@/dominio/tipos';
import { ProvedorDeTema } from '@/tema';
import { ListaDaEquipe } from './Equipe';

const perfil = (id: string, nome: string) => ({ id, nomeExibicao: nome, formacao: 'Educação Física', especialidades: ['musculacao'] }) as unknown as PerfilProfissional;

test('cada filho da lista é um item de lista (com o cartão dentro)', () => {
  render(
    <ProvedorDeTema>
      <ListaDaEquipe perfis={[perfil('p1', 'Carla'), perfil('p2', 'Rafael')]} aoAbrir={() => {}} />
    </ProvedorDeTema>,
  );
  type No = { type: unknown; props: { accessibilityRole?: string; role?: string }; children: No[] };
  const raiz = screen.UNSAFE_root as unknown as { findAll: (f: (n: No) => boolean) => No[] };
  const lista = raiz.findAll((n) => typeof n.type === 'string' && (n.props.accessibilityRole === 'list' || n.props.role === 'list'))[0]!;
  const filhos = lista.children;
  expect(filhos).toHaveLength(2);
  for (const f of filhos) expect(f.props.role ?? f.props.accessibilityRole).toBe('listitem');
});
