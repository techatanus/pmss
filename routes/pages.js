const express = require('express');
const route = express.Router();
const db = require('../util/db');
const session = require('express-session');
const{processRequest, addTenant, addCategory, addHouses, userAuthentication,checkPermission, deleteCategory} = require('../controllers/utils');
const{ CompanyDetail, generalSettings, taxSettings } = require('../controllers/settings');
const { addUseRole, addUserPrivilledge } = require('../controllers/access/role');
const { deleteProduct, updateStock, postUpdate, updateSoldItem, updateCategory, stcockTransfer, stockTransfer, updateUser, updateSuppler } = require('../controllers/crud/crud');
const { companySetup, adminAccount, activatePos } = require('../controllers/middleware/setup');
const { editrole } = require('../controllers/middleware/manageRoles');




route.use(express.json());
route.use(session({
  secret:'pajama123@#',
  resave:false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

//login form
route.get('/', (req, res) => {
  res.render('./home');
});


// reset password
route.get('/reset',(req,res,next)=>{
  res.render('./reset')
})

// categupate
route.get('/updt',(req,res)=>{
  const username = req.session.user ? req.session.user.username : 'Guest';
const id = req.query.id;

db.query('SELECT * FROM p_categories WHERE id = ?',[id],(err,rs)=>{
       if(err){
        throw err;
       }
       res.render('./updateCategory',{categ : rs[0],username })
})
});

// receive product from supplier
route.get('/rec',(req,res) => {
  const username = req.session.user ? req.session.user.username : 'Guest';
  const u_id = req.query.id;
  const receiptPd = 'SELECT * FROM products WHERE p_id = ?';
  db.query(receiptPd,[u_id],(err,rs) => {
    if(err){
      console.log('error retrieving products');
    }
    res.render('./receiveStock',{product : rs[0], username});
  })
})
// sales-return
route.get('/return_s',(req,res) => {
  const username = req.session.user ? req.session.user.username : 'Guest';
  db.query(" SELECT si.sale_id, p.p_name AS product, si.quantity, si.price,(si.quantity * si.price) AS total,s.payment_type AS payment_mode, s.date FROM sales_items si JOIN products p ON si.product_id = p.p_id JOIN dev_sales s ON si.sale_id = s.id",(err,rs)=>{
  
    res.render('./returns', {sales : rs,username})
  })
  });
  // delete suppliers
  route.get('/delsup',(req,res,next)=>{
    const sip = req.query.id;
     db.query('DELETE FROM houses WHERE id = ?',[sip],(err,rs) => {
       if(err) {
        console.log('error deleting record');
       }else{
        res.send(`
         <script>
         alert('you have successfully deleted the record');
          window.location.href = '/t';
         </script>
        `)
       }
     })
  })
  // creste client sudo
  route.get('/crsdo',(req,res) => {
     res.render('./crsudo');
  });
  // activate product
  route.get('/active',(req,res) => {
    res.render('./productActivation')
  });

  // del user
  route.get('/deluser',(req,res) => {
     const id = req.query.id;
     db.query('DELETE FROM dev_users WHERE u_id = ?',[id],(err,rs) => {
        if(err){
          console.log('error deleting record');
        }
        res.send(`
           <script>
              alert('record deleted successful');
              window.location.href = '/users';
           </script>
        `)
     })
  });
  // update user
  route.get('/upd',(req,res) => {
    const id = req.query.id;
    db.query('SELECT * FROM dev_users WHERE u_id= ?',[id],(err,rs) => {
        if(err){
          console.log('error retrieving user data');

        }
        res.render('./upduser', {users : rs[0]})
    })
    
  });
  // updatesuplier
  route.get('/updatesup',(req,res)=> {
    const id= req.query.id;
    db.query('SELECT * FROM houses WHERE id = ?',[id],(err,rs) =>{
         if(err){
          console.log('error retrieving data');
         }
       res.render('./updsupply',{supps : rs[0]});

    })
  });
  // delete role
  route.get('/de',(req,res) => {
    const id = req.query.id;
    db.query('DELETE FROM d_roles WHERE id = ?',[id],(err,rs) => {
       if(err){
         console.log('error deleting record');
       }
       res.send(`
          <script>
             alert('record deleted successful');
             window.location.href = '/roles';
          </script>
       `)
    })
 });

//  update roles
route.get('/editrole',(req,res) => {
  const id = req.query.id;
  db.query('SELECT * FROM d_roles WHERE id= ?',[id],(err,rs) => {
      if(err){
        console.log('error retrieving user data');

      }
      res.render('./editRole', {users : rs[0]})
  })
  
});

// route.get('/h', checkPermission('viewAllReports'), (req, res) => {
//     // Log permissions to confirm it's set
//     const username = req.session.user ? req.session.user.username : 'Guest';
//     console.log('Permissions:', req.session.user ? req.session.user.permissions : 'No permissions found');
//   res.send(`
//   <script>
//   window.location.href='/index'
// </script>
//   `)

// });

route.get('/h', checkPermission('viewAllReports'), (req, res) => {
  const user = req.session.user;
  console.log('User:', user);
  console.log('Permissions:', user ? user.permissions : 'No permissions found');

  res.send(`
  <script>
      console.log("Redirecting to /index...");
      window.location.href='/index';
  </script>
  `);
});


// Products - Assuming "viewProducts" permission is required
route.get('/t', checkPermission('viewTenants'), (req, res) => {
  const username = req.session.user ? req.session.user.username : 'Guest';
  
  db.query('SELECT * FROM products', (err, result) => {
      if (err) {
          console.log('error retrieving data');
      } else {
          db.query('SELECT * FROM p_categories', (err, rs) => {
              if (err) {
                  console.log('error retrieving sample');
              } else {
                  db.query('SELECT * FROM houses', (err, rss) => {
                      res.render('./table', { addedProduct: result, items: rs, sups: rss ,username});
                  });
              }
          });
      }
  });
});
// Sales - "manageProperties" permission
route.get('/sales', checkPermission('manageProperties'), (req, res) => {
  const username = req.session.user ? req.session.user.username : 'Guest';
  res.render('./book',{username});
});

// //  admin
route.get('/sup', checkPermission('configureSystem'),(req,res)=>{
  const username = req.session.user ? req.session.user.username : 'Guest';
  res.render('./super',{username});
  
 });

 route.get('/returnItem/:id',checkPermission('manageProperties'),(req,res,next)=>{
  const username = req.session.user ? req.session.user.username : 'Guest';
 const salesId = req.params.id;
 const sql = 'SELECT * FROM sales_items WHERE sale_id = ?';
  
   db.query(sql,[salesId],(err,rs)=>{
      if(err){
console.log('error retrieving data');
      }else{
        res.render('./updateSalesItem',{data : rs[0],username})
      }
   })
  
 })


  route.get('/settings',checkPermission('configureSystem'),(req,res)=>{
    const username = req.session.user ? req.session.user.username : 'Guest';
  res.render('./settings',{username});
  
 });


// Reports - "viewAllReports" permission
route.get('/rep', checkPermission('viewAllReports'), (req, res) => {
  const username = req.session.user ? req.session.user.username : 'Guest';
  res.render('./reports',{username});
});

// Customers - "updateTenants" permission
route.get('/customers', checkPermission('updateTenants'), (req, res) => {
  const username = req.session.user ? req.session.user.username : 'Guest';
  res.render('./customers',{username});
});

// Settings - "configureSystem" permission (or any relevant permission for settings)
route.get('/settings', checkPermission('configureSystem'), (req, res) => {
  res.render('./settings');
});

// Admin/SuperAdmin - "adminAccess" or "superAdminAccess" permission
// route.get('/sup', checkPermission('adminAccess'), (req, res) => {
//   res.render('./super');
// });

// Inventory Management - "viewTenants" permission for Store Keepers
// route.get('/inventory', checkPermission('viewTenants'), (req, res) => {
//   const username = req.session.user ? req.session.user.username : 'Guest';
//   const st = 'received';
  
//   db.query('SELECT t.p_id, t.p_name,p.payment_date as date,t.houseno, COALESCE(SUM(p.amount_paid), 0) AS total_paid FROM products t LEFT JOIN payments p ON t.p_id = p.tenant_id GROUP BY t.p_id, p.tenant_id',(err, result) => {
//     if(err) throw err;
//     db.query('SELECT * FROM houses WHERE status < 1',(err,casups)=>{
//       if(err) throw err;
//       db.query('SELECT * FROM p_categories',(err,cats)=>{
//         res.render('./invent', { addedProduct: result,casup : casups, cat:cats, username });
//       })
     
//     })
      

//   });
// });


route.get('/inventory', checkPermission('viewTenants'), (req, res) => {
  const username = req.session.user ? req.session.user.username : 'Guest';

  db.query(`SELECT t.p_id, t.p_name, p.payment_date AS date, t.houseno, 
                   COALESCE(SUM(p.amount_paid), 0) AS total_paid 
            FROM products t 
            LEFT JOIN payments p ON t.p_id = p.tenant_id 
            WHERE status = 1
            GROUP BY t.p_id, p.tenant_id`, (err, result) => {
    if (err) throw err;

    db.query('SELECT * FROM houses WHERE status IN (0, 2)', (err, casups) => {
      if (err) throw err;

      // Ensure categories are linked to houses
      db.query('SELECT p.*, h.houseno FROM p_categories p LEFT JOIN houses h ON p.name = h.category', (err, cats) => {
        if (err) throw err;

        res.render('./invent', { 
          addedProduct: result, 
          casup: casups, 
          cat: cats, 
          username 
        });
      });
    });
  });
});




// view category
route.get('/categ', checkPermission('viewTenants'), (req, res) => {
  db.query('SELECT * FROM p_categories', (err, result) => {
    const username = req.session.user ? req.session.user.username : 'Guest';
      res.render('./categ', { addedProduct: result , username});
  });
});

// Roles and Permissions - "manageRoles" permission
route.get('/roles', checkPermission('configureSystem'), (req, res) => {
  db.query('SELECT * FROM d_roles', (err, rs) => {
    const username = req.session.user ? req.session.user.username : 'Guest';
      res.render('./roles', { items: rs , username});
  });
});

// Manage User Role - "configureSystem" permission
// manage-user-role
route.get('/manage',checkPermission('configureSystem'),(req, res, next) => {
  const username = req.session.user ? req.session.user.username : 'Guest';
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
                  'Cashier': ['collectRent', 'viewReceipts', 'generateInvoice'],
                  'Manager': ['viewTenants', 'manageProperties', 'editRentalReports', 'managePayments', 'manageContracts'],
                  'Admin': ['deleteTenants', 'updateTenants', 'updateHouses'],
                  'SuperAdmin': ['addUsers', 'configureSystem', 'viewAllReports'],
                  'Caretaker': ['viewHouses', 'updateHouseStatus'],
                  'Property Auditor': ['viewRentalBalance', 'viewOccupiedHouses', 'viewVacantHouses']
                };

                const selectedPermissions = existingPermissions.map(perm => perm.permission);

                res.render('./manageUser_role', {
                    rls: rs,
                    permissions,
                    selectedRole,
                    selectedPermissions,
                    username
                });
            });
        });
    });
});


