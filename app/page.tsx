"use client"

import { useMemo, useState } from "react"
import { DownloadLinksModal } from "@/components/download-links-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { extractDownloadLinks, type DownloadLink } from "@/lib/extract-downloads"
import { extractMovieImages } from "@/lib/extract-movie-images"
import { extractMovies, buildMovieNamesCopyText, type MovieLink } from "@/lib/extract-topics"
import { filterMovies, getAvailableYears } from "@/lib/movie-filters"
import { Check, Copy, Link2, Loader2, Film, Search } from "lucide-react"

export default function Page() {
  const [url, setUrl] = useState("https://1tamilmv.cards/")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [movies, setMovies] = useState<MovieLink[]>([])
  const [copied, setCopied] = useState(false)
  const [hasRun, setHasRun] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [modalTitle, setModalTitle] = useState("")
  const [downloads, setDownloads] = useState<DownloadLink[]>([])
  const [modalImages, setModalImages] = useState<string[]>([])
  const [search, setSearch] = useState("Tamil true")
  const [yearFilter, setYearFilter] = useState("")

  const availableYears = useMemo(() => getAvailableYears(movies), [movies])
  const filteredMovies = useMemo(
    () => filterMovies(movies, search, yearFilter),
    [movies, search, yearFilter],
  )

  async function handleExtract(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setHasRun(true)
    setCopied(false)
    setSearch("")
    setYearFilter("")
    try {
      const res = await fetch("/api/fetch-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.")
      }
      const found = extractMovies(data.html as string)
      setMovies(found)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
      setMovies([])
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (filteredMovies.length === 0) return
    await navigator.clipboard.writeText(buildMovieNamesCopyText(filteredMovies))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleMovieClick(movie: MovieLink) {
    setModalOpen(true)
    setModalLoading(true)
    setModalError(null)
    setModalTitle(movie.title)
    setDownloads([])
    setModalImages([])
    try {
      const res = await fetch("/api/fetch-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: movie.url }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.")
      }
      setDownloads(extractDownloadLinks(data.html as string))
      setModalImages(extractMovieImages(data.html as string))
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Something went wrong.")
      setDownloads([])
      setModalImages([])
    } finally {
      setModalLoading(false)
    }
  }

  function closeModal() {
    setModalOpen(false)
    setModalLoading(false)
    setModalError(null)
    setDownloads([])
    setModalImages([])
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-12 font-sans">
      <header className="flex flex-col gap-2">
        <h1 className="flex items-center gap-2 text-balance text-3xl font-bold tracking-tight">
          <Film className="size-7 text-primary" />
          Movie Link Extractor
        </h1>
        <p className="text-pretty leading-relaxed text-muted-foreground">
          Fetch a page and capture every movie URL, listing each one as a clickable link with its
          name derived from the slug. Copy movie names with an IMDB rating sort prompt.
        </p>
      </header>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleExtract} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="url">Page URL</Label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="url"
                    type="url"
                    required
                    placeholder="https://1tamilmv.cards/"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-9 font-mono text-sm"
                  />
                </div>
                <Button type="submit" disabled={loading} className="sm:w-36">
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Fetching
                    </>
                  ) : (
                    "Extract Links"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {hasRun && !error && !loading && movies.length === 0 && (
        <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No movie links were found on that page.
        </div>
      )}

      {movies.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">
              Movies
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                {filteredMovies.length === movies.length
                  ? `${movies.length} ${movies.length === 1 ? "movie" : "movies"}`
                  : `${filteredMovies.length} of ${movies.length}`}
              </span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={filteredMovies.length === 0}
            >
              {copied ? (
                <>
                  <Check className="size-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  Copy Names
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search movies…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-40"
                aria-label="Filter by year"
              >
                <option value="">All years</option>
                {availableYears.map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {filteredMovies.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No movies match your search or filter.
              </p>
            ) : (
              <ul className="flex flex-col divide-y">
                {filteredMovies.map((m, i) => (
                  <li key={m.url} className="flex items-baseline gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="w-6 shrink-0 text-right font-mono text-xs text-muted-foreground">
                      {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleMovieClick(m)}
                      className="min-w-0 text-left font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {m.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <DownloadLinksModal
        open={modalOpen}
        title={modalTitle}
        loading={modalLoading}
        error={modalError}
        downloads={downloads}
        images={modalImages}
        onClose={closeModal}
      />
    </main>
  )
}
