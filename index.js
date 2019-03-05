const express = require('express')
const questions = require('./questions').word_pairs;

const bodyParser = require('body-parser')
const app = express()
const uuidv1 = require('uuid/v1');
app.use(bodyParser.json())

const optionDefinitions = [
  { name: 'port', alias: 'p', type: Number }
]
const commandLineArgs = require('command-line-args')
const options = commandLineArgs(optionDefinitions)

const port = (options.port != undefined) ? options.port : 3000;

app.get("/session_id", function(req, res) {
  res.status(200);
  res.json({session_id : uuidv1()});
})

app.get('/questions', function(req, res) {
  res.status(200);
  console.log("(" + req.query.sid + ") Asking for questions");
	res.json(questions());
});

app.get('/should_present_survey', function(req, res) {
  res.status(200);
  console.log("(" + req.query.sid + ") Asking whether to present survey");
	res.json({"present_survey" : true, "timeout" : 1000});
});

app.post('/initial_sentiment', function(req, res, next) {
  res.status(200);
  res.json({sucess:true});
	console.log("(" + req.body.session_id + ") Initial sentiment" + " --> " + req.body.sentiment);
});

app.post('/survey_results', function(req, res, next) {
  res.status(200);
  res.json({sucess:true});
	console.log("(" + req.body.session_id + ") " + req.body.question + " --> " + req.body.answer);
});

// Serve static content from the public directory
app.use(express.static('public'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
