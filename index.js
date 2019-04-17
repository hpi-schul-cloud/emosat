const express = require('express')
const questions = require('./questions').word_pairs;

const json2csv = require('json2csv').parse;
const answer_fields = ['timestamp', 'session_id', 'option_left', 'option_right', 'value'];
const sentiment_fields = ['timestamp', 'session_id', 'sentiment'];

const Database = require('better-sqlite3');
const db = new Database('survey3.sqlite', {
  /* verbose: console.log */
});

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
  db.prepare("CREATE TABLE IF NOT EXISTS opt_out (timestamp INTEGER, session_id TEXT)").run();
  db.prepare("CREATE TABLE IF NOT EXISTS sentiment (timestamp INTEGER, session_id TEXT, sentiment TEXT)").run();
  db.prepare("CREATE TABLE IF NOT EXISTS response (timestamp INTEGER, session_id TEXT, question_id INTEGER, value INTEGER)").run();
  init_survey();
  init_questions();
}

function table_exists(table) {
  // SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}';
  var stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?");
  return (stmt.all(table).length > 0) == true;
}

function create_survey(name, title) {
  var survey_stmt = db.prepare("INSERT INTO survey (name, title) VALUES (?, ?)");
  survey_stmt.run(name, title);
  
  var stmt = db.prepare("SELECT max(ID) as id FROM survey");
  var result = stmt.get();
  var survey_id = result.id;
  return survey_id;
}

function get_questions_for_survey(survey_id) {
  var stmt = db.prepare("SELECT question_id as id, survey_question.position as position from survey_question where survey_id = ?");
  var rows = stmt.all(survey_id);
  return rows;
}

function add_question_to_survey(survey_id, question_id) {
  // Just put the next question to the end of the survey
  var position = get_questions_for_survey(survey_id).length;
  var survey_stmt = db.prepare("INSERT INTO survey_question (question_id, survey_id, position) VALUES (?, ?, ?)");
  survey_stmt.run(question_id, survey_id, position);
}

function add_question(type, parameters) {
  // returns the ID of the newly created question
  var question_stmt = db.prepare("INSERT INTO question (type) VALUES (?)");

  var question_id = -1;

  question_stmt.run(type);

  var stmt = db.prepare("SELECT max(ID) as id FROM question");
  var result = stmt.get();
  var question_id = result.id;

  for (var order = 0; order < parameters.responses.length; order++) {
    var response = parameters.responses[order];
    add_possible_reponse(question_id, response, order);
  }
  for (var category_index in parameters.categories) {
    add_category_for_question(question_id, parameters.categories[category_index]);
  }

  return question_id;
}

function add_category(name) {
  // returns the ID of the newly created category
  var category_id = category_exists(name);
  if (category_id <= 0) {
    var category_stmt = db.prepare("INSERT INTO category (name) VALUES (?)");
    category_stmt.run(name);
    category_id = category_exists(name);
  }

  console.log("Created category", category_id);
  return category_id;
}

function add_possible_reponse(question_id, text, question_order) {
  var possible_response_stmt = db.prepare("INSERT INTO possible_response (text, question_id, question_order) VALUES (?, ?, ?)");
  possible_response_stmt.run(text, question_id, question_order);
};

function category_exists(category_name) {
  var stmt = db.prepare("SELECT id FROM category where name = ?");
  var rows = stmt.all(category_name);
  return (rows.length > 0) ? rows[0].id : -1;
}

function link_category_question(question_id, category_id) {
  var stmt = db.prepare("INSERT INTO question_category (question_id, category_id) VALUES (?, ?)");
  stmt.run(question_id, category_id);
}

function add_category_for_question(question_id, category_name) {
  var category_id = add_category(category_name);
  link_category_question(question_id, category_id);
}

function bootstrap_questions() {
  categories = Object.keys(questions());
  console.log(categories);
  var test_survey_id = create_survey("test_survey", "The TEST survey");
  var question1 = add_question("two_type_7", {responses : ["inspiring", "boring"], categories : ["funny_questions"]});
  var question2 = add_question("two_type_7", {responses : ["good", "bad"], categories : ["set_A"]});
  
  add_question_to_survey(test_survey_id, question1);
  add_question_to_survey(test_survey_id, question2);

  add_question("single_type_7", {responses : ["I really like this software."], categories : ["test_survey", "set_B"]});
  add_question("single_type_7", {responses : ["I like the easter bunny."], categories : ["test_survey", "set_B"]});

  for (type_index in categories) {
    var type = categories[type_index];

    for (var i in questions()[type]) {
      var question_parameters = {
        responses: questions()[type][i],
        categories: [type, "blub"]
      };
      console.log(question_parameters);
      add_question("two_type_5", question_parameters);
    }
  }
}

