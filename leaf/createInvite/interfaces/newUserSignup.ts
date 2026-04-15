export interface NewUserSignup {
  discordName: string
  nickname: string
  gw2Name: string
  age: number
  joinReason: string
  fashionWars: string
  favoriteActivity: string
  favoriteNpc: string
  inviteCode: string

  // Added when saving to database
  timestamp?: string

  // Added when approved/denied
  approvedBy?: string
  approved?: boolean
  approvedTimestamp?: number

  // Added when user joins discord
  discordId?: string

  // Added when the user registers gw2 api key
  registered?: boolean
}
