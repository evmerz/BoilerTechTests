/**
 * Runs user's code for each question in a given set from a quiz.
 * 
 * @param {JSON} submissionData JSON array of user's submission data for a quiz (includes question IDs and code)
 * @returns Array of each question's code submission's output
 */
async function runSubmittedCode(submissionData) {
    // TODO: Rewrite function to access the code from the submissionData JSON array instead

    const code = editor.getValue().trim();
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
        user_code = '''${code.replace(/'/g, "\\'").replace(/\n/g, "\\n")}'''

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

        document.getElementById("output").textContent =
            output.split("Hidden Test Cases:")[0] || "";
    } catch (error) {
        document.getElementById("output").textContent = error;
        // TODO: fill the userAnswers of current question with FAIL state for each regular and hidden test case.
        // In case of an error, mark all test cases as "FAILED"
        let failedOutput = "";
        testCases.forEach((_, i) => {
            failedOutput += `Test Case ${i + 1}: FAILED\n\n`;
        });
        failedOutput += "Hidden Test Cases:\n";
        hiddenCases.forEach((test, i) => {
            failedOutput += `${
                test.name || "Hidden Test " + (i + 1)
            }: FAILED\n`;
        });
        userAnswers[currentQuestionIndex].results = failedOutput;
    }

    answerCount = userAnswers.filter(
        (answer) => answer.code && answer.code.includes("return")
    ).length;
    console.log("count: ", answerCount);
    document.getElementById("submit").style.display =
        answerCount === quizData.questions.length ? "inline-block" : "none";
    submitFlag = 0;
}