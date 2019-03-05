$(function() {
  console.log("test");
    setTimeout(function() {
      show_survey(true);
    }, 1000);

  $(".close-button").click(function() {
      show_survey(false);
  })

  $(".survey_reaction").click(function() {
    proceed_survey();
  });
});

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
  new_answer.find("input").on("click", function(event) {
    var question = $(event.target).parents("tr").attr("question");
    var answer = $(event.target).attr("answer")
    var response = JSON.stringify({question: question, answer: answer});

    $.ajax({
      url:"/survey_results",
      type:"POST",
      data:response,
      contentType:"application/json; charset=utf-8",
      processData: false,
      dataType:"json",
      success: function(){
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
  fill_survey(answer_source.slice(offset, offset+count));
}

function proceed_survey() {
  resize_survey_content(97, 50);
  content_stage_2();
}

function resize_survey_content(width, height) {
  $("#question_content").css({"width": width + "%", "height" : height + "%"});
}

function content_stage_2() {
  $(".title").text("Please help us improve by rating us according to the following criteria.");
  $.getJSON( "/questions", function( data ) {
    fill_survey(data.pragmatic_quality);
    //fill_survey_partial(data.hedonic_quality, 3, 0);
    show_survey_table(true);
  });
}
