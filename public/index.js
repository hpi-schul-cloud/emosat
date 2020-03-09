$(function () {
    //init_survey({div_name: "my_survey_div", session_id: "0000-1234-5678"});
    //init_survey({div_name: "my_survey_div", server_prefix: "/surveytool"});
    init_survey({
        div_name: "my_survey_div", 
        user_role : "student",
        request_nps : true, 
        //header_color: "#f00",
        //icon_positive: "👍",
        //icon_negative: "👎",
        question_series : 2
    });
});