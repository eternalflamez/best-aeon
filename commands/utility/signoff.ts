import { SlashCommandBuilder, ThreadChannel, Message, CommandInteraction } from 'discord.js'

module.exports = {
  data: new SlashCommandBuilder()
    .setName('signoff')
    .setDescription('Signs you off from a sell and pings the backups to yoink. Only works in the sell thread.'),
  async execute(interaction: CommandInteraction) {
    const interactionUser = interaction.user.id
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
    const relevantEmojis = ['MCMysticCoin', 'MCBU']
    const filteredReactions = reactions.filter((reaction) => relevantEmojis.includes(reaction.emoji.name!))

    if (filteredReactions.size === 0) {
      await interaction.reply({
        content: 'No relevant reactions found on the original message.',
        ephemeral: true,
      })
      return
    }

    const hasSignUps = filteredReactions.some((reaction) => reaction.emoji.name === 'MCMysticCoin')
    const hasBackups = filteredReactions.some((reaction) => reaction.emoji.name === 'MCBU')

    if (!hasSignUps) {
      await interaction.reply({
        content: 'You are not even signed up, dumbo.',
        ephemeral: true,
      })
      return
    }
    if (!hasBackups) {
      await interaction.reply({
        content:
          'Sadly, no backups were found for this sell. Cannot ping any backups. If you still want to sign off, manually do so and communicate it.',
        ephemeral: true,
      })
      return
    }

    let backupPeople: string[] = []

    for (const reaction of filteredReactions.values()) {
      const emoji = reaction.emoji.name
      let users
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
      switch (emoji) {
        case 'MCMysticCoin':
          if (!users.has(interactionUser)) {
            await interaction.reply({
              content: 'You are not even signed up, dumbo.',
              ephemeral: true,
            })
            return
          }
          // remove MCMysticCoin reaction from user that prompted the command
          try {
            await reaction.users.remove(interactionUser)
          } catch (error) {
            console.error('Cannot remove reaction from user:', error)
            await interaction.reply({
              content: 'Could not remove your reaction. Someone check bot permissions.',
              ephemeral: true,
            })
            return
          }
          break
        case 'MCBU':
          backupPeople.push(...users.keys())
          break
        default:
          break
      }
    }

    let messageText = `<@${interactionUser}> signed off for this sell. Go yoink!\n\n`
    messageText += `${formatMentions(backupPeople)}`

    await interaction.reply({ content: messageText, ephemeral: false })
  },
}

function formatMentions(userIds: string[]) {
  return userIds.map((id) => `<@${id}>`).join(', ')
}
