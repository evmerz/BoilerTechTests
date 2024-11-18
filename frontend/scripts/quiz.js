var currentQuestionIndex = 0;
var quizData;
var userAnswers;
var quizContainer;

/**
 * Loads the appropriate multiple choice quiz based on the quiz id from the URL query string parameter.
 *
 * @param {string} quiz_id The unique ID of the quiz that is to be loaded in.
 * @returns The JSON data of the quiz. Returns null if there is no quiz found.
 */
async function loadQuizData(quiz_id) {
    
    const json_directory = await (
        await fetch("/frontend/content/quiz_data.json")
    ).json();

    console.log(JSON.stringify(json_directory));

    var _quizData;

    // Serve the quiz data that corresponds to the quiz ID
    for (let i = 0; i < json_directory.quizzes.length; i++) {
        if (json_directory.quizzes[i].quizID == quiz_id) {

            console.log("ID: " + json_directory.quizzes[i].quizID);

            console.log("filepath: " + json_directory.quizzes[i].filePath);

            _quizData = await (
                await fetch(json_directory.quizzes[i].filePath)
            ).json();

            if (_quizData.quizInfo.type != "mc") continue;

            console.log(JSON.stringify(_quizData));

            return _quizData;
        }
    }

    console.log('No quiz found with ID \"' + quiz_id + '\"');
    return null;
}

/**
 * Creates the HTML elements to display the question data.
 */
function renderQuestion() {
    const questionData = quizData.questions[currentQuestionIndex];
    quizContainer.innerHTML = `
        <div class="question">
            <p>${currentQuestionIndex + 1}. ${questionData.question}</p>
            ${questionData.options.map((option) => `
                <label class="option">
                    <input type="radio" name="quiz-question" value="${option.optionID}"
                    ${userAnswers[currentQuestionIndex] === option.optionID ? "checked" : ""}>
                    ${option.text}
                </label>`
                ).join("")
            }
        </div>
        <div>
            <button id="next-button">Next</button>
        </div>
    `;
    document.getElementById("next-button").addEventListener("click", nextQuestion);
}

/**
 * Goes to the next question of the quiz.
 */
function nextQuestion() {
    const selectedOption = document.querySelector(
        'input[name="quiz-question"]:checked'
    );
    if (selectedOption) {
        // Save the selected answer
        userAnswers[currentQuestionIndex] = selectedOption.value;

        if (currentQuestionIndex < quizData.questions.length - 1) {
            currentQuestionIndex++;
            renderQuestion();
        } else {
            // All questions answered, show submit button
            quizContainer.innerHTML = `
                <p>All questions answered. Click below to submit your answers.</p>
                <button id="submit-quiz">Submit</button>
            `;
            document.getElementById("submit-quiz").addEventListener("click", async () => {
                await storeQuizResults();
                window.location.href = `/frontend/pages/results.html?quiz-id=${quizID}`;
            });
        }
    } else {
        alert("Please select an answer before proceeding.");
    }
}

/**
 * Grades the quiz and stores results in local storage and the MySQL database (if the user is logged in).
 */
async function storeQuizResults() {

    const params = new URLSearchParams(location.search);
    quizID = params.get("quiz-id");

    // Store the results of the quiz in an array of JSON objects
    const results = quizData.questions.map((questionData, index) => {
        return {
            questionID: questionData.questionID,
            answerID: userAnswers[index]
        };
    });

    localStorage.setItem(`quiz_${quizID}`, JSON.stringify(results));

    // If there is a user logged in, store the quiz response in the database
    const userID = localStorage.getItem("userId");
    if (userID) await saveQuiz(userID, quizID, results);
}

/**
 * Saves the quiz results in the MySQL database.
 *
 * @param {int} userID The unique ID of the user that took the quiz.
 * @param {string} quizID The unique ID of the quiz that the user took.
 * @param {json} answerData The array of the user's responses to the quiz questions.
 */
async function saveQuiz(userID, quizID, answerData) {
    console.log("yes");
    console.log("quiz:", answerData);
    console.log(
        "quiz string:",
        JSON.stringify({
            user_id: userID,
            quiz_id: quizID,
            answers: answerData,
        })
    );

    const url = `https://boilertechtests.com/api/quiz`;
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: userID,
                quiz_id: quizID,
                answers: answerData,
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to save quiz");
        }

        const data = await response.json();
        console.log("Quiz saved successfully:", data);
    } catch (error) {
        console.error("Error saving quiz:", error);
    }
}

/**
 * Retrieves the user's quiz submission based on userID and quizID, respectively.
 * 
 * @param {int} userID The unique ID of the user that submitted the quiz.
 * @param {string} quizID The unique ID of the quiz that is to be requested.
 * @returns The JSON array of the user's responses to the quiz, pulled from the MySQL database. Returns null if there is no submission.
 */
async function getSubmission(userID, quizID) {
    const url = `https://www.boilertechtests.com/api/get-submit?userID=${encodeURIComponent(userID)}&quizID=${encodeURIComponent(quizID)}`;

    try {
        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message);
        }

        const data = await response.json();
        console.log("Submission data:", data.submissionData);

        return data.submissionData;
    } catch (error) {
        console.error("Error retrieving submission:", error);
        return null;
    }
}

// TODO: Change this function since topic ID isn't the same as file name (probs don't need function at all honestly)
async function getQuizID(topicID) {
    try {
        // Fetch the quiz_data.json file
        const json_directory = await (
            await fetch("/frontend/content/quiz_data.json")
        ).json();

        // Find the quiz whose file path includes the topicID
        for (const quiz of json_directory.quizzes) {
            if (quiz.filePath.includes(`quiz_${topicID}`)) {
                return quiz.quizID;
            }
        }
    } catch (error) {
        console.error("Error loading quiz data:", error);
    }

    // Return null if no quiz is found with the given topicID
    return null;
}