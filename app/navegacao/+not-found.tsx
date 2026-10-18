import { Link } from 'expo-router';
import { View } from 'react-native';
import { EstadoVazio, Texto } from '@/componentes';
import { useTema } from '@/tema';

export default function NaoEncontrada() {
  const { cores } = useTema();
  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo, justifyContent: 'center' }}>
      <EstadoVazio titulo="Esta tela não existe" texto="Volte ao começo do app." icone="alerta">
        <Link href="/">
          <Texto variante="corpoForte" cor="marca">
            Voltar ao começo
          </Texto>
        </Link>
      </EstadoVazio>
    </View>
  );
}
