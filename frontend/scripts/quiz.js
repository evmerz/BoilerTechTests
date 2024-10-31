document.addEventListener('DOMContentLoaded', function() {
    const quizData = [
        {
            question: 'What will the following code output?\nif (5 > 10) { printf("A"); } else { printf("B"); }',
            options: ['A', 'B', 'Error', 'Nothing'],
            answer: 'B'
        },
        {
            question: 'Which of the following is true about the if-else statement in C?',
            options: ['Else is mandatory after if', 'If can have multiple else blocks', 'If evaluates a condition', 'Else can evaluate a condition'],
            answer: 'If evaluates a condition'
        },
        {
            question: 'What will the following code output?\nint x = 10; if (x == 10) printf("True"); else printf("False");',
            options: ['True', 'False', 'Error', 'Nothing'],
            answer: 'True'
        },
        {
            question: 'Which of the following is a valid if-else syntax in C?',
            options: [
                'if (condition) statement1; else statement2;',
                'if condition statement1 else statement2',
                'if (condition) statement1 else statement2',
                'if (condition) statement1; statement2 else'
            ],
            answer: 'if (condition) statement1; else statement2;'
        },
        {
            question: 'What will happen if you omit the "else" block after an "if" statement?',
            options: [
                'It will cause a compilation error',
                'It will always execute the else block',
                'Nothing will happen if the condition is false',
                'It will always execute the if block'
            ],
            answer: 'Nothing will happen if the condition is false'
        }
    ];

    let currentQuestionIndex = 0;
    const userAnswers = new Array(quizData.length).fill(null);
    const quizContainer = document.getElementById('quiz-contents');

    function renderQuestion() {
        const questionData = quizData[currentQuestionIndex];
        quizContainer.innerHTML = `
            <div class="question">
                <p>${currentQuestionIndex + 1}. ${questionData.question}</p>
                ${questionData.options.map(option => `
                    <label class="option">
                        <input type="radio" name="quiz-question" value="${option}" ${userAnswers[currentQuestionIndex] === option ? 'checked' : ''}>
                        ${option}
                    </label>`).join('')}
            </div>
            <div>
                <button id="next-button">Next</button>
            </div>
        `;
        document.getElementById('next-button').addEventListener('click', nextQuestion);
    }

    function nextQuestion() {
        const selectedOption = document.querySelector('input[name="quiz-question"]:checked');
        if (selectedOption) {
            userAnswers[currentQuestionIndex] = selectedOption.value;

            if (currentQuestionIndex < quizData.length - 1) {
                currentQuestionIndex++;
                renderQuestion();
            } else {
                showSubmitButton();
            }
        } else {
            alert('Please select an answer before proceeding.');
        }
    }

    function showSubmitButton() {
        quizContainer.innerHTML = `
            <p>All questions answered. Click below to submit your answers.</p>
            <button id="submit-quiz">Submit</button>
        `;
        document.getElementById('submit-quiz').addEventListener('click', gradeQuiz);
    }

    function gradeQuiz() {
        const results = quizData.map((questionData, index) => {
            const userAnswer = userAnswers[index];
            const correctAnswer = questionData.answer;
            const score = userAnswer === correctAnswer ? '1/1' : '0/1';
            return { question: questionData.question, userAnswer, correctAnswer, score, isCorrect: userAnswer === correctAnswer };
        });
        displayResults(results);
    }

    function displayResults(results) {
        const totalScore = results.reduce((acc, result) => acc + (result.isCorrect ? 1 : 0), 0);
        quizContainer.innerHTML = `<h2>Quiz Results</h2><p>Total Score: ${totalScore}/${results.length}</p>`;
        
        results.forEach((result, index) => {
            const correctnessLabel = result.isCorrect ? "(Correct)" : "(Incorrect)";
            quizContainer.innerHTML += `
                <div class="question">
                    <p>Question ${index + 1}: ${result.question}</p>
                    <p class="${result.isCorrect ? 'correct' : 'incorrect'}">
                        Your answer: ${result.userAnswer || 'No answer selected'} ${correctnessLabel}
                    </p>
                    <p class="correct-answer">Correct answer: ${result.correctAnswer}</p>
                    <p>Score: ${result.score}</p>
                </div>
            `;
        });
    }

    renderQuestion();
});

document.getElementById('back-button').addEventListener('click', function() {
    window.location.href = '/cs240.html'; // Update the path if needed
});
