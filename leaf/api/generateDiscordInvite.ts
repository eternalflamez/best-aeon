import express from 'express'

const app = express()
const port = process.env.PORT || 4000

export function setupApi() {
  app.get('/', (req, res) => {
    res.send('Hello World!')
  })

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
}