function init_survey() {
  if (!table_exists("survey")) {
    db.prepare("CREATE TABLE IF NOT EXISTS survey (id INTEGER PRIMARY KEY, name TEXT, title TEXT)").run();
    db.prepare("CREATE TABLE IF NOT EXISTS survey_question (id INTEGER PRIMARY KEY, survey_id INTEGER, question_id INTEGER, position INTEGER)").run(); 
  }
}

function init_questions() {
  if (!table_exists("question")) {
    db.prepare("CREATE TABLE IF NOT EXISTS question (id INTEGER PRIMARY KEY, type TEXT)").run();
    db.prepare("CREATE TABLE IF NOT EXISTS possible_response (id INTEGER PRIMARY KEY, text TEXT, question_id INTEGER, question_order INTEGER)").run();
    db.prepare("CREATE TABLE IF NOT EXISTS category (id INTEGER PRIMARY KEY, name TEXT)").run();
    db.prepare("CREATE TABLE IF NOT EXISTS question_category (id INTEGER PRIMARY KEY, question_id INTEGER, category_id INTEGER)").run();
    bootstrap_questions();
  }
  else {
    console.log("Question table already exists. Skipping.");
  }
}

// Admin requests

app.get('/admin/question', function (req, res) {
  // Endpoint to return all available questions from 
  // the DB for admin purposes

  var limit = req.query.limit || 10;
  var offset = req.query.offset || 0;
  res.json(get_questions(undefined, undefined, limit, offset));
});

app.post('/admin/question', function (req, res, next) {
  res.status(200);
  res.json({ success: true });

});

// Regular requests

app.get("/session_id", function (req, res) {
  res.status(200);
  res.json({ session_id: uuidv1() });
})

function get_answers_for_question(question_id) {
  var stmt = db.prepare("SELECT text FROM possible_response where question_id = ? ORDER BY question_order ASC");
  return stmt.all(question_id);
}

function get_survey(survey_name) {
  var stmt = db.prepare("SELECT id, title FROM survey where name = ?");
  return stmt.all(survey_name);
} 

function get_questions(survey_name, category_name, limit, offset) {
  var survey_id = 0;
  var survey_filter = "";
  var survey_from = "";
  var survey_title = "";
  var survey_order = "";

  if (survey_name !== undefined) {
    
    var survey_data = get_survey(survey_name);
    console.log(survey_data);
    if (survey_data.length > 0) {
      survey_id = survey_data[0].id;
      survey_title = survey_data[0].title;
      survey_filter = " ANd survey_question.survey_id = ? AND survey_question.question_id = t1.id";
      survey_from = "survey_question, ";
      survery_order = "survey_question.position ASC, ";
    }
    else {
      var error_text = "Survey " + survey_name + " was not found.";
      console.log(error_text);
      return {questions : [], 
              survey_title : "", 
              error: error_text, 
              status : 404};
    }
    
  }

  var category_filter = (category_name !== undefined) ? " ANd category.name = ? " : "";
  var limit_statement = limit > 0 ? "LIMIT ? OFFSET ?" : "";

  var sql = "SELECT t1.id AS id, \
                                  t1.type AS type, \
                                  possible_response.text AS text, \
                                  category.name as category \
                          FROM \
                                  (SELECT * FROM question " + limit_statement + ")\
                                  t1, " + survey_from + "\
                                  possible_response, \
                                  question_category, \
                                  category \
                          WHERE \
                                  t1.id = possible_response.question_id \
                                aND \
                                  t1.id = question_category.question_id \
                                AnD \
                                  question_category.category_id = category.id " + category_filter + survey_filter+ "\
                          ORDER BY " + survery_order + "\
                                  id ASC, \
                                  possible_response.question_order ASC;";
  var stmt = db.prepare(sql);
  var parameters = [];
  if (limit > 0) {
    parameters.push(limit);
    parameters.push(offset);
  }
  if (category_name !== undefined) {
    parameters.push(category_name);
  }
  if (survey_id > 0) {
    parameters.push(survey_id);
  }

  var rows = stmt.all(parameters);
  var result = [];
  var mapping = {};
  for (row_index in rows) {
    var row = rows[row_index];
    var key = "question_" + row.id;
    if (!(key in mapping)) {
      mapping[key] = result.length;
      result.push({ "id": row.id, "type": row.type, "possible_reponses": [], "categories": [] });
    }
    if (!result[mapping[key]].possible_reponses.includes(row.text)) {
      result[mapping[key]].possible_reponses.push(row.text);
    }
    if (!result[mapping[key]].categories.includes(row.category)) {
      result[mapping[key]].categories.push(row.category);
    }
  }

  return {questions : result, 
    survey_title : survey_title,
    survey_id : survey_id,
    error: "", 
    status : 200};

}

