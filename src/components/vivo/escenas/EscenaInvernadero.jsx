import { FilmGrain, FlutedGlass, Fog, Godrays, RadialGradient, Shader, SolidColor, Vignette } from "shaders/react";
import { useEsAngosto } from "../useEsAngosto";

/*
  El invernadero de noche, la víspera del despacho. De atrás hacia adelante:
  la noche (forest-deep), la humedad que el cursor empuja, la luz lima que entra
  por la esquina y el policarbonato acanalado que la refracta. El isotipo
  sembrado (SembradoIsotipo) va delante, fuera del motor.
*/
export default function EscenaInvernadero({ className, quieto, cursor, onLista, onSinGpu }) {
  const angosto = useEsAngosto();
  const ritmo = quieto ? 0 : 1;

  return (
    <Shader className={className} disableTelemetry onReady={onLista} onUnavailable={onSinGpu}>
      <SolidColor color="#071b11" />
      <RadialGradient colorA="#d9ea73" colorB="#071b11" center={{ x: 0.9, y: 0 }} radius={0.75} opacity={0.09} />
      <Fog
        colorA="#071b11"
        colorB="#104a31"
        seed={7}
        speed={0.28 * ritmo}
        turbulence={0.7}
        detail={11}
        blending={0.55}
        mouseInfluence={cursor ? 0.22 : 0}
        mouseRadius={0.16}
        opacity={angosto ? 0.7 : 0.9}
      />
      <Godrays center={{ x: 0.94, y: -0.08 }} rayColor="#d9ea73" density={0.22} intensity={0.5} spotty={0.4} speed={0.18 * ritmo} opacity={0.12} blendMode="screen" />
      <FlutedGlass frequency={angosto ? 9 : 18} softness={0.7} refraction={0.55} aberration={0.12} highlight={0.06} highlightSoftness={0.55} highlightColor="#f3f6ef" lightAngle={24} />
      <FilmGrain strength={0.1} bias={2} />
      <Vignette color="#071b11" radius={0.7} falloff={0.6} intensity={0.55} />
    </Shader>
  );
}
