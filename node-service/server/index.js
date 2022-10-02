const express = require("express")
const cors = require("cors")
const helper = require("./helper")

const PORT = 8080
const app = express()

app.use(express.text()); // parses body as string ("text/plain")

// Client app on 3000
app.use(cors({
  origin: ['http://localhost:3000']
}))

// Server app on 8080, access via /coffee-order-creation BUT POST!!!
app.post("/coffee-order-creation", (req, res) => {
  
  // Simulate some delay in the response
  setTimeout((() => {
    try {
      const deliverySchedule = helper.parseRequest(req.body)
      res.json({ deliverySchedule })
    } catch (error) {
      res.status(400).send({error: error.message})
    }   
  }), 1200)
})

app.listen(PORT, () => {
  console.log(`Coffee Service started, listening on ${PORT}`)
})

