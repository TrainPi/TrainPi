export function isValidYouTubeId(id: string | null | undefined): boolean {
  return !!id && /^[A-Za-z0-9_-]{11}$/.test(id)
}

export function extractYouTubeId(url: string): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1).split('?')[0]
      return isValidYouTubeId(id) ? id : null
    }
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/results') || u.pathname.startsWith('/channel') || u.pathname.startsWith('/playlist') || u.pathname === '/') return null
      const v = u.searchParams.get('v')
      if (isValidYouTubeId(v)) return v
      if (u.pathname.startsWith('/embed/') || u.pathname.startsWith('/shorts/')) {
        const seg = u.pathname.split('/').pop()
        return isValidYouTubeId(seg) ? seg! : null
      }
      return null
    }
  } catch { /* ignore */ }
  const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/)
  return m && isValidYouTubeId(m[1]) ? m[1] : null
}

export function isYouTubeUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.hostname.includes('youtube.com') || u.hostname === 'youtu.be'
  } catch { return false }
}

export function extractYouTubeSearchQuery(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.pathname === '/results' || u.pathname.startsWith('/results')) {
      return u.searchParams.get('search_query') || null
    }
  } catch { /* ignore */ }
  return null
}

export interface YouTubeEmbed { type: 'embed'; id: string; label: string }
export interface YouTubeSearch { type: 'search'; query: string; label: string }
export interface YouTubeLink { type: 'link'; url: string; label: string }
export type YouTubeItem = YouTubeEmbed | YouTubeSearch | YouTubeLink

/**
 * Extract YouTube items from a list of resources.
 * Returns embeds (direct video), search (search page), or links (other YouTube pages).
 */
export function getYouTubeItems(resources: any[]): YouTubeItem[] {
  const items: YouTubeItem[] = []
  const seenIds = new Set<string>()
  if (!Array.isArray(resources)) return items

  for (const r of resources) {
    const url = String(r?.url || r?.link || '')
    if (!url) continue
    const id = extractYouTubeId(url)
    if (id && !seenIds.has(id)) {
      items.push({ type: 'embed', id, label: String(r?.name || r?.title || 'Video') })
      seenIds.add(id)
    } else if (!id && isYouTubeUrl(url)) {
      const query = extractYouTubeSearchQuery(url)
      if (query) {
        items.push({ type: 'search', query, label: String(r?.name || r?.title || 'YouTube Tutorials') })
      } else {
        items.push({ type: 'link', url, label: String(r?.name || r?.title || 'YouTube') })
      }
    }
  }
  return items
}

/**
 * Extract YouTube items from a lesson module (checks module.video_url + resources array).
 */
export function getYouTubeItemsFromModule(module: any, resources?: any[]): YouTubeItem[] {
  const items: YouTubeItem[] = []
  const seenIds = new Set<string>()

  if (module?.video_url) {
    const id = extractYouTubeId(module.video_url)
    if (id) {
      items.push({ type: 'embed', id, label: module.title || 'Lesson Video' })
      seenIds.add(id)
    } else if (isYouTubeUrl(module.video_url)) {
      const query = extractYouTubeSearchQuery(module.video_url)
      if (query) items.push({ type: 'search', query, label: module.title || 'YouTube Tutorials' })
      else items.push({ type: 'link', url: module.video_url, label: module.title || 'YouTube' })
    }
  }

  if (Array.isArray(resources)) {
    for (const r of resources) {
      const url = r?.url || r?.link || ''
      if (!url) continue
      const id = extractYouTubeId(url)
      if (id && !seenIds.has(id)) {
        items.push({ type: 'embed', id, label: r?.name || r?.title || 'Video' })
        seenIds.add(id)
      } else if (!id && isYouTubeUrl(url)) {
        const query = extractYouTubeSearchQuery(url)
        if (query) items.push({ type: 'search', query, label: r?.name || r?.title || 'YouTube Tutorials' })
        else items.push({ type: 'link', url, label: r?.name || r?.title || 'YouTube' })
      }
    }
  }

  return items
}
