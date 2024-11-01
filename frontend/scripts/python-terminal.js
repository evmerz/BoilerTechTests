var quizData, quizID, userAnswers;
let currentQuestionIndex = 0;
let answerCount = 0;
let submitFlag = 0;
let summaryOutput = "";

// Load Pyodide
let pyodide;
async function loadPyodideAndPackages() {
  pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/"
  });
  document.getElementById('run').disabled = false; // Enable the button when ready
}
loadPyodideAndPackages();

// Disable the run button initially
document.getElementById('run').disabled = true;
const quizContainer = document.getElementById('code-contents');
const resultContainer = document.getElementById('result-contents');

// Initialize CodeMirror
const editor = CodeMirror.fromTextArea(document.getElementById('code'), {
  lineNumbers: true,
  mode: "python",
  theme: "eclipse"
});


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

          if (quizData.quizInfo.type != "python") continue;

          console.log(JSON.stringify(quizData));

          return;
      }
  }

  console.log('No quiz found with ID "' + quiz_id + '"');
}

// // Collection of questions with test cases
// const questions = [
//   {
//     prompt: "Write a Python function that concatenates two strings.",
//     functionSignature: "def concat_strings(str1, str2):",
//     functionName: "concat_strings",
//     testCases: [
//       { input: ["hello", " world"], expected: "hello world" },
//       { input: ["foo", "bar"], expected: "foobar" }
//     ],
//     hiddenCases: [
//       { name: "punctuation", input: ["Yes ", "please!"], expected: "Yes please!" },
//       { name: "multiple words", input: ["Come with me\n", "24601"], expected: "Come with me\n24601" },
//     ]
//   },
//   {
//     prompt: "Write a Python function that adds two numbers.",
//     functionSignature: "def add_numbers(a, b):",
//     functionName: "add_numbers",
//     testCases: [
//       { input: [1.3, 2], expected: 3.3 },
//       { input: [-1, 1], expected: 0 }
//     ],
//     hiddenCases: [
//       { name: "positive positive", input: [100, 3001], expected: 3101 },
//       { name: "negative positive", input: [-3, 3], expected: 0 },
//       { name: "negative negative", input: [-60, -5], expected: -65 }
//     ]
//   },
//   {
//     prompt: "Write a Python function that subtracts one number from another.",
//     functionSignature: "def subtract_numbers(a, b):",
//     functionName: "subtract_numbers",
//     testCases: [
//       { input: [2, 1], expected: 1 },
//       { input: [-6, 1], expected: -7 }
//     ],
//     hiddenCases: [
//       { name: "positive negative", input: [2, -1], expected: 3 },
//       { name: "negative negative", input: [-6, -1], expected: -5 }
//     ]
//   },
//   {
//     prompt: "Write a Python function that removes consecutive duplicate characters from a string.",
//     functionSignature: "def remove_consecutive_duplicates(s):",
//     functionName: "remove_consecutive_duplicates",
//     testCases: [
//       { input: ["aabbcc"], expected: "abc" },
//       { input: ["aaabbbccc"], expected: "abc" },
//       { input: ["abccba"], expected: "abcba" },
//     ],
//     hiddenCases: [
//       { name: "empty", input: [""], expected: "" },
//       { name: "no duplicates", input: ["abc"], expected: "abc" },
//       { name: "many duplicates", input: ["aabbccddeeff"], expected: "abcdef" }
//     ]
//   }
// ];

window.addEventListener('DOMContentLoaded', async function() {
  const params = new URLSearchParams(location.search);
  quizID = params.get("quiz-id");
  await loadQuizData(quizID);
  

  userAnswers = new Array(quizData.questions.length).fill(null).map(() => ({
    code: null,
    results: null
  }));

  // Initially display the first question
  displayQuestion();

  // const quizSubmitted = localStorage.getItem('quizSubmitted');
  // if (quizSubmitted === 'true') {
  //   displayResults();
  // }
});


//this contains the user answers for each question 
//given that they have used the 'run' button
//index is null if they have not answered the question, but they can't hit submit without at least having written the word return

function displayQuestion() {
  const currentQuestion = quizData.questions[currentQuestionIndex];
  document.getElementById('question').textContent = currentQuestion.prompt;
  editor.setValue(userAnswers[currentQuestionIndex].code || currentQuestion.functionSignature + '\n    # Your code here\n    # Click Run to save answer');
  //editor.setValue(currentQuestion.functionSignature + '\n    # Your Python code goes here\n');
  document.getElementById('output').textContent = "";
  document.getElementById('header').textContent = "Question " + (currentQuestionIndex + 1);

}

