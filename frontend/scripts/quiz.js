var currentQuestionIndex = 0;
var quizData;
var userAnswers;
var quizContainer;

document.addEventListener('DOMContentLoaded', function() {

    const params = new URLSearchParams(location.search);
    loadQuizData(params.get('quiz-id'));

    userAnswers = new Array(quizData.length).fill(null);
    quizContainer = document.getElementById('quiz-contents');

    renderQuestion();
});


/**
 * Loads the appropriate quiz based on the quiz id from the URL query string parameter.
 * 
 * @param {string} quiz_id 
 */
function loadQuizData(quiz_id) {

    fetch("/frontend/content/quiz_data.json")
        .then((response) => response.json())
        .then((json) => {
            for (let i = 0; i < json.quizzes.length; i++) {
                if (json.quizzes[i].id == quiz_id) {
                    fetch("/frontend/content/quizzes/" + json.quizzes[i].fileName)
                        .then((response) => response.json())
                        .then((quizJSON) => {
                            quizData = quizJSON;
                        });
                    return;
                }
                classData[json.classes[i].id] = json.classes[i];
                console.log(classData[json.classes[i].id].name);
            }

            console.log("No quiz found with ID \"" + quiz_id + "\"");
        });
}

/**
 * Creates the HTML elements to display the question data.
 */
function renderQuestion() {
    const questionData = quizData.questions[currentQuestionIndex];
    quizContainer.innerHTML = `
        <div class="question">
            <p>${currentQuestionIndex + 1}. ${questionData.question}</p>
            ${questionData.options.map(option => `
                <label class="option">
                    <input type="radio" name="quiz-question" value="${option.answer}" ${userAnswers[currentQuestionIndex] === option.optionID ? 'checked' : ''}>
                    ${option.answer}
                </label>`).join('')}
        </div>
        <div>
            <button id="next-button">Next</button>
        </div>
    `;
    document.getElementById('next-button').addEventListener('click', nextQuestion);
}

/**
 * Goes to the next question of the quiz.
 */
function nextQuestion() {
    const selectedOption = document.querySelector('input[name="quiz-question"]:checked');
    if (selectedOption) {
        
        // Save the selected answer
        // userAnswers[currentQuestionIndex] = selectedOption.value;

        if (currentQuestionIndex < quizData.length - 1) {
            currentQuestionIndex++;
            renderQuestion();
        } else {
            // All questions answered, show submit button
            showSubmitButton();
        }
    } else {
        alert('Please select an answer before proceeding.');
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
    document.getElementById('submit-quiz').addEventListener('click', gradeQuiz);
    document.getElementById('submit-quiz').addEventListener('click', saveResults);
}


/**
 * Grades the quiz and displays the results.
 * 
 * @returns JSON object storing quiz submission data
 */
function gradeQuiz() {
    const results = quizData.map((questionData, index) => {
        const userAnswer = userAnswers[index];
        const correctAnswer = questionData.answer;
        const score = userAnswer === correctAnswer ? '1/1' : '0/1';
        return { question: questionData.question, userAnswer, correctAnswer, score, isCorrect: userAnswer === correctAnswer };
    });
    displayResults(results);
}

/**
 * Saves the quiz results in the MySQL database.
 * 
 * @param {string} quizId 
 * @param {int} userId 
 * @param {json} quizResponses 
 */
async function saveQuiz(quizId, userId, quizResponses) {
    console.log("yes");
    console.log("quiz:", quizResponses);
    console.log("quiz string:", JSON.stringify({
        quizId,
        userId,
        quizResponses
    }));

    const url = `https://boilertechtests.com/api/quiz`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                quiz_id: quizId,
                user_id: userId,
                answers: quizResponses
            })
        });

        if (!response.ok) {
            throw new Error('Failed to save quiz');
        }

        const data = await response.json();
        console.log('Quiz saved successfully:', data);
    } catch (error) {
        console.error('Error saving quiz:', error);
    }
}

function saveResults() {
    const meh = quizData.map((questionData, index) => {
        const userAnswer = userAnswers[index];
        const correctAnswer = questionData.answer;
        const score = userAnswer === correctAnswer ? 1 : 0;
        return { question_number: index + 1, response: userAnswer, score };
    });
    console.log(meh);
    saveQuiz(1, localStorage.getItem('userId'), meh);
}

function displayResults(results) {
    const totalScore = results.reduce((acc, result) => acc + (result.isCorrect ? 1 : 0), 0); // Calculate total score
    quizContainer.innerHTML = `<h2>Quiz Results</h2><p>Total Score: ${totalScore}/${results.length}</p>`; // Display total score
    results.forEach((result, index) => {
        quizContainer.innerHTML += `
            <div class="question">
                <p>Question ${index + 1}: ${result.question}</p>
                <p class="${result.isCorrect ? 'correct' : 'incorrect'}">
                    Your answer: ${result.userAnswer || 'No answer selected'}
                </p>
                <p>Correct answer: ${result.correctAnswer}</p>
                <p>Score: ${result.score}</p>
            </div>
        `;
    });
}


