import { Client, userMention } from 'discord.js'
import leafDb from './leaf-firestore'
import dedent from 'dedent'

export default async function (client: Client) {
  const userDocs = await leafDb?.collection('santas').get()
  let users: {
    id: string
    receiver: string
    display: string
    userDoc: FirebaseFirestore.QueryDocumentSnapshot
  }[] = []

  userDocs?.forEach(async (userDoc) => {
    const user = userDoc.data()

    if (!user) {
      return
    }

    users.push({
      id: user.id,
      receiver: user.receiver,
      display: user.display,
      userDoc,
    })
  })

  users = shuffleArray(users)

  for (let i = 0; i < users.length; i++) {
    const user = users[i]
    const discordUser = await client.users.fetch(user.id).catch(() => null)

    if (!discordUser) {
      console.error(`Failed fetching discord user for ${user}`)
      continue
    }

    const receiver = i === 0 ? users[users.length - 1] : users[i - 1]

    user.userDoc.ref.set(
      {
        receiver: receiver.id,
      },
      {
        merge: true,
      },
    )

    console.log(`Linking ${user.display} to ${receiver.display}`)

    // discordUser.send(
    //   dedent`Hey there! <:leaf_helper:1433816388497309696>

    //   Your Secret Santa recipient is :drum: ... ${userMention(receiver.id)}, ${receiver.display} :partying_face:
    //   Please make sure to send them your :gift: between <t:1766620800:f> and <t:1766966400:f>!

    //   Happy holidays!`,
    // )
  }
}

function shuffleArray(array: any[]): any[] {
  const copy = [...array]
  const result = []

  while (copy.length) {
    const index = Math.floor(Math.random() * copy.length)

    result.push(copy[index])
    copy.splice(index, 1)
  }

  return result
}
