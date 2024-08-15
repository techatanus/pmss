const express = require('express');
const route = express.Router();
const db = require('../util/db');
const session = require('express-session');
const{processRequest, addProduct, addCategory, addsuppliers, userAuthentication} = require('../controllers/utils');



route.use(express.json());
route.use(session({
  secret:'pajama123@#',
  resave:false,
  saveUninitialized: true,
}));


// route for getting all address
route.get('/',(req,res)=>{
  res.render('./home');
  
    // res.render('./form');
 });
//  cashier
 route.get('/h',(req,res)=>{
  res.render('./index');
  
    // res.render('./form');
 });
//  products
route.get('/t',(req,res)=>{
   db.query('SELECT * FROM products',(err,result)=>{
    res.render('./table', {addedProduct : result});
   })
    // res.render('./form');
 });
//  sales
route.get('/sales',(req,res)=>{
  res.render('./book');
  
    // res.render('./form');
 });
//  reports
route.get('/rep',(req,res)=>{
  res.render('./reports');
 });
//  customer
route.get('/customers',(req,res)=>{
  res.render('./customers');
  
 });
//  settings
route.get('/settings',(req,res)=>{
  res.render('./settings');
  
 });
//  admin
route.get('/sup',(req,res)=>{
  res.render('./super');
  
 });
//  inventory management
route.get('/inventory',(req,res)=>{
  res.render('./invent');
  
 });
//  roles and permision
route.get('/roles',(req,res)=>{
  res.render('./roles');
  
 });

//  manage-user-role
route.get('/manage',(req,res,next)=>{
   res.render('./manageUser_role')
})
// manage supply
route.get('/supply',(req,res)=>{
  db.query('SELECT * FROM suppliers',(err,rs)=>{
    res.render('./supply', {newsupps : rs})
 })  
 });

//  users manage
route.get('/users', async(req,res)=>{
   await db.query('SELECT * FROM dev_users',(err,rs)=>{
    res.render('./users', {persons : rs});
   })
 
  
 });
//  bulk upload
route.get('/bulk',(req,res)=>{
  res.render('./file');
  
 });
 //--------------CONFIGS OF THE SYSTEM-------------------
   route.get('/info',(req,res)=>{
  res.render('./info');
  
    // res.render('./form');
 });
  route.get('/barcode',(req,res)=>{
  res.render('./barcode');
  
    // res.render('./form');
 });
  route.get('/localization',(req,res)=>{
  res.render('./localization');
  
    // res.render('./form');
 });
   route.get('/invoices',(req,res)=>{
  res.render('./invoices');
  
    // res.render('./form');
 });
   route.get('/general',(req,res)=>{
  res.render('./general');
  
    // res.render('./form');
 });
   route.get('/receipt',(req,res)=>{
  res.render('./receipt');
    // res.render('./form');
 });
   route.get('/con',(req,res)=>{
  res.render('./config');
    // res.render('./form');
 });
   route.get('/tableSetting',(req,res)=>{
  res.render('./tableSetting');
  
    // res.render('./form');
 });
   route.get('/taxes',(req,res)=>{
  res.render('./taxes');
  
    // res.render('./form');
 });

// <--------- call the db function here--------->
// ---------------------------------------------------
// system users
route.post('/in',processRequest)

// add product to the database
route.post('/purchase',addProduct);

// add product category
route.post('/addcat',addCategory);

// add suppliers
route.post('/addsup', addsuppliers)

// login
route.post('/sign',userAuthentication);

// auto filter products
// route.get('/search-products',Sales_autosearch);

// Export the route object
module.exports = route;
