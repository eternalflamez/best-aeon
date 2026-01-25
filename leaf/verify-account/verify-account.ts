import { CacheType, Interaction, MessageFlags, ModalSubmitInteraction } from 'discord.js'
import { GuildWarsData } from '../guild/gw-api'
import { config } from 'dotenv'
import leafDb from '../leaf-firestore'

config()

export async function verifyAccount(interaction: Interaction<CacheType>): Promise<boolean> {
  if (!interaction.isModalSubmit()) {
    return false
  }

  let id = interaction.customId

  if (id !== 'verify-gw2-user-modal') {
    return false
  }

  const apiKey = interaction.fields.getTextInputValue('key')

  const accountInfo = await GuildWarsData.getAccount(apiKey)

  if (!accountInfo) {
    await reply(interaction, 'Could not retrieve your user data. Is the API key valid?', MessageFlags.Ephemeral)

    return true
  }

  await leafDb
    ?.collection('verification')
    .doc(interaction.user.id)
    .set({
      discordId: interaction.user.id,
      discordDisplay: interaction.user.displayName,
      gwId: accountInfo.id,
      gwName: accountInfo.name,
      token: apiKey,
      isGuildMember: accountInfo.guilds.includes(process.env.LEAF_GUILD_ID!),
    })

  await reply(interaction, 'Hurrah, you are now API verified!')

  return true
}

async function reply(interaction: ModalSubmitInteraction<CacheType>, content: string, flags?: number) {
  if (interaction.replied) {
    await interaction.followUp({
      content,
      flags,
    })
  } else {
    await interaction.reply({
      content,
      flags,
    })
  }
}
