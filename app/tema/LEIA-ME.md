# tema/

O tema é GERADO do `02-design/sistema-de-design/tokens.json` (1.8.0): `npm run gerar:tema` (ferramentas/gerar-tema.mjs) escreve `gerado/tokens.ts`. Nunca edite o gerado; mude o tokens.json e rode de novo.

- `ProvedorDeTema.tsx` — `useTema()`: claro/escuro (segue o sistema), cores, sombras, degradês, "reduzir movimento", "reduzir transparência", celular pequeno. `SobreposicaoDeCores` troca papéis dentro da foto e do vidro, como o CSS do mockup.
- `tipografia.ts` — `estiloDeTexto(nome)`: a escala fechada com a fonte pelo nome do arquivo (sem fontWeight; iOS).
- `movimento.ts` — durações, curvas, molas e o `esmaecer` de 160 ms (catálogo de movimento).
- `vibracao.ts` + `ProvedorDeVibracao.tsx` — `useVibrar()`, já com a chave "Vibração" do Perfil.
- `acessibilidade.ts` / `.web.ts` — as preferências do sistema, ao vivo.
- `fontes.ts` — o mapa das fontes para `useFonts` (Expo Go e navegador).

No navegador dá para forçar: `?tema=escuro`, `?movimento=reduzido`, `?transparencia=reduzida`.
