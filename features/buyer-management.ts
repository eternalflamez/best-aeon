import { Client, TextChannel, ThreadAutoArchiveDuration } from 'discord.js'

export default function setup(client: Client) {
  client.on('guildMemberAdd', async (member) => {
    try {
      console.log('user added')
      console.log(member)

      const guildId = member.guild.id

      // BTB
      if (guildId !== '1248337933413650614') {
        return
      }

      const channel = await client.channels.fetch('1263780410089799726')

      if (!channel || !(channel instanceof TextChannel)) {
        return
      }

      const messages = await channel.messages.fetch()
      let threadParent = messages.get('1263780446995615815')

      if (!threadParent) {
        threadParent = await channel.send('Could not find thread parent, so made a new one')
      }

      const thread = await threadParent.startThread({
        name: `Welcome, ${member.displayName}`,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
      })

      thread.send('This is gonna be such a cool message, showing you our sell list')

      const members = await member.guild.members.fetch()

      const admin = members.get('109707866629246976')

      if (admin) {
        await thread.members.add(admin)
      }

      console.log('adding member')

      await thread.members.add(member)

      console.log(thread.members)
    } catch (e) {
      console.error(e)
    }
  })
}
