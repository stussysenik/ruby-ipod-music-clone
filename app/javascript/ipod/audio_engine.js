// Web Audio API engine — handles playback and provides analyser data

export function createAudioEngine() {
  let audioContext = null
  let currentSource = null
  let gainNode = null
  let analyserNode = null
  let audioElement = null
  let mediaSource = null
  let isInitialized = false

  function ensureContext() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
      gainNode = audioContext.createGain()
      analyserNode = audioContext.createAnalyser()
      analyserNode.fftSize = 256
      analyserNode.smoothingTimeConstant = 0.8
      gainNode.connect(analyserNode)
      analyserNode.connect(audioContext.destination)
      isInitialized = true
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }
    return audioContext
  }

  async function loadAndPlay(filePath) {
    ensureContext()

    // Clean up previous
    if (audioElement) {
      audioElement.pause()
      audioElement.removeAttribute('src')
      audioElement.load()
    }
    if (mediaSource) {
      mediaSource.disconnect()
      mediaSource = null
    }

    // Use HTML Audio element for streaming compatibility
    audioElement = new Audio(filePath)
    audioElement.crossOrigin = 'anonymous'

    mediaSource = audioContext.createMediaElementSource(audioElement)
    mediaSource.connect(gainNode)

    await audioElement.play()
    return audioElement
  }

  function play() {
    if (audioElement) {
      ensureContext()
      audioElement.play()
    }
  }

  function pause() {
    if (audioElement) audioElement.pause()
  }

  function seek(time) {
    if (audioElement) audioElement.currentTime = time
  }

  function setVolume(v) {
    if (gainNode) gainNode.gain.value = Math.max(0, Math.min(1, v))
  }

  function getCurrentTime() {
    return audioElement ? audioElement.currentTime : 0
  }

  function getDuration() {
    return audioElement && isFinite(audioElement.duration) ? audioElement.duration : 0
  }

  function isPlaying() {
    return audioElement && !audioElement.paused
  }

  function getFrequencyData() {
    if (!analyserNode) return new Uint8Array(0)
    const data = new Uint8Array(analyserNode.frequencyBinCount)
    analyserNode.getByteFrequencyData(data)
    return data
  }

  function onEnded(callback) {
    if (audioElement) {
      audioElement.addEventListener('ended', callback, { once: true })
    }
  }

  function getAnalyserNode() {
    return analyserNode
  }

  function getAudioContext() {
    return audioContext
  }

  return {
    loadAndPlay, play, pause, seek, setVolume,
    getCurrentTime, getDuration, isPlaying,
    getFrequencyData, onEnded,
    getAnalyserNode, getAudioContext,
    get initialized() { return isInitialized }
  }
}
