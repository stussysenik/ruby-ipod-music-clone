// Audio frequency visualizer bars

import visualizerShaderCode from './shaders/visualizer.wgsl'

const BAR_COUNT = 32

export function createVisualizerPipeline(gpu) {
  const { device, format } = gpu

  const uniformBuffer = device.createBuffer({
    size: 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  })

  const freqBuffer = device.createBuffer({
    size: BAR_COUNT * 4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  })

  const shaderModule = device.createShaderModule({ code: visualizerShaderCode })

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } }
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
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } },
      { binding: 1, resource: { buffer: freqBuffer } }
    ]
  })

  let startTime = performance.now()

  function render(pass, freqData) {
    const time = (performance.now() - startTime) / 1000

    device.queue.writeBuffer(uniformBuffer, 0, new Float32Array([time, BAR_COUNT, 0, 0]))

    // Downsample frequency data to BAR_COUNT bars
    const downsampled = new Float32Array(BAR_COUNT)
    if (freqData && freqData.length > 0) {
      const step = Math.floor(freqData.length / BAR_COUNT)
      for (let i = 0; i < BAR_COUNT; i++) {
        let sum = 0
        for (let j = 0; j < step; j++) {
          sum += freqData[i * step + j] || 0
        }
        downsampled[i] = sum / step
      }
    }
    device.queue.writeBuffer(freqBuffer, 0, downsampled)

    pass.setPipeline(pipeline)
    pass.setBindGroup(0, bindGroup)
    pass.draw(6)
  }

  return { render }
}
