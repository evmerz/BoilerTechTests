document.getElementById('login-form').addEventListener('submit', function (event) {
  event.preventDefault(); // Prevent the form from refreshing the page

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const url = `https://boilertechtests.com/api/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

  fetch(url, {
    method: 'GET',
  })
  .then(response => {
      if (!response.ok) {
          return response.json().then(errorData => {
              throw new Error(errorData.message);
          });
      }
      return response.json();
  })
  .then(data => {
      document.getElementById('response-message').textContent = data.message;
      if (data.message === "Login successful") {
          // Store user ID in local storage
          localStorage.setItem('userId', data.userId);
          localStorage.setItem('username', username);
          localStorage.setItem('password', password);
          // Redirect to about.html after a short delay
          setTimeout(() => {
              window.location.href = 'account.html';
          }, 1000); // 1 second delay
      }
  })
    .catch(error => {
        document.getElementById('response-message').textContent = 'Error: ' + error.message;
    });
  });