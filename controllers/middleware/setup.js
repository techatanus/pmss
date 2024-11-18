const bcrypt = require('bcrypt');
const db  = require('../../util/db');
const crypto = require('crypto');

// company setup
const companySetup = async(req,res,next) => {
    const {businessName,address,email,phone,location,logo} = req.body;
      const businessExists = 'SELECT * FROM c_setup WHERE businessName = ? '
      await db.query(businessExists,[businessName],(err,rs)=>{
          if(rs.length > 0){
            res.send(`
            <script>
            alert('clients alread exists');
            window.location.href = '/info';
            
            </script>
            `)
          }else{
             db.query('INSERT INTO c_setup(businessName,address,email,phone,location,logo) VALUES(?,?,?,?,?,?)',[businessName,address,email,phone,location,logo],(err,rs)=>{
                 if(err){
                    console.log(err);
                 }
                 
                 res.send(`
                 <script>
                 alert('clients data processed successful');
                 window.location.href = '/crsdo';
                 
                 </script>
                 `)
             })
          }
      })
};

// Admin Account
const adminAccount = async(req,res,next) =>{
    const {name,uname,email,phone,password} = req.body;
    const hashedPass = bcrypt.hashSync(password,10);
    const accountExists = 'SELECT * FROM admin WHERE uname = ? '
    await db.query(accountExists,[uname],(err,rs)=>{
        if(rs.length > 0){
          res.send(`
          <script>
          alert('user alread exists');
          window.location.href = '/crsdo';
          
          </script>
          `)
        }else{
           db.query('INSERT INTO admin(name,uname,email,phone,password) VALUES(?,?,?,?,?)',[name,uname,email,phone,hashedPass],(err,rs)=>{
               if(err){
                  console.log(err);
               }else{
                // Create a key and set its expiration
                 createActivationKeyWithExpiry();

        db.query('SELECT * FROM c_setup',(err,rs)=>{
              if(err)throw err;
           res.render('./productActivation',{items : rs[0]});
        })
              
               }
            
           });
        }
    })
}


// Product Activation

// Function to generate a random hashed activation key
function generateActivationKey() {
    // Generate a random string
    const activationKey = crypto.randomBytes(20).toString('hex');
    
    // Hash the random string using SHA256
    const hashedKey = crypto.createHash('sha256').update(activationKey).digest('hex');
    
    return hashedKey;
}

// Function to simulate storing the key and setting its expiration
function createActivationKeyWithExpiry(){
    const activationKey = generateActivationKey();
    const expiryTime = Date.now() + 5* 60 * 1000; // Current time + 5 minutes
    
    console.log(`Activation Key: ${activationKey}`);
    console.log(`Expires at: ${new Date(expiryTime).toLocaleTimeString()}`);
    //   check if the key exists and active
    db.query('SELECT * FROM timeline',(err,rs) => {
          if(rs.length > 0){
       console.log('the product is still active');
          }else{
            db.query('INSERT INTO timeline(activationkey,expires) VALUES(?,?)',[activationKey,expiryTime],(err,rs) => {
                if(err) throw err;
                console.log('data processed successful');
            })
          }
    })
    // Schedule key expiration after 5 minutes
    setTimeout(() => {
        console.log('Activation key expired');
        db.query('DELETE FROM timeline',(err,rs) => {
            console.log('product expired and was deleted successful');
        })
      
        // Here you can add logic to remove the key from your storage (database, memory, etc.)
    }, 5 * 60 * 1000);
}

// authenticate active key 
const activatePos = async(req,res,next) => {
     const {name,code} = req.body;
     console.log(req.body);
}


module.exports = {companySetup,adminAccount,activatePos}