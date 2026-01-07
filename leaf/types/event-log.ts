type EventLog =
  | JoinedEventLog
  | InvitedEventLog
  | InviteDeclinedEventLog
  | KickEventLog
  | RankChangeEventLog
  | TreasuryEventLog
  | StashEventLog
  | MotdEventLog
  | UpgradeEventLog
  | InfluenceEventLog
  | MissionEventLog

interface BaseEventLog {
  id: number
  time: string
  user: string
}

interface JoinedEventLog extends BaseEventLog {
  type: 'joined'
}

interface InvitedEventLog extends BaseEventLog {
  type: 'invited'
  invited_by: string
}

interface InviteDeclinedEventLog extends BaseEventLog {
  type: 'invite_declined'
  declined_by?: string
}

interface KickEventLog extends BaseEventLog {
  type: 'kick'
  kicked_by: string
}

interface RankChangeEventLog extends BaseEventLog {
  type: 'rank_change'
  changed_by: string
  old_rank: string
  new_rank: string
}

interface TreasuryEventLog extends BaseEventLog {
  type: 'treasury'
  item_id: number
  count: number
}

interface StashEventLog extends BaseEventLog {
  type: 'stash'
  operation: 'deposit' | 'withdraw' | 'move'
  item_id: number
  count: number
  coins: number
}

interface MotdEventLog extends BaseEventLog {
  type: 'motd'
  motd: string
}

interface UpgradeEventLog extends BaseEventLog {
  type: 'upgrade'
  action: 'queued' | 'cancelled' | 'completed' | 'sped_up'
  upgrade_id: number
  recipe_id?: number
  item_id?: number
  count?: number
}

interface InfluenceEventLog extends BaseEventLog {
  type: 'influence'
  activity: 'daily_login' | 'gifted'
  participants: number
  total_participants: string[]
}

interface MissionEventLog extends BaseEventLog {
  type: 'mission'
  state: 'start' | 'success' | 'fail'
  influence: number
}
