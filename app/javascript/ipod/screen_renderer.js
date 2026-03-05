// Renders iPod screen content — menu lists, now playing, browse lists

const HEADER_HEIGHT = 22
const ITEM_HEIGHT = 22
const MAX_VISIBLE_ITEMS = 7

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function renderHeader(title, hasPlayback) {
  return `
    <div style="
      height: ${HEADER_HEIGHT}px;
      background: linear-gradient(180deg, #4a6fa5 0%, #2d4a7a 100%);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 8px;
      font-size: 11px;
      font-weight: 600;
      color: #fff;
      border-bottom: 1px solid #1a3a6a;
    ">
      <span>${title}</span>
      ${hasPlayback ? '<span style="font-size: 9px;">&#9654;</span>' : ''}
    </div>
  `
}

function renderMenuList(items, selectedIndex, title, hasPlayback) {
  const scrollOffset = Math.max(0, selectedIndex - MAX_VISIBLE_ITEMS + 1)
  const visibleItems = items.slice(scrollOffset, scrollOffset + MAX_VISIBLE_ITEMS)

  const itemsHtml = visibleItems.map((item, i) => {
    const actualIndex = scrollOffset + i
    const isSelected = actualIndex === selectedIndex
    const hasSubmenu = item.children || item.hasSubmenu

    return `
      <div style="
        height: ${ITEM_HEIGHT}px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 8px;
        ${isSelected ?
          'background: linear-gradient(180deg, #4a8cff 0%, #2060d0 100%); color: #fff;' :
          'background: transparent; color: #e8e8e8;'}
        font-size: 13px;
        box-sizing: border-box;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      ">
        <span style="overflow: hidden; text-overflow: ellipsis;">${item.label || item.title || item.name}</span>
        ${hasSubmenu ? '<span style="font-size: 10px; opacity: 0.7;">&#9654;</span>' : ''}
      </div>
    `
  }).join('')

  // Scroll indicator
  const showScrollUp = scrollOffset > 0
  const showScrollDown = scrollOffset + MAX_VISIBLE_ITEMS < items.length

  return `
    ${renderHeader(title, hasPlayback)}
    <div style="position: relative;">
      ${itemsHtml}
      ${showScrollUp ? '<div style="position: absolute; top: 0; right: 4px; font-size: 8px; color: #888;">&#9650;</div>' : ''}
      ${showScrollDown ? '<div style="position: absolute; bottom: 0; right: 4px; font-size: 8px; color: #888;">&#9660;</div>' : ''}
    </div>
  `
}

function renderNowPlaying(playback) {
  const track = playback.currentTrack
  if (!track) return '<div style="color: #888; padding: 20px; text-align: center;">No track selected</div>'

  const progress = playback.duration > 0 ? (playback.position / playback.duration) * 100 : 0
  const isPlaying = playback.state === 'playing'

  return `
    ${renderHeader('Now Playing', false)}
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 12px;
      height: 170px;
      box-sizing: border-box;
    ">
      <div style="
        width: 70px; height: 70px;
        background: ${track.cover_image_path ?
          `url(${track.cover_image_path}) center/cover` :
          'linear-gradient(135deg, #4a6fa5, #2d4a7a)'};
        border-radius: 4px;
        margin-bottom: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      "></div>
      <div style="
        text-align: center;
        width: 100%;
        overflow: hidden;
      ">
        <div id="now-playing-title" style="
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        ">${track.title}</div>
        <div style="
          font-size: 11px;
          color: #aac;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        ">${track.artist_name} — ${track.album_name || ''}</div>
      </div>
      <div style="
        width: 100%;
        margin-top: auto;
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #8899bb;
          margin-bottom: 2px;
        ">
          <span id="np-pos">${formatTime(playback.position)}</span>
          <span>${isPlaying ? '&#9654;' : '&#10074;&#10074;'}</span>
          <span id="np-remaining">-${formatTime(Math.max(0, playback.duration - playback.position))}</span>
        </div>
        <div style="
          width: 100%;
          height: 4px;
          background: #1a2a4a;
          border-radius: 2px;
          overflow: hidden;
        ">
          <div id="np-progress" style="
            width: ${progress}%;
            height: 100%;
            background: linear-gradient(90deg, #4a8cff, #6aacff);
            border-radius: 2px;
            transition: width 0.3s linear;
          "></div>
        </div>
        <div style="
          margin-top: 4px;
          height: 3px;
          background: #1a2a4a;
          border-radius: 2px;
          overflow: hidden;
        ">
          <div style="
            width: ${playback.volume * 100}%;
            height: 100%;
            background: linear-gradient(90deg, #3a6a3a, #5a9a5a);
            border-radius: 2px;
          "></div>
        </div>
      </div>
    </div>
  `
}

export function renderScreen(state, menuItems, title) {
  const container = document.getElementById('ipod-screen-content')
  if (!container) return

  const hasPlayback = state.playback.state !== 'stopped'

  let html = ''

  if (state.screen === 'now_playing') {
    html = renderNowPlaying(state.playback)
  } else {
    html = renderMenuList(menuItems, state.selectedIndex, title, hasPlayback)
  }

  // Slide animation: track direction
  const wrapper = container.querySelector('.screen-slide-wrapper')
  if (wrapper) {
    container.innerHTML = `<div class="screen-slide-wrapper" style="animation: slideInRight 0.15s ease-out;">${html}</div>`
  } else {
    container.innerHTML = `<div class="screen-slide-wrapper">${html}</div>`
  }
}

export function renderScreenWithDirection(state, menuItems, title, direction) {
  const container = document.getElementById('ipod-screen-content')
  if (!container) return

  const hasPlayback = state.playback.state !== 'stopped'

  let html = ''

  if (state.screen === 'now_playing') {
    html = renderNowPlaying(state.playback)
  } else {
    html = renderMenuList(menuItems, state.selectedIndex, title, hasPlayback)
  }

  const anim = direction === 'forward' ? 'slideInRight' : 'slideInLeft'
  container.innerHTML = `<div class="screen-slide-wrapper" style="animation: ${anim} 0.2s ease-out;">${html}</div>`
}
