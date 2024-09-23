const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors());

app.use(express.json());

const db = mysql.createConnection({ 
  host: 'database-1.cvmku4284fk0.us-east-2.rds.amazonaws.com',
  user: 'admin',
  password: 'Boilerpass0!',
  database: 'database-1'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL database');
  });

const isPasswordStrong = (password) => {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()]).{8,}$/;
    return strongPasswordRegex.test(password);
};
  
  // GET request to create a new account
  // GET request to create a new account
app.get('/create-account', (req, res) => {
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

  
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
  });