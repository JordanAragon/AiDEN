import { ContourLines, FilmGrain, RadialGradient, Shader, SimplexNoise, SolidColor } from "shaders/react";

/*
  El fondo del pulso de la operación: un plano de curvas de nivel casi quieto y
  un brillo lima cuya intensidad depende de los asuntos abiertos. Sin riesgos el
  panel queda en calma; cuantos más asuntos, más calor en la esquina. Es la
  interfaz operativa: nada se mueve rápido ni compite con las cifras.
*/
export default function EscenaPulso({ className, quieto, onLista, onSinGpu, riesgos = 0 }) {
  const calor = Math.min(0.2, 0.04 + riesgos * 0.011);
  return (
    <Shader className={className} disableTelemetry onReady={onLista} onUnavailable={onSinGpu}>
      <SolidColor color="#0b2b1b" />
      <RadialGradient colorA="#d9ea73" colorB="#0b2b1b" center={{ x: 0.08, y: 0.05 }} radius={0.85} opacity={calor} />
      <ContourLines levels={9} lineWidth={1} softness={0.45} gamma={0.9} colorMode="custom" lineColor="#718b58" backgroundColor="transparent" opacity={0.18}>
        <SimplexNoise colorA="#000000" colorB="#ffffff" scale={1.6} contrast={0.1} seed={41} speed={quieto ? 0 : 0.02} />
      </ContourLines>
      <FilmGrain strength={0.07} bias={2} />
    </Shader>
  );
}
