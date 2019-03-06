const express = require('express')
const questions = require('./questions').word_pairs;

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');

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

function init_database() {
  db.serialize(function () {
    db.run("CREATE TABLE sentiment (timestamp INTEGER, session_id TEXT, sentiment TEXT)");
    db.run("CREATE TABLE response (timestamp INTEGER, session_id TEXT, option_left TEXT, option_right TEXT, value INTEGER)");
  });
}

app.get("/session_id", function (req, res) {
  res.status(200);
  res.json({ session_id: uuidv1() });
})

app.get('/questions', function (req, res) {
  res.status(200);
  console.log("(" + req.query.sid + ") Asking for questions");
  res.json(questions());
});

app.get('/should_present_survey', function (req, res) {
  res.status(200);
  console.log("(" + req.query.sid + ") Asking whether to present survey");
  res.json({ "present_survey": true, "timeout": 1000 });
});

app.post('/initial_sentiment', function (req, res, next) {
  res.status(200);
  res.json({ sucess: true });
  db.serialize(function () {
    var stmt = db.prepare("INSERT INTO sentiment VALUES (?, ?, ?)");
    stmt.run(
      + new Date(),
      req.body.session_id,
      req.body.sentiment);
    stmt.finalize();
  });
  console.log("(" + req.body.session_id + ") Initial sentiment" + " --> " + req.body.sentiment);
});

function get_answers(callback) {
  answers = [];
  db.all("SELECT timestamp, session_id, option_left, option_right, value FROM response", function (err, rows) {
    for (var index in rows) {
      answers.push([rows[index].timestamp, rows[index].session_id, rows[index].option_left, rows[index].option_right, rows[index].value,]);
    }
    callback(answers);
  });
}

function get_sentiments(callback) {
  sentiments = [];
  db.all("SELECT timestamp, session_id, sentiment FROM sentiment", function (err, rows) {
    for (var index in rows) {
      sentiments.push([rows[index].timestamp, rows[index].session_id, rows[index].sentiment]);
    }
    callback(sentiments);
  });
}

app.get('/results/answers/json', function (req, res) {
  res.status(200);
  get_answers(function (answers) {
    res.json({ "answers": answers });
  })
});

app.get('/results/sentiments/json', function (req, res) {
  res.status(200);
  get_sentiments(function (sentiments) {
    res.json({ "sentiments": sentiments });
  });
});

app.post('/survey_results', function (req, res, next) {
  res.status(200);
  res.json({ sucess: true });
  db.serialize(function () {
    var stmt = db.prepare("INSERT INTO response VALUES (?, ?, ?, ?, ?)");
    //session_id TEXT, option_left TEXT, option_right TEXT, value INTEGER
    stmt.run(
      + new Date(),
      req.body.session_id,
      req.body.question.split("#")[0],
      req.body.question.split("#")[1],
      req.body.answer
    );
    stmt.finalize();
  });
  console.log("(" + req.body.session_id + ") " + req.body.question + " --> " + req.body.answer);
});

// Serve static content from the public directory
app.use(express.static('public'))
init_database();
app.listen(port, () => console.log(`Example app listening on port ${port}!`))
//db.close();