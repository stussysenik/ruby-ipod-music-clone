import { DIM } from './svg_dimensions'

const SVG_NS = 'http://www.w3.org/2000/svg'
const XHTML_NS = 'http://www.w3.org/1999/xhtml'

function el(tag, attrs = {}, children = []) {
  const e = document.createElementNS(SVG_NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v)
  for (const c of children) {
    if (typeof c === 'string') e.appendChild(document.createTextNode(c))
    else e.appendChild(c)
  }
  return e
}

function buildDefs() {
  const defs = el('defs')

  // Brushed aluminum gradient
  const bodyGrad = el('linearGradient', { id: 'bodyGradient', x1: '0', y1: '0', x2: '1', y2: '1' })
  bodyGrad.append(
    el('stop', { offset: '0%', 'stop-color': '#e8e8e8' }),
    el('stop', { offset: '25%', 'stop-color': '#d4d4d4' }),
    el('stop', { offset: '50%', 'stop-color': '#e0e0e0' }),
    el('stop', { offset: '75%', 'stop-color': '#c8c8c8' }),
    el('stop', { offset: '100%', 'stop-color': '#d8d8d8' })
  )
  defs.append(bodyGrad)

  // Bezel gradient
  const bezelGrad = el('linearGradient', { id: 'bezelGradient', x1: '0', y1: '0', x2: '0', y2: '1' })
  bezelGrad.append(
    el('stop', { offset: '0%', 'stop-color': '#3a3a3a' }),
    el('stop', { offset: '50%', 'stop-color': '#1a1a1a' }),
    el('stop', { offset: '100%', 'stop-color': '#2a2a2a' })
  )
  defs.append(bezelGrad)

  // Wheel gradient
  const wheelGrad = el('radialGradient', { id: 'wheelGradient', cx: '50%', cy: '45%', r: '55%' })
  wheelGrad.append(
    el('stop', { offset: '0%', 'stop-color': '#f0f0f0' }),
    el('stop', { offset: '70%', 'stop-color': '#d0d0d0' }),
    el('stop', { offset: '100%', 'stop-color': '#b0b0b0' })
  )
  defs.append(wheelGrad)

  // Center button gradient
  const centerGrad = el('radialGradient', { id: 'centerGradient', cx: '45%', cy: '40%', r: '60%' })
  centerGrad.append(
    el('stop', { offset: '0%', 'stop-color': '#f8f8f8' }),
    el('stop', { offset: '100%', 'stop-color': '#d8d8d8' })
  )
  defs.append(centerGrad)

  // Screen glow gradient for backlight effect
  const screenGlow = el('radialGradient', { id: 'screenGlow', cx: '50%', cy: '50%', r: '70%' })
  screenGlow.append(
    el('stop', { offset: '0%', 'stop-color': '#1a2a4a', 'stop-opacity': '1' }),
    el('stop', { offset: '100%', 'stop-color': '#0a0f1a', 'stop-opacity': '1' })
  )
  defs.append(screenGlow)

  // Glass shine gradient for overlay
  const glassGrad = el('linearGradient', { id: 'glassShine', x1: '0', y1: '0', x2: '0', y2: '1' })
  glassGrad.append(
    el('stop', { offset: '0%', 'stop-color': '#ffffff', 'stop-opacity': '0.15' }),
    el('stop', { offset: '40%', 'stop-color': '#ffffff', 'stop-opacity': '0.02' }),
    el('stop', { offset: '100%', 'stop-color': '#ffffff', 'stop-opacity': '0' })
  )
  defs.append(glassGrad)

  // Noise filter for brushed metal texture
  const noiseFilter = el('filter', { id: 'noise', x: '0', y: '0', width: '100%', height: '100%' })
  noiseFilter.append(
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.9', numOctaves: '4', stitchTiles: 'stitch', result: 'noise' }),
    el('feColorMatrix', { type: 'saturate', values: '0', in: 'noise', result: 'grayNoise' }),
    el('feBlend', { in: 'SourceGraphic', in2: 'grayNoise', mode: 'multiply' })
  )
  defs.append(noiseFilter)

  // Drop shadow for body
  const shadowFilter = el('filter', { id: 'bodyShadow', x: '-10%', y: '-5%', width: '120%', height: '115%' })
  shadowFilter.append(
    el('feDropShadow', { dx: '0', dy: '8', 'stdDeviation': '12', 'flood-color': '#000000', 'flood-opacity': '0.5' })
  )
  defs.append(shadowFilter)

  // Specular lighting for chrome bezel
  const specFilter = el('filter', { id: 'chromeSpec', x: '-5%', y: '-5%', width: '110%', height: '110%' })
  specFilter.append(
    el('feSpecularLighting', {
      'specularExponent': '40', 'lighting-color': '#ffffff', result: 'specOut', 'surfaceScale': '2'
    }, [
      el('fePointLight', { x: '160', y: '20', z: '200' })
    ]),
    el('feComposite', { in: 'specOut', in2: 'SourceAlpha', operator: 'in', result: 'specClip' }),
    el('feComposite', { in: 'SourceGraphic', in2: 'specClip', operator: 'arithmetic', k1: '0', k2: '1', k3: '0.3', k4: '0' })
  )
  defs.append(specFilter)

  return defs
}

