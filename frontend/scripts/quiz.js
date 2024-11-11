var currentQuestionIndex = 0;
var quizData;
var userAnswers;
var quizContainer;
var quizID;

/**
 * Loads the appropriate multiple choice quiz based on the quiz id from the URL query string parameter.
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

            if (quizData.quizInfo.type != "mc") continue;

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
async function gradeQuiz() {
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

    // displayResults(answerData);

    // Navigate to results page
    // window.location.href = '/frontend/pages/results.html';
    // displayResults(results);
    const userID = localStorage.getItem('userId');
    const { submitted, submissionData } = await getSubmission(userID, quizID);
    console.log("gradequiz submissionData:", submissionData);

    saveQuiz(localStorage.getItem("userId"), quizID, answerData);
    if (submitted) {
        displayResults(submissionData)
    } else {
        displayResults(answerData);
    }
    window.location.href = '/frontend/pages/results.html';

    // maybe?
    
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

// function getSubmission(quizID, userID) {
//     console.log("inside");
//     const url = `https://www.boilertechtests.com/api/get-submit?userID=${encodeURIComponent(userID)}&quizID=${encodeURIComponent(quizID)}`;
//     // const submission = "";

//     const response =fetch(url, {
//         method: 'GET',
//     })
//     .then(response => {
//         console.log("response");
//         if (!response.ok) {
//             console.log("response bad");
//             return response.json().then(errorData => {
//                 throw new Error(errorData.message);
//             });
//         }
//         console.log("response good");
//         return response.json().data;
//     })
//     .then(data => {
//         console.log("data:", data);
//         // document.getElementById('response-message').textContent = data.message;
//         // const submission = data.result;
//         // console.log("submit:", submission);
//         // return submission;
//     })
//     .catch(error => {
//         console.log("error");
//         throw error;
//         // document.getElementById('response-message').textContent = 'Error: ' + error.message;
//     });
//     // return submission;
// }

// async function getSubmission(quizID, userID) {
//     const url = `https://www.boilertechtests.com/api/get-submit?userID=${encodeURIComponent(userID)}&quizID=${encodeURIComponent(quizID)}`;

//     try {
//         const response = await fetch(url, { method: 'GET' });
//         if (!response.ok) {
//             const errorData = await response.json();
//             throw new Error(errorData.message);
//         }

//         const data = await response.json();
//         console.log("Submission status:", data.submitted);
//         console.log("submission from quiz.js:", data.submission);
//         return data.submission; // Return the submitted status directly
//     } catch (error) {
//         console.error("Error retrieving submission:", error);
//         return null;
//     }
// }

async function getSubmission(userID, quizID) {
    const url = `https://www.boilertechtests.com/api/get-submit?userID=${encodeURIComponent(userID)}&quizID=${encodeURIComponent(quizID)}`;

    try {
        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message);
        }

        const data = await response.json();
        console.log("Submission status:", data.submitted);
        console.log("Submission data:", data.submissionData);

        return {
            submitted: data.submitted,
            submissionData: data.submissionData
        };
    } catch (error) {
        console.error("Error retrieving submission:", error);
        return { submitted: false, submissionData: null };
    }
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


window.addEventListener("DOMContentLoaded", async function () {
    const params = new URLSearchParams(location.search);
    quizID = params.get("quiz-id");
    console.log(quizID);

    await loadQuizData(quizID);

    userAnswers = new Array(quizData.questions.length).fill(null);
    quizContainer = document.getElementById("quiz-contents");

    renderQuestion();
});