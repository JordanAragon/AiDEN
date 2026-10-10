import { ContourLines, FilmGrain, RadialGradient, Shader, SimplexNoise, SolidColor } from "shaders/react";

/*
  Curvas de nivel que derivan despacio sobre el bosque: el terreno donde está
  el vivero, leído como un plano. Un relieve de ruido simplex se dibuja solo con
  sus isolíneas (musgo), y un brillo lima marca la cota más alta, donde está la
  pregunta. Es textura: nada aquí reacciona al cursor ni compite con el texto.
*/
export default function EscenaTopografia({ className, quieto, onLista, onSinGpu }) {
  const ritmo = quieto ? 0 : 1;
  return (
    <Shader className={className} disableTelemetry onReady={onLista} onUnavailable={onSinGpu}>
      <SolidColor color="#0b2b1b" />
      <RadialGradient colorA="#d9ea73" colorB="#0b2b1b" center={{ x: 0.22, y: 0.18 }} radius={0.7} opacity={0.07} />
      <ContourLines levels={10} lineWidth={1} softness={0.4} gamma={0.85} colorMode="custom" lineColor="#718b58" backgroundColor="transparent" opacity={0.3}>
        <SimplexNoise colorA="#000000" colorB="#ffffff" scale={1.35} contrast={0.1} seed={23} speed={0.035 * ritmo} />
      </ContourLines>
      <FilmGrain strength={0.08} bias={2} />
    </Shader>
  );
}
