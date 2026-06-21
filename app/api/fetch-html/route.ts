import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  let body: { url?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const url = body.url?.trim()
  if (!url) {
    return NextResponse.json({ error: "A URL is required." }, { status: 400 })
  }

  // Basic validation: must be http(s)
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: "That doesn't look like a valid URL." }, { status: 400 })
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Only http and https URLs are supported." }, { status: 400 })
  }

  try {
    const res = await fetch(parsed.toString(), {
      headers: {
        // Pretend to be a browser so more servers respond with HTML.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `The server responded with status ${res.status}.` },
        { status: 502 },
      )
    }

    const html = await res.text()
    return NextResponse.json({ html, finalUrl: res.url })
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch the URL. It may be unreachable or blocking requests." },
      { status: 502 },
    )
  }
}
