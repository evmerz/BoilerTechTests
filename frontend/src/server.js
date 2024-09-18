const mysql = require('mysql');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Parse JSON request bodies
app.use(express.json());

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


  ///

//   import express from "express";
// import cors from "cors";
// import authors from "./routes/author.js";
// import books from "./routes/book.js";
// import expressSanitizer from "express-sanitizer";

// const PORT = process.env.PORT || 5050;
// const app = express();

// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use(expressSanitizer());

// // sanitize user input for specific routes or fields
// app.use("/author", (req, res, next) => {
//   if (req.body && req.body.name) {
//     // sanitize the name field
//     req.body.name = req.sanitize(req.body.name);
//   }
//   next();
// });

// app.use("/book", (req, res, next) => {
//   if (req.body && req.body.title) {
//     // sanitize the title field
//     req.body.title = req.sanitize(req.body.title);
//   }
//   next();
// });

// app.use("/author", authors);
// app.use("/book", books);

// // start the express server
// app.listen(PORT, () => {
//   console.log(`Server listening on port ${PORT}`);
// });
