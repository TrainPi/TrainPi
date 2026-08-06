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
 * Classify one URL as an embed/search/link item and push it, if not already
 * seen. `label` is the caller-provided name (e.g. resource.name); each type
 * has its own fallback when that's missing, matching how each type reads in
 * the UI (a search result reads oddly labeled "Video", etc).
 */
function pushYouTubeItem(items: YouTubeItem[], seenIds: Set<string>, url: string, label: string | undefined, fallbacks: { embed: string; search: string; link: string }) {
  if (!url) return
  const id = extractYouTubeId(url)
  if (id) {
    if (seenIds.has(id)) return
    items.push({ type: 'embed', id, label: label || fallbacks.embed })
    seenIds.add(id)
    return
  }
  if (!isYouTubeUrl(url)) return
  const query = extractYouTubeSearchQuery(url)
  if (query) items.push({ type: 'search', query, label: label || fallbacks.search })
  else items.push({ type: 'link', url, label: label || fallbacks.link })
}

/**
 * Extract YouTube items from a lesson module (checks module.video_url + resources array).
 */
export function getYouTubeItemsFromModule(module: any, resources?: any[]): YouTubeItem[] {
  const items: YouTubeItem[] = []
  const seenIds = new Set<string>()

  if (module?.video_url) {
    const moduleLabel = module.title || 'Lesson Video'
    pushYouTubeItem(items, seenIds, module.video_url, moduleLabel, { embed: moduleLabel, search: moduleLabel, link: moduleLabel })
  }

  if (Array.isArray(resources)) {
    for (const r of resources) {
      const resourceLabel = r?.name || r?.title
      pushYouTubeItem(items, seenIds, String(r?.url || r?.link || ''), resourceLabel, { embed: 'Video', search: 'YouTube Tutorials', link: 'YouTube' })
    }
  }

  return items
}
