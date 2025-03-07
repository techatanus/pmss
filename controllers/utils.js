const db = require('../util/db');
const bcrypt = require('bcrypt');



// function to capture user data

 const processRequest = async(req,res,next)=>{
    const {name,email,role} = req.body
    const Password = 'Ke@254';
    const hashedPass = bcrypt.hashSync(Password,10);

    // -----check if user exist before creating new user-------
    const user_exist = 'SELECT * FROM dev_users where u_email = ?';
      await db.query(user_exist,[email],(err,rs)=>{
            if(rs.length > 0){
               // ------user exists--------
               res.send(`
               <script>
               alert("User with the email already exists")
               window.location.href = '/users';
               </script>
               
               
               `)
               // console.log('User with the email already exists');
            }else{
               // proceed and create new user
               db.query('INSERT INTO dev_users(u_name,u_email,u_role,u_pass) VALUES(?,?,?,?)',[name,email,role,hashedPass],(error)=>{
                  if(error){
                  res.send('<script>alert("error uploading data")</script>')
                  }else{
                     db.query('SELECT * FROM dev_users',(err,rs)=>{
                           res.send(`
                           <script>
                           alert("data inserted successful");
                           window.location.href = '/users';
                           </script>

                           `)
                        // res.render('./table',{persons : rs});
                     })
                  }
                  // res.send('<script>alert("data inserted successful")</script>')
                  //  console.log('data inserted successful');
                })
            }
      })
 }
//ADD tenants FUNCTION TO THE DB

const addTenant = (req, res, next) => {
    const { name, bp, sp, category, n_cats, date } = req.body;

    console.log("Received house number (category):", category, n_cats, sp); // Debugging

    // Step 1: Check if the email is already used
    const checkEmailQuery = 'SELECT * FROM products WHERE p_name = ? OR p_sp = ?';
    db.query(checkEmailQuery, [name,sp], (err, emailResult) => {
        if (err) {
            console.error('Error checking email:', err);
            return res.send(`
                <script>
                    alert("Error checking email.");
                    window.location.href = '/inventory';
                </script>
            `);
        }

        if (emailResult.length > 0) {
            return res.send(`
                <script>
                    alert("This  user  is already registered in the system.");
                    window.location.href = '/inventory';
                </script>
            `);
        }

        // Step 2: Check if the tenant already exists in the same category
        const checkTenantQuery = 'SELECT * FROM products WHERE p_name = ? AND houseno = ? AND category = ?';
        db.query(checkTenantQuery, [name, category, n_cats], (err, tenantResult) => {
            if (err) {
                console.error('Error checking tenant:', err);
                return res.send(`
                    <script>
                        alert("Error checking tenant.");
                        window.location.href = '/inventory';
                    </script>
                `);
            }

            if (tenantResult.length > 0) {
                return res.send(`
                    <script>
                        alert("Tenant with this name and house in the selected category already exists.");
                        window.location.href = '/inventory';
                    </script>
                `);
            }

            // Step 3: Check if the house in the selected category is occupied
            const checkHouseQuery = 'SELECT * FROM houses WHERE houseno = ? AND category = ? AND status = 0';
            db.query(checkHouseQuery, [category, n_cats], (err, houseResult) => {
                if (err) {
                    console.error('Error checking house:', err);
                    return res.send(`
                        <script>
                            alert("Error checking house.");
                            window.location.href = '/inventory';
                        </script>
                    `);
                }

                if (houseResult.length === 0) {
                    return res.send(`
                        <script>
                            alert("Selected house is either occupied or does not exist in this category. Please choose another.");
                            window.location.href = '/inventory';
                        </script>
                    `);
                }

                // Step 4: Insert new tenant
                const insertTenantQuery = 'INSERT INTO products(p_name, houseno, category, p_bp, p_sp, date) VALUES(?,?,?,?,?,?)';
                db.query(insertTenantQuery, [name, category, n_cats, bp, sp, date], (err, result) => {
                    if (err) {
                        console.error('Error inserting tenant:', err);
                        return res.send(`
                            <script>
                                alert("Error adding tenant.");
                                window.location.href = '/inventory';
                            </script>
                        `);
                    }

                    // Step 5: Update house status to occupied (1)
                    const updateHouseStatusQuery = 'UPDATE houses SET status = 1 WHERE houseno = ? AND category = ?';
                    db.query(updateHouseStatusQuery, [category, n_cats], (err, updateResult) => {
                        if (err) {
                            console.error('Error updating house status:', err);
                            return res.send(`
                                <script>
                                    alert("Error updating house status.");
                                    window.location.href = '/inventory';
                                </script>
                            `);
                        }

                        console.log("Tenant added and house status updated successfully!");
                        return res.send(`
                            <script>
                                alert("Tenant added and house status updated successfully!");
                                window.location.href = '/inventory';
                            </script>
                        `);
                    });
                });
            });
        });
    });
};


      //add house type- category
      const addCategory = async(req,res,next)=>{
      //   check if the category exist else create new category
      const {cname} = req.body
      console.log(req.body);
      const sql = 'SELECT * FROM p_categories WHERE name = ?';
      await db.query(sql,[cname],(err,rs)=>{
          if(rs.length > 0){
            
           res.send('<script>alert("category already exists!")</script>')
          }else{
           const addC = 'INSERT INTO p_categories(name) VALUES(?)';
           db.query(addC,[cname],(err)=>{
                if(err) throw err;
                res.send(`
                <script>
                alert("category added successful");
                 window.location.href = '/categ';
                </script>
                
                `)
           })
          }
      })

      }

      // delete category
    //   const deleteCategory = async(req,res,next) => {
    //     const id = req.query.id;
    //     db.query('DELETE FROM p_categories WHERE id = ?',[id],(err,rs)=>{
    //       if(err) throw err;
    //       res.send(`
    //       <script>
    //       alert("category deleted successful");
    //        window.location.href = '/categ';
    //       </script>
          
    //       `)
    //     })

    //   }
    const deleteCategory = async (req, res, next) => {
        const categoryName = req.query.id;
    
        if (!categoryName) {
            return res.send(`<script>alert("Category name is required"); window.location.href = '/categ';</script>`);
        }
    
        // Start by deleting all houses under the category
        db.query('DELETE FROM houses WHERE category = ?', [categoryName], (err, result) => {
            if (err) {
                console.error("Error deleting houses:", err);
                return res.send(`<script>alert("Error deleting houses"); window.location.href = '/categ';</script>`);
            }
    
            console.log(`${result.affectedRows} houses deleted.`); // Log deleted rows
    
            // Now delete the category after deleting its dependent houses
            db.query('DELETE FROM p_categories WHERE name = ?', [categoryName], (err, result) => {
                if (err) {
                    console.error("Error deleting category:", err);
                    return res.send(`<script>alert("Error deleting category"); window.location.href = '/categ';</script>`);
                }
    
                console.log(`${result.affectedRows} category deleted.`); // Log deleted rows
    
                res.send(`
                    <script>
                        alert("Category and associated houses deleted successfully");
                        window.location.href = '/categ';
                    </script>
                `);
            });
        });
    };
    
    

