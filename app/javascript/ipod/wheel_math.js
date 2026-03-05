import { DIM } from './svg/svg_dimensions'

const DEG_PER_TICK = 15
const { cx, cy, outerRadius, innerRadius } = DIM.wheel

export function classifyPoint(x, y) {
  const dx = x - cx
  const dy = y - cy
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist <= innerRadius) return { zone: 'center' }
  if (dist > outerRadius) return { zone: 'outside' }

  // Angle in degrees, 0 = top (north), clockwise positive
  let angle = Math.atan2(dx, -dy) * 180 / Math.PI
  if (angle < 0) angle += 360

  const { buttons } = DIM.wheel
  for (const [name, btn] of Object.entries(buttons)) {
    let start = btn.startAngle
    let end = btn.endAngle
    if (start < 0) start += 360
    if (end < 0) end += 360

    if (start < end) {
      if (angle >= start && angle < end) return { zone: 'button', button: name }
    } else {
      if (angle >= start || angle < end) return { zone: 'button', button: name }
    }
  }

  return { zone: 'ring', angle }
}

export function createWheelTracker() {
  let lastAngle = null
  let accumulated = 0

  function getAngle(x, y) {
    const dx = x - cx
    const dy = y - cy
    return Math.atan2(dx, -dy) * 180 / Math.PI
  }

  function start(x, y) {
    lastAngle = getAngle(x, y)
    accumulated = 0
  }

  function update(x, y) {
    if (lastAngle === null) return 0

    const currentAngle = getAngle(x, y)
    let delta = currentAngle - lastAngle

    // Handle wraparound at +/-180
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360

    accumulated += delta
    lastAngle = currentAngle

    let ticks = 0
    while (accumulated >= DEG_PER_TICK) {
      ticks++
      accumulated -= DEG_PER_TICK
    }
    while (accumulated <= -DEG_PER_TICK) {
      ticks--
      accumulated += DEG_PER_TICK
    }

    return ticks // positive = clockwise = scroll down
  }

  function stop() {
    lastAngle = null
    accumulated = 0
  }

  return { start, update, stop }
}
