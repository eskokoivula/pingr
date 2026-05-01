import { getInitData } from './telegram'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const initData = getInitData()

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': initData,
        ...options.headers,
      },
    })
  } catch (err) {
    throw new Error(`Network error: ${err instanceof Error ? err.message : 'fetch failed'}`)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    let msg = `HTTP ${res.status}`
    try {
      const json = JSON.parse(body)
      msg = json.error || msg
    } catch {
      if (body) msg = body.slice(0, 100)
    }
    throw new Error(msg)
  }

  return res.json()
}