function buildBody() {
  const g = el('g', { id: 'ipod-body' })

  // Main body with shadow
  g.append(el('rect', {
    x: 0, y: 0,
    width: DIM.body.width, height: DIM.body.height,
    rx: DIM.body.rx,
    fill: 'url(#bodyGradient)',
    filter: 'url(#bodyShadow)',
    stroke: '#999',
    'stroke-width': '1'
  }))

  // Brushed metal overlay
  g.append(el('rect', {
    x: 0, y: 0,
    width: DIM.body.width, height: DIM.body.height,
    rx: DIM.body.rx,
    fill: 'url(#bodyGradient)',
    filter: 'url(#noise)',
    opacity: '0.4'
  }))

  return g
}

function buildBezel() {
  const g = el('g', { id: 'ipod-bezel' })

  // Dark chrome bezel
  g.append(el('rect', {
    x: DIM.bezel.x, y: DIM.bezel.y,
    width: DIM.bezel.width, height: DIM.bezel.height,
    rx: DIM.bezel.rx,
    fill: 'url(#bezelGradient)',
    filter: 'url(#chromeSpec)'
  }))

  return g
}

function buildScreen() {
  const g = el('g', { id: 'ipod-screen' })

  // Screen background — dark base that shows when no WebGPU
  g.append(el('rect', {
    x: DIM.screen.x, y: DIM.screen.y,
    width: DIM.screen.width, height: DIM.screen.height,
    fill: 'url(#screenGlow)',
    rx: '2'
  }))

  // No foreignObject — screen content is rendered as a separate HTML layer
  return g
}

