struct Uniforms {
  direction: vec2f,  // (1,0) for horizontal, (0,1) for vertical
  intensity: f32,
  _pad: f32,
}

@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var srcTexture: texture_2d<f32>;
@group(0) @binding(2) var srcSampler: sampler;

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
  let texSize = vec2f(textureDimensions(srcTexture));
  let texelSize = 1.0 / texSize;

  // 9-tap Gaussian blur
  let weights = array<f32, 5>(0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);

  var result = textureSample(srcTexture, srcSampler, in.uv) * weights[0];

  for (var i = 1; i < 5; i++) {
    let offset = u.direction * texelSize * f32(i) * 2.0;
    result += textureSample(srcTexture, srcSampler, in.uv + offset) * weights[i];
    result += textureSample(srcTexture, srcSampler, in.uv - offset) * weights[i];
  }

  return result * u.intensity;
}
