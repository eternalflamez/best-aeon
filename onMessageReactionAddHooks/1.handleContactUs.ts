import { MessageReaction, PartialMessageReaction, PartialUser, User, userMention } from 'discord.js'

export default async function (
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser,
  clientId: string | undefined,
) {
  if (reaction.partial) {
    try {
      await reaction.fetch()
    } catch (error) {
      console.error('Something went wrong when fetching the message:', error)
      return
    }
  }

  if (user.partial) {
    try {
      await user.fetch()
    } catch (error) {
      console.error('Something went wrong when fetching the user:', error)
      return
    }
  }

  if (!clientId) {
    return
  }

  const checkEmoji: string[] = ['✅', '☑️', '✔️', '☑', '✔']
  const emoji = reaction.emoji

  // check if reaction is on bot message, emoji is in checkEmoji list and is the first valid reaction
  if (
    reaction.message.author?.id === clientId &&
    emoji.name &&
    checkEmoji.includes(emoji.name) &&
    reaction.message.content &&
    !reaction.message.content.includes('Contacted by')
  ) {
    reaction.message.edit('~~' + reaction.message.content + '~~' + '\r\n' + `Contacted by ${userMention(user.id)}`)
  }
}
