// var quizData, quizID, userAnswers;
var questionData, userAnswers;
let currentQuestionIndex = 0;
let answerCount = 0;
let submitFlag = 0;
let summaryOutput = "";

// Load Pyodide
let pyodide;
async function loadPyodideAndPackages() {
    pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/",
    });
    document.getElementById("run").disabled = false; // Enable the button when ready
}
loadPyodideAndPackages();

// Disable the run button initially
document.getElementById("run").disabled = true;
const quizContainer = document.getElementById("code-contents");
const resultContainer = document.getElementById("result-contents");

// Initialize CodeMirror
const editor = CodeMirror.fromTextArea(document.getElementById("code"), {
    lineNumbers: true,
    mode: "python",
    theme: "eclipse",
});

async function loadQuestionData() {
    questionData = await (
        (await fetch("/frontend/content/guest/guest_code_qs.json")).json()
    )
    return;
}

// async function loadQuizData(quiz_id) {
//     const json_directory = await (
//         await fetch("/frontend/content/quiz_data.json")
//     ).json();

//     console.log(JSON.stringify(json_directory));

//     // Serve the quiz data that corresponds to the quiz ID
//     for (let i = 0; i < json_directory.quizzes.length; i++) {
//         if (json_directory.quizzes[i].quizID == quiz_id) {
//             console.log("ID: " + json_directory.quizzes[i].quizID);

//             console.log("filepath: " + json_directory.quizzes[i].filePath);

//             quizData = await (
//                 await fetch(json_directory.quizzes[i].filePath)
//             ).json();

//             if (quizData.quizInfo.type != "python") continue;

//             console.log(JSON.stringify(quizData));

//             return;
//         }
//     }

//     console.log('No quiz found with ID "' + quiz_id + '"');
// }


window.addEventListener("DOMContentLoaded", async function () {
    
    await loadQuestionData();

    userAnswers = new Array(questionData.questions.length).fill(null).map(() => ({
        code: null,
        results: null,
    }));

    // Initially display the first question
    displayQuestion();
});

//this contains the user answers for each question
//given that they have used the 'run' button
//index is null if they have not answered the question, but they can't hit submit without at least having written the word return

function displayQuestion() {
    const currentQuestion = questionData.questions[currentQuestionIndex];
    document.getElementById("question").textContent = currentQuestion.prompt;
    editor.setValue(
        userAnswers[currentQuestionIndex].code ||
            currentQuestion.functionSignature +
                "\n    # Your code here\n    # Click Run to save answer"
    );
    //editor.setValue(currentQuestion.functionSignature + '\n    # Your Python code goes here\n');
    document.getElementById("output").textContent = "";
    document.getElementById("header").textContent =
        "Question " + (currentQuestionIndex + 1);

    const scoreContainer = document.getElementById("score-container");
    if (scoreContainer) {
        scoreContainer.style.display = "none";
    }
}

document.getElementById("prev").addEventListener("click", () => {
    // If we're at the first question, wrap around to the last question
    if (currentQuestionIndex === 0) {
        currentQuestionIndex = questionData.questions.length - 1;
    } else {
        // Otherwise, go to the previous question
        currentQuestionIndex--;
    }
    displayQuestion();
});

document.getElementById("next").addEventListener("click", () => {
    // If we're at the last question, wrap around to the first question
    if (currentQuestionIndex === questionData.questions.length - 1) {
        currentQuestionIndex = 0;
    } else {
        // Otherwise, go to the next question
        currentQuestionIndex++;
    }
    displayQuestion();
});

// document.getElementById("submit").addEventListener("click", async () => {
//     submitFlag = 1;
//     //for (let i = 0; i < questions.length; i++) {
//     //currentQuestionIndex = i;
//     await run();
//     //}
//     displayResults();
//     localStorage.setItem("quizSubmitted", "true");
// });

