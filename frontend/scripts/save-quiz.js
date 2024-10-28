async function saveQuiz(quizId, userId, quizResponses) {
    console.log("yes");
    const url = `https://boilertechtests.com/api/quiz/{quizId}/submit`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                quizId,
                userId,
                responses: quizResponses
            })
        });

        if (!response.ok) {
            throw new Error('Failed to save quiz');
        }

        const data = await response.json();
        console.log('Quiz saved successfully:', data);
    } catch (error) {
        console.error('Error saving quiz:', error);
    }
}
