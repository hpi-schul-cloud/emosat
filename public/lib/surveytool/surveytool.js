var survey_session_id = "";
function show_survey_table(show) {
  if (show === true) {
    $("#survey_area").removeClass("hidden");
  }
  else {
    $("#survey_area").addClass("hidden");
  }
}

function show_survey(show) {
  if (show) {
    $("#question_content").addClass("in-view");
  }
  else {
    $("#question_content").removeClass("in-view");
  }
}

function add_survey_question(left_word, right_word, row_identifier) {
  var table = $(".survey-table")
  var new_answer = $(".survey-tr-prototype").clone();
  row_identifier = row_identifier || "answer";
  new_answer.removeClass("hidden");
  new_answer.attr("question", left_word + "#" + right_word);
  new_answer.find("input").on("click", function (event) {
    var question = $(event.target).parents("tr").attr("question");
    var answer = $(event.target).attr("answer")
    var response = JSON.stringify({ "session_id": survey_session_id, question: question, answer: answer });

    $.ajax({
      url: "/survey_results",
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
  new_answer.removeClass("survey-tr-prototype");
  new_answer.addClass("survey-answer-option");
  new_answer.find("input").attr("name", row_identifier)
  new_answer.find(".word-left").html(left_word);
  new_answer.find(".word-right").html(right_word);
  table.append(new_answer);
}

function publish_initial_sentiment(positive_sentiment) {
  $.ajax({
    url: "/initial_sentiment",
    type: "POST",
    data: JSON.stringify({ "session_id": survey_session_id, "sentiment": positive_sentiment ? "positive" : "negative" }),
    contentType: "application/json; charset=utf-8",
    processData: false,
    dataType: "json",
    success: function () {
      console.log("Successfully sent initial sentiment to server");
    }
  });
}

function clear_survey() {
  $(".survey-answer-option").remove();
}

function fill_survey(answer_source) {
  clear_survey();
  for (i in answer_source) {
    var pair = answer_source[i];
    add_survey_question(pair[0], pair[1], "question-" + i);
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
  $.getJSON("/questions?sid=" + survey_session_id, function (data) {
    fill_survey(data.pragmatic_quality);
    //fill_survey_partial(data.hedonic_quality, 3, 0);
    show_survey_table(true);
  });
}

function init_survey(div_name, session_id) {
  $("#" + div_name).html(survey_html_content());
  survey_session_id = session_id;

  console.log("Init of survey tool");
  $.getJSON("/should_present_survey?sid=" + survey_session_id, function (data) {
    if (data.present_survey) {
      setTimeout(function () {
        show_survey(true);
      }, data.timeout);
    }
  })


  $(".close-button").click(function () {
    show_survey(false);
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
            <tr class="survey-tr-prototype hidden">
              <td><span class="word-left">left</span></td>
              <td><input answer="1" type="radio"></td>
              <td><input answer="2" type="radio"></td>
              <td><input answer="3" type="radio"></td>
              <td><input answer="4" type="radio"></td>
              <td><input answer="5" type="radio"></td>
              <td><span class="word-right">right</span></td>
            </tr>
          </table>
        </div>
      </div>

    </div>
  </div>
  </div>`
}