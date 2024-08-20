const db = require('../util/db');

// pos config
const CompanyDetail = async(req,res,next)=>{
 const {name,logo,address,website,email,phone,fax,policy} = req.body;
   const sql = 'SELECT * FROM settings WHERE c_name = ?';
   await db.query(sql,[name],(err,rs)=>{
       if(err) throw err;
       if(rs.length > 0){
        // details exist update
        const sql2 = 'UPDATE settings SET c_name = ?,c_logo = ?,c_address = ?,c_website = ?,c_email = ?,c_phone = ?,c_fax = ?,c_policy = ?'
         db.query(sql2,[name,logo,address,website,email,phone,fax,policy]);
         res.send('<script>alert("data updated successful")</script>')

       } else{
        // insert new details
        const nSql ='INSERT INTO settings(c_name,c_logo,c_address,c_website,c_email,c_phone,c_fax,c_policy) VALUES(?,?,?,?,?,?,?,?)'
           db.query(nSql,[name,logo,address,website,email,phone,fax,policy],(err,rs)=>{
               if(err) throw err;
               res.send('<script>alert("data inserted successful")</script>')
           })
       }
   })
};

// general settings

 const generalSettings = async(req,res,next)=>{
    const{timezone,currency,language} = req.body;
    const sql = 'SELECT * FROM g_settings WHERE g_timezone = ?';
    await db.query(sql,[timezone],(err,rs)=>{
        if(err) throw err;
        if(rs.length > 0){
         // details exist update
         const sql2 = 'UPDATE g_settings SET g_timezone = ?, g_currency = ?,g_language = ?'
          db.query(sql2,[timezone,currency,language]);
          res.send('<script>alert("data updated successful")</script>')
 
        } else{
         // insert new details
         const nSql ='INSERT INTO g_settings(g_timezone,g_currency,g_language) VALUES(?,?,?)'
            db.query(nSql,[timezone,currency,language],(err,rs)=>{
                if(err) throw err;
                res.send('<script>alert("data inserted successful")</script>')
            })
        }
    })
 };

//  tax detail
const taxSettings = async(req,res,next) => {
     const {taxRate,taxID} = req.body;
     const sql = 'SELECT * FROM tax_setting WHERE rate = ?';
     await db.query(sql,[taxRate],(err,rs)=>{
         if(err) throw err;
         if(rs.length > 0){
          // details exist update
          const sql2 = 'UPDATE tax_setting SET rate = ? , taxid = ? '
           db.query(sql2,[taxRate,taxID]);
           res.send('<script>alert("data updated successful")</script>')
  
         } else{
          // insert new details
          const nSql ='INSERT INTO tax_setting(rate,taxid) VALUES(?,?)'
             db.query(nSql,[taxRate,taxID],(err,rs)=>{
                 if(err) throw err;
                 res.send('<script>alert("data inserted successful")</script>')
             })
         }
     })
    
}













module.exports={CompanyDetail,generalSettings,taxSettings}