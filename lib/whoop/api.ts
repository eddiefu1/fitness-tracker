const API = 'https://api.prod.whoop.com/developer/v2'

type Paginated<T> = { records?: T[]; next_token?: string }

async function fetchJson<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`${path}: ${res.status} ${t.slice(0, 200)}`)
  }
  return res.json() as Promise<T>
}

/** Paginate WHOOP list endpoints (max 25 per page). */
export async function fetchAllPages<T>(
  path: string,
  accessToken: string,
  maxPages = 100
): Promise<T[]> {
  const out: T[] = []
  let nextToken: string | undefined
  for (let page = 0; page < maxPages; page++) {
    const u = new URL(`${API}${path}`)
    u.searchParams.set('limit', '25')
    if (nextToken) u.searchParams.set('nextToken', nextToken)

    const res = await fetch(u.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    })
    if (!res.ok) {
      const t = await res.text()
      throw new Error(`${path}: ${res.status} ${t.slice(0, 200)}`)
    }
    const json = (await res.json()) as Paginated<T>
    const records = json.records ?? []
    out.push(...records)
    nextToken = json.next_token
    if (!nextToken) break
  }
  return out
}

export async function fetchWhoopProfile(accessToken: string) {
  return fetchJson<{
    user_id?: number
    email?: string
    first_name?: string
    last_name?: string
  }>('/user/profile/basic', accessToken)
}

export async function fetchWhoopBodyMeasurement(accessToken: string) {
  return fetchJson<{
    height_meter?: number
    weight_kilogram?: number
    max_heart_rate?: number
  }>('/user/measurement/body', accessToken)
}
