export type WhoopRecovery = {
  cycle_id?: number
  created_at?: string
  updated_at?: string
  score_state?: 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE'
  score?: {
    recovery_score?: number
    resting_heart_rate?: number
    hrv_rmssd_milli?: number
    spo2_percentage?: number
    skin_temp_celsius?: number
    user_calibrating?: boolean
  }
}

export type WhoopSleepStages = {
  total_in_bed_time_milli?: number
  total_awake_time_milli?: number
  total_light_sleep_time_milli?: number
  total_slow_wave_sleep_time_milli?: number
  total_rem_sleep_time_milli?: number
  sleep_cycle_count?: number
  disturbance_count?: number
}

export type WhoopSleep = {
  id?: string
  cycle_id?: number
  start?: string
  end?: string
  nap?: boolean
  score_state?: 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE'
  score?: {
    stage_summary?: WhoopSleepStages
    sleep_needed?: {
      baseline_milli?: number
      need_from_sleep_debt_milli?: number
      need_from_recent_strain_milli?: number
    }
    respiratory_rate?: number
    sleep_performance_percentage?: number
    sleep_consistency_percentage?: number
    sleep_efficiency_percentage?: number
  }
}

export type WhoopWorkout = {
  id?: string
  start?: string
  end?: string
  sport_name?: string
  sport_id?: number
  score_state?: 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE'
  score?: {
    strain?: number
    average_heart_rate?: number
    max_heart_rate?: number
    kilojoule?: number
    distance_meter?: number
    percent_recorded?: number
  }
}

export type WhoopCycle = {
  id?: number
  start?: string
  end?: string
  timezone_offset?: string
  score_state?: 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE'
  score?: {
    strain?: number
    kilojoule?: number
    average_heart_rate?: number
    max_heart_rate?: number
  }
}

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
  recoveries: WhoopRecovery[]
  sleeps: WhoopSleep[]
  workouts: WhoopWorkout[]
  cycles: WhoopCycle[]
}

export type WhoopTokenResponse = {
  access_token: string
  expires_in: number
  refresh_token?: string
  token_type: string
  scope?: string
}
