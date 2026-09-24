import { Timestamp } from 'firebase-admin/firestore'

export type WrapUserDoc = {
  userName: string
  herbert: {
    pings: number
    cooldowns: number
    errors: number
    blockDesire: number
  }
  sells: {
    signedUp: number
    posted: number
    myScheduleClicks: number
    emptyMySchedule: number
  }
  emotes: Record<string, number>
  helloIAmCount: number
  dibs: {
    count: number
    fastestMs: number | null
  }
}

export type HelloIAmSample = {
  textTrigger: string
  timestamp: Timestamp
}

export type DibsSample = {
  responseTimeMs: number
  timestamp: Timestamp
}

export type SellSignupMarker = {
  createdAt: Timestamp
}
