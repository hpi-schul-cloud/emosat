const express = require('express')
const app = express()

const optionDefinitions = [
  { name: 'port', alias: 'p', type: Number }
]
const commandLineArgs = require('command-line-args')
const options = commandLineArgs(optionDefinitions)

const port = (options.port != undefined) ? options.port : 3000;

//app.get('/', (req, res) => res.send('Hello World!'))

// Serve static content from the public directory
app.use(express.static('public'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
