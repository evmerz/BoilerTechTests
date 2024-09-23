const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3000;

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
  
  // GET request to create a new account
  app.get('/create-account', (req, res) => {
    const username = req.query.username;
    const password = req.query.password;
  
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
  
    const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.query(query, [username, password], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error inserting data into the database' });
      }
      res.status(201).json({ message: 'Account created', userId: result.insertId });
    });
  });
  
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
  });