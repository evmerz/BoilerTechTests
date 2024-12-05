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

          if (_quizData.quizInfo.type != type) {
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