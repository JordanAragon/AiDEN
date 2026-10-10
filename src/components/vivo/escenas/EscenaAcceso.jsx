import { CursorRipples, FilmGrain, FlutedGlass, Godrays, ImageTexture, Shader, Vignette } from "shaders/react";

/*
  La foto del vivero vista desde dentro del invernadero: el policarbonato
  acanalado la refracta, la luz lima entra por la esquina y el cursor deja
  ondas como un dedo sobre el vidrio húmedo. Con movimiento reducido, quieta.
*/
export default function EscenaAcceso({ className, quieto, cursor, onLista, onSinGpu, foto }) {
  const ritmo = quieto ? 0 : 1;
  return (
    <Shader className={className} disableTelemetry onReady={onLista} onUnavailable={onSinGpu}>
      <ImageTexture url={foto} objectFit="cover" />
      <Godrays center={{ x: 1, y: -0.05 }} rayColor="#d9ea73" density={0.2} intensity={0.45} spotty={0.4} speed={0.15 * ritmo} opacity={0.16} blendMode="screen" />
      <FlutedGlass frequency={12} softness={0.75} refraction={0.4} aberration={0.1} highlight={0.07} highlightSoftness={0.6} highlightColor="#f3f6ef" lightAngle={28} />
      {cursor && <CursorRipples intensity={6} decay={6} radius={0.35} chromaticSplit={0.4} />}
      <FilmGrain strength={0.08} bias={2} />
      <Vignette color="#071b11" radius={0.6} falloff={0.7} intensity={0.55} />
    </Shader>
  );
}
