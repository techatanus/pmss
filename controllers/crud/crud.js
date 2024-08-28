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
     window.location.href = '/t';
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
    
        const { p_id, p_name, p_category, p_suplier, p_bp, p_sp, p_wp, p_quantity, expD } = req.body;
        const sql = 'UPDATE products SET p_name = ?, p_category = ?, p_suplier = ?, p_bp = ?, p_sp = ?, p_wp = ?, p_quantity = ?, expD = ? WHERE p_id = ?';
        
        db.query(sql, [p_name, p_category, p_suplier, p_bp, p_sp, p_wp, p_quantity, expD, p_id], (err, result) => {
            if (err) throw err;
            res.send(`
            
            <script>
            alert("Product updated successfully");
            window.location.href = '/t';
            </script>
            
            
            
            `);
        });
   
}












module.exports = {deleteProduct,updateStock,postUpdate}