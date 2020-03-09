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

function publish_nps(nps) {
  $.ajax({
    url: server_prefix + "/nps",
    type: "POST",
    data: JSON.stringify({ "session_id": survey_options.session_id, "nps": nps }),
    contentType: "application/json; charset=utf-8",
    processData: false,
    dataType: "json",
    success: function () {
      console.log("Successfully sent NPS to server");
    }
  });
}

function publish_statistical_data(gender_id, age_group_id) {
  $.ajax({
    url: server_prefix + "/statistics",
    type: "POST",
    data: JSON.stringify({ "session_id": survey_options.session_id, "gender": gender_id, "age_group": age_group_id }),
    contentType: "application/json; charset=utf-8",
    processData: false,
    dataType: "json",
    success: function () {
      console.log("Successfully sent statistical data to server");
    }
  });
}

function publish_comment(comment) {
  $.ajax({
    url: server_prefix + "/comment",
    type: "POST",
    data: JSON.stringify({ "session_id": survey_options.session_id, "comment": comment }),
    contentType: "application/json; charset=utf-8",
    processData: false,
    dataType: "json",
    success: function () {
      console.log("Successfully sent comment to server");
    }
  });
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
  $(".survey-footer").removeClass("hidden");
  if (survey_options.request_nps == true) {
    content_state_nps();
  }
  else {
    content_stage_2(survey_options.question_series);
  }
}

function resize_survey_content(width, height, absolute=false) {
  var unit = absolute ? "px" : "%";
  $("#question_content").css({ "width": width + unit, "height" : height + unit });
}

function content_stage_statistics() {
  resize_survey_content(50, 50, false);
  $(".survey-content").html(statistics_html_content());
  $(".survey-footer").html(statistics_html_footer());
  $(".survey-header-text").text("Thank you!")

  $("#no-personal-data-button").click(function() {
    show_survey(false);
  });

  $("#statistics-submit-button").click(function() {
    var age_group_id = $("input[name='age']:checked").attr("answer");
    var gender_id = $("input[name='gender']:checked").attr("answer");

    publish_statistical_data(parseInt(gender_id, 10), parseInt(age_group_id, 10));

    var comment = $("#comment").val();
    publish_comment(comment);

    show_survey(false);
  })

  show_survey(true);
}

function content_state_nps() {
  $(".survey-content").addClass("footer-present");
  $(".survey-content").html(nps_html_content());
  $(".survey-footer").html(nps_html_footer());

  $("#nps-submit-button").click(function() {
    var nps_value = $("input[name='nps']:checked").attr("answer");
    if (nps_value !== undefined) {
      publish_nps(parseInt(nps_value, 10));
      survey_options.request_nps = false;
      content_stage_2(survey_options.question_series);
    }
    else {
      alert("Please select a value first");
    }
  });
}

function content_stage_2(question_series_id) {
  resize_survey_content(90, 50, false);
  $(".survey-content").html(survey_body_html_content());
  $(".survey-footer").html(survey_html_footer());

  $("#survey-submit-button").click(function() {
    show_survey(false);
    content_stage_statistics();
    //determine_survey_need();
  });

  $("#remind-me-later-button").click(function() {
    show_survey(false);
  });

  $(".survey-intro").text("Please help us improve by rating us according to the following criteria.");

  $.getJSON(server_prefix + "/questions/" + question_series_id + "/?" + get_sid_url_string() + get_role_url_string(), function (data) {
    if (data.success === true) {
      fill_survey(data.questions);
      $(".survey-header-text").text(data.survey_friendly_title);
      show_survey_table(true);
    }
    else {
      // If we cannot get data, we better hide.
      console.log("No more surveys available for this session");
      show_survey(false);
    }
  }).fail(function() {
  console.log("An error occured while retrieving the next survey.");
  show_survey(false);
  });
}

function get_sid_url_string() {
  return "sid=" + survey_options.session_id;
}

function get_role_url_string() {
  return survey_options.user_role ? "&role=" + survey_options.user_role : "";
}

function determine_survey_need() {
  console.log("Checking whether survey is needed");
  $.getJSON(server_prefix + "/should_present_survey?" + get_sid_url_string() + get_role_url_string(), function (data) {
    if (data.present_survey) {
      setTimeout(function () {
        if (data.starting_stage == 1) {
          show_survey(true);
        }
        else {
          proceed_survey();
          show_survey(true);
        }
        
      }, data.timeout);
    }
  })
}

