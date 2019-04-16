const express = require('express')
const questions = require('./questions').word_pairs;

const json2csv = require('json2csv').parse;
const answer_fields = ['timestamp', 'session_id', 'option_left', 'option_right', 'value'];
const sentiment_fields = ['timestamp', 'session_id', 'sentiment'];

var sqlite3 = require('sqlite3').verbose();
//var db = new sqlite3.Database(':memory:');
var db = new sqlite3.Database('survey.sqlite');

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
    db.run("CREATE TABLE IF NOT EXISTS opt_out (timestamp INTEGER, session_id TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS sentiment (timestamp INTEGER, session_id TEXT, sentiment TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS response (timestamp INTEGER, session_id TEXT, option_left TEXT, option_right TEXT, value INTEGER)");
  });
  init_questions();
}

function table_exists(table, callback) {
  // SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}';
  var stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?");
  stmt.all(table, function (err, rows) {
    callback(rows.length > 0);
  });
}

function add_question(type, parameters, callback) {
  var question_stmt = db.prepare("INSERT INTO question (type) VALUES (?)");
  // optional callback returns the ID of the newly created question

  var question_id = -1;
  var error = { "description": "unknown" };

  question_stmt.run(type);
  question_stmt.finalize();

  var stmt = db.prepare("SELECT max(ID) as id FROM question");
  stmt.all(function (err, rows) {
    var question_id = rows[0].id;
    //callback(question_id, callback_param);

    for (var order = 0; order < parameters.responses.length; order++) {
      var response = parameters.responses[order];
      add_possible_reponse(question_id, response, order);
    }
    for (var category_index in parameters.categories) {
      add_category_for_question(question_id, parameters.categories[category_index]);
    }

    if (callback != undefined) {
      callback(question_id);
    }
  });

}

function add_category(name, callback) {
  var category_stmt = db.prepare("INSERT INTO category (name) VALUES (?)");
  // returns the ID of the newly created category in the callback

  category_stmt.run(name);
  category_stmt.finalize();

  var stmt = db.prepare("SELECT max(ID) as id FROM category ");
  db.serialize(function () {
    stmt.all(function (err, rows) {
      var category_id = rows[0].id;
      console.log("Created category", category_id);
      callback(category_id, {});
    });
  });
}

function add_possible_reponse(question_id, text, question_order) {
  var possible_response_stmt = db.prepare("INSERT INTO possible_response (text, question_id, question_order) VALUES (?, ?, ?)");
  possible_response_stmt.run(text, question_id, question_order);
  possible_response_stmt.finalize();
};

function category_exists(category_name, callback) {
  var stmt = db.prepare("SELECT id FROM category where name = ?");
  stmt.all(category_name, function (err, rows) {
    console.log("-->", category_name, rows);
    var exists = (rows.length > 0);
    var category_id = 0;
    if (rows.length > 0) {
      category_id = rows[0].id;
    }

    callback(exists, category_id);
  });
}

function link_category_question(question_id, category_id) {
  var stmt = db.prepare("INSERT INTO question_category (question_id, category_id) VALUES (?, ?)");
  stmt.run(question_id, category_id);
  stmt.finalize();
}

function add_category_for_question(question_id, category_name) {
  category_exists(category_name, function (exists, category_id) {
    console.log(category_name, exists ? "DOES" : "DOES NOT", "exist");

    if (!exists) {
      add_category(category_name, function (category_id) {
        link_category_question(question_id, category_id);
      });
    }
    else {
      link_category_question(question_id, category_id);
    }
  });
}

function bootstrap_questions() {
  categories = Object.keys(questions());
  console.log(categories);
  for (type_index in categories) {
    var type = categories[type_index];
    
    for (var i in questions()[type]) {
      var question_parameters = {
        responses: questions()[type][i],
        categories: [type, "blub"]
      };
      console.log(question_parameters);
      add_question("two_type", question_parameters);
    }
  }
}

function init_questions() {
  table_exists("question", function (exists) {
    if (!exists) {
      db.serialize(function () {
        db.run("CREATE TABLE IF NOT EXISTS question (id INTEGER PRIMARY KEY, type TEXT)");
        db.run("CREATE TABLE IF NOT EXISTS possible_response (id INTEGER PRIMARY KEY, text TEXT, question_id INTEGER, question_order INTEGER)");
        db.run("CREATE TABLE IF NOT EXISTS category (id INTEGER PRIMARY KEY, name TEXT)");
        db.run("CREATE TABLE IF NOT EXISTS question_category (id INTEGER PRIMARY KEY, question_id INTEGER, category_id INTEGER)");

        bootstrap_questions();
      });
    }
    else {
      console.log("Question table already exists. Skipping.");
    }
  });
}

// Admin requests

app.get('/admin/question', function (req, res) {
  // Endpoint to return all available questions from 
  // the DB for admin purposes

  var limit = req.query.limit || 10;
  var offset = req.query.offset || 0;
  get_questions(function (questions) {
    res.json(questions);
  }, undefined, limit, offset);
});

app.post('/admin/question', function (req, res, next) {
  res.status(200);
  res.json({ success: true });
  db.serialize(function () {
    var stmt = db.prepare("INSERT INTO question VALUES (?, ?)");
    stmt.run(
      + new Date(),
      req.body.session_id
    );
    stmt.finalize();
  });
  console.log("(" + req.body.session_id + ") User opted out");
});

// Regular requests

app.get("/session_id", function (req, res) {
  res.status(200);
  res.json({ session_id: uuidv1() });
})