// Manage Supply - "manageContracts" permission
route.get('/supply', checkPermission('manageContracts'), (req, res) => {
  const username = req.session.user ? req.session.user.username : 'Guest';
  db.query(`      
 
  SELECT 
    t.p_name AS tenant,h.houseno,
    COALESCE(SUM(p.amount_paid), 0) AS total_paid,
    COALESCE(h.price - SUM(p.amount_paid), h.price) AS balance_due,h.price,t.date
FROM products t
JOIN houses h ON t.houseno = h.houseno AND t.category = h.category
LEFT JOIN payments p ON t.p_id = p.tenant_id
WHERE h.status = 1
GROUP BY t.p_id, t.p_name, h.price;
  `, (err, rs) => {
     if(err) throw err;
     const sql = 'SELECT t.p_id, t.p_name,p.payment_date as date,p.invoice, COALESCE(p.amount_paid ) as total FROM products t  JOIN  payments p ON t.p_id = p.tenant_id WHERE p.amount_paid > 0 ';
      db.query(sql,(err,result) =>{
        if(err) throw err;
        res.render('./supply', { details: rs, books: result, username });
      })
     
  });
});

// Users Management - "viewTenants" or "manageUsers" permission
route.get('/users', checkPermission('viewTenants'), async (req, res) => {
  const username = req.session.user ? req.session.user.username : 'Guest';
  await db.query('SELECT * FROM dev_users', (err, rs) => {
      if (err) {
          console.log('error retrieving data');
      } else {
          db.query('SELECT * FROM d_roles', (err, result) => {
              res.render('./users', { persons: rs, rules: result,username });
          });
      }
  });
});

