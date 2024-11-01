var currentQuestionIndex = 0;
var quizData;
var userAnswers;
var quizContainer;
var quizID;

/**
 * Loads the appropriate quiz based on the quiz id from the URL query string parameter.
 *
 * @param {string} quiz_id
 */
async function loadQuizData(quiz_id) {
    
    const json_directory = await (
        await fetch("/frontend/content/quiz_data.json")
    ).json();

    console.log(JSON.stringify(json_directory));

    // Serve the quiz data that corresponds to the quiz ID
    for (let i = 0; i < json_directory.quizzes.length; i++) {
        if (json_directory.quizzes[i].quizID == quiz_id) {

            console.log("ID: " + json_directory.quizzes[i].quizID);

            console.log("filepath: " + json_directory.quizzes[i].filePath);

            quizData = await (
                await fetch(json_directory.quizzes[i].filePath)
            ).json();

            console.log(JSON.stringify(quizData));

            return;
        }
    }

    console.log('No quiz found with ID "' + quiz_id + '"');
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
            showSubmitButton();
        }
    } else {
        alert("Please select an answer before proceeding.");
    }
}

/**
 * Displays the submit button for the quiz.
 */
function showSubmitButton() {
    quizContainer.innerHTML = `
        <p>All questions answered. Click below to submit your answers.</p>
        <button id="submit-quiz">Submit</button>
    `;
    document.getElementById("submit-quiz").addEventListener("click", gradeQuiz);
    // document.getElementById("submit-quiz").addEventListener("click", saveResults);
}

/**
 * Grades the quiz and displays the results.
 *
 * @returns JSON object storing quiz submission data
 */
function gradeQuiz() {
    // const results = getSubmission();
    // console.log("results:", results);
    const results = quizData.questions.map((questionData, index) => {
        const userAnswer = userAnswers[index];
        const correctAnswer = questionData.answerID;
        const score = userAnswer === correctAnswer ? questionData.points : 0;
        var correctAnswerText = "";
        var userAnswerText = "";
        for (var i = 0; i < questionData.options.length; i++) {
            if (questionData.options[i].optionID == correctAnswer) {
                correctAnswerText = questionData.options[i].text;
                console.log("correctAnswerText", correctAnswerText);
            }
            if (questionData.options[i].optionID == userAnswer) {
                userAnswerText = questionData.options[i].text;
            }
        }

        return {
            question: questionData.question,
            questionID: questionData.questionID,
            userAnswer,
            userAnswerText,
            correctAnswer,
            correctAnswerText,
            score,
            isCorrect: userAnswer === correctAnswer,
        };
    });

    const answerData = quizData.questions.map((questionData, index) => {
        return {
            questionID: questionData.questionID,
            answerID: userAnswers[index]
        };
    });

     // Overwrite results in sessionStorage
     sessionStorage.setItem('quizResults', JSON.stringify(results));
     sessionStorage.setItem(`${quizID}Taken`, 'true');
 
     // Navigate to results page
     window.location.href = '/frontend/pages/results.html';

    displayResults(results);
    saveQuiz(localStorage.getItem("userId"), quizID, answerData);
}

function displayResults(results) {
    // Calculate total score
    const totalScore = results.reduce((acc, result) => acc + result.score, 0);

    var totalPossible = 0;
    for (var i = 0; i < quizData.questions.length; i++) {
        totalPossible += quizData.questions[i].points;
    }

    // Display total score
    quizContainer.innerHTML = `<h2>Quiz Results</h2><p>Total Score: ${totalScore}/${totalPossible}</p>`;

    results.forEach((result, index) => {
        quizContainer.innerHTML += `
            <div class="question">
                <p>Question ${index + 1}: ${result.question}</p>
                <p class="${result.isCorrect ? "correct" : "incorrect"}">
                    Your answer: ${result.userAnswerText || "No answer selected"}
                </p>
                <p>Correct answer: ${result.correctAnswerText}</p>
                <p>Score: ${result.score}/${
            quizData.questions[index].points
        }</p>
            </div>
        `;
    });
}

/**
 * Saves the quiz results in the MySQL database.
 *
 * @param {int} userID
 * @param {string} quizID
 * @param {json} quizResponses
 */
async function saveQuiz(userID, quizID, quizResponses) {
    console.log("yes");
    console.log("quiz:", quizResponses);
    console.log(
        "quiz string:",
        JSON.stringify({
            user_id: userID,
            quiz_id: quizID,
            answers: quizResponses,
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
                answers: quizResponses,
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

function saveResults() {
    // const meh = quizData.questions.map((questionData, index) => {
    //     const userAnswer = userAnswers[index];
    //     const correctAnswer = questionData.answer;
    //     const score = userAnswer === correctAnswer ? 1 : 0;
    //     return { question_number: index + 1, response: userAnswer, score };
    // });
    // console.log(meh);
    // saveQuiz(1, localStorage.getItem("userId"), meh);
}

function getSubmission() {
    const userID = localStorage.getItem('userId');
    const url = `https://www.boilertechtests.com/api/get-submit?userID=${encodeURIComponent(userID)}&quizID=${encodeURIComponent(quizID)}`;
    // const submission = "";

    fetch(url, {
        method: 'GET',
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.message);
            });
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('response-message').textContent = data.message;
        const submission = data.result;
        console.log("submit:", submission);
        return submission;
    })
    .catch(error => {
        document.getElementById('response-message').textContent = 'Error: ' + error.message;
    });
}

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


window.addEventListener("load", async function () {
    const params = new URLSearchParams(location.search);
    quizID = params.get("quiz-id");
    console.log(quizID);

    await loadQuizData(quizID);

    userAnswers = new Array(quizData.questions.length).fill(null);
    quizContainer = document.getElementById("quiz-contents");

    renderQuestion();
});