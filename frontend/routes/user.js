import express from "express";
const router = express.Router();

// Route to create an account
router.post('/create-account', (req, res) => {
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

// // creates a new author
// router.post("/create-author", async (req, res) => {
//   try {
//     let newDocument = {
//         name: req.body.name,
//         dob:  req.body.dob,
//         gender: req.body.gender,
//     };
//     let collection = await db.collection("authors");
//     let result = await collection.insertOne(newDocument);
//     res.send(result).status(204);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Error adding author");
//   }
// });

// // creating a new author using transactions when appropriate
// router.post("/create-author", async (req, res) => {
//   const session = await mongoose.startSession();
//   try {
//     session.startTransaction();

//     const newAuthor = await Author.create([req.body], { session: session });
//     await session.commitTransaction();

//     res.status(200).json({ success: true, data: newAuthor });
//   } catch (error) {
//     await session.abortTransaction();
//     res.status(500).json({ success: false, error: error.message });
//   } finally {
//     session.endSession();
//   }
// });

// // updates author by id
// router.patch("/edit-author/:id", async (req, res) => {
//   try {
//     const query = { _id: new ObjectId(req.params.id) };
//     const updates = {
//       $set: {
//         name: req.body.name,
//         dob:  req.body.dob,
//         gender: req.body.gender,
//       },
//     };

//     let collection = await db.collection("authors");
//     let result = await collection.updateOne(query, updates);
//     res.send(result).status(200);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Error updating author");
//   }
// });

// // deletes author by id
// router.delete("/:id", async (req, res) => {
//   try {
//     const query = { _id: new ObjectId(req.params.id) };

//     const collection = db.collection("authors");
//     let result = await collection.deleteOne(query);

//     res.send(result).status(200);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Error deleting author");
//   }
// });

export default router;