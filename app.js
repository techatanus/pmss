const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { required } = require('nodemon/lib/config');
const CryptoJS = require('crypto-js');
const bcrypt = require("bcrypt");
const axios = require('axios');


 const app = express();
 const upload = multer({ dest: 'uploads/' });
 app.use(express.static('public'));

 app.use(bodyParser.urlencoded({extended : true}));
 app.use(bodyParser.json()); // Add this to parse JSON data
 
// Import your pages route
const route = require('./routes/pages');
const db = require('./util/db');
const { log } = require('console');


// Use the pages route
app.use('/', route);

app.use(express.static('public'));
// middleware for json parsing
app.use(express.json());
//  set view engine
app.set('view engine','ejs');



// profile
app.get('/profile',(req,res,next)=>{
    res.render('./profile')
})
//upload bulk products
app.post('/upload', upload.single('bulkFile'), (req, res) => {
    const filePath = req.file.path;
    const products = [];
    let isFirstRow = true;

    fs.createReadStream(filePath)
        .pipe(csv(['Name', 'Category','Supplier','Buying_Price', 'Selling_Price', 'Wholesale_Price', 'Quantity','Expiry_Date']))
        .on('data', (row) => {
            if (isFirstRow) {
                isFirstRow = false; // Skip the first row, which contains the column names
                return;
            }
            products.push(row);
        })
        .on('end', () => {
            const query = 'INSERT INTO products (p_name, p_category,p_suplier, p_bp, p_sp, p_wp, p_quantity,expD) VALUES ?';
            const values = products.map(product => [
                product.Name,
                product.Category,
                product.Supplier,
                product.Buying_Price,
                product.Selling_Price,
                product.Wholesale_Price,
                product.Quantity,
                product.Expiry_Date

            ]);
            
            console.log(values);
            
            db.query(query, [values], (err, result) => {
                if (err) {
                    console.error('Error inserting data:', err);
                    res.status(500).send('Error inserting data.');
                    return;
                }
                res.send(`
                <script>
                  alert("File uploaded and data inserted successfully!");
                  window.location.href = '/t';
                </script>
              `);
                  
                // res.send('<script>alert("File uploaded and data inserted successfully!")</script>');
            });
        })
        .on('error', (err) => {
            console.error('Error reading file:', err);
            res.status(500).send('Error reading file.');
        });
});


// salesAutosearch
app.get('/search-products', (req, res) => {
    const searchTerm = req.query.term;

    console.log('Search Term:', searchTerm);

    const query = `
        SELECT p_id, p_name, p_bp, p_sp, p_wp,p_quantity
        FROM products
        WHERE p_name LIKE ? LIMIT 10`;

    db.query(query, [`%${searchTerm}%`], (err, results) => {
        if (err) {
            console.error('Error fetching data:', err.stack);
            return res.status(500).json({ error: 'Failed to fetch data' });
        }

        console.log('Query Results:', results); // Log the results to see what is returned
        res.json(results);
    });
});

// view tenant details separately
app.get('/viewtenant',(req,res)=>{
    const id = req.params.id;
    console.log(id);
})


// Route to handle form submission
app.post('/submit-sale', (req, res) => {
    const { comment, paymentType, paymentValue, encryptedCartItems } = req.body;
    const encryptionKey = '3ncryption@key'; // Replace with your encryption key

    // Decrypt and parse the cart items
    let cartItems = [];
    if (encryptedCartItems) {
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedCartItems, encryptionKey);
            const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
            cartItems = JSON.parse(decryptedData);
        } catch (error) {
            console.error('Error parsing cart items:', error);
            return res.status(500).send('Error parsing cart items');
        }
    }

    // Check if cartItems array is empty
    if (cartItems.length === 0) {
        return res.status(400).send('No sales items to insert.');
    }

    // Check product quantities before proceeding with the sale
    const checkQuantityPromises = cartItems.map(item => {
        return new Promise((resolve, reject) => {
            const checkProductQuery = 'SELECT p_quantity FROM products WHERE p_id = ?';
            db.query(checkProductQuery, [item.id], (err, results) => {
                if (err) {
                    return reject(err);
                }
                const product = results[0];
                if (!product || product.p_quantity < item.quantity) {
                    return resolve({ isAvailable: false, productId: item.id });
                }
                resolve({ isAvailable: true });
            });
        });
    });

    Promise.all(checkQuantityPromises)
        .then(availabilityResults => {
            const unavailableProducts = availabilityResults.filter(result => !result.isAvailable);

            if (unavailableProducts.length > 0) {
                return res.status(400).send(`<script>alert("Some products are out of stock or have insufficient quantity. Please review your cart.")</script>`);
            }

            // Save the sale to the database
            const saleQuery = 'INSERT INTO dev_sales (comment, payment_type, payment_value) VALUES (?, ?, ?)';
            db.query(saleQuery, [comment, paymentType, paymentValue], (err, result) => {
                console.log(paymentValue);
                if (err) {
                    console.error('Error inserting sale:', err);
                    return res.status(500).send('Error inserting sale');
                }

                const saleId = result.insertId;

                // Prepare sales items data for insertion
                const salesItemsData = cartItems.map(item => [saleId, item.id, item.quantity, item.sp]);
             console.log(salesItemsData);
                // Insert cart items into the sales_items table
                const salesItemsQuery = 'INSERT INTO sales_items (sale_id, product_id, quantity, price) VALUES ?';
                db.query(salesItemsQuery, [salesItemsData], (err) => {
                    if (err) {
                        console.error('Error inserting sales items:', err);
                        return res.status(500).send('Error inserting sales items');
                    }

                    // Update the product quantities in the products table
                    cartItems.forEach(item => {
                        const updateProductQuery = 'UPDATE products SET p_quantity = p_quantity - ? WHERE p_id = ?';
                        db.query(updateProductQuery, [item.quantity, item.id], (err) => {
                            if (err) {
                                console.error('Error updating product quantity:', err);
                                return res.status(500).send('Error updating product quantity');
                            }
                        });
                    });

                  res.send(`
         <script>
         alert("Sale and items successfully recorded");
             window.location.href = '/sales';
              </script>
     `);

                });
            });
        })
        .catch(err => {
            console.error('Error checking product availability:', err);
            res.status(500).send('Error checking product availability');
        });
});