app.get('/questions', function (req, res) {
  console.log("(" + req.query.sid + ") Asking for questions");
  var data = get_questions("test_survey", undefined, 0, 0);
  res.status(data.status);
  res.json(data);
});

app.get('/should_present_survey', function (req, res) {
  res.status(200);
  console.log("(" + req.query.sid + ") Asking whether to present survey");
  var opt_out = has_opted_out(req.query.sid);
  if (!opt_out) {
    res.json({ "present_survey": true, "timeout": 1000 });
    console.log("(" + req.query.sid + ") We're good to go.");
  }
  else {
    res.json({ "present_survey": false });
    console.log("(" + req.query.sid + ") Session had already opted out. No questions asked.");
  }
});

function has_opted_out(session_id) {
  var stmt = db.prepare("SELECT 1 FROM opt_out WHERE session_id = ?");
  var rows = stmt.all(session_id);
  return (rows.length > 0);
}

app.post('/opt_out', function (req, res, next) {
  res.status(200);
  res.json({ success: true });
  var stmt = db.prepare("INSERT INTO opt_out VALUES (?, ?)");
  stmt.run(
    + new Date(),
    req.body.session_id
  );
  console.log("(" + req.body.session_id + ") User opted out");
});

app.post('/initial_sentiment', function (req, res, next) {
  res.status(200);
  res.json({ success: true });
  var stmt = db.prepare("INSERT INTO sentiment VALUES (?, ?, ?)");
  stmt.run(
    + new Date(),
    req.body.session_id,
    req.body.sentiment);
  console.log("(" + req.body.session_id + ") Initial sentiment" + " --> " + req.body.sentiment);
});

function get_answers(session_id, single_value) {
  var session_filter = session_id !== undefined ? "WHERE session_id = ? " : "";
  var sql = "";
  if (single_value) {
    sql = "SELECT t1.timestamp, t1.session_id, t1.question_id, response.value FROM \
                (SELECT max(timestamp) as timestamp, \
                        session_id, \
                        question_id \
                   FROM response " + session_filter + "\
                   GROUP BY session_id, question_id) t1 \
                INNER JOIN response \
                ON t1.timestamp = response.timestamp \
               AND t1.session_id = response.session_id \
               AND t1.question_id = response.question_id;";
  }
  else {
    sql = "SELECT timestamp, \
                  session_id, \
                  question_id \
                  FROM response " + session_filter + ";";
  }
  return db.prepare(sql).all(session_id !== undefined ? [session_id] : []);
}

function get_sentiments(session_id) {
  var stmt = session_id !== undefined ?
    db.prepare("SELECT timestamp, session_id, sentiment FROM sentiment WHERE session_id = ?") :
    db.prepare("SELECT timestamp, session_id, sentiment FROM sentiment");
  return session_id !== undefined ? stmt.all(session_id) : stmt.all();
}

app.get('/results/answers/:format', function (req, res) {
  var format = req.params.format;
  var sid = req.query.sid || undefined
  var single_answer = req.query.single_answer == "true";
  var answers = get_answers(sid, single_answer);
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
});

app.get('/results/sentiments/:format', function (req, res) {
  var format = req.params.format;
  var sid = req.query.sid || undefined;
  var sentiments = get_sentiments(sid)
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

function get_session_ids() {
  session_ids = [];
  return db.prepare("SELECT session_id, MIN(timestamp) AS 'from_time', MAX(timestamp) AS 'to_time' \
                    FROM (SELECT session_id, timestamp FROM sentiment \
                            UNION ALL \
                          SELECT session_id, timestamp FROM response) \
                    GROUP BY session_id;").all();
}

app.get('/results/sessions', function (req, res) {
  res.status(200);
  res.json({ "sessions_ids": get_session_ids() });
});

app.post('/survey_results', function (req, res, next) {
  res.status(200);
  res.json({ sucess: true });
  var stmt = db.prepare("INSERT INTO response VALUES (?, ?, ?, ?)");
  //time TIMESTAMP, session_id TEXT, question_id INTEGER, value INTEGER
  stmt.run(
    + new Date(),
    req.body.session_id,
    req.body.question,
    req.body.answer
  );
  console.log("answer received (" + req.body.session_id + ") " + req.body.question + " --> " + req.body.answer);
});

// Serve static content from the public directory
app.use(express.static('public'))
init_database();
app.listen(port, () => console.log(`Example app listening on port ${port}!`))
//db.close();