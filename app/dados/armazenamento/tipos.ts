/**
 * O que o app guarda NO APARELHO: a fila de envio com dono (R12.3), as
 * preferências locais (último vínculo escolhido, vibração, o cronômetro, o
 * aviso dispensado) e as COLEÇÕES que o repositório local grava enquanto não
 * há servidor (vínculos, presenças, graduações, avisos, perfis, medições…;
 * agente AA, P11). Luta (P12): a presença nasce no telefone, como o treino
 * realizado nascia (R15.9), e mora na coleção `presencas`.
 * Tudo SÍNCRONO: a gravação acontece no mesmo quadro do toque, antes de
 * qualquer animação.
 *
 * Implementações:
 * - `banco.ts` — expo-sqlite (Android e iPhone), fora do backup do sistema
 *   (03-DECISOES-TECNICAS.md, seção 5);
 * - `banco.web.ts` — localStorage, só para ver o app no navegador do PC;
 * - `memoria.ts` — em memória, para os testes no Node.
 *
 * Toda ESCRITA que falha no motor (disco cheio, banco travado, navegador sem
 * espaço) lança `ErroDeArmazenamento` (`dados/erros.ts`) e não deixa nada
 * pela metade nem visível como gravado (agente AG, P11).
 */
import type { Id } from '../../dominio/tipos.ts';
import type { ItemDaFila } from '../../dominio/sincronizacao.ts';

export interface ArmazenamentoLocal {
  readonly tipo: 'sqlite' | 'navegador' | 'memoria';
  /** A fila inteira, de todas as contas que usaram o aparelho. */
  fila(): ItemDaFila[];
  gravarItemDaFila(item: ItemDaFila): void;
  removerItemDaFila(id: Id): void;
  lerPreferencia(chave: string): string | null;
  gravarPreferencia(chave: string, valor: string | null): void;
  /** Os registros de uma coleção (id → valor JSON), na ordem em que foram gravados pela primeira vez. */
  colecao(nome: string): [Id, unknown][];
  /** Grava (ou, com `null`, apaga) um registro da coleção. */
  gravarNaColecao(nome: string, id: Id, valor: unknown | null): void;
  /** Um item da fila pelo id (sem reler a fila inteira; agente AG). */
  itemDaFila(id: Id): ItemDaFila | null;
  /** Um registro da coleção pelo id (sem reler a coleção inteira; agente AG). */
  registroDaColecao(nome: string, id: Id): unknown | null;
  /**
   * Tudo ou nada (agente AG): as escritas de `f` vão juntas para o disco, ou
   * nenhuma vai. Se o app fecha no meio, ao reabrir não há treino gravado
   * fora da fila (a presença gravada sem o item da fila, por exemplo). Pode aninhar (a de dentro entra na de fora).
   */
  transacao<T>(f: () => T): T;
}
