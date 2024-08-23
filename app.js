const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { required } = require('nodemon/lib/config');
const CryptoJS = require('crypto-js');


 const app = express();
 const upload = multer({ dest: 'uploads/' });
 app.use(express.static('public'));

 app.use(bodyParser.urlencoded({extended : true}));
 app.use(bodyParser.json()); // Add this to parse JSON data
// Import your pages route
const route = require('./routes/pages');
const db = require('./util/db');


// Use the pages route
app.use('/', route);

app.use(express.static('public'));
// middleware for json parsing
app.use(express.json());
//  set view engine
app.set('view engine','ejs');




//upload bulk products
app.post('/upload', upload.single('bulkFile'), (req, res) => {
    const filePath = req.file.path;
    const products = [];
    let isFirstRow = true;

    fs.createReadStream(filePath)
        .pipe(csv(['Name', 'Category', 'Buying_Price', 'Selling_Price', 'Wholesale_Price', 'Quantity','Expiry_Date']))
        .on('data', (row) => {
            if (isFirstRow) {
                isFirstRow = false; // Skip the first row, which contains the column names
                return;
            }
            products.push(row);
        })
        .on('end', () => {
            const query = 'INSERT INTO products (p_name, p_category, p_bp, p_sp, p_wp, p_quantity,expD) VALUES ?';
            const values = products.map(product => [
                product.Name,
                product.Category,
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
                res.send('<script>alert("File uploaded and data inserted successfully!")</script>');
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
        SELECT p_id, p_name, p_bp, p_sp, p_wp
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

// sales submission
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

    // Save the sale to the database
    const saleQuery = 'INSERT INTO dev_sales (comment, payment_type, payment_value) VALUES (?, ?, ?)';
    db.query(saleQuery, [comment, paymentType, paymentValue], (err, result) => {
        if (err) {
            console.error('Error inserting sale:', err);
            return res.status(500).send('Error inserting sale');
        }

        const saleId = result.insertId;
       
        // Prepare sales items data for insertion
        const salesItemsData = cartItems.map(item => [saleId, item.id, item.quantity, item.sp]);
            //  console.log(salesItemsData);
        // Check if salesItemsData has correct values
        if (salesItemsData.length === 0) {
            return res.status(400).send('No sales items to insert.');
        }

        // Insert cart items into the sales_items table
        const salesItemsQuery = 'INSERT INTO sales_items (sale_id, product_id, quantity, price) VALUES ?';
        db.query(salesItemsQuery, [salesItemsData], (err) => {
            if (err) {
                console.error('Error inserting sales items:', err);
             
        // db.query('UPDATE products SET p_quantity = ?'[],(err,rs)=>{

        // })
                return res.status(500).send('Error inserting sales items');
            }
//             db.query('SELECT * FROM products WHERE p_id = ?'[salesItemsData[1]],(err,rs)=>{
//                 console.log(rs);
//  })
            res.send('<script>alert("Sale and items successfully recorded")</script>');
           // res.send('Sale and items successfully recorded');
        });
    });
});

//reports
//WHERE s.date BETWEEN ? AND ?
app.get('/report', (req, res) => {
    const { startDate, endDate, type } = req.query;

    let query = '';
    switch (type) {
        case 'dailySales':
            query = `
                SELECT si.sale_id, p.p_name AS product, si.quantity, si.price, 
                       (si.quantity * si.price) AS total,s.payment_type AS payment_mode, s.date  
                FROM sales_items si
                JOIN products p ON si.product_id = p.p_id
                JOIN dev_sales s ON si.sale_id = s.id
                ;
            `;
            break;
        case 'paymentMode':
            query = `
                SELECT s.payment_type AS payment_mode, s.id AS transaction_id, 
                       s.payment_value AS amount, s.date
                FROM dev_sales s
               ;
            `;
            break;
        case 'stockRemaining':
            query = `
                SELECT p.p_name AS product, p.p_category AS category, 
                       p.p_quantity AS quantity_remaining, p.date AS last_restocked
                FROM products p
                JOIN p_categories c ON p.p_category = c.name
                
            `;
            break;
        case 'stockSold':
            query = `
                SELECT p.p_name AS product, c.name AS category, 
                       SUM(si.quantity) AS quantity_sold, s.date AS date_sold
                FROM sales_items si
                JOIN products p ON si.product_id = p.p_id
                JOIN p_categories c ON p.p_category = c.name
                JOIN dev_sales s ON si.sale_id = s.id
                
                GROUP BY p.p_name, c.name, s.date;
            `;
            break;
        default:
            res.status(400).send('Invalid report type');
            return;
    }

    db.query(query, [startDate, endDate], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            res.status(500).send('Internal server error');
            return;
        }
        res.json(results);
    });
});

// permit
app.get('/config', (req, res) => {
    const rolesQuery = 'SELECT DISTINCT role FROM d_roles';
    const permissionsQuery = 'SELECT permission FROM p WHERE department = ?';

    db.query(rolesQuery, (err, roles) => {
        if (err) throw err;

        let selectedRole = req.query.department || roles[0].role;
        db.query(permissionsQuery, [selectedRole], (err, existingPermissions) => {
            if (err) throw err;

            const permissions = {
                'Cashier': ['manageSales', 'viewReports', 'PrintReceipt'],
                'Manager': ['viewUsers', 'manageStock', 'editReports', 'manageSales', 'manageSuppliers', 'manageCustomers'],
                'Admin': ['viewUsers', 'deleteUsers', 'updateUsers', 'AddUsers', 'manageStock', 'editReports', 'manageSuppliers', 'manageCustomers'],
                'SuperAdmin': ['viewUsers', 'deleteUsers', 'updateUsers', 'AddUsers', 'manageStock', 'editReports', 'manageSales', 'viewReports', 'manageSuppliers', 'manageCustomers', 'configuration'],
                'Waiters': ['viewSales', 'PrintReceipt'],
                'Store Keeper': ['manageStock', 'viewStock'],
                'Chefs': ['viewStock', 'viewSales'],
                'Washers': ['viewStock', 'manageSuppliers']
            };

            const selectedPermissions = existingPermissions.map(perm => perm.permission);

            res.render('config', {
                rls: roles,
                permissions,
                selectedRole,
                selectedPermissions
            });
        });
    });
});

// logout user
app.get('/logout',(req,res)=>{
   res.render('./home');
})









//  create server to listen to
app.listen(4002,()=>{
    console.log('access the site via http://localhost:4002');
});
