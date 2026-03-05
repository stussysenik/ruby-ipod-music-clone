import { Controller } from "@hotwired/stimulus"
import { buildIpodSVG, buildGlassSVG } from "../ipod/svg/ipod_svg"
import { DIM } from "../ipod/svg/svg_dimensions"
import { createStateMachine } from "../ipod/state_machine"
import { classifyPoint, createWheelTracker } from "../ipod/wheel_math"
import { renderScreen, renderScreenWithDirection } from "../ipod/screen_renderer"
import { createAudioEngine } from "../ipod/audio_engine"
import { initGPU } from "../webgpu/gpu_renderer"

export default class extends Controller {
  static targets = ["container", "svgLayer", "gpuCanvas", "screenContent", "glassLayer"]

  connect() {
    this.sm = createStateMachine()
    this.audio = createAudioEngine()
    this.wheelTracker = createWheelTracker()
    this.isDragging = false
    this.allTracks = []
    this.gpu = null
    this.animationId = null
    this.lastDirection = 'forward'

    this.buildSVG()
    this.setupWheelEvents()
    this.setupKeyboard()
    this.sm.subscribe((state) => this.onStateChange(state))
    this.fetchAllTracks()
    this.initGPU()
    this.startUpdateLoop()
  }

  disconnect() {
    if (this.animationId) cancelAnimationFrame(this.animationId)
  }

  buildSVG() {
    const svg = buildIpodSVG()
    this.svgLayerTarget.appendChild(svg)

    const glass = buildGlassSVG()
    this.glassLayerTarget.appendChild(glass)

    // Position GPU canvas over screen area
    const canvas = this.gpuCanvasTarget
    canvas.width = DIM.canvas.width * 2  // retina
    canvas.height = DIM.canvas.height * 2
    canvas.style.width = `${DIM.canvas.width}px`
    canvas.style.height = `${DIM.canvas.height}px`
    canvas.style.left = `${DIM.canvas.x}px`
    canvas.style.top = `${DIM.canvas.y}px`

    // Position screen content div over screen area
    const sc = this.screenContentTarget
    sc.style.left = `${DIM.screen.x}px`
    sc.style.top = `${DIM.screen.y}px`
    sc.style.width = `${DIM.screen.width}px`
    sc.style.height = `${DIM.screen.height}px`

    // Position glass layer
    this.glassLayerTarget.style.top = '0'
    this.glassLayerTarget.style.left = '0'
    this.glassLayerTarget.style.width = `${DIM.body.width}px`
    this.glassLayerTarget.style.height = `${DIM.body.height}px`

    this.svgElement = svg
  }

  setupWheelEvents() {
    const svg = this.svgElement

    const getCoords = (e) => {
      const rect = svg.getBoundingClientRect()
      const scaleX = DIM.body.width / rect.width
      const scaleY = DIM.body.height / rect.height
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      }
    }

    svg.addEventListener('pointerdown', (e) => {
      const { x, y } = getCoords(e)
      const hit = classifyPoint(x, y)

      if (hit.zone === 'center') {
        this.lastDirection = 'forward'
        this.sm.dispatch({ type: 'SELECT' })
        this.handleMenuAction()
        return
      }

      if (hit.zone === 'button') {
        this.handleButton(hit.button)
        return
      }

      if (hit.zone === 'ring') {
        this.isDragging = true
        this.wheelTracker.start(x, y)
        svg.setPointerCapture(e.pointerId)
      }
    })

    svg.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return
      const { x, y } = getCoords(e)
      const ticks = this.wheelTracker.update(x, y)

