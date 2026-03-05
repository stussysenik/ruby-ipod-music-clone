// iPod state machine — central state management
// All UI updates flow through state changes

import { MENU_TREE, getMenuNode } from './menu_tree'

export function createStateMachine() {
  const state = {
    screen: 'menu',       // 'menu' | 'now_playing' | 'browse_list'
    menuPath: [],         // indices into MENU_TREE
    selectedIndex: 0,
    browseData: null,     // { type, items, title }
    playback: {
      state: 'stopped',  // 'stopped' | 'playing' | 'paused'
      currentTrack: null,
      queue: [],
      queueIndex: -1,
      position: 0,
      duration: 0,
      volume: 0.8
    }
  }

  const listeners = new Set()

  function notify() {
    for (const fn of listeners) fn({ ...state })
  }

  function subscribe(fn) {
    listeners.add(fn)
    fn({ ...state })
    return () => listeners.delete(fn)
  }

  function getState() {
    return { ...state }
  }

  function getCurrentMenuItems() {
    if (state.screen === 'browse_list' && state.browseData) {
      return state.browseData.items
    }
    const node = getMenuNode(state.menuPath)
    if (node && node.children) {
      return node.children.map(c => ({ label: c.label }))
    }
    return []
  }

  function getCurrentTitle() {
    if (state.screen === 'browse_list' && state.browseData) {
      return state.browseData.title
    }
    if (state.menuPath.length === 0) return 'iPod'
    const parentPath = state.menuPath.slice(0, -1)
    const parentNode = getMenuNode(parentPath)
    const idx = state.menuPath[state.menuPath.length - 1]
    return parentNode.children[idx].label
  }

  function dispatch(action) {
    switch (action.type) {
      case 'SCROLL_UP':
        if (state.screen === 'now_playing') {
          state.playback.volume = Math.min(1, state.playback.volume + 0.05)
        } else {
          const items = getCurrentMenuItems()
          if (state.selectedIndex > 0) state.selectedIndex--
        }
        break

      case 'SCROLL_DOWN':
        if (state.screen === 'now_playing') {
          state.playback.volume = Math.max(0, state.playback.volume - 0.05)
        } else {
          const items = getCurrentMenuItems()
          if (state.selectedIndex < items.length - 1) state.selectedIndex++
        }
        break

      case 'SELECT': {
        if (state.screen === 'now_playing') break

        if (state.screen === 'browse_list' && state.browseData) {
          const item = state.browseData.items[state.selectedIndex]
          if (item && item.action) {
            dispatch({ type: item.action, payload: item })
          }
          break
        }

        const node = getMenuNode(state.menuPath)
        if (!node || !node.children) break
        const selected = node.children[state.selectedIndex]
        if (!selected) break

        if (selected.children) {
          state.menuPath.push(state.selectedIndex)
          state.selectedIndex = 0
        } else if (selected.action) {
          dispatch({ type: selected.action, payload: selected })
        }
        break
      }

      case 'NAVIGATE_BACK':
        if (state.screen === 'now_playing') {
          state.screen = state.browseData ? 'browse_list' : 'menu'
        } else if (state.screen === 'browse_list') {
          state.screen = 'menu'
          state.browseData = null
          state.selectedIndex = 0
        } else if (state.menuPath.length > 0) {
          state.selectedIndex = state.menuPath.pop()
        }
        break

      case 'BROWSE_ARTISTS':
      case 'BROWSE_ALBUMS':
      case 'BROWSE_SONGS':
      case 'BROWSE_PLAYLISTS':
        state.screen = 'browse_list'
        state.selectedIndex = 0
        state.browseData = { type: action.type, items: [], title: 'Loading...', loading: true }
        break

      case 'SET_BROWSE_DATA':
        if (state.browseData) {
          state.browseData.items = action.payload.items
          state.browseData.title = action.payload.title
          state.browseData.loading = false
        }
        break

      case 'PLAY_TRACK':
        state.screen = 'now_playing'
        state.playback.currentTrack = action.payload.track
        state.playback.queue = action.payload.queue || [action.payload.track]
        state.playback.queueIndex = action.payload.queueIndex || 0
        state.playback.state = 'playing'
        state.playback.position = 0
        state.playback.duration = action.payload.track.duration_seconds || 0
        break

      case 'TOGGLE_PLAY_PAUSE':
        if (state.playback.state === 'playing') {
          state.playback.state = 'paused'
        } else if (state.playback.state === 'paused') {
          state.playback.state = 'playing'
        }
        break

      case 'NEXT_TRACK':
        if (state.playback.queueIndex < state.playback.queue.length - 1) {
          state.playback.queueIndex++
          state.playback.currentTrack = state.playback.queue[state.playback.queueIndex]
          state.playback.position = 0
          state.playback.duration = state.playback.currentTrack.duration_seconds || 0
          state.playback.state = 'playing'
        }
        break

      case 'PREV_TRACK':
        if (state.playback.position > 3) {
          state.playback.position = 0
        } else if (state.playback.queueIndex > 0) {
          state.playback.queueIndex--
          state.playback.currentTrack = state.playback.queue[state.playback.queueIndex]
          state.playback.position = 0
          state.playback.duration = state.playback.currentTrack.duration_seconds || 0
          state.playback.state = 'playing'
        }
        break

      case 'UPDATE_POSITION':
        state.playback.position = action.payload
        break

      case 'NOW_PLAYING':
        if (state.playback.currentTrack) {
          state.screen = 'now_playing'
        }
        break

      case 'SHUFFLE_ALL':
        // Handled by controller — dispatches PLAY_TRACK with shuffled queue
        break

      case 'ABOUT':
      case 'BACKLIGHT':
        // Settings stubs
        break
    }

    notify()
    return state
  }

  return { subscribe, dispatch, getState, getCurrentMenuItems, getCurrentTitle }
}
