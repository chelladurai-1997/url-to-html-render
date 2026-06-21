import type { MovieLink } from "@/lib/extract-topics"

const YEAR_REGEX = /\b(19|20)\d{2}\b/

export function extractMovieYear(movie: MovieLink): number | null {
  const name = movie.slug.replace(/^\d+-/, "")
  const slugMatch = name.match(YEAR_REGEX)
  if (slugMatch) return Number(slugMatch[0])

  const titleMatch = movie.title.match(YEAR_REGEX)
  if (titleMatch) return Number(titleMatch[0])

  return null
}

export function getAvailableYears(movies: MovieLink[]): number[] {
  const years = new Set<number>()
  for (const movie of movies) {
    const year = extractMovieYear(movie)
    if (year) years.add(year)
  }
  return [...years].sort((a, b) => b - a)
}

export function filterMovies(
  movies: MovieLink[],
  search: string,
  year: string,
): MovieLink[] {
  const query = search.trim().toLowerCase()
  const yearFilter = year ? Number(year) : null

  return movies.filter((movie) => {
    if (query && !movie.title.toLowerCase().includes(query)) return false
    if (yearFilter !== null && extractMovieYear(movie) !== yearFilter) return false
    return true
  })
}
