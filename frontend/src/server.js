const mysql = require('mysql');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

// Parse JSON request bodies
app.use(express.json());
app.use(cors());
app.use(express.static('public'));


const connection = mysql.createConnection({
  host: 'database-1.cvmku4284fk0.us-east-2.rds.amazonaws.com',
  user: 'admin',
  password: 'Boilerpass0!',
  database: 'database-1'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Route to create an account
app.post('/create-account', (req, res) => {
    const { username, password } = req.body;
  
    // Basic validation (you can add more if needed)
    if (!username || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    // Insert into database
    const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
    connection.query(query, [username, password], (err, results) => {
      if (err) {
        console.error('Error inserting data:', err);
        return res.status(500).json({ message: 'Error creating account' });
      }
  
      res.json({ message: 'Account created successfully!' });
    });
  });
  
  // Start the server
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });