interface PriceDocument {
  messageId: string
  title: string
  description: string
  fields: {
    name: string
    value: string
    inline: boolean
  }[]
}
