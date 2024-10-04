document.getElementById('login-form').addEventListener('submit', function(event) {
  event.preventDefault(); // Prevent the form from refreshing the page

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const url = `https://boilertechtests.com/api/create-account`;

  fetch(url, {
      method: 'POST', // Changed to POST
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          username: username,
          password: password
      })
  })
  .then(response => {
      if (!response.ok) {
          return response.json().then(errorData => {
              throw new Error(errorData.message); // Use the message from the server
          });
      }
      return response.json();
  })
  .then(data => {
      // Store user info in localStorage
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('username', username);
      localStorage.setItem('password', password); // Not recommended for production

      // Redirect to account.html
      window.location.href = '/account';
  })
  .catch(error => {
      document.getElementById('response-message').textContent = 'Error: ' + error.message;
  });
});