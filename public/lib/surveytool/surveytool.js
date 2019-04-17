var server_prefix = "";
var survey_options = {};

function show_survey_table(show) {
  if (show === true) {
    $("#survey_area").removeClass("hidden");
  }
  else {
    $("#survey_area").addClass("hidden");
  }
}

function retrieve_session_id() {
  $.getJSON(server_prefix + "/session_id", function (data) {
    if (data.session_id) {
      survey_options.session_id = data.session_id;
      determine_survey_need();
    }
    else {
      console.log("Error while retrieving session ID");
    }
  })
}

function show_survey(show) {
  if (show) {
    $("#question_content").addClass("in-view");
  }
  else {
    $("#question_content").removeClass("in-view");
  }
}

function add_survey_question(type, answers, question_id) {

  var table = $(".survey-table")

  var new_answer = undefined;
  if (type == "two_type_7" || type == "single_type_7") {
    new_answer = $(".survey-likert-7-tr-prototype").clone();
    new_answer.removeClass("survey-likert-7-tr-prototype");
  }
  else {
    new_answer = $(".survey-tr-prototype").clone();
    new_answer.removeClass("survey-tr-prototype");
  }
  row_identifier = "question-" + question_id;
  new_answer.removeClass("hidden");

  new_answer.attr("question", question_id);
  new_answer.find("input").on("click", function (event) {
    var question = $(event.target).parents("tr").attr("question");
    var answer = $(event.target).attr("answer")
    var response = JSON.stringify({ "session_id": survey_options.session_id, question: question, answer: answer });
    $.ajax({
      url: server_prefix + "/survey_results",
      type: "POST",
      data: response,
      contentType: "application/json; charset=utf-8",
      processData: false,
      dataType: "json",
      success: function () {
        console.log("Successfully sent data to server");
      }
    });

    console.log(question, answer);
  })

  new_answer.addClass("survey-answer-option");
  new_answer.find("input").attr("name", row_identifier)

  if (type == "single_type_5" || type == "single_type_7") {
    new_answer.find(".word-left").html("Does not apply");
    new_answer.find(".word-right").html("Fully applies");
    var question_header = undefined;
    if (type == "single_type_5") {
      var question_header = $(".survey-tr-header-prototype").clone();
      question_header.removeClass("survey-tr-header-prototype");
    }
    else if (type == "single_type_7") {
      var question_header = $(".survey-tr-header-7-prototype").clone();
      question_header.removeClass("survey-tr-header-7-prototype");
    }
    question_header.removeClass("hidden");
    question_header.find(".survey-question").html(answers[0]);
    table.append(question_header);
  }
  else if (type == "two_type_5" || type == "two_type_7") {
    new_answer.find(".word-left").html(answers[0]);
    new_answer.find(".word-right").html(answers[1]);
  }

  table.append(new_answer);
}

function publish_initial_sentiment(positive_sentiment) {
  $.ajax({
    url: server_prefix + "/initial_sentiment",
    type: "POST",
    data: JSON.stringify({ "session_id": survey_options.session_id, "sentiment": positive_sentiment ? "positive" : "negative" }),
    contentType: "application/json; charset=utf-8",
    processData: false,
    dataType: "json",
    success: function () {
      console.log("Successfully sent initial sentiment to server");
    }
  });
}

function opt_out() {
  $.ajax({
    url: server_prefix + "/opt_out",
    type: "POST",
    data: JSON.stringify({ "session_id": survey_options.session_id }),
    contentType: "application/json; charset=utf-8",
    processData: false,
    dataType: "json",
    success: function () {
      console.log("Successfully sent opt out to server");
    }
  });
}

function clear_survey() {
  $(".survey-answer-option").remove();
}

function fill_survey(answer_source) {
  clear_survey();
  for (i in answer_source) {
    var question_data = answer_source[i];
    add_survey_question(question_data.type, question_data.possible_reponses, question_data.id);
  }
}

function fill_survey_partial(answer_source, count, offset) {
  fill_survey(answer_source.slice(offset, offset + count));
}

function proceed_survey() {
  resize_survey_content(97, 50);
  content_stage_2();
}

function resize_survey_content(width, height) {
  $("#question_content").css({ "width": width + "%", "height": height + "%" });
}

function content_stage_2() {
  $(".title").text("Please help us improve by rating us according to the following criteria.");
  $.getJSON("/questions?" + get_sid_url_string() + get_role_url_string(), function (data) {
    fill_survey(data.questions);
    //fill_survey_partial(data.hedonic_quality, 3, 0);
    show_survey_table(true);
  });
}

function get_sid_url_string() {
  return "sid=" + survey_options.session_id;
}

function get_role_url_string() {
  return survey_options.role ? "&role=" + survey_options.role : "";
}

function determine_survey_need() {
  console.log("Checking whether survey is needed");
  $.getJSON(server_prefix + "/should_present_survey?" + get_sid_url_string() + get_role_url_string(), function (data) {
    if (data.present_survey) {
      setTimeout(function () {
        show_survey(true);
      }, data.timeout);
    }
  })
}

function init_survey(options) {
  survey_options = options;
  console.log("Init of survey tool for div " + options.div_name);

  $("#" + options.div_name).html(survey_html_content());
  server_prefix = options.server_prefix || "";

  if (survey_options.session_id) {
    determine_survey_need();
  }
  else {
    retrieve_session_id();
    // Need for survey needs to be determined asynchronously
  }

  $(".close-button").click(function () {
    show_survey(false);
    opt_out();
  })

  $(".survey_reaction").click(function () {
    publish_initial_sentiment($(this).hasClass("positive"));
    proceed_survey();
  });

}

function survey_html_content() {
  return `
  <div class="surveytool-container cf">
  <div id="question_content" class="animation-element bounce-up cf">
    <div class="subject survey">
      <div class="header-color"></div>
      <div class="icon"><i class="fa fa-poll-h"></i></div>
      <div class="close-button">
        <i class="fa fa-times"></i>
      </div>
      <h3 class="title">How is your learning journey so far?
        <div class="survey_reaction negative">👎</div>
        <div class="survey_reaction positive">👍</div>
      </h3>
      <div class="content">
        <div id="survey_area" class="hidden">
          <table class="survey-table">
            <tr class="survey-tr-header survey-tr-header-prototype hidden">
              <td colspan="7"><span class="survey-question">That's the Question</span></td>
            </tr>
            <tr class="survey-tr-header survey-tr-header-7-prototype hidden">
              <td colspan="9"><span class="survey-question">That's the Question</span></td>
            </tr>
            <tr class="survey-tr-prototype hidden">
              <td><span class="word-left">left</span></td>
              <td><input answer="1" type="radio"></td>
              <td><input answer="2" type="radio"></td>
              <td><input answer="3" type="radio"></td>
              <td><input answer="4" type="radio"></td>
              <td><input answer="5" type="radio"></td>
              <td><span class="word-right">right</span></td>
            </tr>
            <tr class="survey-likert-7-tr-prototype hidden">
              <td><span class="word-left">left</span></td>
              <td><input answer="1" type="radio"></td>
              <td><input answer="2" type="radio"></td>
              <td><input answer="3" type="radio"></td>
              <td><input answer="4" type="radio"></td>
              <td><input answer="5" type="radio"></td>
              <td><input answer="6" type="radio"></td>
              <td><input answer="7" type="radio"></td>
              <td><span class="word-right">right</span></td>
            </tr>
          </table>
        </div>
      </div>

    </div>
  </div>
  </div>`
}