function buildClickWheel() {
  const { cx, cy, outerRadius, innerRadius, buttons } = DIM.wheel
  const g = el('g', { id: 'ipod-wheel', cursor: 'pointer' })

  // Outer wheel ring
  g.append(el('circle', {
    cx, cy, r: outerRadius,
    fill: 'url(#wheelGradient)',
    stroke: '#aaa',
    'stroke-width': '1'
  }))

  // Wheel track groove
  g.append(el('circle', {
    cx, cy, r: (outerRadius + innerRadius) / 2,
    fill: 'none',
    stroke: '#c0c0c0',
    'stroke-width': '0.5',
    opacity: '0.5'
  }))

  // Center button
  g.append(el('circle', {
    cx, cy, r: innerRadius,
    fill: 'url(#centerGradient)',
    stroke: '#bbb',
    'stroke-width': '1',
    id: 'wheel-center'
  }))

  // Button labels
  const labelRadius = (outerRadius + innerRadius) / 2 + 2
  const labelPositions = {
    menu:      { x: cx,                y: cy - labelRadius, anchor: 'middle' },
    next:      { x: cx + labelRadius,  y: cy + 4,          anchor: 'middle' },
    playpause: { x: cx,                y: cy + labelRadius + 5, anchor: 'middle' },
    prev:      { x: cx - labelRadius,  y: cy + 4,          anchor: 'middle' }
  }

  for (const [key, btn] of Object.entries(buttons)) {
    const pos = labelPositions[key]
    const text = el('text', {
      x: pos.x, y: pos.y,
      'text-anchor': pos.anchor,
      'font-family': "'Helvetica Neue', sans-serif",
      'font-size': key === 'menu' ? '10' : '9',
      'font-weight': key === 'menu' ? '600' : '400',
      fill: '#666',
      'pointer-events': 'none'
    }, [btn.label])
    g.append(text)
  }

  // Invisible hit-zone arcs for button detection
  for (const [key, btn] of Object.entries(buttons)) {
    const startRad = (btn.startAngle - 90) * Math.PI / 180
    const endRad = (btn.endAngle - 90) * Math.PI / 180
    const r = outerRadius
    const ir = innerRadius + 2

    const x1 = cx + r * Math.cos(startRad)
    const y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad)
    const y2 = cy + r * Math.sin(endRad)
    const x3 = cx + ir * Math.cos(endRad)
    const y3 = cy + ir * Math.sin(endRad)
    const x4 = cx + ir * Math.cos(startRad)
    const y4 = cy + ir * Math.sin(startRad)

    const largeArc = (btn.endAngle - btn.startAngle) > 180 ? 1 : 0

    const d = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${ir} ${ir} 0 ${largeArc} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ')

    g.append(el('path', {
      d,
      fill: 'transparent',
      'data-button': key,
      class: 'wheel-button-zone'
    }))
  }

  return g
}

function buildGlassOverlay() {
  const svg = el('svg', {
    viewBox: DIM.viewBox,
    width: DIM.body.width,
    height: DIM.body.height,
    style: 'position: absolute; top: 0; left: 0; pointer-events: none;'
  })

  const defs = el('defs')
  const glassGrad = el('linearGradient', { id: 'glassOverlayGrad', x1: '0', y1: '0', x2: '0.3', y2: '1' })
  glassGrad.append(
    el('stop', { offset: '0%', 'stop-color': '#ffffff', 'stop-opacity': '0.08' }),
    el('stop', { offset: '50%', 'stop-color': '#ffffff', 'stop-opacity': '0' }),
    el('stop', { offset: '100%', 'stop-color': '#000000', 'stop-opacity': '0.05' })
  )
  defs.append(glassGrad)
  svg.append(defs)

  // Screen glass shine
  svg.append(el('rect', {
    x: DIM.screen.x, y: DIM.screen.y,
    width: DIM.screen.width, height: DIM.screen.height,
    fill: 'url(#glassOverlayGrad)',
    rx: '2'
  }))

  // Subtle top edge highlight on body
  svg.append(el('rect', {
    x: 2, y: 2,
    width: DIM.body.width - 4, height: DIM.body.height / 3,
    rx: DIM.body.rx,
    fill: 'url(#glassShine)',
    opacity: '0.6'
  }))

  return svg
}

export function buildIpodSVG() {
  const svg = el('svg', {
    viewBox: DIM.viewBox,
    width: DIM.body.width,
    height: DIM.body.height,
    id: 'ipod-svg',
    style: 'display: block;'
  })

  svg.append(buildDefs())
  svg.append(buildBody())
  svg.append(buildBezel())
  svg.append(buildScreen())
  svg.append(buildClickWheel())

  return svg
}

export function buildGlassSVG() {
  return buildGlassOverlay()
}
