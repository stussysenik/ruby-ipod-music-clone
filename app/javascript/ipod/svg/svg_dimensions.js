// Single source of truth for all iPod dimensions
export const DIM = {
  // Overall iPod body
  body: { width: 320, height: 540, rx: 24 },

  // Screen bezel (dark chrome frame)
  bezel: { x: 24, y: 40, width: 272, height: 208, rx: 6 },

  // Visible screen area
  screen: { x: 32, y: 48, width: 256, height: 192 },

  // Click wheel
  wheel: {
    cx: 160, cy: 400,
    outerRadius: 90,
    innerRadius: 36,
    // Button hit zones (angle ranges in degrees, 0 = top)
    buttons: {
      menu:     { startAngle: -45,  endAngle: 45,   label: 'MENU' },
      next:     { startAngle: 45,   endAngle: 135,  label: '\u25B6\u25B6\u2759' },
      playpause:{ startAngle: 135,  endAngle: 225,  label: '\u25B6\u2759\u2759' },
      prev:     { startAngle: 225,  endAngle: 315,  label: '\u2759\u25C0\u25C0' }
    }
  },

  // SVG viewBox
  viewBox: '0 0 320 540',

  // Screen content area (inside foreignObject)
  content: { x: 32, y: 48, width: 256, height: 192 },

  // Canvas overlay position (aligned with screen)
  canvas: { x: 32, y: 48, width: 256, height: 192 }
}