function get_answers_for_question(question_id, callback) {
  var stmt = db.prepare("SELECT text FROM possible_response where question_id = ? ORDER BY question_order ASC");

  stmt.all(question_id, function (err, rows) {
    callback(rows);
  });
}

function get_questions(callback, category_name, limit, offset) {
  // select question.id as id, question.type as type, possible_response.text as text from question, possible_response where question.id = possible_response.question_id LIMIT ? OFFSET ? ORDER BY question_id ASC;
  if (category_name !== undefined) {
    var stmt = db.prepare("SELECT id, option_left, option_right FROM question WHERE category = ?");
    stmt.all(category_name, function (err, rows) {
      callback(rows);
    });
  }
  else {

    //SELECT * FROM possible_response INNER JOIN question ON question.id = (select id, type from question where question.id = possible_response.question_id order by question.id asc limit 5);
    //var stmt = db.prepare("SELECT question.id AS id, question.type AS type, possible_response.text AS text FROM question, possible_response WHERE question.id = possible_response.question_id LIMIT ? OFFSET ? ORDER BY id ASC");

    //var stmt = db.prepare("SELECT t1.id AS id, t1.type AS type, possible_response.text AS text FROM (SELECT * FROM question LIMIT ? OFFSET ?) t1, possible_response where t1.id = possible_response.question_id order by id asc, possible_response.question_order asc;");
    var stmt = db.prepare("SELECT t1.id AS id, t1.type AS type, possible_response.text AS text, category.name as category FROM (SELECT * FROM question LIMIT ? OFFSET ?) t1, possible_response, question_category, category where t1.id = possible_response.question_id = question_category.question_id and question_category.category_id = category.id ORDER BY id ASC, possible_response.question_order ASC;");
    stmt.all(limit, offset, function (err, rows) {
      var result = [];
      var mapping = {};
      for (row_index in rows) {
        var row = rows[row_index];
        var key = "question_" + row.id;
        if (!(key in mapping)) {
          mapping[key] = result.length;
          result.push({ "id": row.id, "type": row.type, "possible_reponses": [] , "categories" : []});
        }
        if (!result[mapping[key]].possible_reponses.includes(row.text)) {
          result[mapping[key]].possible_reponses.push(row.text);
        }
        if (!result[mapping[key]].categories.includes(row.category)) {
          result[mapping[key]].categories.push(row.category);
        }
      }
      callback(result);
    });
  }
}

app.get('/questions', function (req, res) {
  res.status(200);
  console.log("(" + req.query.sid + ") Asking for questions");
  get_questions(function (questions) {
    res.json(questions);
  }, "hedonic_quality");
});

app.get('/should_present_survey', function (req, res) {
  res.status(200);
  console.log("(" + req.query.sid + ") Asking whether to present survey");
  has_opted_out(function (opt_out) {
    if (!opt_out) {
      res.json({ "present_survey": true, "timeout": 1000 });
      console.log("(" + req.query.sid + ") We're good to go.");
    }
    else {
      res.json({ "present_survey": false });
      console.log("(" + req.query.sid + ") Session had already opted out. No questions asked.");
    }
  }, req.query.sid);

});

function has_opted_out(callback, session_id) {
  var stmt = db.prepare("SELECT 1 FROM opt_out WHERE session_id = ?");
  stmt.all(session_id, function (err, rows) {
    callback(rows.length > 0);
  });
}

app.post('/opt_out', function (req, res, next) {
  res.status(200);
  res.json({ success: true });
  db.serialize(function () {
    var stmt = db.prepare("INSERT INTO opt_out VALUES (?, ?)");
    stmt.run(
      + new Date(),
      req.body.session_id
    );
    stmt.finalize();
  });
  console.log("(" + req.body.session_id + ") User opted out");
});

app.post('/initial_sentiment', function (req, res, next) {
  res.status(200);
  res.json({ success: true });
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

function get_answers(callback, session_id) {
  answers = [];
  var stmt = session_id !== undefined ?
    db.prepare("SELECT timestamp, session_id, option_left, option_right, value FROM response WHERE session_id = ?") :
    db.prepare("SELECT timestamp, session_id, option_left, option_right, value FROM response");
  stmt.all(session_id, function (err, rows) {
    callback(rows);
  });
}

function get_sentiments(callback, session_id) {
  sentiments = [];
  var stmt = session_id !== undefined ?
    db.prepare("SELECT timestamp, session_id, sentiment FROM sentiment WHERE session_id = ?") :
    db.prepare("SELECT timestamp, session_id, sentiment FROM sentiment");
  stmt.all(session_id, function (err, rows) {
    callback(rows);
  });
}

app.get('/results/answers/:format', function (req, res) {
  var format = req.params.format;
  var sid = req.query.sid || undefined
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
  }, sid)
});

app.get('/results/sentiments/:format', function (req, res) {
  var format = req.params.format;
  var sid = req.query.sid || undefined;
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
  }, sid);
});

function get_session_ids(callback) {
  session_ids = [];
  db.all("SELECT session_id, MIN(timestamp) AS 'from_time', MAX(timestamp) AS 'to_time' FROM (SELECT session_id, timestamp FROM sentiment UNION ALL SELECT session_id, timestamp FROM response) GROUP BY session_id;", function (err, rows) {
    callback(rows);
  });
}

app.get('/results/sessions', function (req, res) {
  res.status(200);
  get_session_ids(function (sessions_ids) {
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