document.getElementById('reveal').addEventListener('click', () => {
    const currentQuestion = questionData.questions[currentQuestionIndex];
    document.getElementById('output').textContent = currentQuestion.solution;
  });

  async function run() {
    const code = editor.getValue().trim();
    userAnswers[currentQuestionIndex].code = code;
    const currentQuestion = questionData.questions[currentQuestionIndex];
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
        user_code = '''${code.replace(/'/g, "\\'").replace(/\n/g, "\\n")}'''

        # Run the user code
        exec(user_code)

        # Get the function name dynamically from the current question
        function_name = '${currentQuestion.functionName}'

        # Test cases
        test_cases = ${JSON.stringify(testCases)}
        hidden_cases = ${JSON.stringify(hiddenCases)}
        results = ""

        # Process regular test cases
        results += "Public Test Cases:\\n\\n"
        for i, test in enumerate(test_cases, start=1):
            input_args = test['input']
            expected = test['expected']

            if function_name in globals():
                func = globals()[function_name]
                result = func(*input_args)

                # Regular test case results
                results += f"Test Case {i}\\nInput: {input_args}\\nOutput: {result}\\nExpected: {expected}. "
                results += "Test Case PASSED" if result == expected else "Test Case FAILED"
                results += "\\n\\n"
            else:
                results += f"Function {function_name} not found.\\n"

        # Process hidden test cases
        results += "Hidden Test Cases:\\n"
        for i, test in enumerate(hidden_cases, start=1):
            input_args = test['input']
            expected = test['expected']

            if function_name in globals():
                func = globals()[function_name]
                result = func(*input_args)

                # Add test case results with a newline after each
                test_name = test.get('name', f"Hidden Test {i}")
                results += f"{test_name}: {'PASSED' if result == expected else 'FAILED'}"
                results += "\\n\\n"
            else:
                results += f"Function {function_name} not found.\\n\\n"



        # Get the output from the redirected stdout
        output = sys.stdout.getvalue()
        sys.stdout = old_stdout  # Restore standard output
        results += output
        results
    `);

        userAnswers[currentQuestionIndex].results = output;

        // Display both regular and hidden test cases in the output box
        document.getElementById("output").textContent = output;
    } catch (error) {
        document.getElementById("output").textContent = error;

        // Mark all test cases as failed if an error occurs
        let failedOutput = "Public Test Cases:\n";
        testCases.forEach((_, i) => {
            failedOutput += `Test Case ${i + 1}: FAILED\n\n`;
        });
        failedOutput += "Hidden Test Cases:\n";
        hiddenCases.forEach((test, i) => {
            failedOutput += `${test.name || "Hidden Test " + (i + 1)}: FAILED\n`;
        });
        userAnswers[currentQuestionIndex].results = failedOutput;
        document.getElementById("output").textContent = failedOutput;
    }

    answerCount = userAnswers.filter(
        (answer) => answer.code && answer.code.includes("return")
    ).length;
    console.log("count: ", answerCount);
}


// Run code function
document.getElementById("run").addEventListener("click", async () => {
    await run();
    var results = displayResults();

    // Display the score in the score container
    const scoreContainer = document.getElementById("score-container");
    if (scoreContainer) {
        scoreContainer.textContent = `Score: ${results}`;
        scoreContainer.style.display = "block"; // Show the score container
        const [score, total] = results.split('/').map(Number); // Split score and total (e.g., "4/4")
        if (score === total) {
            scoreContainer.style.backgroundColor = "#e8fcd3"; // Green for perfect score
        } else {
            scoreContainer.style.backgroundColor = "#ffffff"; // White for other scores
        }
    }
});

// // Change the 'Run' button label
// document.getElementById('run').textContent = "Run";

function displayResults() {
    let totalPasses = 0;
    let totalTests = 0;
    let totalScore = 0;

    // Get the current question and its results
    const currentQuestion = questionData.questions[currentQuestionIndex];
    const userResult = userAnswers[currentQuestionIndex].results;
    totalTests = currentQuestion.testCases.length + currentQuestion.hiddenCases.length;

    // Count 'PASSED' occurrences in the user's results
    totalPasses = (userResult.match(/PASSED/g) || []).length;
    totalScore = `${totalPasses}/${totalTests}`;

    return totalScore;
}