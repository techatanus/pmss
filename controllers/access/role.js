const db = require('../../util/db');


// add user role
const addUseRole = async(req,res,next)=>{
    const {name,description,department} = req.body;
    //check if role exist before creating new role
    const sql = 'SELECT * FROM d_roles WHERE role = ?';
    await db.query(sql,[name],(err,results)=>{
         if(results.length > 0){
            res.send('<script>alert("role already exists")</script>');
         }else{
            db.query('INSERT INTO d_roles(role,descp,dept) VALUES(?,?,?)',[name,description,department],(err,rs)=>{
                 if(err) throw err;
            db.query('SELECT * FROM d_roles',(err,rs)=>{
                res.render('./roles',{items : rs})
            })
                res.send('<script>alert("role inserted successful")</script>');
    
             })
         }
      
    })


}

// Assign the roles permissions
// const addUserPrivilledge = async(req,res,next) =>{
//      // Extract form data
//      const department = req.body.department;
//      const permissions = [];
 
//      ['manageSales', 'viewReports', 'PrintReceipt', 'viewUsers', 'manageStock', 'editReports',
//          'manageSuppliers', 'manageCustomers', 'deleteUsers', 'updateUsers', 'AddUsers',
//          'configuration', 'viewSales', 'viewStock']
//          .forEach(permission => {
//              if (req.body[permission]) {
//                  permissions.push(permission);
//              }
//          });
 
//      if (permissions.length === 0) {
//          return res.send("No permissions selected.");
//      }
 
//      // Delete existing permissions for the department
//      const deleteQuery = 'DELETE FROM d_access WHERE department = ?';
//      db.query(deleteQuery, [department], (err, result) => {
//          if (err) {
//              console.error('Error deleting data:', err.stack);
//              return res.send("Error saving roles.");
//          }
 
//          // Insert new permissions for the department
//          const insertQuery = 'INSERT INTO d_access (department, permission) VALUES ?';
//          const values = permissions.map(permission => [department, permission]);
 
//          db.query(insertQuery, [values], (err, results) => {
//              if (err) {
//                  console.error('Error inserting data:', err.stack);
//                  return res.send("Error saving roles.");
//              }

 
           
//          });
//      });

// }

// Assign the roles permissions
const addUserPrivilledge = async(req, res, next) => {
    const department = req.body.department;
    const permissions = [];

    ['manageSales', 'viewReports', 'PrintReceipt', 'viewUsers', 'manageStock', 'editReports',
        'manageSuppliers', 'manageCustomers', 'deleteUsers', 'updateUsers', 'AddUsers',
        'configuration', 'viewSales', 'viewStock']
        .forEach(permission => {
            if (req.body[permission]) {
                permissions.push(permission);
            }
        });

    if (permissions.length === 0) {
        return res.send("No permissions selected.");
    }

    // Delete existing permissions for the department
    const deleteQuery = 'DELETE FROM d_access WHERE department = ?';
    db.query(deleteQuery, [department], (err, result) => {
        if (err) {
            console.error('Error deleting data:', err.stack);
            return res.send("Error saving roles.");
        }

        // Insert new permissions for the department
        const insertQuery = 'INSERT INTO d_access (department, permission) VALUES ?';
        const values = permissions.map(permission => [department, permission]);

        db.query(insertQuery, [values], (err, results) => {
            if (err) {
                console.error('Error inserting data:', err.stack);
                return res.send("Error saving roles.");
            }
            res.redirect('/manage'); // Redirect after saving
        });
    });
}

//   validate access privilledges
// const checkPermission = (requiredPermission) => {
//     return async (req, res, next) => {
//         if (!req.session.user) {
//             return res.redirect('/'); // Redirect to login if not authenticated
//         }

//         const userId = req.session.user.u_role;
//         const sql = `
//             SELECT * FROM d_access 
//             WHERE user_id = ? AND permission = ?`;

//         await db.query(sql, [userId, requiredPermission], (err, result) => {
//             if (err) {
//                 return res.status(500).send('Internal Server Error');
//             }

//             if (result.length > 0) {
//                 next(); // User has permission, allow access
//             } else {
//                 res.status(403).send('<script>alert("Access Denied: You do not have permission to access this page.")</script>');
//             }
//         });
//     };
// };








module.exports = {addUseRole,addUserPrivilledge}
