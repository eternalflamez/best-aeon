import { CacheType, Interaction, MessageFlags, ModalSubmitInteraction, roleMention, userMention } from 'discord.js'
import { GuildWarsData } from '../../guild/gw-api'
import { config } from 'dotenv'
import leafDb from '../../leaf-firestore'
import dedent from 'dedent'
import { getLeafCouncillorChannel } from '../approvalHandler'
import { addSproutlingRole } from '../../roles/setup-roles'
import { RegisteredUser } from '../interfaces/registeredUser'
import { NewUserSignup } from '../interfaces/newUserSignup'

config()

export async function registerAccount(interaction: Interaction<CacheType>): Promise<boolean> {
  if (!interaction.isModalSubmit()) {
    return false
  }

  let id = interaction.customId

  if (id !== 'register-gw2-user-modal') {
    return false
  }

  const apiKey = interaction.fields.getTextInputValue('key')

  const accountInfo = await GuildWarsData.getAccount(apiKey)

  if (!accountInfo) {
    await reply(
      interaction,
      dedent`Hmm, I could not retrieve your user data.

        Please check [here](https://status.gw2efficiency.com/) to see if the API is having issues, and try again!`,
      MessageFlags.Ephemeral,
    )

    return true
  }

  await leafDb
    ?.collection('registrations')
    .doc(interaction.user.id)
    .set({
      discordId: interaction.user.id,
      discordDisplay: interaction.user.displayName,
      gwId: accountInfo.id,
      gwName: accountInfo.name,
      token: apiKey,
      isGuildMember: accountInfo.guilds.includes(process.env.LEAF_GUILD_ID!),
      timestamp: Date.now(),
    } as RegisteredUser)

  try {
    const signupRef = await leafDb?.collection('signups').where('discordId', '==', interaction.user.id).limit(1).get()

    const doc = signupRef?.docs.shift()

    if (doc) {
      await doc.ref.update({
        registered: true,
      } as Partial<NewUserSignup>)
    }
  } catch (e) {
    console.error('Failed to update signup registered flag', e)
  }

  await reply(
    interaction,
    dedent`Magnificent! You are very, very good at this! Many thanks are sent your way!
    
      Now, your role is updated to Sproutling.
      
      That means 2 things:
        1) In 3 days, you shall become a full member of the guild. Meanwhile you can already hang out with my Overlords and all the other Salads in the server!
        2) One of my Overlords will invite you to the guild in-game as soon as they stop touching grass and come back to the real world of Tyria!`,
  )

  const channel = await getLeafCouncillorChannel(interaction.client)

  if (!channel) {
    return true
  }

  const member = await channel.guild.members.fetch(interaction.user.id)

  await addSproutlingRole(member)

  const role = channel.guild.roles.cache.find((role) => role.name.includes('Councillor Salad'))

  await channel.send(dedent`Hey, magnificent Overlords / ${role ? ` / ${roleMention(role.id)}` : ''}! <:leaf_helper:1433816388497309696>
      
    ${userMention(interaction.user.id)} / [${accountInfo.name}] just registered their API key and became a Sproutling! Invite them to the guild in-game at your earliest convenience!`)

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
