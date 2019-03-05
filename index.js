const express = require('express')
const questions = require('./questions').word_pairs;

const bodyParser = require('body-parser')
const app = express()
app.use(bodyParser.json())

const optionDefinitions = [
  { name: 'port', alias: 'p', type: Number }
]
const commandLineArgs = require('command-line-args')
const options = commandLineArgs(optionDefinitions)

const port = (options.port != undefined) ? options.port : 3000;

app.get('/questions', function(req, res) {
  res.status(200);
	res.json(questions());
});

// Serve static content from the public directory
app.use(express.static('public'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