// addHouses
const addHouses = async (req, res, next) => {
    const { contact, category, descript, amount } = req.body;

    // Check if the exact combination of houseno and category exists
    const sql = 'SELECT * FROM houses WHERE houseno = ? AND category = ?';
    db.query(sql, [contact, category], (err, rs) => {
        if (err) {
            console.error('Error checking house existence:', err);
            return res.send('<script>alert("Database error. Try again!")</script>');
        }

        if (rs.length > 0) {
            res.send(`
            <script>alert("House with this category already exists!")
            window.location.href = '/t';
            </script>`);
        } else {
            // Insert new house with a different category
            const addC = 'INSERT INTO houses (houseno, category, description, price) VALUES (?, ?, ?, ?)';
            db.query(addC, [contact, category, descript, amount], (err, rs) => {
                if (err) {
                    console.error('Error inserting house:', err);
                    res.send('<script>alert("Error adding data")</script>');
                } else {
                    res.send(`
                    <script>
                        alert("House added successfully!");
                        window.location.href = '/t';
                    </script>
                    `);
                }
            });
        }
    });
};

// userAuthentication
const userAuthentication = async (req, res, next) => {
    const { name, password } = req.body;
    const sql = 'SELECT * FROM dev_users WHERE u_name = ?';
    
    await db.query(sql, [name], async (err, rs) => {
        if (err) {
            res.send('<script>alert("User with name do not exist")</script>');
        } else {
            const user = rs[0];
            if (user && bcrypt.compareSync(password, user.u_pass)) {
                // Fetch permissions based on the user's role
                const role = user.u_role; // Assuming the role is stored in `u_role`
                const permissionsSql = 'SELECT permission FROM d_access WHERE department = ?';
                
                await db.query(permissionsSql, [role], (err, permissionsResult) => {
                    if (err) {
                        res.send('<script>alert("Error fetching permissions")</script>');
                    } else {                    

                          db.query(`
                          SELECT 
                          (SELECT COALESCE(SUM(amount_paid), 0) FROM payments) AS paid,
                          (SELECT COALESCE(SUM(price), 0) FROM houses WHERE status IN (1, 2)) - 
                          (SELECT COALESCE(SUM(amount_paid), 0) FROM payments) AS balance_due;
                      
                      
                      
                          `,(err,results)=>{
                            if(err){
                             console.log('error fetching data')
                            }else{
                             db.query(`
                             SELECT 
                             COUNT(*) AS total,
                             SUM(CASE WHEN status IN (0, 2) THEN 1 ELSE 0 END) AS vacant,
                             SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) AS occupied
                         FROM houses;
                         

                             `,(err,dts)=>{
                               if(err) {
                                console.log('error retriving tenants and houses');
                               }else{

                                const permissions = permissionsResult.map(row => row.permission);
                        
                                req.session.user = {
                                    id: user.u_id,
                                    username: user.u_name,
                                    email: user.u_email,
                                    role: role,
                                    permissions: permissions // Store permissions in session
                                };
                                
                                const username = user.u_name;
                                console.log(results, dts);
                             
                                res.render('./index', { username , result: results[0], dt : dts[0]});
                                

                               }
                             })
                           
            
                            }
                         })
                     
                    
                    }
                });
            } else {
                res.send('<script>alert("Invalid username or password")</script>');
            }
        }
    });
};

// userpermission
function checkPermission(permission) {
  return (req, res, next) => {
      if (req.session.user && req.session.user.permissions.includes(permission)) {
          next();
      } else {
          res.status(403).send(`
          <script>
         alert('You dont have rights to access this resource!');
         window.location.href = '/h'
          </script>
          
          `);
      }
  };
}


// Sales_autosearch proucts
// const Sales_autosearch = async(req,res,next)=>{
  

// }


















//  import the functions
module.exports ={processRequest,addTenant,addCategory,addHouses,userAuthentication,checkPermission,deleteCategory}
