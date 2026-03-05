// Animated gradient background for menu/now-playing screens

import gradientShaderCode from './shaders/gradient.wgsl'

const MENU_COLORS = {
  color1: [0.05, 0.08, 0.18, 1.0],
  color2: [0.1, 0.15, 0.3, 1.0]
}

const NOW_PLAYING_COLORS = {
  color1: [0.08, 0.05, 0.18, 1.0],
  color2: [0.15, 0.08, 0.25, 1.0]
}

export function createGradientPipeline(gpu) {
  const { device, format } = gpu

  const uniformBuffer = device.createBuffer({
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  })

  const shaderModule = device.createShaderModule({ code: gradientShaderCode })

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }
    ]
  })

  const pipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
    vertex: { module: shaderModule, entryPoint: 'vs' },
    fragment: {
      module: shaderModule,
      entryPoint: 'fs',
      targets: [{
        format,
        blend: {
          color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
          alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' }
        }
      }]
    },
    primitive: { topology: 'triangle-list' }
  })

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }]
  })

  let startTime = performance.now()

  function render(pass, state) {
    const time = (performance.now() - startTime) / 1000
    const isNowPlaying = state.screen === 'now_playing'
    const colors = isNowPlaying ? NOW_PLAYING_COLORS : MENU_COLORS

    const data = new Float32Array([
      time,
      isNowPlaying ? 1.0 : 0.0,
      state.playback.volume,
      0.0,
      ...colors.color1,
      ...colors.color2
    ])
    device.queue.writeBuffer(uniformBuffer, 0, data)

    pass.setPipeline(pipeline)
    pass.setBindGroup(0, bindGroup)
    pass.draw(6)
  }

  return { render }
}
