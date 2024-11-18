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

 const addTenant = async(req,res,next)=>{
          const {name,bp,sp,category,date} = req.body;
            const product_exist = 'SELECT * FROM products WHERE p_name =?';
           
            await db.query(product_exist,[name],(err,rs)=>{
                     if(rs.length > 0){
                        // ------product exists , stop exit the program----->
                        res.send(`
                        <script>
                        alert("tenant already exists");
                        window.location.href ='/inventory'
                        
                        </script>
                        `)
                        // console.log('Prouct already exists');
                     }else{
                        // --------proceed and insert the product to the db----->
                        const state = 1;
                        const newTenant = 'INSERT INTO products(p_name,houseno,p_bp,p_sp,date) VALUES(?,?,?,?,?)';
                        const updateStatus = `UPDATE houses SET status = ? WHERE houseno = ?`;

                        db.query(newTenant,[name,category,bp,sp,date],(err,rs)=>{
                            if(err){
                              console.log('error inserting client', err);
                            }else{
                              db.query(updateStatus,[state,category],(err,result)=>{
                                if(err) throw err;
                                res.send(`
                                     <script>
                                     alert('status updated successfully');
                                        window.location.href = '/inventory'
                                     </script>
                                  `)
                            })
                            }
                         
                        })


                        // db.query(newTenant,[name,category,bp,sp,date],(err)=>{
                        //     if(err) {
                        //       console.log('error adding product')
                        //     }else{
                        //     const state = 1;
                        //     db.query(updateStatus,[state,category],(err,resp) =>{
                        //       console.log(category);
                        //      if(err) {
                        //    console.log('error updating status');
                        //      }
                        //      res.send(`
                        //      <script>
                        //      alert('status updated successfully');
                        //         window.location.href = '/inventory'
                        //      </script>
                        //   `)
                        //     })
                        //     }
                        
                        // })
                     } 
            })

      }
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
      const deleteCategory = async(req,res,next) => {
        const id = req.query.id;
        db.query('DELETE FROM p_categories WHERE id = ?',[id],(err,rs)=>{
          if(err) throw err;
          res.send(`
          <script>
          alert("category deleted successful");
           window.location.href = '/categ';
          </script>
          
          `)
        })

      }

// addHouses
const addHouses = async(req,res,next)=>{
   //capture supp detail,check if they exists and create new
   const {contact,category,descript,amount} = req.body;
 
    const sql = 'SELECT * FROM houses WHERE houseno= ?';
    await db.query(sql,[contact],(err,rs)=>{
        if(rs.length > 0){
          
         res.send('<script>alert("house already exists!")</script>')
        }else{
         const addC = 'INSERT INTO houses(houseno,category,description,price) VALUES(?,?,?,?)';
         db.query(addC,[contact,category,descript,amount],(err,rs)=>{
              if(err){
      res.send('<script>alert("Error adding data")</script>')
              }else{
                res.send(`
                <script>
                 window.location.href ='/t';
                </script>
                `)
              //  db.query('SELECT * FROM suppliers',(err,rs)=>{
              //     res.render('./supply', {newsupps : rs})
              //  })
              
              }
           
          
         })
        }
    })

}

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
                          SELECT COUNT(t.p_name)as tenants,SUM(p.amount_paid)as paid,(SUM(h.price) - IFNULL(SUM(p.amount_paid), 0)) AS          balance_due,t.date
                          FROM products t
                          JOIN houses h ON trim(t.houseno) = trim(h.houseno)
                           JOIN payments p ON p.tenant_id = t.p_id
                      
                          `,(err,results)=>{
                            if(err){
                             console.log('error fetching data')
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
                            console.log(results);
                         
                            res.render('./index', { username , result: results[0]});
                             
            
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
