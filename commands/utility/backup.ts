import { SlashCommandBuilder, ThreadChannel, Message, CommandInteraction, userMention } from 'discord.js'

module.exports = {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Pings the backups for the corresponding sell. Only works in the sell thread.'),
  async execute(interaction: CommandInteraction) {
    if (!(interaction.channel instanceof ThreadChannel)) {
      await interaction.reply({
        content: 'This channel is not a thread! Command only works in the corresponding sell thread.',
        ephemeral: true,
      })
      return
    }

    let originalMessage: Message | null = null
    try {
      originalMessage = await interaction.channel.fetchStarterMessage()
    } catch (error) {
      console.error('Error fetching starter message:', error)
      await interaction.reply({
        content: 'Failed to fetch the original message.',
        ephemeral: true,
      })
    }
    if (!originalMessage) {
      return
    }

    const reactions = originalMessage.reactions.cache
    const relevantEmojis = ['MCBU']
    const filteredReactions = reactions.filter((reaction) => relevantEmojis.includes(reaction.emoji.name!))

    if (filteredReactions.size === 0) {
      await interaction.reply({
        content: 'There are sadly no backups signed up for this sell.',
        ephemeral: true,
      })
      return
    }

    let backupPeople: string[] = []

    if (reactions.values()) {
      let users

      const reaction = reactions.get('MCBU')

      if (!reaction) {
        return
      }

      try {
        users = await reaction.users.fetch()
      } catch (error) {
        console.error('Error fetching users for reaction:', error)
        await interaction.reply({
          content: 'Failed to fetch users for a reaction.',
          ephemeral: true,
        })
        return
      }

      backupPeople.push(...users.keys())
    }

    const messageText = `Aye, a backup is needed!\n${formatMentions(backupPeople)}`
    await interaction.reply({ content: messageText, ephemeral: false })
  },
}

function formatMentions(userIds: string[]) {
  return userIds.map((id) => userMention(id)).join(' ')
}