//reports
//WHERE s.date BETWEEN ? AND ?
app.get('/report', (req, res) => {
    const { startDate, endDate, type } = req.query;

    let query = '';
    switch (type) {
        case 'monthlyRental':
            query = `
            SELECT t.p_name AS tenant,  t.houseno,SUM(p.amount_paid) AS total_rent , MONTH(p.payment_date) AS month
            FROM payments p
            JOIN products t ON p.tenant_id = t.p_id
             GROUP BY t.p_name, month
            `;
            break;
        case 'rentalBalance':
            query = `
SELECT 
    t.p_name AS tenant,h.houseno,
    COALESCE(SUM(p.amount_paid), 0) AS total_paid,
    COALESCE(h.price - SUM(p.amount_paid), h.price) AS balance_due,t.date
FROM products t
JOIN houses h ON t.houseno = h.houseno AND t.category = h.category
LEFT JOIN payments p ON t.p_id = p.tenant_id
WHERE h.status IN (1, 2)
GROUP BY t.p_id, t.p_name, h.price;


            `;
            break;
        case 'vacantHouses':
            query = `
            SELECT h.houseno, h.category, h.description
            FROM houses h
            LEFT JOIN products t ON h.category = t.category
            WHERE h.status IN (0, 2)
            GROUP BY h.id;
            
            `;
            break;
        case 'totalPaymentsByTenant':
            query = `
   
        SELECT t.p_name AS tenant,  t.houseno,SUM(p.amount_paid) AS total_paid
       FROM payments p
        JOIN products t ON p.tenant_id = t.p_id
         GROUP BY t.p_name;
            `;
            break;
        case 'paymentHistory':
            query = `
            SELECT t.p_name AS tenant,p.amount_paid, p.payment_date FROM
          payments p
            JOIN products t ON trim(p.tenant_id) = trim(t.p_id)
            
            `;
            break;
        default:
            res.status(400).send('Invalid report type');
            return;
    }

    const queryParams = type === 'paymentHistory' ? [startDate] : [startDate, endDate];

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            res.status(500).send('Internal server error');
            return;
        }
        res.json(results);
    });
});

// handle rent payments
app.post('/pay', (req, res) => {
    const { category,invoice, amount } = req.body; // Assuming category holds tenant name and amount holds the payment amount

    // Fetch the tenant's details, including the rental rate and total paid (even if no payments exist)
    const tenantQuery = `
    SELECT t.p_id, t.p_name, h.houseno, h.price AS rental_rate, 
    COALESCE(p.amount_paid, 0) AS total_paid
FROM products t
JOIN houses h ON TRIM(t.houseno) = TRIM(h.houseno)
LEFT JOIN payments p ON t.p_id = p.tenant_id
WHERE t.p_name = ?
       GROUP BY t.p_id, h.houseno;
    `;

    db.query(tenantQuery, [category], (err, tenantResult) => {
        if (err) {
            console.error('Error fetching tenant details:', err);
            res.status(500).send('Internal server error');
            return;
        }

        // Ensure we got a tenant record, even if no payments have been made yet
        if (tenantResult.length === 0) {
            res.status(400).send('Tenant not found');
            return;
        }

        const tenant = tenantResult[0];
        const { rental_rate, total_paid } = tenant;

        // Calculate the new total paid if the new amount is added
        const newTotalPaid = total_paid + parseFloat(amount);

        // Check if the new total exceeds the rental rate
        if (newTotalPaid > rental_rate) {
            res.status(400).send(`Payment exceeds the rental rate. Maximum you can pay is: ${rental_rate - total_paid}`);
            return;
        }

        // If the payment is valid, insert the new payment
        const paymentInsertQuery = `
            INSERT INTO payments (tenant_id, house_id, amount_paid,invoice, payment_date)
            VALUES (?, ?, ?,?, NOW());
        `;

        db.query(paymentInsertQuery, [tenant.p_id, tenant.houseno, amount,invoice], (err, result) => {
            if (err) {
                console.error('Error inserting payment:', err);
                res.status(500).send('Internal server error');
                return;
            }

            // If the tenant has paid the full rental rate, prompt them to pay for the next month
            if (newTotalPaid === rental_rate) {
                res.status(200).send('Payment successful! The current rent is fully paid. You can now pay for the next month.');
            } else {
                res.status(200).send(`Payment successful! You have paid ${newTotalPaid} out of ${rental_rate}.`);
            }
        });
    });
});

