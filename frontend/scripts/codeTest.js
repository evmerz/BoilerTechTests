let pyodide;
async function loadPyodideAndPackages() {
    pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/"
    });
    document.getElementById('run').disabled = false;
}
loadPyodideAndPackages();

document.getElementById('run').disabled = true;

const editor = CodeMirror.fromTextArea(document.getElementById('code'), {
    lineNumbers: true,
    mode: "python",
    theme: "eclipse"
});

const questions = [
    {
      prompt: "Write a Python function that concatenates two strings.",
      functionSignature: "def concat_strings(str1, str2):",
      functionName: "concat_strings",
      testCases: [
        { input: ["hello", " world"], expected: "hello world" },
        { input: ["foo", "bar"], expected: "foobar" }
      ],
      hiddenCases: [
        { input: ["Yes ", "please!"], expected: "Yes please!"},
        { input: ["Come with me\n", "24601"], expected: "Come with me\n24601"},
      ]
    },
    {
      prompt: "Write a Python function that adds two numbers.",
      functionSignature: "def add_numbers(a, b):",
      functionName: "add_numbers",
      testCases: [
        { input: [1.3, 2], expected: 3.3 },
        { input: [-1, 1], expected: 0 }
      ],
      hiddenCases: [
        { input: [100, 3001], expected: 3101},
        { input: [-3, 3], expected: 0},
        { input: [-60, 5], expected: -55}
      ]
    },
    {
      prompt: "Write a Python function that subtracts one number from another.",
      functionSignature: "def subtract_numbers(a, b):",
      functionName: "subtract_numbers",
      testCases: [
        { input: [2, 1], expected: 1 },
        { input: [-6, 1], expected: -7 }
      ],
      hiddenCases: [
        { input: [2, -1], expected: 3 },
        { input: [-6, -1], expected: -5 }
      ]
    },
    {
      prompt: "Write a Python function that removes consecutive duplicate characters from a string.",
      functionSignature: "def remove_consecutive_duplicates(s):",
      functionName: "remove_consecutive_duplicates",
      testCases: [
        { input: ["aabbcc"], expected: "abc" },
        { input: ["aaabbbccc"], expected: "abc" },
        { input: ["abccba"], expected: "abcba" },
      ],
      hiddeCases: [
        { input: [""], expected: "" },
        { input: ["abc"], expected: "abc" },
        { input: ["aabbccddeeff"], expected: "abcdef" }
      ]
    }
  ];

let currentQuestionIndex = 0;
const userAnswers = new Array(questions.length).fill(null);

function displayQuestion() {
    const currentQuestion = questions[currentQuestionIndex];
    document.getElementById('header').textContent = `Question ${currentQuestionIndex + 1}`;
    document.getElementById('question').textContent = currentQuestion.prompt;
    editor.setValue(userAnswers[currentQuestionIndex] || currentQuestion.functionSignature + '\n    # Your code here');
    document.getElementById('output').textContent = "";
    
    if (currentQuestionIndex === questions.length - 1) {
        document.getElementById('next').textContent = 'Submit';
    } else {
        document.getElementById('next').textContent = 'Next Question';
    }
}


document.getElementById('prev').addEventListener('click', () => {
    currentQuestionIndex = currentQuestionIndex === 0 ? questions.length - 1 : currentQuestionIndex - 1;
    displayQuestion();
});

document.getElementById('next').addEventListener('click', () => {
    const code = editor.getValue().trim();
    if (code.includes("return")) {
        userAnswers[currentQuestionIndex] = code;
        if (currentQuestionIndex === questions.length - 1) {
            showSubmitButton();
        } else {
            currentQuestionIndex++;
            displayQuestion();
        }
    } else {
        alert("Please include 'return' in your answer.");
    }
});

document.getElementById('run').addEventListener('click', async () => {
    const code = editor.getValue().trim();
    const currentQuestion = questions[currentQuestionIndex];
    
    try {
        let output = await pyodide.runPython(`
            import sys
            from io import StringIO
            
            old_stdout = sys.stdout
            sys.stdout = StringIO()
            user_code = '''${code.replace(/'/g, "\\'").replace(/\n/g, '\\n')}'''
            exec(user_code)
            
            function_name = '${currentQuestion.functionName}'
            public_cases = ${JSON.stringify(currentQuestion.publicTestCases)}
            hidden_cases = ${JSON.stringify(currentQuestion.hiddenTestCases)}
            results = {"public": {"pass": 0, "total": len(public_cases)}, "hidden": {"pass": 0, "total": len(hidden_cases)}}

            if function_name in globals():
                func = globals()[function_name]
                for case in public_cases:
                    input_args = case['input']
                    expected = case['expected']
                    result = func(*input_args)
                    if result == expected:
                        results["public"]["pass"] += 1
                for case in hidden_cases:
                    input_args = case['input']
                    expected = case['expected']
                    result = func(*input_args)
                    if result == expected:
                        results["hidden"]["pass"] += 1

            sys.stdout = old_stdout
            results
        `);
        document.getElementById('output').textContent = `Public: ${output.public.pass}/${output.public.total}, Hidden: ${output.hidden.pass}/${output.hidden.total}`;
    } catch (error) {
        document.getElementById('output').textContent = error;
    }
});

function showSubmitButton() {
    document.getElementById('submit-container').innerHTML = `<button id="submit-quiz">Submit Quiz</button>`;
    document.getElementById('submit-quiz').addEventListener('click', submitQuiz);
}

function submitQuiz() {
    const results = questions.map((question, index) => {
        const code = userAnswers[index] || "";
        const publicCases = question.publicTestCases;
        const hiddenCases = question.hiddenTestCases;
        
        let publicPass = 0;
        let hiddenPass = 0;

        publicCases.forEach(test => {
            if (runTestCase(code, question.functionName, test)) publicPass++;
        });

        hiddenCases.forEach(test => {
            if (runTestCase(code, question.functionName, test)) hiddenPass++;
        });

        return {
            question: question.prompt,
            publicScore: `${publicPass}/${publicCases.length}`,
            hiddenScore: `${hiddenPass}/${hiddenCases.length}`
        };
    });

    displayResults(results);
}

function runTestCase(code, functionName, testCase) {
    try {
        let output = eval(`
            (function() {
                ${code}
                return ${functionName}(...${JSON.stringify(testCase.input)});
            })();
        `);
        return output === testCase.expected;
    } catch {
        return false;
    }
}

function displayResults(results) {
    let resultHTML = "<h2>Quiz Results</h2>";
    results.forEach((result, index) => {
        resultHTML += `
            <div class="question-result">
                <p>Question ${index + 1}: ${result.question}</p>
                <p>Public Test Cases Passed: ${result.publicScore}</p>
                <p>Hidden Test Cases Passed: ${result.hiddenScore}</p>
            </div>`;
    });
    document.getElementById('submit-container').innerHTML = resultHTML;
}

// Initially display the first question
displayQuestion();
