struct Uniforms {
  viewProjection: mat4x4f,
  time: f32,
  selectedIndex: f32,
  coverCount: f32,
  reflection: f32,  // 0.0 = normal pass, 1.0 = reflection pass
}

struct CoverInstance {
  model: mat4x4f,
  texIndex: f32,
  alpha: f32,
  _pad1: f32,
  _pad2: f32,
}

@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var<storage, read> covers: array<CoverInstance>;
@group(0) @binding(2) var coverTexture: texture_2d<f32>;
@group(0) @binding(3) var coverSampler: sampler;

struct VertexOutput {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
  @location(1) alpha: f32,
}

@vertex
fn vs(@builtin(vertex_index) vid: u32, @builtin(instance_index) iid: u32) -> VertexOutput {
  // Quad vertices for each cover
  var quadPos = array<vec2f, 6>(
    vec2f(-0.5, -0.5), vec2f(0.5, -0.5), vec2f(-0.5, 0.5),
    vec2f(-0.5, 0.5), vec2f(0.5, -0.5), vec2f(0.5, 0.5)
  );
  var quadUV = array<vec2f, 6>(
    vec2f(0.0, 1.0), vec2f(1.0, 1.0), vec2f(0.0, 0.0),
    vec2f(0.0, 0.0), vec2f(1.0, 1.0), vec2f(1.0, 0.0)
  );

  let cover = covers[iid];
  var localPos = vec4f(quadPos[vid], 0.0, 1.0);

  // Flip Y for reflection
  if (u.reflection > 0.5) {
    localPos.y = -localPos.y - 1.0;
  }

  let worldPos = cover.model * localPos;
  let clipPos = u.viewProjection * worldPos;

  var out: VertexOutput;
  out.pos = clipPos;
  out.uv = quadUV[vid];

  // Reflection alpha fades out
  if (u.reflection > 0.5) {
    let fadeY = quadUV[vid].y;
    out.alpha = cover.alpha * (1.0 - fadeY) * 0.3;
  } else {
    out.alpha = cover.alpha;
  }

  return out;
}

@fragment
fn fs(in: VertexOutput) -> @location(0) vec4f {
  let color = textureSample(coverTexture, coverSampler, in.uv);
  return vec4f(color.rgb, color.a * in.alpha);
}
