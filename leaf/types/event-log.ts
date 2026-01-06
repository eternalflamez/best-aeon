interface EventLog {
  id: number
  time: string
  type:
    | 'joined'
    | 'invited'
    | 'invite_declined'
    | 'kick'
    | 'rank_change'
    | 'treasury'
    | 'stash'
    | 'motd'
    | 'upgrade'
    | 'influence'
    | 'mission'
  user: string
  kicked_by: string
}
