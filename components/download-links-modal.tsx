"use client"

import { Button } from "@/components/ui/button"
import type { DownloadLink } from "@/lib/extract-downloads"
import { Download, Loader2, Magnet, X } from "lucide-react"

const typeLabels = {
  torrent: "Torrent",
  magnet: "Magnet",
  direct: "Direct",
} as const

const typeIcons = {
  torrent: Download,
  magnet: Magnet,
  direct: Download,
} as const

interface DownloadLinksModalProps {
  open: boolean
  title: string
  loading: boolean
  error: string | null
  downloads: DownloadLink[]
  onClose: () => void
}

export function DownloadLinksModal({
  open,
  title,
  loading,
  error,
  downloads,
  onClose,
}: DownloadLinksModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border bg-background shadow-lg">
        <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id="download-modal-title" className="text-base font-semibold leading-snug">
              Download Links
            </h2>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{title}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Fetching download links…
            </div>
          )}

          {!loading && error && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          {!loading && !error && downloads.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No download links were found on this page.
            </p>
          )}

          {!loading && !error && downloads.length > 0 && (
            <ul className="flex flex-col divide-y">
              {downloads.map((link) => {
                const Icon = typeIcons[link.type]
                return (
                  <li key={`${link.type}-${link.url}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      <Icon className="size-3" />
                      {typeLabels[link.type]}
                    </span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {link.label}
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