// reset password
app.post("/update-password", async (req, res) => {
    const { name, pass, conpass } = req.body;
    

    if (!name || !pass || !conpass) {
        return res.status(400).json({ message: "Name, password, and confirm password are required" });
    }

    if (pass !== conpass) {
        return res.status(400).json({ message: "Passwords do not match" });
    }

    try {
        const hashedPassword = await bcrypt.hash(pass, 10);
        const sql = "UPDATE dev_users SET u_pass = ? WHERE u_name = ?";

        db.query(sql, [hashedPassword, name], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Database error" });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "User not found" });
            }

            res.render('./home')
        });
    } catch (error) {
        res.status(500).json({ message: "Error hashing password" });
    }
});
// permit
app.get('/config', (req, res) => {
    const rolesQuery = 'SELECT DISTINCT role FROM d_roles';
    const permissionsQuery = 'SELECT permission FROM d_access WHERE department = ?';

    db.query(rolesQuery, (err, roles) => {
        if (err) {
            console.error('Error fetching roles:', err);
            return res.status(500).send('Internal Server Error');
        }

        if (roles.length === 0) {
            return res.status(404).send('No roles found.');
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

            res.render('manage', {
                rls: roles,
                permissions,
                selectedRole,
                selectedPermissions
            });
        });
    });
});

// mpesa processing
const generateToken = async (req,res,next)=>{

    const consumerKey = "is5NBH6qKQ1QKwOS4qoSAFyMQzFZUq5Vl7q1JgVdGtZTadPB";
    const consumerSecret = "GhQNTPRkhn5evqlKhglsVvQjjSC9OwYntKheELUtnbGpaFqMy1NXArtFnwd4rGMO";

    const auth =  new Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
        "base64"
      );
  await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",{
     headers: {
             authorization : `Basic ${auth}`
     }
  }
  )
  .then((response)=>{
    console.log(response.data.access_token);
  let token = response.data.access_token;
    
  })
  .catch((err)=>{
    console.log(err);
    res.status(400).json(err.message);

  })

};
// Express route for handling form submission
app.post('/stk',generateToken, (req, res) => {
    const{phone,amount} = req.body

    async function sendStkPush() {
        // const token = await generateToken();
        const date = new Date();
        const timestamp =
        date.getFullYear() +
        ("0" + (date.getMonth() + 1)).slice(-2) +
        ("0" + date.getDate()).slice(-2) +
        ("0" + date.getHours()).slice(-2) +
        ("0" + date.getMinutes()).slice(-2) +
        ("0" + date.getSeconds()).slice(-2);
    
        //you can use momentjs to generate the same in one line 
   
        const shortCode =174379; //sandbox -174379
        const passkey = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
        
  
        const stk_password = new Buffer.from(shortCode + passkey + timestamp).toString(
              "base64"
            );
  
        //choose one depending on you development environment
        const url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        // const url = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      
        const headers = {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        };
      
        const requestBody = {
          "BusinessShortCode": shortCode,
          "Password": stk_password,
          "Timestamp": timestamp,
          "TransactionType": "CustomerPayBillOnline", //till "CustomerBuyGoodsOnline"
          "Amount": `${amount}`,
          "PartyA": `${phone}`,
          "PartyB": shortCode,
          "PhoneNumber": "254798741201",
          "CallBackURL": "https://yourwebsite.co.ke/callbackurl",
          "AccountReference": "account",
          "TransactionDesc": "test"
        };
      
        try {
          const response = await axios.post(url, requestBody, { headers });
          return response.data;
        } catch (error) {
          console.error(error);
        }
      }
});

// checkout tenants
// app.get("/checkout", (req, res) => {
//     const tenant_id = req.query.id;
//     console.log("Received Tenant ID:", tenant_id);

