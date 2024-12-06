var currentQuestionIndex = 0;
var quizData;
var userAnswers;
var quizContainer;

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
            <button id="next-button" class="button">Next</button>
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
                <button id="submit-quiz" class="button">Submit</button>
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