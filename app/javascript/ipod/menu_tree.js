// Menu tree definition — mirrors the iPod Classic hierarchy
// Each node has: label, children (submenu), or action (leaf handler name)

export const MENU_TREE = {
  label: 'iPod',
  children: [
    {
      label: 'Music',
      children: [
        { label: 'Artists',   action: 'BROWSE_ARTISTS' },
        { label: 'Albums',    action: 'BROWSE_ALBUMS' },
        { label: 'Songs',     action: 'BROWSE_SONGS' },
        { label: 'Playlists', action: 'BROWSE_PLAYLISTS' }
      ]
    },
    { label: 'Now Playing', action: 'NOW_PLAYING' },
    { label: 'Shuffle Songs', action: 'SHUFFLE_ALL' },
    {
      label: 'Settings',
      children: [
        { label: 'About',    action: 'ABOUT' },
        { label: 'Backlight', action: 'BACKLIGHT' }
      ]
    }
  ]
}

export function getMenuNode(path) {
  let node = MENU_TREE
  for (const idx of path) {
    if (!node.children || !node.children[idx]) return null
    node = node.children[idx]
  }
  return node
}