function init_survey(options) {
  survey_options = options;
  survey_options.welcome_question = survey_options.welcome_question || "How is your learning journey so far?";
  console.log("Init of survey tool for div " + options.div_name);

  survey_options.question_series = survey_options.question_series || 1;
  $("#" + options.div_name).html(survey_html_content());
  $(".survey-content").html(pre_survey_html_content());
  $("#welcome-question").text(survey_options.welcome_question);

  if (survey_options.header_color) {
    $(".header-color").css("background", survey_options.header_color);
  }

  $(".survey_reaction.negative").text(survey_options.icon_negative || "👎");
  $(".survey_reaction.positive").text(survey_options.icon_positive || "👍");

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

function nps_html_content() {
  return `
  <h3>How likely is it that you would recommend <span id="brand-name">[brand]</span> to a friend or colleague?</h3>
  <table class="survey-table">
    <tr class="survey-nps">
      <td><span class="word-left">0</span></td>
      <td><input answer="0" type="radio" name="nps"></td>
      <td><input answer="1" type="radio" name="nps"></td>
      <td><input answer="2" type="radio" name="nps"></td>
      <td><input answer="3" type="radio" name="nps"></td>
      <td><input answer="4" type="radio" name="nps"></td>
      <td><input answer="5" type="radio" name="nps"></td>
      <td><input answer="6" type="radio" name="nps"></td>
      <td><input answer="7" type="radio" name="nps"></td>
      <td><input answer="8" type="radio" name="nps"></td>
      <td><input answer="9" type="radio" name="nps"></td>
      <td><input answer="10" type="radio" name="nps"></td>
      <td><span class="word-right">10</span></td>
    </tr>
  </table>
  `
}

function statistics_html_content() {
  return `
  Thank you for helping us! In order to understand your answer even, we'd like to know a little bit more about yourself.
  <h3>Gender</h3>
  <table class="survey-table">
    <tr>
      <td> female <input answer="0" type="radio" name="gender"></td>
      <td> male <input answer="1" type="radio" name="gender"></td>
      <td> other <input answer="2" type="radio" name="gender"></td>
      <td> I prefer not to answer <input answer="2" type="radio" name="gender"></td>
    </tr>
  </table>
  <h3>Age</h3>
  <table class="survey-table">
    <tr>
      <td>18-24 <input answer="0" type="radio" name="age"></td>
      <td>25-34 <input answer="1" type="radio" name="age"></td>
      <td>35-44 <input answer="2" type="radio" name="age"></td>
      <td>45-54 <input answer="3" type="radio" name="age"></td>
      <td>55-64 <input answer="4" type="radio" name="age"></td>
      <td>65+ <input answer="5" type="radio" name="age"></td>
    </tr>
  </table>

  <input type="text" id="comment"></input>
  `
}

function nps_html_footer() {
  return `
    <button id="nps-submit-button" class="submit">Submit</button>
  `
}

function survey_html_footer() {
  return `
    <button id="survey-submit-button" class="submit">Submit</button>
    <button id="remind-me-later-button" class="remind-me-later">Remind me later</button>
  `
}

function statistics_html_footer() {
  return `
    <button id="statistics-submit-button" class="submit">Submit</button>
    <button id="no-personal-data-button" class="remind-me-later">I prefer not to answer</button>
  `
}

function pre_survey_html_content() {
  return `
  <h3 class="surveytool-title">
    <span id="welcome-question"> I'm the question.</span>
    <div class="survey_reaction negative">👎</div>
    <div class="survey_reaction positive">👍</div>
  </h3>
  `
}

function survey_body_html_content() {
  return `
  <div id="survey_area" class="hidden">
    <div class="survey-intro">I am the intro.</div>
    <table class="survey-table">
      <tr class="survey-tr-header survey-tr-header-prototype hidden">
        <td colspan="7"><span class="survey-question">That's the Question</span></td>
      </tr>
      <tr class="survey-tr-header survey-tr-header-7-prototype hidden">
        <td colspan="9"><span class="survey-question">That's the Question</span></td>
      </tr>
      <tr class="survey-tr-prototype hidden">
        <td class="word-column"><span class="word-left">left</span></td>
        <td class="selection-column"><input answer="1" type="radio"></td>
        <td class="selection-column"><input answer="2" type="radio"></td>
        <td class="selection-column"><input answer="3" type="radio"></td>
        <td class="selection-column"><input answer="4" type="radio"></td>
        <td class="selection-column"><input answer="5" type="radio"></td>
        <td class="word-column"><span class="word-right">right</span></td>
      </tr>
      <tr class="survey-likert-7-tr-prototype hidden">
        <td class="word-column"><span class="word-left">left</span></td>
        <td class="selection-column"><input answer="1" type="radio"></td>
        <td class="selection-column"><input answer="2" type="radio"></td>
        <td class="selection-column"><input answer="3" type="radio"></td>
        <td class="selection-column"><input answer="4" type="radio"></td>
        <td class="selection-column"><input answer="5" type="radio"></td>
        <td class="selection-column"><input answer="6" type="radio"></td>
        <td class="selection-column"><input answer="7" type="radio"></td>
        <td class="word-column"><span class="word-right">right</span></td>
      </tr>
    </table>
  </div>
  `
}

function survey_html_content() {
  return `
  <div class="surveytool-container cf">
  <div id="question_content" class="animation-element bounce-up cf">
    <div class="subject survey">
      <div class="header-color">
        <div class="survey-header-text"></div>
        <div class="close-button">
          <i class="far fa-window-close"></i>
        </div>
      </div>

      <div class="survey-content"></div>

      <div class="survey-footer hidden"></div>

    </div>
  </div>
  </div>`
}