import { SlashCommandBuilder, ThreadChannel, Message, CommandInteraction, userMention } from 'discord.js'

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sellinfo')
    .setDescription('Posts the sign-up for the corresponding sell. Only works in the sell thread.'),
  async execute(interaction: CommandInteraction) {
    if (!(interaction.channel instanceof ThreadChannel)) {
      await interaction.reply({
        content: 'This channel is not a thread! Command only works in the corresponding sell thread.',
        ephemeral: true,
      })
      return
    }

    let originalMessage = await interaction.channel.fetchStarterMessage().catch((error) => {
      console.error('Error fetching starter message:', error)

      interaction
        .reply({
          content: 'Failed to fetch the original message.',
          ephemeral: true,
        })
        .catch(() => {
          // Do nothing
        })
    })

    if (!originalMessage) {
      return
    }

    const reactions = originalMessage.reactions.cache
    const relevantEmojis = ['MCMysticCoin', 'MCBU', 'MCUNSURE']
    const filteredReactions = reactions.filter((reaction) => relevantEmojis.includes(reaction.emoji.name!))

    if (filteredReactions.size === 0) {
      await interaction.reply({
        content: 'No relevant reactions found on the original message.',
        ephemeral: true,
      })
      return
    }

    let signedPeople: string[] = []
    let backupPeople: string[] = []
    let unsurePeople: string[] = []

    for (const reaction of filteredReactions.values()) {
      if (!reaction) {
        continue
      }

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
          signedPeople.push(...users.keys())
          break
        case 'MCBU':
          backupPeople.push(...users.keys())
          break
        case 'MCUNSURE':
          unsurePeople.push(...users.keys())
          break
        default:
          break
      }
    }

    const interactionUser = interaction.user.id
    let messageText = ''

    if (signedPeople.includes(interactionUser)) {
      messageText += '**You are signed up!**\n'
    } else if (backupPeople.includes(interactionUser)) {
      messageText += '**You are signed up as a backup!**\n'
    } else if (unsurePeople.includes(interactionUser)) {
      messageText += '**You are signed up as unsure!**\n'
    } else {
      messageText += '**You are not signed up at all!**\n'
    }

    messageText += '\n'

    messageText += `Main roster (${signedPeople.length}): ${formatMentions(signedPeople)}\n`
    messageText += `Backup (${backupPeople.length}): ${formatMentions(backupPeople)}\n`

    if (unsurePeople.length > 0) {
      messageText += `Unsure (${unsurePeople.length}): ${formatMentions(unsurePeople)}\n`
    }

    await interaction.reply({ content: messageText, ephemeral: true })
  },
}

function formatMentions(userIds: string[]) {
  return userIds.map((id) => userMention(id)).join(', ')
}
