struct Uniforms {
  time: f32,
  screen: u32,    // 0 = menu, 1 = now_playing
  volume: f32,
  _pad: f32,
  color1: vec4f,
  color2: vec4f,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

struct VertexOutput {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
}

@vertex
fn vs(@builtin(vertex_index) i: u32) -> VertexOutput {
  // Fullscreen quad: 2 triangles from 6 vertices
  var positions = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0),
    vec2f(-1.0, 1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0)
  );
  var uvs = array<vec2f, 6>(
    vec2f(0.0, 1.0), vec2f(1.0, 1.0), vec2f(0.0, 0.0),
    vec2f(0.0, 0.0), vec2f(1.0, 1.0), vec2f(1.0, 0.0)
  );

  var out: VertexOutput;
  out.pos = vec4f(positions[i], 0.0, 1.0);
  out.uv = uvs[i];
  return out;
}

// Simplex-ish noise
fn hash(p: vec2f) -> f32 {
  let h = dot(p, vec2f(127.1, 311.7));
  return fract(sin(h) * 43758.5453);
}

fn noise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2f(1.0, 0.0)), u.x),
    mix(hash(i + vec2f(0.0, 1.0)), hash(i + vec2f(1.0, 1.0)), u.x),
    u.y
  );
}

@fragment
fn fs(in: VertexOutput) -> @location(0) vec4f {
  let t = u.time * 0.3;

  // Animated gradient with noise
  let n = noise(in.uv * 3.0 + vec2f(t, t * 0.7)) * 0.3;
  let gradient = mix(u.color1.rgb, u.color2.rgb, in.uv.y + n);

  // Vignette
  let center = in.uv - vec2f(0.5);
  let vignette = 1.0 - dot(center, center) * 1.2;

  let color = gradient * vignette;

  // Slight alpha for compositing over SVG screen
  return vec4f(color, 0.85);
}
