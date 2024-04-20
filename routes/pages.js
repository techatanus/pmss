const express = require('express');
const route = express.Router();
const db = require('../util/db');




//mpesa intergration


// route for getting all address
route.get('/',(req,res)=>{
  
    res.render('./form');
 });

//  create address for books
route.post('/address',async(req,res)=>{
    const {name, address} = req.body;
    console.log(req.body);
    const sql = 'INSERT INTO crud (name, address) VALUES(?,?)';
    await db.query(sql, [name, address],(err,result) => {
           try {
            res.send('<script>alert("Data added successfully")</script>');
           
           
          } catch (error) {
            res.send('<script>alert("Error creating data")</script>')
          } 
    })
});
// select all books | Read
route.get('/all_books', async(req,res)=> {
   await db.query('SELECT * FROM crud', (err,result)=> {
      try {
        res.render('./table', {books: result});
      } catch (error) {
        res.send('<script>alert("Error retrieving data from the table")</script>')
      }
   })
});
// retrieve books based on id for future update
route.get('/change', async(req,res)=> {
  const id = req.query.id;
    const sql = 'SELECT * FROM crud WHERE id= ?';
  await db.query(sql,[id],(err,result)=> {
          try {
             res.render('./update_books', {books : result})
            console.log('Successful retrived the record');
          } catch (error) {
            console.log('error retrieving record');
          }
    })
});
// update the books
route.post('/address_update',async(req,res)=> {
      const {name, address, id} = req.body;
      // console.log(req.body);
      const sql = 'UPDATE crud SET name = ?, address = ? WHERE id = ?';
      await db.query(sql, [name, address, id], (error,result)=> {
            try {
              res.send('<script>alert("Record updated Successful")</script>')
              
            } catch (error) {
              res.send('<script>alert("failed to update the record")</script>')
             
            }
      })
})
// delete books based on id
route.get('/del',(req,res)=>{
  const id = req.query.id;
  console.log(id);
  const sql = 'DELETE FROM crud WHERE id = ?';
  db.query(sql, id, (err, result) => {
    if (err) throw err;
    db.query('SELECT * FROM crud',(err,result)=> {
       if(err) throw err;
       res.render('./table',{books: result});
    })
    // res.send('<script>alert("Address deleted successfully")</script>')
  
  });
});
// view each book separately
route.get('/view', async(req,res)=> {
  const id = req.query.id;
    await db.query('SELECT * FROM crud WHERE id = ?', [id],(error,result) => {
      try {
          res.render('./book', {items : result})
      } catch (error) {
        console.log(error);
      }
    })
})

// Export the route object
module.exports = route;
