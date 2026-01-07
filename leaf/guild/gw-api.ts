export class GuildWarsData {
  private static cachedItems: { [id: string]: Item } = {}

  public static async getItem(id: number): Promise<Item> {
    if (this.cachedItems[id]) {
      return this.cachedItems[id]
    }

    const response = await fetch(`https://api.guildwars2.com/v2/items/${id}`, {
      method: 'GET',
    })

    if (!response.ok) {
      console.log(`Error fetching item - ${response.status}`)

      return {
        id,
        name: 'Unknown',
        chat_link: 'Unknown',
      }
    }

    const item = (await response.json()) as Item
    this.cachedItems[id] = item

    return item
  }
}

interface Item {
  id: number
  name: string
  chat_link: string
  icon?: string
}