// Bulk Upload - "bulkUpload" permission
route.get('/bulk', checkPermission('configureSystem'), (req, res) => {
  const username = req.session.user ? req.session.user.username : 'Guest';
  res.render('./file',{username});
});

// System configureSystem - "configureSystem" permission (usually for SuperAdmin)
route.get('/con', checkPermission('configureSystem'), (req, res) => {
  const username = req.session.user ? req.session.user.username : 'Guest';
  res.render('./config',{username});
});

// Other system settings routes with respective permissions
route.get('/info',(req, res) => {
  const username = req.session.user ? req.session.user.username : 'Guest';
  res.render('./info',{username});
});

route.get('/barcode', checkPermission('configureSystem'), (req, res) => {
  const username = req.session.user ? req.session.user.username : 'Guest';
  res.render('./barcode',{username});
});

route.get('/localization', checkPermission('configureSystem'), (req, res) => {
  const username = req.session.user ? req.session.user.username : 'Guest';
  res.render('./localization',{username});
});

route.get('/invoices', checkPermission('configureSystem'), (req, res) => {
  const username = req.session.user ? req.session.user.username : 'Guest';
  res.render('./invoices',{username});
});

route.get('/general', checkPermission('configureSystem'), (req, res) => {
  const username = req.session.user ? req.session.user.username : 'Guest';
  res.render('./general',{username});
});

