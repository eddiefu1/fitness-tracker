/** Withings measure group from getmeas (subset). */
export type WithingsMeasure = {
  type: number
  value: number
  unit: number
}

export type WithingsMeasureGroup = {
  grpid: number
  date: number
  measures: WithingsMeasure[]
}

export type WithingsGetMeasBody = {
  measuregrps?: WithingsMeasureGroup[]
}

export type WithingsTokenBody = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  userid?: number
  user_id?: number
}
