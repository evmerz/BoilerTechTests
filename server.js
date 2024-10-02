const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 5000;

// Allow requests from the specified origin
app.use(cors());

// Your existing routes here


app.use(express.json());

// Create an Express Router
const router = express.Router();
// =====================
// Mount Router at /api
// =====================
app.use('/api', router);

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

// =====================
// Define Routes on Router
// =====================

// Create Account Route
router.get('/create-account', (req, res) => {
    const username = req.query.username;
    const password = req.query.password;

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
router.get('/login', (req, res) => {
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
router.post('/update-account', (req, res) => {
  const { userId, newUsername, newPassword } = req.body;
  if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
  }

  // Create an array for the query
  const updates = [];
  const params = [];

  // Check if newUsername is provided and not empty
  if (newUsername && newUsername.trim() !== '') {
      updates.push('username = ?');
      params.push(newUsername);
  }

  // Check if newPassword is provided and not empty
  if (newPassword && newPassword.trim() !== '') {
      updates.push('password = ?');
      params.push(newPassword);
  }

  // If no updates, return an error
  if (updates.length === 0) {
      return res.status(400).json({ message: 'No updates provided' });
  }

  // Construct the query
  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
  params.push(userId);

  db.query(query, params, (err, results) => {
      if (err) {
          return res.status(500).json({ message: 'Error updating account' });
      }

      res.json({ success: true, message: 'Account updated successfully' });
  });
});



  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
  });
