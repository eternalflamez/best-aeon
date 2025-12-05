export interface CustomerDib {
  response_time: number
  timestamp: FirebaseFirestore.Timestamp
  user_id: string
  user_name: string
}

export interface SignupUserEntry {
  emote_used: string
  timestamp: FirebaseFirestore.Timestamp
  response_time: number
  user_id: string
  user_name: string
}

export interface SignupUsersCollection {
  [key: string]: SignupUserEntry // "${user_id}-${emoji_name}"
}

export interface SignupEvent {
  users?: SignupUsersCollection
}

export interface HelloIAmEntry {
  text_trigger: string
  timestamp: FirebaseFirestore.Timestamp
}

export interface RequestedSignupEntry {
  signup_count: number
}

export type GeminiTriggerType = 'response' | 'cooldown' | 'error' | 'ban'

export interface UsedGeminiEntry {
  timestamp: FirebaseFirestore.Timestamp
  trigger_type: GeminiTriggerType
}

export interface UserDoc {
  id: string
  user_name: string
  ping_count: number
  cooldown_triggers: number
  error_triggers: number
  block_responses: number
  created_signups: number
  requested_signups_count: number
  requested_empty_signups_count: number
  hello_i_am: Record<string, HelloIAmEntry>
  requested_signups: Record<string, RequestedSignupEntry>
  used_gemini: Record<string, UsedGeminiEntry>
}
