const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const util = require('util');

const app = express();
const port = 5000;

// Allow requests from the specified origin
app.use(cors());

// mount express router to /api
app.use(express.json());
// const router = express.Router();


// Database Connection
const db = mysql.createConnection({ 
  host: 'database-1.cvmku4284fk0.us-east-2.rds.amazonaws.com',
  user: 'admin',
  password: 'Boilerpass0!',
  database: 'database-1'
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1); // Exit process with failure
    }
    console.log('Connected to MySQL database');
});

// Password Strength Checker
const isPasswordStrong = (password) => {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()]).{8,}$/;
    return strongPasswordRegex.test(password);
};

// Create Account Route (Changed to POST)
app.post('/create-account', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
  }

  // Check if the username already exists
  const checkQuery = 'SELECT * FROM users WHERE username = ?';
  db.query(checkQuery, [username], (err, results) => {
      if (err) {
          return res.status(500).json({ message: 'Error checking username' });
      }

      // Check password strength
      if (!isPasswordStrong(password)) {
          return res.status(400).json({ message: 'Password must be at least 8 characters long, contain uppercase and lowercase letters, a number, and a special character.' });
      }

      // If username exists, return an error message
      if (results.length > 0) {
          return res.status(409).json({ message: 'Username already exists, please choose a different one.' });
      }

      // If username is unique, insert it into the database
      const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
      db.query(query, [username, password], (err, result) => {
          if (err) {
              return res.status(500).json({ message: 'Error inserting data into the database' });
          }
          res.status(201).json({ message: 'Account created', userId: result.insertId });
      });
  });
});

// Login Route
app.get('/login', (req, res) => {
    const username = req.query.username;
    const password = req.query.password;
  
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
  
    const query = 'SELECT id FROM users WHERE username = ? AND password = ?';
    db.query(query, [username, password], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error querying the database' });
      }

      if (results.length > 0) {
        return res.status(200).json({ message: 'Login successful', userId: results[0].id });
      } else {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
    });
});

// Endpoint to update username and/or password
app.post('/update-account', (req, res) => {
  const { userId, newUsername, newPassword, currentPassword } = req.body;

  if (!userId || (!newUsername && !newPassword)) {
      return res.status(400).json({ message: 'New account credentials cannot be blank.' });
  }

  // Fetch current credentials for the user
  const getUserQuery = 'SELECT username, password FROM users WHERE id = ?';
  db.query(getUserQuery, [userId], (err, results) => {
      if (err) {
          return res.status(500).json({ message: 'Error fetching user information' });
      }

      if (results.length === 0) {
          return res.status(404).json({ message: 'User not found' });
      }

      const currentUser = results[0];
      const currentUsername = currentUser.username;
      const currentStoredPassword = currentUser.password;

      // Check if new username or password matches the current one
      if (newUsername && newUsername === currentUsername) {
          return res.status(400).json({ message: 'New username cannot be the same as the current username' });
      }

      if (newPassword && newPassword === currentStoredPassword) {
          return res.status(400).json({ message: 'New password cannot be the same as the current password' });
      }

      // If updating the password, check that current password matches the stored one
      if (newPassword) {
          if (!currentPassword) {
              return res.status(400).json({ message: 'Current password is required to update password' });
          }
          if (currentPassword !== currentStoredPassword) {
              return res.status(401).json({ message: 'Current password is incorrect' });
          }
          // Validate new password strength
          if (!isPasswordStrong(newPassword)) {
              return res.status(400).json({ message: 'Password must be at least 8 characters long, contain uppercase and lowercase letters, a number, and a special character.' });
          }
      }

      // Check if new username already exists
      if (newUsername) {
          const checkUsernameQuery = 'SELECT * FROM users WHERE username = ?';
          db.query(checkUsernameQuery, [newUsername], (err, results) => {
              if (err) {
                  return res.status(500).json({ message: 'Error checking username' });
              }

              if (results.length > 0) {
                  return res.status(409).json({ message: 'Username already exists, please choose a different one.' });
              }

              // Proceed to update credentials if validation passed
              updateCredentials(userId, newUsername, newPassword, res);
          });
      } else {
          // If only updating password, no need to check username
          updateCredentials(userId, newUsername, newPassword, res);
      }
  });
});

