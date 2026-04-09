/** Snapshot saved to localStorage after a successful sync. */
export type WhoopStoredData = {
  syncedAt: string
  profile?: {
    user_id?: number
    email?: string
    first_name?: string
    last_name?: string
  }
  bodyMeasurement?: {
    height_meter?: number
    weight_kilogram?: number
    max_heart_rate?: number
  }
  recoveries: unknown[]
  sleeps: unknown[]
  workouts: unknown[]
  cycles: unknown[]
}

export type WhoopTokenResponse = {
  access_token: string
  expires_in: number
  refresh_token?: string
  token_type: string
  scope?: string
}
