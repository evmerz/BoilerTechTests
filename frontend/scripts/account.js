// Function to retrieve user info from localStorage
function displayAccountInfo() {
  const username = localStorage.getItem('username');
  const password = localStorage.getItem('password'); // Not safe for production
  const userId = localStorage.getItem('userId');

  if (!username || !userId || !password) {
      alert("User not logged in.");
      window.location.href = '/login';
      return;
  }

  document.getElementById('username').textContent = username;
  document.getElementById('password').textContent = '********'; // Hide password
  document.getElementById('userId').textContent = userId;
}

// Display account info on page load
displayAccountInfo();

// Log out button logic
document.getElementById('logout-btn').addEventListener('click', function() {
  localStorage.removeItem('username');
  localStorage.removeItem('password');
  localStorage.removeItem('userId');
  window.location.href = '/login'; // Redirect to login page
});

// Change username and/or password
document.getElementById('change-btn').addEventListener('click', function() {
  const userId = localStorage.getItem('userId'); // Get user ID
  const currentPassword = document.getElementById('currentPassword').value;
  const newUsername = document.getElementById('newUsername').value;
  const newPassword = document.getElementById('newPassword').value;

  if (!currentPassword && newPassword) {
      document.getElementById('response-message').textContent = 'Current password is required to change password.';
      return;
  }

  const url = `https://boilertechtests.com/api/update-account`;

  fetch(url, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          userId: userId,
          currentPassword: currentPassword, // Send current password for validation
          newUsername: newUsername,
          newPassword: newPassword
      })
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

      if (data.success) {
          // Update localStorage if changes are successful
          if (newUsername) {
              localStorage.setItem('username', newUsername);
              document.getElementById('username').textContent = newUsername; // Update displayed username
          }
          if (newPassword) {
              localStorage.setItem('password', newPassword); // Not recommended for production
          }
      }
  })
  .catch(error => {
      document.getElementById('response-message').textContent = 'Error: ' + error.message;
  });
});