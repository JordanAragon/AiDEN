import { useEffect, useState } from "react";
import { DotGrid, FilmGrain, Fog, Glass, RadialGradient, Shader, SolidColor, Vignette } from "shaders/react";
import { sdfIsotipo } from "../sdfMarca";
import { useEsAngosto } from "../useEsAngosto";

/*
  El isotipo en vidrio: el símbolo extruido como una pieza sólida, con bisel,
  que refracta lo que tiene detrás (un sembrado de puntos musgo bajo la niebla).
  Con cursor, la pieza gira siguiéndolo con un resorte; sin cursor se mece sola;
  con movimiento reducido queda quieta en tres cuartos. Es lo que permanece
  cuando el cuaderno se moja y la memoria se va.
*/

const REPOSO = { rotX: 14, rotY: -24 };

function giro(cursor, quieto) {
  if (quieto) return REPOSO;
  if (cursor) {
    return {
      rotX: { type: "mouse", axis: "y", outputMin: 26, outputMax: -6, smoothing: 0.35, momentum: 0.35 },
      rotY: { type: "mouse", axis: "x", outputMin: -48, outputMax: 34, smoothing: 0.35, momentum: 0.35 },
    };
  }
  return {
    rotX: 12,
    rotY: { type: "auto-animate", mode: "ping-pong", outputMin: -34, outputMax: 18, speed: 0.07, easing: "sine" },
  };
}

export default function EscenaVidrio({ className, quieto, cursor, onLista, onSinGpu }) {
  const [campo, setCampo] = useState("");
  const angosto = useEsAngosto();
  const ritmo = quieto ? 0 : 1;

  useEffect(() => {
    let vigente = true;
    sdfIsotipo()
      .then((url) => {
        if (vigente) setCampo(url);
      })
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, []);

  return (
    <Shader className={className} disableTelemetry onReady={onLista} onUnavailable={onSinGpu}>
      <SolidColor color="#071b11" />
      <RadialGradient colorA="#718b58" colorB="#071b11" center={angosto ? { x: 0.5, y: 0.72 } : { x: 0.74, y: 0.5 }} radius={0.55} opacity={0.7} />
      <DotGrid color="#d9ea73" density={angosto ? 34 : 44} dotSize={0.14} twinkle={quieto ? 0 : 0.4} opacity={0.32} />
      <Fog colorA="#071b11" colorB="#104a31" seed={3} speed={0.22 * ritmo} turbulence={0.6} detail={9} blending={0.5} opacity={0.55} />
      {campo && (
        <Glass
          shapeSdfUrl={campo}
          shape={{ type: "svgExtrude3D", depth: 0.14, bevel: 0.055, ...giro(cursor, quieto) }}
          center={angosto ? { x: 0.5, y: 0.74 } : { x: 0.74, y: 0.5 }}
          scale={angosto ? 0.62 : 1.05}
          refraction={0.9}
          thickness={0.32}
          edgeSoftness={0.06}
          aberration={0.45}
          innerZoom={1.3}
          highlight={0.42}
          highlightColor="#f3f6ef"
          highlightSoftness={0.4}
          fresnel={0.22}
          fresnelSoftness={0.18}
          fresnelColor="#d9ea73"
          tintColor="#d9ea73"
          tintIntensity={0.05}
          lightAngle={300}
        />
      )}
      <FilmGrain strength={0.09} bias={2} />
      <Vignette color="#071b11" radius={0.75} falloff={0.6} intensity={0.5} />
    </Shader>
  );
}