//     if (!tenant_id) {
//         return res.status(400).json({ message: "Tenant ID is required" });
//     }

//     // Ensure tenant_id is a valid integer
//     const tenantIdInt = parseInt(tenant_id, 10);
//     if (isNaN(tenantIdInt)) {
//         return res.status(400).json({ message: "Invalid Tenant ID format" });
//     }

//     // Get tenant details
//     db.query("SELECT houseno, category FROM products WHERE p_id = ?", [tenantIdInt], (err, result) => {
//         if (err) {
//             console.error("Error fetching tenant details:", err);
//             return res.status(500).json({ message: "Database query error", error: err.message });
//         }

//         console.log("Query Result:", result);

//         if (!result || result.length === 0) {
//             return res.status(404).json({ message: "Tenant not found in the database" });
//         }

//         const house_id = result[0].houseno;
//         const category = result[0].category;

//         console.log(`House ID: ${house_id}, Category: ${category}`);

//         // Update tenant status to 'vacated'
//         db.query("UPDATE products SET status = 'vacated' WHERE p_id = ?", [tenantIdInt], (err) => {
//             if (err) {
//                 console.error("Error updating tenant status:", err);
//                 return res.status(500).json({ message: "Failed to update tenant status", error: err.message });
//             }

//             // Update house status to 'vacant' (0)
//             db.query("UPDATE houses SET status = 0 WHERE houseno = ? AND category = ?", [house_id, category], (err) => {
//                 if (err) {
//                     console.error("Error updating house status:", err);
//                     return res.status(500).json({ message: "Failed to update house status", error: err.message });
//                 }

//                 res.status(200).json({ message: "Tenant checked out successfully" });
//             });
//         });
//     });
// });

app.get("/checkout", (req, res) => {
    const tenant_id = req.query.id;
    console.log("Received Tenant ID:", tenant_id);

    if (!tenant_id) {
        return res.status(400).json({ message: "Tenant ID is required" });
    }

    const tenantIdInt = parseInt(tenant_id, 10);
    if (isNaN(tenantIdInt)) {
        return res.status(400).json({ message: "Invalid Tenant ID format" });
    }

    // Get tenant details: house number & category
    db.query("SELECT houseno, category FROM products WHERE p_id = ?", [tenantIdInt], (err, result) => {
        if (err) {
            console.error("Error fetching tenant details:", err);
            return res.status(500).json({ message: "Database query error", error: err.message });
        }

        if (!result || result.length === 0) {
            return res.status(404).json({ message: "Tenant not found in the database" });
        }

        const house_id = result[0].houseno;
        const category = result[0].category;

        // Calculate total amount paid by the tenant
        db.query("SELECT SUM(amount_paid) AS total_paid FROM payments WHERE tenant_id = ?", [tenantIdInt], (err, paymentResult) => {
            if (err) {
                console.error("Error fetching payments:", err);
                return res.status(500).json({ message: "Error fetching payment details", error: err.message });
            }

            const totalPaid = paymentResult[0].total_paid || 0; // Default to 0 if no payments

            // Get the house price
            db.query("SELECT price FROM houses WHERE houseno = ? AND category = ?", [house_id, category], (err, houseResult) => {
                if (err) {
                    console.error("Error fetching house price:", err);
                    return res.status(500).json({ message: "Error fetching house details", error: err.message });
                }

                if (!houseResult || houseResult.length === 0) {
                    return res.status(404).json({ message: "House not found" });
                }

                const housePrice = houseResult[0].price;
                const balance = totalPaid - housePrice; // Calculate balance

                console.log(`Total Paid: ${totalPaid}, House Price: ${housePrice}, Balance: ${balance}`);

                // Check if the balance is negative
                if (balance < 0) {
                    return res.status(400).json({ message: "Tenant cannot be checked out due to outstanding rent balance" });
                }

                // Update tenant status to 'vacated'
                db.query("UPDATE products SET status = 'vacated' WHERE p_id = ?", [tenantIdInt], (err) => {
                    if (err) {
                        console.error("Error updating tenant status:", err);
                        return res.status(500).json({ message: "Failed to update tenant status", error: err.message });
                    }

                    // Update house status to 'vacant' (0)
                    db.query("UPDATE houses SET status = 2 WHERE houseno = ? AND category = ?", [house_id, category], (err) => {
                        if (err) {
                            console.error("Error updating house status:", err);
                            return res.status(500).json({ message: "Failed to update house status", error: err.message });
                        }

                        res.status(200).json({ message: "Tenant checked out successfully" });
                    });
                });
            });
        });
    });
});


// logout user
route.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/');
        }
        res.redirect('/');
    });
});










//  create server to listen to
app.listen(4003,()=>{
    console.log('access the site via http://localhost:4003');
});