route.get('/receipt', checkPermission('configureSystem'), (req, res) => {
  const username = req.session.user ? req.session.user.username : 'Guest';
  res.render('./receipt',{username});
});

route.get('/tableSetting', checkPermission('configureSystem'), (req, res) => {
  const username = req.session.user ? req.session.user.username : 'Guest';
  res.render('./tableSetting',{username});
});

route.get('/taxes', checkPermission('configureSystem'), (req, res) => {
  const username = req.session.user ? req.session.user.username : 'Guest';
  res.render('./taxes',{username});
});





// <--------- call the db function here--------->
// ---------------------------------------------------
// system users
route.post('/in',processRequest)

// add product to the database
route.post('/purchase',addTenant);

// add product category
route.post('/addcat',addCategory);

// add suppliers
route.post('/addsup', addHouses)

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
route.post('/update_product',postUpdate);
// post return-sale
route.post('/return-sale', updateSoldItem);
// delete category
route.get('/delt',deleteCategory);
// update category
route.post('/update_category', updateCategory);
//stock transfer
route.post('/receipt_stock',stockTransfer);
// updateuser data
route.post('/updateuser',updateUser);
// update supplier data
route.post('/updsuppler', updateSuppler);
// post company details
route.post('/setup',companySetup);
//adm acc
route.post('/sudor',adminAccount);
//activeproducts
 route.post('/s',activatePos)
// updater roles
route.post('/edirole',editrole)











// Export the route object
module.exports = route;
