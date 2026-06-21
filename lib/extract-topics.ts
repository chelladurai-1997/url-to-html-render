export interface MovieLink {
  url: string
  slug: string
  title: string
  year: number | null
}

// Captures movie URLs across common patterns, e.g.:
//   https://site.com/movie/the-matrix
//   https://site.com/movies/the-matrix-1999
//   https://site.com/title/inception
//   https://site.com/forums/topic/198566-nooru-sami-2026-...
// The second group is the slug used to derive the title.
const MOVIE_REGEX =
  /(https?:\/\/[^\s"']+\/(?:movies?|title|film|watch|topic)\/([^/"'?#]+))/gi

function slugToTitle(slug: string): string {
  const clean = slug.split(/[?#]/)[0]
  return decodeURIComponent(clean)
    .replace(/\.(html?|php)$/i, "")
    .replace(/[-_+]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function slugToMovieTitle(slug: string): string {
  // Forum topics often prefix slugs with a numeric id, e.g. 198566-nooru-sami-2026
  const name = slug.replace(/^\d+-/, "")
  if (!name || name === "0") return ""
  return slugToTitle(name)
}

function normalizeUrl(url: string): string {
  return url.replace(/\/$/, "")
}

function extractYear(slug: string, title: string): number | null {
  const name = slug.replace(/^\d+-/, "")
  for (const part of name.split("-")) {
    if (/^(19|20)\d{2}$/.test(part)) {
      return parseInt(part, 10)
    }
  }
  for (const match of title.matchAll(/\b(19|20)\d{2}\b/g)) {
    return parseInt(match[1], 10)
  }
  return null
}

export function filterMovies(
  movies: MovieLink[],
  query: string,
  year: string,
): MovieLink[] {
  const normalizedQuery = query.trim().toLowerCase()
  return movies.filter((movie) => {
    const matchesQuery =
      !normalizedQuery || movie.title.toLowerCase().includes(normalizedQuery)
    const matchesYear = !year || movie.year?.toString() === year
    return matchesQuery && matchesYear
  })
}

export function extractMovies(html: string): MovieLink[] {
  const seen = new Set<string>()
  const results: MovieLink[] = []

  for (const match of html.matchAll(MOVIE_REGEX)) {
    const url = normalizeUrl(match[1])
    const slug = match[2]
    if (seen.has(url)) continue
    // Skip pure numeric ids (no readable name)
    if (/^\d+$/.test(slug)) continue
    const title = slugToMovieTitle(slug)
    if (!title) continue
    seen.add(url)
    results.push({ url, slug, title, year: extractYear(slug, title) })
  }

  results.sort((a, b) => a.title.localeCompare(b.title))
  return results
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function buildHtmlBody(movies: MovieLink[]): string {
  if (movies.length === 0) return ""
  const items = movies
    .map(
      (m) =>
        `  <li><a href="${escapeHtml(m.url)}">${escapeHtml(m.title)}</a></li>`,
    )
    .join("\n")
  return `<ul>\n${items}\n</ul>`
}

export function buildMovieNamesCopyText(movies: MovieLink[]): string {
  if (movies.length === 0) return ""
  const names = movies.map((m, i) => `${i + 1}. ${m.title}`).join("\n")
  return `Order the following movies by IMDB rating (highest to lowest):\n\n${names}`
}