document.getElementById('prev').addEventListener('click', () => {
  // If we're at the first question, wrap around to the last question
  if (currentQuestionIndex === 0) {
    currentQuestionIndex = quizData.questions.length - 1;
  } else {
    // Otherwise, go to the previous question
    currentQuestionIndex--;
  }
  displayQuestion();
});

document.getElementById('next').addEventListener('click', () => {
  // If we're at the last question, wrap around to the first question
  if (currentQuestionIndex === quizData.questions.length - 1) {
    currentQuestionIndex = 0;
  } else {
    // Otherwise, go to the next question
    currentQuestionIndex++;
  }
  displayQuestion();
});

document.getElementById('submit').addEventListener('click', async () => {
  submitFlag = 1;
  //for (let i = 0; i < questions.length; i++) {
  //currentQuestionIndex = i; 
  await run(editor.getValue().trim(), true);
  //}
  displayResults();
  localStorage.setItem('quizSubmitted', 'true');

});

async function run(codeInput, display) {
  const code = codeInput;
  userAnswers[currentQuestionIndex].code = code;
  const currentQuestion = quizData.questions[currentQuestionIndex];
  const testCases = currentQuestion.testCases;
  const hiddenCases = currentQuestion.hiddenCases;

  try {
    let output = await pyodide.runPython(`
      import sys
      from io import StringIO

      # Redirect standard output
      old_stdout = sys.stdout
      sys.stdout = StringIO()

      # Prepare the user code
      user_code = '''${code.replace(/'/g, "\\'").replace(/\n/g, '\\n')}'''

      # Run the user code
      exec(user_code)

      # Get the function name dynamically from the current question
      function_name = '${currentQuestion.functionName}'

      # Test cases
      test_cases = ${JSON.stringify(testCases)}
      results = ""
      hidden_str = ""

      # Loop through the test cases
      for i, test in enumerate(test_cases, start=1):
          input_args = test['input']
          expected = test['expected']

          # Dynamically look up the function by its name and call it
          if function_name in globals():
              func = globals()[function_name]
              result = func(*input_args)

              # For regular cases, keep the original format
              result_str = f"Test Case {i}\\nInput: {input_args}\\nOutput: {result}\\nExpected: {expected}. "
              result_str += "Test Case PASSED" if result == expected else "Test Case FAILED"
              results += result_str + "\\n\\n"
          else:
              results += f"Function {function_name} not found.\\n"

      # Uncomment this block when you want to check for submitFlag
      # if ${submitFlag}:
      hidden_str += "Hidden Test Cases:\\n\\n"
      test_cases = ${JSON.stringify(hiddenCases)}

      for i, test in enumerate(test_cases, start=1):
          input_args = test['input']
          expected = test['expected']

          # Dynamically look up the function by its name and call it
          if function_name in globals():
              func = globals()[function_name]
              result = func(*input_args)

              # For hidden cases, format as "[name]: [PASS/FAIL]"
              test_name = test.get('name', f"Hidden Test {i}")
              hidden_str += f"{test_name}: {'PASSED' if result == expected else 'FAILED'}"
              hidden_str += "\\n"
          else:
              hidden_str += f"Function {function_name} not found.\\n"

      # Get the output from the redirected stdout
      output = sys.stdout.getvalue()
      sys.stdout = old_stdout  # Restore standard output
      results += hidden_str
      output + str(results)
    `);

    userAnswers[currentQuestionIndex].results = output;
    // console.log("output: " + output);

    if (display) {
      document.getElementById('output').textContent = output.split("Hidden Test Cases:")[0] || "";
    }


  } catch (error) {
    if (display) {
      document.getElementById('output').textContent = error;
    }
    // TODO: fill the userAnswers of current question with FAIL state for each regular and hidden test case.
    // In case of an error, mark all test cases as "FAILED"
    let failedOutput = '';
    testCases.forEach((_, i) => {
      failedOutput += `Test Case ${i + 1}: FAILED\n\n`;
    });
    failedOutput += "Hidden Test Cases:\n";
    hiddenCases.forEach((test, i) => {
      failedOutput += `${test.name || 'Hidden Test ' + (i + 1)}: FAILED\n`;
    });
    userAnswers[currentQuestionIndex].results = failedOutput;
  }

  answerCount = userAnswers.filter(answer => answer.code && answer.code.includes("return")).length;
  console.log("count: ", answerCount);
  document.getElementById('submit').style.display = answerCount === quizData.questions.length ? 'inline-block' : 'none';
  submitFlag = 0;
}

