// WebGPU initialization with alpha compositing support

export async function createGPUContext(canvas) {
  if (!navigator.gpu) {
    throw new Error('WebGPU not supported')
  }

  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) {
    throw new Error('No WebGPU adapter found')
  }

  const device = await adapter.requestDevice()

  const context = canvas.getContext('webgpu')
  const format = navigator.gpu.getPreferredCanvasFormat()

  context.configure({
    device,
    format,
    alphaMode: 'premultiplied',  // Critical for SVG compositing
  })

  return { adapter, device, context, format, canvas }
}
