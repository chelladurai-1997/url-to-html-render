export type DownloadLinkType = "torrent" | "magnet"

export interface DownloadLink {
  url: string
  label: string
  type: DownloadLinkType
}

export interface DownloadGroup {
  size: string
  torrent: DownloadLink | null
  magnet: DownloadLink | null
}

const ANCHOR_REGEX = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
}

function getAttr(attrs: string, name: string): string | null {
  const match = attrs.match(new RegExp(`${name}=["']([^"']*)["']`, "i"))
  return match ? decodeHtml(match[1]) : null
}

function stripTags(html: string): string {
  return decodeHtml(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
}

function classifyAnchor(
  attrs: string,
  href: string,
  innerHtml: string,
): DownloadLink | null {
  const classes = getAttr(attrs, "class") ?? ""
  const fileExt = getAttr(attrs, "data-fileext")
  const text = stripTags(innerHtml)

  if (fileExt === "torrent" || /\.torrent$/i.test(text)) {
    return {
      url: href,
      label: text.replace(/\.torrent$/i, "") || "Torrent file",
      type: "torrent",
    }
  }

  if (href.startsWith("magnet:") || classes.includes("skyblue-button")) {
    return {
      url: href,
      label: text || "Magnet link",
      type: "magnet",
    }
  }

  return null
}

export function extractDownloadLinks(html: string): DownloadLink[] {
  const seen = new Set<string>()
  const results: DownloadLink[] = []

  for (const match of html.matchAll(ANCHOR_REGEX)) {
    const attrs = match[1]
    const innerHtml = match[2]
    const href = getAttr(attrs, "href")
    if (!href || href === "#") continue

    const link = classifyAnchor(attrs, href, innerHtml)
    if (!link) continue

    const key = `${link.type}:${link.url}`
    if (seen.has(key)) continue
    seen.add(key)
    results.push(link)
  }

  return results
}

export function extractFileSize(torrentLabel: string): string {
  const cleaned = torrentLabel.replace(/\.torrent$/i, "").replace(/\.mkv$/i, "")

  const esubMatch = cleaned.match(/- (\d+(?:\.\d+)?)\s*(GB|MB|KB)\s*-?\s*ESub/i)
  if (esubMatch) return `${esubMatch[1]}${esubMatch[2].toUpperCase()}`

  const matches = [...cleaned.matchAll(/(\d+(?:\.\d+)?)\s*(GB|MB|KB)\b/gi)]
  if (matches.length === 0) return "Unknown size"

  const last = matches[matches.length - 1]
  return `${last[1]}${last[2].toUpperCase()}`
}

export function groupDownloadLinks(links: DownloadLink[]): DownloadGroup[] {
  const groups: DownloadGroup[] = []
  let current: DownloadGroup | null = null

  for (const link of links) {
    if (link.type === "torrent") {
      current = {
        size: extractFileSize(link.label),
        torrent: link,
        magnet: null,
      }
      groups.push(current)
      continue
    }

    if (!current) {
      current = {
        size: "Unknown size",
        torrent: null,
        magnet: link.type === "magnet" ? link : null,
      }
      groups.push(current)
      continue
    }

    if (link.type === "magnet" && !current.magnet) {
      current.magnet = link
    }
  }

  return groups
}
