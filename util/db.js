const mysql = require('mysql');
require('dotenv').config();

const db = mysql.createConnection({
    host:  process.env.DB_HOST,
    user:  process.env.DB_USER,
    password: process.env.DB_PASS,
    database:  process.env.DBS
})

db.connect(error=> {
   if(error) throw error;
   console.log(' connected to the database');
});



module.exports = db;