// Run code function
document.getElementById('run').addEventListener('click', async () => {
  await run(editor.getValue().trim(), true);
});

// // Change the 'Run' button label
// document.getElementById('run').textContent = "Run";



function displayResults() {
  // Clear previous results
  quizContainer.innerHTML = '';
  resultContainer.innerHTML = '';
  const savedResults = localStorage.getItem('savedResults');

  // Hide other elements on the page
  const elementsToHide = [
    document.getElementById('header'),
    document.getElementById('question'),
    document.getElementById('output'),
    document.getElementById('code'),
    document.getElementById('run'),
    document.getElementById('prev'),
    document.getElementById('next'),
    document.getElementById('submit')
  ];

  elementsToHide.forEach(element => {
    if (element) element.style.display = 'none';
  });

  const codeMirrorElement = document.querySelector('.CodeMirror');
  if (codeMirrorElement) codeMirrorElement.style.display = 'none';

  // Scroll to the top of the page
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (savedResults) {
    // Load previously saved results if they exist
    resultContainer.innerHTML = savedResults;
  } else {

    let totalPasses = 0;
    let tests = 0;

    // Create a string for the summary output
    let summaryOutput = '<h2>Quiz Results:</h2>'; // Header for total results

    // Iterate over each question to format the results
    quizData.questions.forEach((question, i) => {
      const userResult = userAnswers[i].results;
      const totalTests = question.testCases.length + question.hiddenCases.length;
      tests += totalTests;
      const passes = (userResult.match(/PASSED/g) || []).length; // Count 'PASSED' occurrences
      totalPasses += passes;
      const totalScore = `${passes}/${totalTests}`;

      // Create the formatted output for each question
      let output = `<h3>Question ${i + 1}: ${question.prompt}</h3>`;
      output += `<pre>${userAnswers[i].code}</pre>`;
      output += `<h4>Total Score: ${totalScore}</h4>`;
      output += `<h4>Test Results:</h4>`;

      // Split userResult into visible and hidden parts
      const visibleResults = userResult.split("Hidden Test Cases:")[0].trim(); // Results before "Hidden Test Cases:"
      const hiddenResults = userResult.split("Hidden Test Cases:")[1]?.trim(); // Results after "Hidden Test Cases:"

      // Add the visible results
      output += visibleResults.replace(/\\n/g, '<br>').replace(/\n/g, '<br>'); // Handle both escaped and actual newlines

      // Add the bold label for hidden test cases if it exists
      if (hiddenResults) {
        output += '<br><h4>Hidden Test Cases:</h4>'; // Bold label
        output += hiddenResults.replace(/\\n/g, '<br>').replace(/\n/g, '<br>'); // Handle both escaped and actual newlines
      }

      // Append the question output to the resultContainer
      resultContainer.innerHTML += output + '<hr>'; // Add a separator between questions
    });

    // After all questions are processed, add the summary output
    summaryOutput += `<h4>Total Test Cases: ${tests}</h4>`;
    summaryOutput += `<h4>Total Passed: ${totalPasses}</h4>`;

    // Insert the summary output at the top of the resultContainer
    resultContainer.innerHTML = summaryOutput + resultContainer.innerHTML;

    // Save the result content to localStorage
    localStorage.setItem('savedResults', resultContainer.innerHTML);

    // Save the result to the database
    // saveQuiz();
  }

  const retakeButton = document.createElement('button');
  retakeButton.textContent = 'Retake Quiz';
  retakeButton.style.marginTop = '20px'; // Optional styling
  retakeButton.addEventListener('click', () => {
    // Remove flags for quiz submission and saved results
    localStorage.removeItem('quizSubmitted');
    localStorage.removeItem('savedResults');

    // Refresh the page to reset the quiz view
    window.location.reload();
  });

  // Append the button to the result container
  resultContainer.appendChild(retakeButton);
}

async function saveQuiz() {
    const answerData = quizData.questions.map((questionData, index) => {
        return {
            questionID: questionData.questionID,
            answer: userAnswers[index].code
        };
    });

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