/**
 * Helper function for updating credentials in the database.
 * 
 * @param {int} userId 
 * @param {string} newUsername 
 * @param {string} newPassword 
 * @param {*} res 
 */
function updateCredentials(userId, newUsername, newPassword, res) {
  let query = 'UPDATE users SET ';
  const params = [];

  if (newUsername) {
      query += 'username = ?, ';
      params.push(newUsername);
  }
  if (newPassword) {
      query += 'password = ?, ';
      params.push(newPassword);
  }

  query = query.slice(0, -2); // Remove last comma and space
  query += ' WHERE id = ?';
  params.push(userId);

  db.query(query, params, (err) => {
      if (err) {
          return res.status(500).json({ message: 'Error updating account' });
      }

      res.json({ success: true, message: 'Account updated successfully' });
  });
}

app.post('/quiz', async (req, res) => {
    const {user_id, quiz_id, answers } = req.body;
    // console.log("id:", user_id)
    console.log("body:", req.body);

    var submitted = false;
    const checkQuery = 'SELECT * from quiz_submissions WHERE (user_id, quiz_id) = (?, ?)';
    const query = util.promisify(db.query).bind(db);
    await (async () => {
        try {
          const rows = await query(checkQuery, [user_id, quiz_id]);
          if (rows.length > 0) {
            console.log("yes");
            submitted = true;
          }
          console.log("rows:", rows);
        } finally {
        //   db.end();
            console.log("end");
        }
      })()

    console.log("submitted:", submitted);
    
    if (!submitted) {
        const query = 'INSERT INTO quiz_submissions (user_id, quiz_id, answers) VALUES (?, ?, ?)';
        db.query(query, [user_id, quiz_id, JSON.stringify(answers)], (err, result) => {
            if (err) {
                    console.log("error thing: ", err);
                    console.log("ah fuck");
                    console.log("result: ", result);
                    return res.status(500).json({ message: 'Error inserting data into the database' });
            }
            console.log("inserted");
            res.status(201).json({ message: 'Quiz submission saved!'});
        });
    } else {
        const updateQuery = 'UPDATE quiz_submissions SET answers = ? WHERE (user_id, quiz_id) = (?, ?)';
        db.query(updateQuery, [JSON.stringify(answers), user_id, quiz_id], (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Error inserting data into the database' });
            }
            console.log("updated");
            res.status(201).json({ message: 'Quiz submission saved!'});
        });
    }
    
});

app.post('/pin', async (req, res) => {
    const {user_id, classes} = req.body;
    if (user_id) {
        console.log("yes user_id")
        const updateQuery = 'UPDATE users SET classes = ? WHERE (user_id) = (?)';
        db.query(updateQuery, [JSON.stringify(classes), user_id], (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Error updating classes in the database' });
            }
            console.log("updated");
            res.status(201).json({ message: 'Pinned classes saved!'});
        });
    }
})

app.get('/get-submit', async (req, res) => {
    const userID = req.query.userID;
    const quizID = req.query.quizID;

    let submitted = false;
    let submissionData = null;
    const checkQuery = 'SELECT answers FROM quiz_submissions WHERE user_id = ? AND quiz_id = ?';
    const query = util.promisify(db.query).bind(db);

    try {
        const rows = await query(checkQuery, [userID, quizID]);
        if (rows.length > 0) {
            submitted = true;
            submissionData = rows[0].answers; // Get the JSON data from the 'answers' column
        }

        res.status(200).json({
            message: submitted ? 'Quiz submission retrieved!' : 'No previous submission!',
            submitted: submitted,
            submissionData: submitted ? JSON.stringify(submissionData) : null // Parse JSON if there is a submission
        });
    } catch (error) {
        console.error("Error retrieving submission:", error);
        res.status(500).json({ message: 'Database query error' });
    }
});




  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
  });
