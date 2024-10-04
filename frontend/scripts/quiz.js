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

  function shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
      }
  }

  function renderQuiz() {
      const quizContainer = document.getElementById('quiz-contents');
      quizContainer.innerHTML = '';

      quizData.forEach((questionData, index) => {
          const questionElement = document.createElement('div');
          questionElement.classList.add('question');

          shuffle(questionData.options);  // Shuffle options each time

          questionElement.innerHTML = 
              `<p>${index + 1}. ${questionData.question}</p>` +
              questionData.options.map(option => 
                  `<label class="option">
                      <input type="radio" name="quiz-question-${index}" value="${option}">
                      ${option}
                  </label>`
              ).join('') +
              `<input type="hidden" id="correct-answer-${index}" value="${questionData.answer}">`;
          quizContainer.appendChild(questionElement);
      });
  }

  function allQuestionsAnswered() {
      const totalQuestions = quizData.length;
      let answeredQuestions = 0;

      for (let i = 0; i < totalQuestions; i++) {
          const selectedOption = document.querySelector(`input[name="quiz-question-${i}"]:checked`);
          if (selectedOption) {
              answeredQuestions++;
          }
      }

      return answeredQuestions === totalQuestions;
  }

  function enableSubmitButton() {
      const submitButton = document.getElementById('submit-quiz');
      const message = document.getElementById('answer-message');

      if (allQuestionsAnswered()) {
          submitButton.disabled = false;
          submitButton.style.backgroundColor = 'blue';  // Turn the button blue when enabled
          submitButton.style.cursor = 'pointer';  // Change cursor to pointer to indicate it's clickable
          message.style.display = 'none';  // Hide the message when all questions are answered
      } else {
          submitButton.disabled = true;
          submitButton.style.backgroundColor = 'grey';  // Keep it grey when disabled
          submitButton.style.cursor = 'not-allowed';  // Cursor indicates the button is disabled
          message.style.display = 'block';  // Show the message when not all questions are answered
      }
  }

  function gradeQuiz() {
      const quizContainer = document.getElementById('quiz-contents');
      const questions = quizContainer.getElementsByClassName('question');

      for (let i = 0; i < questions.length; i++) {
          const selectedOption = document.querySelector(`input[name="quiz-question-${i}"]:checked`);
          const correctAnswer = document.getElementById(`correct-answer-${i}`).value;

          if (selectedOption) {
              const userAnswer = selectedOption.value;
              const optionLabels = questions[i].getElementsByTagName('label');

              // Check and mark each option
              for (let label of optionLabels) {
                  const input = label.querySelector('input');
                  if (input.value === correctAnswer) {
                      label.classList.add('correct');
                  } else if (input.checked) {
                      label.classList.add('incorrect');
                  }
              }
          }
      }
  }

  function lockQuiz() {
      const quizContainer = document.getElementById('quiz-contents');
      const inputs = quizContainer.querySelectorAll('input[type="radio"]');
      inputs.forEach(input => input.disabled = true);  // Disable all radio buttons
  }

  // Add event listeners for every answer selection
  document.addEventListener('change', function(event) {
      if (event.target.matches('input[type="radio"]')) {
          enableSubmitButton();  // Enable the submit button when all questions are answered
      }
  });

  document.getElementById('submit-quiz').addEventListener('click', function() {
      if (!allQuestionsAnswered()) {
          alert('Please answer all questions before submitting the quiz.');
      } else {
          gradeQuiz();
          lockQuiz();  // Lock the quiz after submission

          // Scroll to top of the page after submission
          window.scrollTo({ top: 0, behavior: 'smooth' });

          // Disable submit button to prevent multiple submissions
          const submitButton = document.getElementById('submit-quiz');
          submitButton.disabled = true;
          submitButton.style.backgroundColor = 'grey';  // Disable the button after submission
          submitButton.style.cursor = 'not-allowed';
      }
  });

  document.getElementById('back-button').addEventListener('click', function() {
      window.location.href = "practice.html";  // Redirect back to practice page
  });

  // Render the quiz when the page loads
  renderQuiz();

  // Initially disable the submit button and show the message
  enableSubmitButton();
});