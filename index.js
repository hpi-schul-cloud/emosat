const express = require('express')
const questions = require('./questions').word_pairs;

const json2csv = require('json2csv').parse;
const answer_fields = ['timestamp', 'session_id', 'option_left', 'option_right', 'value'];
const sentiment_fields = ['timestamp', 'session_id', 'sentiment'];

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
      answers.push({
        timestamp: rows[index].timestamp,
        session_id: rows[index].session_id,
        option_left: rows[index].option_left,
        option_right: rows[index].option_right,
        value: rows[index].value
      });
    }
    callback(answers);
  });
}

function get_sentiments(callback) {
  sentiments = [];
  db.all("SELECT timestamp, session_id, sentiment FROM sentiment", function (err, rows) {
    for (var index in rows) {
      sentiments.push({
        timestamp: rows[index].timestamp,
        session_id: rows[index].session_id,
        sentiment: rows[index].sentiment
      });
    }
    callback(sentiments);
  });
}

app.get('/results/answers/:format', function (req, res) {
  var format = req.params.format;

  get_answers(function (answers) {
    if (format == "json") {
      res.status(200);
      res.json({ "answers": answers });
    }
    else if (format == "csv") {
      var data = json2csv(answers, { fields: answer_fields })
      res.attachment('answers.csv');
      res.status(200).send(data);
    }
    else {
      res.status(404);
      res.json({ "error": "Type not supported." });
    }
  })
});

app.get('/results/sentiments/:format', function (req, res) {
  var format = req.params.format;

  get_sentiments(function (sentiments) {
    if (format == "json") {
      res.status(200);
      res.json({ "sentiments": sentiments });
    }
    else if (format == "csv") {
      var data = json2csv(sentiments, { fields: sentiment_fields })
      res.attachment('sentiments.csv');
      res.status(200).send(data);
    }
    else {
      res.status(404);
      res.json({ "error": "Type not supported." });
    }
  });
});

function get_sentiment_session_ids(callback) {
  session_ids = [];
  db.all("SELECT DISTINCT session_id FROM sentiment", function (err, rows) {
    for (var index in rows) {
      session_ids.push(rows[index].session_id);
    }
    callback(session_ids);
  });
}

app.get('/results/sessions', function (req, res) {
  res.status(200);
  get_sentiment_session_ids(function (sessions_ids) {
    res.json({ "sessions_ids": sessions_ids });
  })
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