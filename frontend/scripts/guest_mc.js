async function loadQuizData() {
    var quizData = await fetch("/frontend/content/guest/guest_mc_qs.json");
    return quizData;
}

let currentQuestionIndex = 0;
let selectedAnswer = null;

const questionTextElement = document.getElementById('question-text');
const optionsListElement = document.getElementById('options-list');
const prevButton = document.getElementById('prev');
const nextButton = document.getElementById('next');
const submitButton = document.getElementById('submit');

function loadQuestion(index) {
    const question = quizData.questions[index];
    questionTextElement.textContent = question.question;
    optionsListElement.innerHTML = '';
    selectedAnswer = null;

    question.options.forEach(option => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <label>
                <input type="radio" name="option" value="${option.optionID}">
                ${option.text}
            </label>
        `;
        listItem.querySelector('input').addEventListener('change', () => {
            selectedAnswer = option.optionID;
        });
        optionsListElement.appendChild(listItem);
    });
}

function highlightAnswer(isCorrect, correctAnswerID) {
    const options = document.querySelectorAll('input[name="option"]');
    options.forEach(option => {
        const parent = option.parentElement.parentElement;
        parent.classList.remove('highlight-correct', 'highlight-incorrect');

        if (option.value === selectedAnswer) {
            parent.classList.add(isCorrect ? 'highlight-correct' : 'highlight-incorrect');
        }
        if (option.value === correctAnswerID && !isCorrect) {
            parent.classList.add('highlight-correct');
        }
    });
}

prevButton.addEventListener('click', () => {
    currentQuestionIndex = (currentQuestionIndex - 1 + quizData.questions.length) % quizData.questions.length;
    loadQuestion(currentQuestionIndex);
});

nextButton.addEventListener('click', () => {
    currentQuestionIndex = (currentQuestionIndex + 1) % quizData.questions.length;
    loadQuestion(currentQuestionIndex);
});

submitButton.addEventListener('click', () => {
    if (!selectedAnswer) {
        alert('Please select an answer before submitting.');
        return;
    }

    const currentQuestion = quizData.questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.answerID;
    highlightAnswer(isCorrect, currentQuestion.answerID);
});

// Load the first question
loadQuestion(currentQuestionIndex);
