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

function word_pairs() {

  /*
  Marc Hassenzahl, Annika Wiklund-Engblom,
  Anette Bengs, Susanne Hägglund & Sarah Diefenbach

  (2015) Experience-Oriented and Product-Oriented Evaluation:
  Psychological Need Fulfillment, Positive Affect, and Product
  Perception, International Journal of Human-Computer Interaction,
  31:8, 530-544, DOI: 10.1080/10447318.2015.1064664
  */

  var pragmatic_quality = [
    ["human", "technical"],
    ["simple", "complicated"],
    ["practical", "impractical"],
    ["straightforward", "cumbersome"],
    ["predictable", "unpredictable"],
    ["clearly structured", "confusing"],
    ["manageable", "unruly"],
  ];

  var hedonic_quality = [
    ["connective", "isolating"],
    ["professional", "unprofessional"],
    ["stylish", "tacky"],
    ["premium", "cheap"],
    ["integrating", "alienating"],
    ["brings me closer to people", "separates me from people"],
    ["presentable", "unpresentable"],
    ["inventive", "conventional"],
    ["creative", "unimaginative"],
    ["bold", "cautious"],
    ["innovative", "conservative"],
    ["captivating", "dull"],
    ["challenging", "undemanding"],
    ["novel", "ordinary"]
  ]
   return {"pragmatic_quality" : pragmatic_quality,
           "hedonic_quality" : hedonic_quality}
}


function content_stage_2() {
  $(".title").text("Please help us improve by rating us according to the follwing criteria.");
  fill_survey(word_pairs().pragmatic_quality);
  //fill_survey_partial(word_pairs().hedonic_quality, 3, 0);

  show_survey_table(true);
}
