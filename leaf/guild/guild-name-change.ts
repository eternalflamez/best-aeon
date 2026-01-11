import { Client } from 'discord.js'
import { sendEmbedToChannel } from './guild-events'
import { COLORS } from '../constants/colors'
import { GuildWarsData } from './gw-api'
import leafDb from '../leaf-firestore'

export async function checkUserNameChange(client: Client) {
  const doc = await leafDb?.collection('util').doc('member-list').get()

  if (!doc || !doc.exists) {
    return false
  }

  const membersJson = doc.data()!['members'] as string
  const oldMembers = JSON.parse(membersJson) as string[]
  const newMembers = await GuildWarsData.getMembers()

  const oldAccounts = new Set(oldMembers)
  const newAccounts = new Set(newMembers.map((m) => m.name))

  const removedUsers = oldMembers.filter((m) => !newAccounts.has(m)).map((m) => m)
  const addedUsers = newMembers.filter((m) => !oldAccounts.has(m.name)).map((m) => m.name)

  if (removedUsers.length !== addedUsers.length) {
    return
  }

  await sendEmbedToChannel(client, {
    embeds: [
      {
        color: COLORS.negative,
        title: 'Guild Member List Changed',
        description: "The member list differs from the previous snapshot. Please verify if there's an issue",
        fields: [
          {
            name: 'Users no longer in the list',
            value: removedUsers.length > 0 ? removedUsers.map((u) => `\`${u}\``).join('\r') : '(None)',
            inline: true,
          },
          {
            name: 'Users who were added to the list',
            value: addedUsers.length > 0 ? addedUsers.map((u) => `\`${u}\``).join('\r') : '(None)',
            inline: true,
          },
        ],
      },
    ],
  })

  await leafDb
    ?.collection('util')
    .doc('member-list')
    .update({
      members: JSON.stringify(Array.from(newAccounts)),
    })
}
