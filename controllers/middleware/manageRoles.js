const db = require('../../util/db');


// delete role
const editrole = async(req,res,next) => {
    const {id,name,description,department}= req.body;
   
    const sql = 'UPDATE d_roles SET role = ?, descp = ?, dept = ? WHERE id = ?';
    await db.query(sql,[name,description,department,id],(err,rs) =>{
        if(err) throw err;
        res.send(`
        <script>
         alert('data updated successful');
         window.location.href = '/roles';
        </script>
        
        `)
    })
}

// payment




module.exports = {editrole}