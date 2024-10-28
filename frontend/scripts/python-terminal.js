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

// Initialize CodeMirror
const editor = CodeMirror.fromTextArea(document.getElementById('code'), {
  lineNumbers: true,
  mode: "python",
  theme: "eclipse"
});

// Collection of questions with test cases
const questions = [
  {
    prompt: "Write a Python function that concatenates two strings.",
    functionSignature: "def concat_strings(str1, str2):",
    functionName: "concat_strings",
    testCases: [
      { input: ["hello", " world"], expected: "hello world" },
      { input: ["foo", "bar"], expected: "foobar" }
    ]
  },
  {
    prompt: "Write a Python function that adds two numbers.",
    functionSignature: "def add_numbers(a, b):",
    functionName: "add_numbers",
    testCases: [
      { input: [1, 2], expected: 3 },
      { input: [-1, 1], expected: 0 }
    ]
  },
  {
    prompt: "Write a Python function that subtracts one number from another.",
    functionSignature: "def subtract_numbers(a, b):",
    functionName: "subtract_numbers",
    testCases: [
      { input: [2, 1], expected: 1 },
      { input: [-6, 1], expected: -7 }
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
      { input: [""], expected: "" },
      { input: ["abc"], expected: "abc" },
      { input: ["aabbccddeeff"], expected: "abcdef" }
    ]
  }
];

let currentQuestionIndex = 0;

function displayQuestion() {
  const currentQuestion = questions[currentQuestionIndex];
  document.getElementById('question').textContent = currentQuestion.prompt;
  editor.setValue(currentQuestion.functionSignature + '\n    # Your Python code goes here\n');
  document.getElementById('output').textContent = "";
  document.getElementById('header').textContent = "Question " + (currentQuestionIndex + 1);

  // Update the 'next' button label
  const nextButton = document.getElementById('next');
  if (currentQuestionIndex === questions.length - 1) {
    nextButton.textContent = 'Submit'; // Change to 'Submit' for the last question
  } else {
    nextButton.textContent = 'Next Question'; // Otherwise, 'Next'
  }
}

document.getElementById('prev').addEventListener('click', () => {
  // If we're at the first question, wrap around to the last question
  if (currentQuestionIndex === 0) {
    currentQuestionIndex = questions.length - 1;
  } else {
    // Otherwise, go to the previous question
    currentQuestionIndex--;
  }
  displayQuestion();
});

document.getElementById('next').addEventListener('click', () => {
  // If we're at the last question, wrap around to the first question
  if (currentQuestionIndex === questions.length - 1) {
    currentQuestionIndex = 0;
  } else {
    // Otherwise, go to the next question
    currentQuestionIndex++;
  }
  displayQuestion();
});

// Initially display the first question
displayQuestion();

// Run code function
document.getElementById('run').addEventListener('click', async () => {
  const code = editor.getValue().trim();
  const currentQuestion = questions[currentQuestionIndex];

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
test_cases = ${JSON.stringify(currentQuestion.testCases)}
results = ""

# Loop through the test cases
for test in test_cases:
    input_args = test['input']
    expected = test['expected']
    
    # Dynamically look up the function by its name and call it
    if function_name in globals():
        func = globals()[function_name]
        result = func(*input_args)
        results = results + (f"test: {input_args}, result: {result}, expected: {expected}, pass: {result == expected}")
        results = results + '\\n'
    else:
        results = results + (f"Function {function_name} not found.")

# Get the output from the redirected stdout
output = sys.stdout.getvalue()
sys.stdout = old_stdout  # Restore standard output
output + str(results)  # Include test results
`);
    document.getElementById('output').textContent = output || "";
  } catch (error) {
    document.getElementById('output').textContent = error;
  }
});

// Change the 'Run' button label
document.getElementById('run').textContent = "Run";
