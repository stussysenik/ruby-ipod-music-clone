// Main GPU render loop coordinator

import { createGPUContext } from './gpu_context'
import { createGradientPipeline } from './gradient_background'
import { createVisualizerPipeline } from './visualizer_renderer'

export async function initGPU(canvas) {
  const gpu = await createGPUContext(canvas)
  const gradient = createGradientPipeline(gpu)
  const visualizer = createVisualizerPipeline(gpu)

  function render(state, freqData) {
    const textureView = gpu.context.getCurrentTexture().createView()

    const encoder = gpu.device.createCommandEncoder()

    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: textureView,
        clearValue: { r: 0, g: 0, b: 0, a: 0 }, // transparent clear for compositing
        loadOp: 'clear',
        storeOp: 'store'
      }]
    })

    // Always render gradient background
    gradient.render(pass, state)

    // Render visualizer only during playback on now-playing screen
    if (state.screen === 'now_playing' && state.playback.state === 'playing') {
      visualizer.render(pass, freqData)
    }

    pass.end()
    gpu.device.queue.submit([encoder.finish()])
  }

  return { render, gpu }
}
