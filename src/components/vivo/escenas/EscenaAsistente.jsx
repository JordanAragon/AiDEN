import { FilmGrain, MeshGradient, RadialGradient, Shader, SolidColor, Vignette } from "shaders/react";

/*
  El fondo del asistente: una malla de luz en los verdes de la marca que deriva
  despacio. Mientras el asistente consulta los registros, un brillo lima respira
  detrás de la ventana del chat; cuando responde, se apaga.
*/
export default function EscenaAsistente({ className, quieto, onLista, onSinGpu, pensando = false }) {
  const ritmo = quieto ? 0 : 1;
  const brillo =
    pensando && !quieto ? { type: "auto-animate", mode: "ping-pong", outputMin: 0.06, outputMax: 0.3, speed: 1.1, easing: "sine" } : 0.07;
  return (
    <Shader className={className} disableTelemetry onReady={onLista} onUnavailable={onSinGpu}>
      <SolidColor color="#0b2b1b" />
      <MeshGradient
        stops={[
          { color: "#071b11", position: 0 },
          { color: "#0b2f20", position: 0.35 },
          { color: "#104a31", position: 0.7 },
          { color: "#718b58", position: 1 },
        ]}
        count={5}
        smoothness={2.4}
        variation={0.3}
        swirl={0.25}
        drift={0.4}
        speed={0.12 * ritmo}
        seed={11}
        opacity={0.6}
      />
      <RadialGradient colorA="#d9ea73" colorB="#0b2b1b" center={{ x: 0.72, y: 0.5 }} radius={0.6} opacity={brillo} blendMode="screen" />
      <FilmGrain strength={0.08} bias={2} />
      <Vignette color="#071b11" radius={0.8} falloff={0.6} intensity={0.45} />
    </Shader>
  );
}
