const db = require('../../util/db');
// 
delete product
const deleteProduct = (req,res)=>{
    const id = req.query.id
   const delt = 'DELETE FROM products WHERE p_id = ?';
   db.query(delt,[id],(err,rs)=>{
   if(err)throw err;
   res.send(`
   <script>
     alert("item successfully deleted");
     window.location.href = '/inventory';
   </script>
 `);
     
   })

}

// update product

const updateStock = (req,res)=>{
    const productId = req.query.id;
    const sql = 'SELECT * FROM products WHERE p_id = ?';
    
    db.query(sql, [productId], (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            res.render('product_form', { product: result[0] });
        } else {
            res.send('Product not found');
        }
    });
}

// post updated product
const postUpdate = (req,res)=>{
    
        const { p_id, p_name, p_category, p_bp, p_sp } = req.body;
        const sql = 'UPDATE products SET p_name = ?, p_category = ?,  p_bp = ?, p_sp = ? WHERE p_id = ?';
        
        db.query(sql, [p_name, p_category,p_bp, p_sp,p_id], (err, result) => {
            if (err) throw err;
            res.send(`
            
            <script>
            alert("details updated successfully");
            window.location.href = '/inventory';
            </script>
            
            `);
        });
   
}

//update wrong posted sales -return-sale
const updateSoldItem = (req,res)=>{
const {sid,pid,quantity,price} = req.body;
// start transaction
db.beginTransaction((err)=>{
    if(err) throw err;
    // 1. update sales item table
    const updateSalesItemsQuery = `UPDATE sales_items SET quantity = quantity - ? WHERE sale_id = ? AND product_id = ?`;
    db.query(updateSalesItemsQuery,[quantity,sid,pid],(err,result)=>{
        if(err) return db.rollback(() => {throw err;});

        // 2. update inventory (optional)
        const updateInventoryQuery = ` UPDATE products SET p_quantity = p_quantity + ? WHERE p_id = ? `;

        db.query(updateInventoryQuery,[quantity,pid],(err,rs)=>{
            if(err) return db.rollback(() => {throw err;});
        });

    });
    // 3. Adjust total price in dev_sales table
    const adjustTotalPriceQuery = `UPDATE dev_sales SET payment_value = payment_value - (SELECT SUM(quantity * price) FROM sales_items WHERE sale_id = ? ) WHERE id = ? `;
    db.query(adjustTotalPriceQuery,[sid,sid],(err,rs)=>{
        if(err) return db.rollback(() => {throw err;});

        // commit the transaction
        db.commit((err) => {
     if(err) return db.rollback(() => {throw err; });

     res.send(`
            
            <script>
            alert("Sale return processed successfully");
            window.location.href = '/return_s';
            </script>
            
            
            
            `);
  
        })
    })

})
}

// update category
const updateCategory = async(req,res) => {
      const {cid,category} = req.body;
      await db.query('UPDATE p_categories SET name = ? WHERE id = ?',[category,cid],(err,rs) => {
         if(err){
            console.log('err updating record')
         }
         res.send(`
            
         <script>
         alert("record upated successfully");
         window.location.href = '/categ';
         </script>
         
         
         
         `);
      })
}

// stock transfer
const stockTransfer = async (req, res) => {
    const { pid, inqt } = req.body;
    // start transaction
    db.beginTransaction((err) => {
        if (err) throw err;
        
        // 1. Get current stock info from the products table
        const quantityInstock = `SELECT * FROM products WHERE p_id = ?;`;
        db.query(quantityInstock, [pid], (err, rs) => {
            if (err) return db.rollback(() => { throw err; });

            const isAvailable = rs[0];

            // Check if the quantity to transfer is available in stock
            if (inqt <= isAvailable.inquantity) {
                
                // 2. Reduce inquantity (stock in warehouse) by inqt
                const updateInstock = 'UPDATE products SET inquantity = inquantity - ? WHERE p_id = ?';
                db.query(updateInstock, [inqt, pid], (err, results) => {
                    if (err) return db.rollback(() => { throw err; });

                    // 3. Increase p_quantity (stock for sale) by inqt
                    const updateOutstock = 'UPDATE products SET p_quantity = p_quantity + ? WHERE p_id = ?';
                    db.query(updateOutstock, [inqt, pid], (err, rs) => {
                        if (err) return db.rollback(() => { throw err; });

                        // Commit the transaction and confirm success
                        db.commit((err) => {
                            if (err) return db.rollback(() => { throw err; });

                            res.send(`
                                <script>
                                    alert("Successfully transferred ${inqt} quantities of stock for sale.");
                                    window.location.href = '/t';
                                </script>
                            `);
                        });
                    });
                });

            } else {
                // If requested quantity exceeds available stock
                res.send(`
                    <script>
                        alert("You can't transfer more than available stock.");
                        window.location.href = '/t';
                    </script>
                `);
            }
        });
    });
};

// update user
const updateUser = async(req,res) => {
    const {id,name,email,role} = req.body
    const sql = 'UPDATE dev_users SET u_name = ?, u_email = ?, u_role = ? WHERE u_id = ?';
    await db.query(sql,[name,email,role,id],(err,rs) => {
          if(err){
            console.log('error updating data');
          }
          res.send(`
           <script>
            alert('user data updated successful');
            window.location.href = '/users';
           </script>
           
          `)
    })
};

// update suppler details
const updateSuppler = async(req,res) => {
    const {id,name,contact,phone,category} = req.body
    const sql = 'UPDATE houses SET houseno = ?, category = ?,description = ?, price = ? WHERE id = ?';
    await db.query(sql,[name,contact,phone,category,id],(err,rs) => {
          if(err){
            console.log('error updating data');
          }
          res.send(`
           <script>
            alert('house details updated successful');
            window.location.href = '/t';
           </script>
           
          `)
    })
};





module.exports = {deleteProduct,updateStock,postUpdate,updateSoldItem,updateCategory,stockTransfer,updateUser,updateSuppler}