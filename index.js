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

function show_survey(show) {
  if (show) {
    $("#question_content").addClass("in-view");
  }
  else {
    $("#question_content").removeClass("in-view");
  }
}


function proceed_survey() {
  resize_survey_content(97, 50);
  content_stage_2();
}

function resize_survey_content(width, height) {
  $("#question_content").css({"width": width + "%", "height" : height + "%"});
}

function content_stage_2() {
  $(".title").text("Please help us improve.")
  $(".content").html("<ul><li>This is some question...</li><li>This is some question...</li><li>This is some question...</li><li>This is some question...</li><li>This is some question...</li><li>This is some question...</li><li>This is some question...</li><li>This is some question...</li><li>This is some question...</li><li>This is some question...</li><li>This is some question...</li><li>This is some question...</li><li>This is some question...</li><li>This is some question...</li><li>This is some question...</li><li>This is some question...</li><li>This is some question...</li></ul>")
}
