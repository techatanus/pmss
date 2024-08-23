const express = require('express');
const route = express.Router();
const db = require('../util/db');
const session = require('express-session');
const{processRequest, addProduct, addCategory, addsuppliers, userAuthentication} = require('../controllers/utils');
const{ CompanyDetail, generalSettings, taxSettings } = require('../controllers/settings');
const { addUseRole, addUserPrivilledge } = require('../controllers/access/role')



route.use(express.json());
route.use(session({
  secret:'pajama123@#',
  resave:false,
  saveUninitialized: true,
}));

//------ROUTES FOR DIFFERENT URI'S-----------

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
    if(err){
   console.log('error retrieving data');
    }else{
      db.query('SELECT * FROM p_categories',(err,rs)=>{
        if(err){
          console.log('error retrieving sample');
        }else{
          db.query('SELECT * FROM suppliers',(err,rss)=>{
            res.render('./table', {addedProduct : result, items : rs, sups:rss});
          })
        }
       })
    }
    
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
  db.query('SELECT * FROM products',(err,result)=>{
    res.render('./invent', {addedProduct : result});
 });
})
//  roles and permision
route.get('/roles',(req,res)=>{
  db.query('SELECT * FROM d_roles',(err,rs)=>{
    res.render('./roles',{items : rs})
})  
 });

//  manage-user-role
route.get('/manage',(req,res,next)=>{
  db.query('SELECT * FROM d_roles',(err,rs)=>{
    res.render('./manageUser_role',{rls: rs})
  })
  
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
    if(err){
      console.log('error retrieving data');
    }else{
   db.query('SELECT * FROM d_roles',(err,result)=>{
    res.render('./users', {persons : rs, rules: result});
   })
    }
   
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

//companydetails
route.post('/cdetails',CompanyDetail);
// genSettings
route.post('/saveGeneralSettings',generalSettings);
//TaxSettings
route.post('/saveTaxSettings',taxSettings);
// add roles
route.post('/addRol3s',addUseRole);
// grant roles permission
route.post('/save-roles',addUserPrivilledge);


// Export the route object
module.exports = route;
