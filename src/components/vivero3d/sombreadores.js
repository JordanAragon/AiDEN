/*
  Sombreadores WGSL del vivero en 3D (vgpu). Todo en espacio sRGB: es una
  escena estilizada en la paleta de AiDEN, no un render físico. La niebla se
  funde con forest-deep, el fondo de los marcos nocturnos.
*/

const ESCENA = /* wgsl */ `
struct Escena {
  vp: mat4x4f,
  ojo: vec4f,
  luz: vec4f,
  fondo: vec4f,
  ajustes: vec4f,
};
@group(0) @binding(0) var<uniform> escena: Escena;

const LIMA = vec3f(0.851, 0.918, 0.451);

fn niebla(mundo: vec3f) -> f32 {
  let distancia = length(mundo - escena.ojo.xyz);
  return smoothstep(escena.ajustes.w * 0.42, escena.ajustes.w, distancia);
}
`;

// ajustes: x tiempo, y lote resaltado (-1 ninguno), z brisa (0 quieto), w distancia de niebla.
export const SOMBREADOR_PLANTAS = /* wgsl */ `
${ESCENA}

const ETAPA = array<vec3f, 4>(
  vec3f(0.78, 0.87, 0.47),
  vec3f(0.60, 0.75, 0.40),
  vec3f(0.45, 0.60, 0.33),
  vec3f(0.33, 0.50, 0.27),
);

struct Salida {
  @builtin(position) posicion: vec4f,
  @location(0) normal: vec3f,
  @location(1) color: vec3f,
  @location(2) mundo: vec3f,
  @location(3) foco: f32,
};

@vertex fn vs_main(
  @location(0) local: vec3f,
  @location(1) normalLocal: vec3f,
  @location(2) parte: f32,
  @location(3) base: vec4f,
  @location(4) datos: vec4f,
) -> Salida {
  let altura = base.w;
  let c = cos(datos.z);
  let s = sin(datos.z);
  var p = local * altura;
  p = vec3f(p.x * c - p.z * s, p.y, p.x * s + p.z * c);
  let n = vec3f(normalLocal.x * c - normalLocal.z * s, normalLocal.y, normalLocal.x * s + normalLocal.z * c);

  // La brisa mece más la punta que la base.
  let t = escena.ajustes.x;
  let fase = datos.w * 6.2831 + base.x * 0.31 + base.z * 0.23;
  let mecer = sin(t * 1.25 + fase) * 0.6 + sin(t * 2.3 + fase * 1.7) * 0.25;
  let curva = local.y * local.y * altura * escena.ajustes.z;
  p.x += mecer * curva * 0.16;
  p.z += mecer * curva * 0.07;

  let mundo = base.xyz + p;
  var out: Salida;
  out.posicion = escena.vp * vec4f(mundo, 1.0);
  out.normal = n;

  let etapa = u32(clamp(datos.x, 0.0, 3.0));
  var color = ETAPA[etapa];
  if (parte < 0.5) {
    color = vec3f(0.29, 0.38, 0.22);
  }
  color *= 0.86 + datos.w * 0.26;

  var foco = 0.0;
  let resaltado = escena.ajustes.y;
  if (resaltado > -0.5) {
    if (abs(datos.y - resaltado) < 0.5) {
      foco = 1.0;
      color = mix(color, LIMA, 0.42);
    } else {
      foco = -1.0;
    }
  }
  out.color = color;
  out.mundo = mundo;
  out.foco = foco;
  return out;
}

@fragment fn fs_main(entrada: Salida, @builtin(front_facing) frente: bool) -> @location(0) vec4f {
  var n = normalize(entrada.normal);
  if (!frente) {
    n = -n;
  }
  let l = normalize(escena.luz.xyz);
  let difusa = max(dot(n, l), 0.0);
  let cielo = 0.5 + 0.5 * n.y;
  var color = entrada.color * (0.34 + 0.55 * difusa + 0.22 * cielo);
  color += LIMA * 0.05 * max(n.y, 0.0);
  if (entrada.foco > 0.5) {
    color += LIMA * 0.1;
  }
  var bruma = niebla(entrada.mundo);
  if (entrada.foco < -0.5) {
    bruma = max(bruma, 0.5);
  }
  return vec4f(mix(color, escena.fondo.rgb, bruma), 1.0);
}
`;

export const SOMBREADOR_ESTATICO = /* wgsl */ `
${ESCENA}

struct Salida {
  @builtin(position) posicion: vec4f,
  @location(0) normal: vec3f,
  @location(1) color: vec4f,
  @location(2) mundo: vec3f,
};

@vertex fn vs_main(@location(0) posicion: vec3f, @location(1) normal: vec3f, @location(2) color: vec4f) -> Salida {
  var out: Salida;
  out.posicion = escena.vp * vec4f(posicion, 1.0);
  out.normal = normal;
  out.color = color;
  out.mundo = posicion;
  return out;
}

@fragment fn fs_main(entrada: Salida, @builtin(front_facing) frente: bool) -> @location(0) vec4f {
  var n = normalize(entrada.normal);
  if (!frente) {
    n = -n;
  }
  let l = normalize(escena.luz.xyz);
  let difusa = max(dot(n, l), 0.0);
  var color = entrada.color.rgb * (0.48 + 0.5 * difusa);
  var alfa = entrada.color.a;
  if (alfa < 0.99) {
    // Vidrio y malla: más visibles de canto, como el policarbonato al contraluz,
    // y acanalados (franjas suaves) como el techo del invernadero de la landing.
    let v = normalize(escena.ojo.xyz - entrada.mundo);
    let canto = 1.0 - abs(dot(n, v));
    let canal = 0.7 + 0.6 * smoothstep(0.35, 0.65, abs(fract((entrada.mundo.x + entrada.mundo.z) * 2.2) - 0.5) * 2.0);
    alfa = alfa * (0.55 + 1.6 * canto * canto) * canal;
    color = entrada.color.rgb * (0.7 + 0.3 * difusa) + LIMA * 0.04 * canto;
  }
  let bruma = niebla(entrada.mundo);
  return vec4f(mix(color, escena.fondo.rgb, bruma), alfa * (1.0 - bruma * 0.85));
}
`;

// post.ajustes: x tiempo, y grano, z viñeta.
export const SOMBREADOR_PRESENTAR = /* wgsl */ `
@group(0) @binding(0) var escenaColor: texture_2d<f32>;
@group(0) @binding(1) var muestreo: sampler;
struct Post {
  ajustes: vec4f,
};
@group(0) @binding(2) var<uniform> post: Post;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  var color = textureSampleLevel(escenaColor, muestreo, uv, 0.0).rgb;
  // La luz lima que entra por la esquina, como en el invernadero del hero.
  let esquina = distance(uv, vec2f(0.96, -0.06));
  color += vec3f(0.851, 0.918, 0.451) * 0.075 * (1.0 - smoothstep(0.0, 0.85, esquina));
  let d = distance(uv, vec2f(0.5, 0.46));
  color = mix(color, vec3f(0.027, 0.106, 0.067), smoothstep(0.42, 0.98, d) * post.ajustes.z);
  let ruido = fract(sin(dot(uv * 913.0 + vec2f(post.ajustes.x * 7.0, post.ajustes.x * 3.0), vec2f(12.9898, 78.233))) * 43758.5453) - 0.5;
  color += vec3f(ruido * post.ajustes.y);
  return vec4f(color, 1.0);
}
`;
