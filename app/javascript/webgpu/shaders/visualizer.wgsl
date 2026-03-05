struct Uniforms {
  time: f32,
  barCount: f32,
  _pad1: f32,
  _pad2: f32,
}

@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var<storage, read> freqData: array<f32>;

struct VertexOutput {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
}

@vertex
fn vs(@builtin(vertex_index) i: u32) -> VertexOutput {
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

@fragment
fn fs(in: VertexOutput) -> @location(0) vec4f {
  let bars = u32(u.barCount);
  let barIdx = u32(in.uv.x * f32(bars));

  // Sample frequency data
  let freq = freqData[barIdx] / 255.0;

  // Bar height from bottom
  let barHeight = freq * 0.8;
  let yFromBottom = 1.0 - in.uv.y;

  if (yFromBottom > barHeight) {
    return vec4f(0.0, 0.0, 0.0, 0.0); // transparent above bar
  }

  // Three-stop color gradient: green -> yellow -> red
  let normalizedY = yFromBottom / max(barHeight, 0.01);
  var color: vec3f;
  if (normalizedY < 0.5) {
    color = mix(vec3f(0.2, 0.8, 0.3), vec3f(0.9, 0.9, 0.2), normalizedY * 2.0);
  } else {
    color = mix(vec3f(0.9, 0.9, 0.2), vec3f(1.0, 0.3, 0.2), (normalizedY - 0.5) * 2.0);
  }

  // Bar gap (thin line between bars)
  let barLocalX = fract(in.uv.x * f32(bars));
  let gap = step(0.1, barLocalX) * step(barLocalX, 0.9);

  return vec4f(color * gap, gap * 0.9);
}
