/**
 * Loads the appropriate multiple choice quiz based on the quiz id from the URL query string parameter.
 *
 * @param {string} quiz_id The unique ID of the quiz that is to be loaded in.
 * @param {string} type The type of the quiz, either "mc" or "python"
 * @returns The JSON data of the quiz. Returns null if there is no quiz found.
 */
async function loadQuizData(quiz_id, type) {
    
  const json_directory = await (
      await fetch("/frontend/content/quiz_data.json")
  ).json();

  console.log(JSON.stringify(json_directory));

  var _quizData;

  // Serve the quiz data that corresponds to the quiz ID
  for (let i = 0; i < json_directory.quizzes.length; i++) {
      if (json_directory.quizzes[i].quizID == quiz_id) {

          console.log("ID: " + json_directory.quizzes[i].quizID);

          console.log("filepath: " + json_directory.quizzes[i].filePath);

          _quizData = await (
              await fetch(json_directory.quizzes[i].filePath)
          ).json();

          if ((type != "any") && _quizData.quizInfo.type != type) {
              console.error("Incorrect quiz type! Found " + _quizData.quizInfo.type + " but wanted " + type);
              return null;
          }

          console.log(JSON.stringify(_quizData));

          return _quizData;
      }
  }

  console.log('No quiz found with ID \"' + quiz_id + '\"');
  return null;
}

/**
 * Saves the quiz results in the MySQL database.
 *
 * @param {int} userID The unique ID of the user that took the quiz.
 * @param {string} quizID The unique ID of the quiz that the user took.
 * @param {json} answerData The array of the user's responses to the quiz questions.
 */
async function saveQuiz(userID, quizID, answerData) {
    console.log("yes");
    console.log("quiz:", answerData);
    console.log(
        "quiz string:",
        JSON.stringify({
            user_id: userID,
            quiz_id: quizID,
            answers: answerData,
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

/**
 * Retrieves the user's quiz submission based on userID and quizID, respectively.
 * 
 * @param {int} userID The unique ID of the user that submitted the quiz.
 * @param {string} quizID The unique ID of the quiz that is to be requested.
 * @returns The JSON array of the user's responses to the quiz, pulled from the MySQL database. Returns null if there is no submission.
 */
async function getSubmission(userID, quizID) {
    const url = `https://www.boilertechtests.com/api/get-submit?userID=${encodeURIComponent(userID)}&quizID=${encodeURIComponent(quizID)}`;

    try {
        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message);
        }

        const data = await response.json();
        console.log("Submission data:", data.submissionData);

        return data.submissionData;
    } catch (error) {
        console.error("Error retrieving submission:", error);
        return null;
    }
}

/**
 * Run the python code submitted for a specified question.
 * 
 * @param {PyodieAPI} pyodide The pyodide environment.
 * @param {JSON} questionData The data associated with the question.
 * @param {string} code The user-submitted code.
 * @returns {string} A string containing the output of the user-submitted code when run against the test cases.
 */
async function runCodeQuestion(pyodide, questionData, code) {
    let output = "";
    try {
        output = await pyodide.runPython(`
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
        function_name = '${questionData.functionName}'

        # Test cases
        test_cases = ${JSON.stringify(questionData.testCases)}
        results = ""
        hidden_str = ""
        passed = 0

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
                if result == expected:
                    result_str += "Test Case PASSED"
                    passed += 1
                else:
                    result_str += "Test Case FAILED"
                    
                results += result_str + "\\n\\n"
            else:
                results += f"Function {function_name} not found.\\n"

        hidden_str += "Hidden Test Cases:\\n\\n"
        test_cases = ${JSON.stringify(questionData.hiddenCases)}

        for i, test in enumerate(test_cases, start=1):
            input_args = test['input']
            expected = test['expected']

            # Dynamically look up the function by its name and call it
            if function_name in globals():
                func = globals()[function_name]
                result = func(*input_args)

                # For hidden cases, format as "[name]: [PASS/FAIL]"
                test_name = test.get('name', f"Hidden Test {i}")
                if result == expected:
                    hidden_str += f"{test_name}: {'PASSED'}"
                    passed += 1
                else:
                    hidden_str += f"{test_name}: {'FAILED'}"
                hidden_str += "\\n"
            else:
                hidden_str += f"Function {function_name} not found.\\n"

        # Get the output from the redirected stdout
        output = sys.stdout.getvalue()
        sys.stdout = old_stdout  # Restore standard output
        results += hidden_str
        output + str(results)
    `);

        // userAnswers[currentQuestionIndex].results = output;

        // document.getElementById("output").textContent =
        //     output.split("Hidden Test Cases:")[0] || "";
    } catch (error) {
        output = error;
        // In case of an error, mark all test cases as "FAILED"
        questionData.testCases.forEach((_, i) => {
            output += `Test Case ${i + 1}: FAILED\n\n`;
        });

        output += "Hidden Test Cases:\n";
        questionData.hiddenCases.forEach((test, i) => {
            output += `${
                test.name || "Hidden Test " + (i + 1)
            }: FAILED\n`;
        });
    }

    return output;
}