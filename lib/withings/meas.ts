import type {
  WithingsGetMeasBody,
  WithingsMeasureGroup,
} from '@/lib/withings/types'

const MEASURE_URLS = [
  'https://wbsapi.withings.net/measure',
  'https://wbsapi.withings.net/v2/measure',
]

/** Withings type 1 = weight (kg). */
const MEASURE_TYPE_WEIGHT = 1

function kgFromMeasure(value: number, unit: number): number {
  return value * Math.pow(10, unit)
}

export function measureGroupsToLb(
  measuregrps: WithingsMeasureGroup[]
): Array<{ id: string; date: string; weight: number }> {
  const out: Array<{ id: string; date: string; weight: number }> = []
  for (const grp of measuregrps) {
    const w = grp.measures.find((m) => m.type === MEASURE_TYPE_WEIGHT)
    if (!w) continue
    const kg = kgFromMeasure(w.value, w.unit)
    const lb = kg * 2.2046226218
    const date = new Date(grp.date * 1000).toISOString()
    out.push({
      id: `withings-${grp.grpid}`,
      date,
      weight: Math.round(lb * 10) / 10,
    })
  }
  return out.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

async function postGetMeas(
  url: string,
  accessToken: string,
  userid: number,
  startUnix: number,
  endUnix: number
): Promise<unknown> {
  const form = new URLSearchParams({
    action: 'getmeas',
    category: '1',
    startdate: String(startUnix),
    enddate: String(endUnix),
    userid: String(userid),
  })

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  })

  return res.json().catch(() => null)
}

export async function fetchWeightMeasurements(
  accessToken: string,
  userid: number,
  startUnix: number,
  endUnix: number
): Promise<
  { ok: true; rows: Array<{ id: string; date: string; weight: number }> } | { ok: false; error: string }
> {
  let lastErr = 'Unknown error'

  for (const url of MEASURE_URLS) {
    const json = await postGetMeas(url, accessToken, userid, startUnix, endUnix)
    if (!json || typeof json !== 'object') {
      lastErr = 'Invalid measure response'
      continue
    }
    const o = json as Record<string, unknown>
    if (o.status !== 0 && o.status !== '0') {
      lastErr = `Withings measure status ${String(o.status)}`
      continue
    }
    const body = o.body as WithingsGetMeasBody | undefined
    const groups = body?.measuregrps ?? []
    const rows = measureGroupsToLb(groups)
    return { ok: true, rows }
  }

  return { ok: false, error: lastErr }
}