      for (let i = 0; i < Math.abs(ticks); i++) {
        this.sm.dispatch({ type: ticks > 0 ? 'SCROLL_DOWN' : 'SCROLL_UP' })
      }
    })

    svg.addEventListener('pointerup', (e) => {
      this.isDragging = false
      this.wheelTracker.stop()
    })

    svg.addEventListener('pointercancel', () => {
      this.isDragging = false
      this.wheelTracker.stop()
    })
  }

  handleButton(button) {
    switch (button) {
      case 'menu':
        this.lastDirection = 'back'
        this.sm.dispatch({ type: 'NAVIGATE_BACK' })
        break
      case 'playpause':
        this.sm.dispatch({ type: 'TOGGLE_PLAY_PAUSE' })
        this.syncPlayback()
        break
      case 'next':
        this.sm.dispatch({ type: 'NEXT_TRACK' })
        this.playCurrentTrack()
        break
      case 'prev':
        this.sm.dispatch({ type: 'PREV_TRACK' })
        this.playCurrentTrack()
        break
    }
  }

  handleMenuAction() {
    const state = this.sm.getState()

    if (state.screen === 'browse_list' && state.browseData) {
      const item = state.browseData.items[state.selectedIndex]
      if (item && item.file_path) {
        // It's a playable track
        const queue = state.browseData.items.filter(i => i.file_path)
        const queueIndex = queue.indexOf(item)
        this.sm.dispatch({
          type: 'PLAY_TRACK',
          payload: { track: item, queue, queueIndex }
        })
        this.playCurrentTrack()
        return
      }
      if (item && item.action === 'BROWSE_ALBUM_TRACKS') {
        this.fetchAlbumTracks(item.id)
        return
      }
      if (item && item.action === 'BROWSE_ARTIST_ALBUMS') {
        this.fetchArtistTracks(item.name)
        return
      }
    }

    // Check if we triggered a browse action
    const newState = this.sm.getState()
    if (newState.screen === 'browse_list' && newState.browseData && newState.browseData.loading) {
      this.fetchBrowseData(newState.browseData.type)
    }

    // Check for shuffle
    if (state.screen === 'menu') {
      const { menuPath, selectedIndex } = state
      // We need to detect if shuffle was selected
      const items = this.sm.getCurrentMenuItems()
      if (items[selectedIndex] && items[selectedIndex].label === 'Shuffle Songs') {
        this.shuffleAll()
      }
    }
  }

  async fetchAllTracks() {
    try {
      const resp = await fetch('/api/tracks')
      this.allTracks = await resp.json()
    } catch (e) {
      console.warn('Failed to fetch tracks:', e)
    }
  }

  async fetchBrowseData(type) {
    try {
      let items = []
      let title = ''

      switch (type) {
        case 'BROWSE_SONGS': {
          const resp = await fetch('/api/tracks')
          const tracks = await resp.json()
          items = tracks.map(t => ({ ...t, label: t.title }))
          title = 'Songs'
          break
        }
        case 'BROWSE_ALBUMS': {
          const resp = await fetch('/api/albums')
          const albums = await resp.json()
          items = albums.map(a => ({
            ...a, label: a.name, hasSubmenu: true,
            action: 'BROWSE_ALBUM_TRACKS'
          }))
          title = 'Albums'
          break
        }
        case 'BROWSE_ARTISTS': {
          const resp = await fetch('/api/artists')
          const artists = await resp.json()
          items = artists.map(a => ({
            ...a, label: a.name, hasSubmenu: true,
            action: 'BROWSE_ARTIST_ALBUMS'
          }))
          title = 'Artists'
          break
        }
        case 'BROWSE_PLAYLISTS': {
          const resp = await fetch('/api/playlists')
          const playlists = await resp.json()
          items = playlists.map(p => ({
            ...p, label: p.name, hasSubmenu: true,
            action: 'BROWSE_PLAYLIST_TRACKS'
          }))
          title = 'Playlists'
          break
        }
      }

      this.sm.dispatch({ type: 'SET_BROWSE_DATA', payload: { items, title } })
    } catch (e) {
      console.warn('Failed to fetch browse data:', e)
    }
  }

  async fetchAlbumTracks(albumId) {
    try {
      const resp = await fetch(`/api/albums/${albumId}`)
      const album = await resp.json()
      const items = album.tracks.map(t => ({
        ...t, label: t.title, album_name: album.name,
        cover_image_path: album.cover_image_path, artist_name: t.artist_name
      }))
      this.sm.dispatch({
        type: 'SET_BROWSE_DATA',
        payload: { items, title: album.name }
      })
      this.sm.dispatch({ type: 'SCROLL_UP' }) // reset to top
      // Fix index
      const state = this.sm.getState()
      while (state.selectedIndex > 0) {
        this.sm.dispatch({ type: 'SCROLL_UP' })
      }
    } catch (e) {
      console.warn('Failed to fetch album tracks:', e)
    }
  }

  async fetchArtistTracks(artistName) {
    try {
      const resp = await fetch('/api/tracks')
      const allTracks = await resp.json()
      const items = allTracks
        .filter(t => t.artist_name === artistName)
        .map(t => ({ ...t, label: t.title }))
      this.sm.dispatch({
        type: 'SET_BROWSE_DATA',
        payload: { items, title: artistName }
      })
    } catch (e) {
      console.warn('Failed to fetch artist tracks:', e)
    }
  }

  async shuffleAll() {
    if (this.allTracks.length === 0) await this.fetchAllTracks()
    const shuffled = [...this.allTracks].sort(() => Math.random() - 0.5)
    if (shuffled.length > 0) {
      this.sm.dispatch({
        type: 'PLAY_TRACK',
        payload: { track: shuffled[0], queue: shuffled, queueIndex: 0 }
      })
      this.playCurrentTrack()
    }
  }

  async playCurrentTrack() {
    const state = this.sm.getState()
    const track = state.playback.currentTrack
    if (!track || !track.file_path) return

    try {
      await this.audio.loadAndPlay(track.file_path)
      this.audio.setVolume(state.playback.volume)
      this.audio.onEnded(() => {
        this.sm.dispatch({ type: 'NEXT_TRACK' })
        this.playCurrentTrack()
      })
    } catch (e) {
      console.warn('Playback failed:', e)
    }
  }

  syncPlayback() {
    const state = this.sm.getState()
    if (state.playback.state === 'playing') {
      this.audio.play()
    } else if (state.playback.state === 'paused') {
      this.audio.pause()
    }
  }

  startUpdateLoop() {
    const tick = () => {
      this.animationId = requestAnimationFrame(tick)

      // Update position directly in DOM (avoid full re-render)
      if (this.audio.isPlaying()) {
        const pos = this.audio.getCurrentTime()
        const state = this.sm.getState()
        state.playback.position = pos
        this.updateProgressBar(pos, state.playback.duration)
      }

      // Update GPU effects
      if (this.gpu) {
        const state = this.sm.getState()
        this.gpu.render(state, this.audio.getFrequencyData())
      }
    }
    tick()
  }

  updateProgressBar(position, duration) {
    const progressEl = document.getElementById('np-progress')
    const posEl = document.getElementById('np-pos')
    const remEl = document.getElementById('np-remaining')
    if (progressEl) {
      const pct = duration > 0 ? (position / duration) * 100 : 0
      progressEl.style.width = `${pct}%`
    }
    if (posEl) {
      const m = Math.floor(position / 60)
      const s = Math.floor(position % 60)
      posEl.textContent = `${m}:${s.toString().padStart(2, '0')}`
    }
    if (remEl) {
      const rem = Math.max(0, duration - position)
      const m = Math.floor(rem / 60)
      const s = Math.floor(rem % 60)
      remEl.textContent = `-${m}:${s.toString().padStart(2, '0')}`
    }
  }

  onStateChange(state) {
    const items = this.sm.getCurrentMenuItems()
    const title = this.sm.getCurrentTitle()
    renderScreenWithDirection(state, items, title, this.lastDirection)
    this.lastDirection = 'forward'

    // Sync volume
    this.audio.setVolume(state.playback.volume)
  }

  setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          this.sm.dispatch({ type: 'SCROLL_UP' })
          break
        case 'ArrowDown':
          e.preventDefault()
          this.sm.dispatch({ type: 'SCROLL_DOWN' })
          break
        case 'ArrowRight':
        case 'Enter':
          e.preventDefault()
          this.lastDirection = 'forward'
          this.sm.dispatch({ type: 'SELECT' })
          this.handleMenuAction()
          break
        case 'ArrowLeft':
        case 'Escape':
          e.preventDefault()
          this.lastDirection = 'back'
          this.sm.dispatch({ type: 'NAVIGATE_BACK' })
          break
        case ' ':
          e.preventDefault()
          this.sm.dispatch({ type: 'TOGGLE_PLAY_PAUSE' })
          this.syncPlayback()
          break
      }
    })
  }

  async initGPU() {
    try {
      this.gpu = await initGPU(this.gpuCanvasTarget)
    } catch (e) {
      console.warn('WebGPU not available, using CSS fallback:', e)
      this.gpuCanvasTarget.style.display = 'none'
      this.useCSSFallback()
    }
  }

  useCSSFallback() {
    // Add CSS-based glow and background effects when WebGPU unavailable
    const container = this.containerTarget
    container.classList.add('css-fallback')
  }
}
