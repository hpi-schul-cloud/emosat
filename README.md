# emosat
Measuring LX

## Running
Execute `npm install` first, then run the project with `node index.js`. It will then run on the default port 3000. If you want to specify a different port, use the command line option `--port`, e.g. `node index.js --port 5000`. Please note that for privileged ports (<1024) you need the according privileges, otherwise the execution will fail.

The application can then be reached in from a browser on the local machine at `http://localhost:<port>`.
 
## Visual appearance
![animation](documentation/animation.gif "Questionaire appearance")

## Use
In your web source file, create an empty div, for example add `<div id="my_survey_div"></div>`. Include the libraries as follows:
```xml
<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.5.0/css/all.css"
    integrity="sha384-B4dIYHKNBt8Bc12p+WXckhzcICo0wtJAoU8YZTY5qE0Id1GSseTk6S+L3BlXeVIU" crossorigin="anonymous">
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
<link rel="stylesheet" type="text/css" href="lib/surveytool/survey.css">
<script src="lib/surveytool/surveytool.js"></script>
```

In your JS code, call `init_survey({div_name: "my_survey_div"});`. Optionally, you can also provide a session/user id (depending on the use case): `init_survey({div_name: "my_survey_div", session_id: "0000-1234-5678"});`. If none is provided, a UUID is generated on the server side. The session ID should not be possible to guess for the user, as otherwise other user's survey results could be influenced. Therefore internal and external ID of the session are clearly distinguished throughout the application.

If the survey server's request URL needs to be adapted, e.g. because it is running behind a reverse proxy, use `init_survey({div_name: "my_survey_div", server_prefix: "/surveytool"});`

## Endpoints for evaluation
`/results/answers/json` and `/results/answers/csv` resturn the answers for the individual questions as JSON and respectively CSV. Same applies for `/results/sentiments/json` and `/results/sentiments/csv`, which contain the initial user sentiment.

There might be several answers for a single questions and a single session ID, as the data is immediately transferred to the backend. If only the final result is of interes, all others can be ignored. This can be facilitated by using the `single_answer=true` URL parameter.

If only entries for a specific session ID are of interest, the session_id can be specified with the GET parameter `sid`, e.g. `/results/sentiments/json?sid=c6aed210-416c-11e9-9ec8-036a18eb7040`.

![csv-image](documentation/csv.png "CSV Output of given answers")

`/results/sessions` returns a list of sessions stored in the system with the corresponding activity time range (`from_time` and `to_time`).