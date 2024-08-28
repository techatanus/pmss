const express = require('express');
const route = express.Router();
const db = require('../util/db');
const session = require('express-session');
const{processRequest, addProduct, addCategory, addsuppliers, userAuthentication,checkPermission} = require('../controllers/utils');
const{ CompanyDetail, generalSettings, taxSettings } = require('../controllers/settings');
const { addUseRole, addUserPrivilledge } = require('../controllers/access/role');
const { deleteProduct, updateStock, postUpdate } = require('../controllers/crud/crud');




route.use(express.json());
route.use(session({
  secret:'pajama123@#',
  resave:false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));


route.get('/', (req, res) => {
  res.render('./home');
});

route.get('/h', checkPermission('manageSales'), (req, res) => {
    // Log permissions to confirm it's set
    console.log('Permissions:', req.session.user ? req.session.user.permissions : 'No permissions found');
    
    // Ensure permissions are passed to the template
    res.render('./index', { permissions: req.session.user ? req.session.user.permissions : [] });
});

// Products - Assuming "viewProducts" permission is required
route.get('/t', checkPermission('viewStock'), (req, res) => {
  db.query('SELECT * FROM products', (err, result) => {
      if (err) {
          console.log('error retrieving data');
      } else {
          db.query('SELECT * FROM p_categories', (err, rs) => {
              if (err) {
                  console.log('error retrieving sample');
              } else {
                  db.query('SELECT * FROM suppliers', (err, rss) => {
                      res.render('./table', { addedProduct: result, items: rs, sups: rss });
                  });
              }
          });
      }
  });
});
// Sales - "manageSales" permission
route.get('/sales', checkPermission('manageSales'), (req, res) => {
  res.render('./book');
});

// //  admin
route.get('/sup', checkPermission('configuration'),(req,res)=>{
  res.render('./super');
  
 });

//------ROUTES FOR DIFFERENT URI'S-----------

// route.get('/',(req,res)=>{
//   res.render('./home');
  
//     // res.render('./form');
//  });
// //  cashier
//  route.get('/h',(req,res)=>{
//   res.render('./index');
  
//     // res.render('./form');
//  });
// //  products
// route.get('/t',(req,res)=>{
//    db.query('SELECT * FROM products',(err,result)=>{
//     if(err){
//    console.log('error retrieving data');
//     }else{
//       db.query('SELECT * FROM p_categories',(err,rs)=>{
//         if(err){
//           console.log('error retrieving sample');
//         }else{
//           db.query('SELECT * FROM suppliers',(err,rss)=>{
//             res.render('./table', {addedProduct : result, items : rs, sups:rss});
//           })
//         }
//        })
//     }
    
//    })
//     // res.render('./form');
//  });
// //  sales
// route.get('/sales',(req,res)=>{
//   res.render('./book');
  
//     // res.render('./form');
//  });
// //  reports
// route.get('/rep',(req,res)=>{
//   res.render('./reports');
//  });
// //  customer
// route.get('/customers',(req,res)=>{
//   res.render('./customers');
  
//  });
// //  settings

  route.get('/settings',checkPermission('configuration'),(req,res)=>{
  res.render('./settings');
  
 });


// Reports - "viewReports" permission
route.get('/rep', checkPermission('viewReports'), (req, res) => {
  res.render('./reports');
});

// Customers - "manageCustomers" permission
route.get('/customers', checkPermission('manageCustomers'), (req, res) => {
  res.render('./customers');
});

// Settings - "configuration" permission (or any relevant permission for settings)
// route.get('/settings', checkPermission('configuration'), (req, res) => {
//   res.render('./settings');
// });

// Admin/SuperAdmin - "adminAccess" or "superAdminAccess" permission
// route.get('/sup', checkPermission('adminAccess'), (req, res) => {
//   res.render('./super');
// });

// Inventory Management - "viewStock" permission for Store Keepers
route.get('/inventory', checkPermission('viewStock'), (req, res) => {
  db.query('SELECT * FROM products', (err, result) => {
      res.render('./invent', { addedProduct: result });
  });
});

// Roles and Permissions - "manageRoles" permission
route.get('/roles', checkPermission('configuration'), (req, res) => {
  db.query('SELECT * FROM d_roles', (err, rs) => {
      res.render('./roles', { items: rs });
  });
});

// Manage User Role - "configuration" permission
// manage-user-role
route.get('/manage',checkPermission('configuration'),(req, res, next) => {
    db.query('SELECT * FROM d_roles', (err, rs) => {
        if (err) {
            console.error('Error retrieving roles:', err);
            return res.status(500).send('Internal Server Error');
        }

        const rolesQuery = 'SELECT DISTINCT role FROM d_roles';
        const permissionsQuery = 'SELECT permission FROM d_access WHERE department = ?';

        db.query(rolesQuery, (err, roles) => {
            if (err) {
                console.error('Error fetching roles:', err);
                return res.status(500).send('Internal Server Error');
            }

            let selectedRole = req.query.department || roles[0].role;

            db.query(permissionsQuery, [selectedRole], (err, existingPermissions) => {
                if (err) {
                    console.error('Error fetching permissions:', err);
                    return res.status(500).send('Internal Server Error');
                }

                const permissions = {
                    'Cashier': ['manageSales', 'viewReports', 'PrintReceipt'],
                    'Manager': ['viewUsers', 'manageStock', 'editReports', 'manageSales', 'manageSuppliers', 'manageCustomers'],
                    'Admin': ['viewUsers', 'deleteUsers', 'updateUsers', 'AddUsers', 'manageStock', 'editReports', 'manageSuppliers', 'manageCustomers'],
                    'SuperAdmin': ['viewUsers', 'deleteUsers', 'updateUsers', 'AddUsers', 'manageStock', 'editReports', 'manageSales', 'viewReports', 'manageSuppliers', 'manageCustomers', 'configuration'],
                    'Waiters': ['viewSales', 'PrintReceipt'],
                    'Store Keeper': ['manageStock', 'viewStock'],
                    'Chefs': ['viewStock', 'viewSales'],
                    'Washers': ['viewStock', 'manageSuppliers']
                };

                const selectedPermissions = existingPermissions.map(perm => perm.permission);

                res.render('./manageUser_role', {
                    rls: rs,
                    permissions,
                    selectedRole,
                    selectedPermissions
                });
            });
        });
    });
});


// Manage Supply - "manageSuppliers" permission
route.get('/supply', checkPermission('manageSuppliers'), (req, res) => {
  db.query('SELECT * FROM suppliers', (err, rs) => {
      res.render('./supply', { newsupps: rs });
  });
});

// Users Management - "viewUsers" or "manageUsers" permission
route.get('/users', checkPermission('viewUsers'), async (req, res) => {
  await db.query('SELECT * FROM dev_users', (err, rs) => {
      if (err) {
          console.log('error retrieving data');
      } else {
          db.query('SELECT * FROM d_roles', (err, result) => {
              res.render('./users', { persons: rs, rules: result });
          });
      }
  });
});

// Bulk Upload - "bulkUpload" permission
route.get('/bulk', checkPermission('configuration'), (req, res) => {
  res.render('./file');
});

// System Configuration - "configuration" permission (usually for SuperAdmin)
route.get('/con', checkPermission('configuration'), (req, res) => {
  res.render('./config');
});

// Other system settings routes with respective permissions
route.get('/info', checkPermission('configuration'), (req, res) => {
  res.render('./info');
});

route.get('/barcode', checkPermission('configuration'), (req, res) => {
  res.render('./barcode');
});

route.get('/localization', checkPermission('configuration'), (req, res) => {
  res.render('./localization');
});

route.get('/invoices', checkPermission('configuration'), (req, res) => {
  res.render('./invoices');
});

route.get('/general', checkPermission('configuration'), (req, res) => {
  res.render('./general');
});

route.get('/receipt', checkPermission('configuration'), (req, res) => {
  res.render('./receipt');
});

route.get('/tableSetting', checkPermission('configuration'), (req, res) => {
  res.render('./tableSetting');
});

route.get('/taxes', checkPermission('configuration'), (req, res) => {
  res.render('./taxes');
});




// //  admin
// route.get('/sup',(req,res)=>{
//   res.render('./super');
  
//  });
// //  inventory management
// route.get('/inventory',(req,res)=>{
//   db.query('SELECT * FROM products',(err,result)=>{
//     res.render('./invent', {addedProduct : result});
//  });
// })
// //  roles and permision
// route.get('/roles',(req,res)=>{
//   db.query('SELECT * FROM d_roles',(err,rs)=>{
//     res.render('./roles',{items : rs})
// })  
//  });

//  manage-user-role
// manage-user-role
// route.get('/manage', (req, res, next) => {
//   db.query('SELECT * FROM d_roles', (err, rs) => {
//       if (err) {
//           console.error('Error retrieving roles:', err);
//           return res.status(500).send('Internal Server Error');
//       }

//       const rolesQuery = 'SELECT DISTINCT role FROM d_roles';
//       const permissionsQuery = 'SELECT permission FROM d_access WHERE department = ?';

//       db.query(rolesQuery, (err, roles) => {
//           if (err) {
//               console.error('Error fetching roles:', err);
//               return res.status(500).send('Internal Server Error');
//           }

//           let selectedRole = req.query.department || roles[0].role;

//           db.query(permissionsQuery, [selectedRole], (err, existingPermissions) => {
//               if (err) {
//                   console.error('Error fetching permissions:', err);
//                   return res.status(500).send('Internal Server Error');
//               }

//               const permissions = {
//                  'Cashier': ['manageSales', 'viewReports', 'PrintReceipt'],
//         'Manager': ['viewUsers', 'manageStock', 'editReports',  'manageSuppliers', 'manageCustomers'],
//         'Admin': ['deleteUsers', 'updateUsers', 'AddUsers','configuration'],
//         'SuperAdmin': ['manageSales','configuration','bulkUpload'],
//         'Waiters': ['viewSales'],
//         'Store Keeper': ['manageStock'],
//         'Chefs': ['viewStock',],
//               };

//               const selectedPermissions = existingPermissions.map(perm => perm.permission);

//               res.render('./manageUser_role', {
//                   rls: rs,
//                   permissions,
//                   selectedRole,
//                   selectedPermissions
//               });
//           });
//       });
//   });
// });



// // manage supply
// route.get('/supply',(req,res)=>{
//   db.query('SELECT * FROM suppliers',(err,rs)=>{
//     res.render('./supply', {newsupps : rs})
//  })  
//  });

// //  users manage
// route.get('/users', async(req,res)=>{
//    await db.query('SELECT * FROM dev_users',(err,rs)=>{
//     if(err){
//       console.log('error retrieving data');
//     }else{
//    db.query('SELECT * FROM d_roles',(err,result)=>{
//     res.render('./users', {persons : rs, rules: result});
//    })
//     }
   
//    })
 
  
//  });
// //  bulk upload
// route.get('/bulk',(req,res)=>{
//   res.render('./file');
  
//  });
//  //--------------CONFIGS OF THE SYSTEM-------------------
//    route.get('/info',(req,res)=>{
//   res.render('./info');
  
//     // res.render('./form');
//  });
//   route.get('/barcode',(req,res)=>{
//   res.render('./barcode');
  
//     // res.render('./form');
//  });
//   route.get('/localization',(req,res)=>{
//   res.render('./localization');
  
//     // res.render('./form');
//  });
//    route.get('/invoices',(req,res)=>{
//   res.render('./invoices');
  
//     // res.render('./form');
//  });
//    route.get('/general',(req,res)=>{
//   res.render('./general');
  
//     // res.render('./form');
//  });
//    route.get('/receipt',(req,res)=>{
//   res.render('./receipt');
//     // res.render('./form');
//  });
//    route.get('/con',(req,res)=>{
//   res.render('./config');
//     // res.render('./form');
//  });
//    route.get('/tableSetting',(req,res)=>{
//   res.render('./tableSetting');
  
//     // res.render('./form');
//  });
//    route.get('/taxes',(req,res)=>{
//   res.render('./taxes');
  
//     // res.render('./form');
//  });

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
// delete product
route.get('/del',deleteProduct);
// retrieve Products
route.get('/change',updateStock);
// updateproduct
route.post('/update_product',postUpdate)
// Export the route object
module.exports = route;
