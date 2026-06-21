const IMG_REGEX = /<img\b([^>]*)\/?>/gi
const LIGHTBOX_ANCHOR_REGEX = /<a\b([^>]*data-ipslightbox[^>]*)>/gi

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function getAttr(attrs: string, name: string): string | null {
  const match = attrs.match(new RegExp(`${name}=["']([^"']*)["']`, "i"))
  return match ? decodeHtml(match[1]) : null
}

function normalizeImageUrl(url: string): string {
  return url.replace(/&amp;/g, "&")
}

function getCommentContent(html: string): string {
  const match = html.match(
    /data-role="commentContent"[^>]*>([\s\S]*?)<\/div>\s*<div class="ipsItemControls"/i,
  )
  return match?.[1] ?? html
}

function isPosterImage(attrs: string, url: string): boolean {
  const classes = getAttr(attrs, "class") ?? ""
  const lower = url.toLowerCase()

  if (classes.includes("ipsUserPhoto")) return false
  if (/thumb\.jpg|\/reactions\/|grandmaster|torrborder|utorrent|logo\.png|\/staff\/|\.svg/i.test(lower)) {
    return false
  }
  if (/\.gif(\?|$)/i.test(lower)) return false

  const width = Number(getAttr(attrs, "width") ?? 0)
  if (width > 0 && width < 200) return false

  if (classes.includes("ipsImage")) return true

  return /\.(jpe?g|png|webp)(\?|$)/i.test(lower)
}

export function extractMovieImages(html: string): string[] {
  const scope = getCommentContent(html)
  const seen = new Set<string>()
  const results: string[] = []

  for (const match of scope.matchAll(LIGHTBOX_ANCHOR_REGEX)) {
    const href = getAttr(match[1], "href")
    if (!href || !isPosterImage(match[1], href)) continue
    const url = normalizeImageUrl(href)
    if (seen.has(url)) continue
    seen.add(url)
    results.push(url)
  }

  for (const match of scope.matchAll(IMG_REGEX)) {
    const attrs = match[1]
    const src = getAttr(attrs, "src")
    if (!src || !isPosterImage(attrs, src)) continue
    const url = normalizeImageUrl(src)
    if (seen.has(url)) continue
    seen.add(url)
    results.push(url)
  }

  return results
}
