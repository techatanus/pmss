// Import required packages
const express = require('express');
const mysql = require('mysql');

// Create MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'address_book'
});

// Connect to MySQL
connection.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

// Create Express app
const app = express();

// Middleware for JSON parsing
app.use(express.json());

// Create address
app.post('/address', (req, res) => {
  const { name, address } = req.body;
  const sql = 'INSERT INTO addresses (name, address) VALUES (?, ?)';
  connection.query(sql, [name, address], (err, result) => {
    if (err) throw err;
    res.send('Address added successfully');
  });
});

// Read all addresses
app.get('/address', (req, res) => {
  connection.query('SELECT * FROM addresses', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// Update address
app.put('/address/:id', (req, res) => {
  const { id } = req.params;
  const { name, address } = req.body;
  const sql = 'UPDATE addresses SET name = ?, address = ? WHERE id = ?';
  connection.query(sql, [name, address, id], (err, result) => {
    if (err) throw err;
    res.send('Address updated successfully');
  });
});

// Delete address
app.delete('/address/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM addresses WHERE id = ?';
  connection.query(sql, id, (err, result) => {
    if (err) throw err;
    res.send('Address deleted successfully');
  });
});

// Reset addresses (delete all)
app.delete('/address/reset', (req, res) => {
  connection.query('DELETE FROM addresses', (err, result) => {
    if (err) throw err;
    res.send('All addresses deleted');
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(Server is running on port ${PORT});
});