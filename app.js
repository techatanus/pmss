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
        .pipe(csv(['Name', 'Category', 'Buying_Price', 'Selling_Price', 'Wholesale_Price', 'Quantity']))
        .on('data', (row) => {
            if (isFirstRow) {
                isFirstRow = false; // Skip the first row, which contains the column names
                return;
            }
            products.push(row);
        })
        .on('end', () => {
            const query = 'INSERT INTO products (p_name, p_category, p_bp, p_sp, p_wp, p_quantity) VALUES ?';
            const values = products.map(product => [
                product.Name,
                product.Category,
                product.Buying_Price,
                product.Selling_Price,
                product.Wholesale_Price,
                product.Quantity
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
                return res.status(500).send('Error inserting sales items');
            }
            res.send('<script>alert("Sale and items successfully recorded")</script>');
           // res.send('Sale and items successfully recorded');
        });
    });
});

//reports
app.get('/report', (req, res) => {
    const { startDate, endDate, type } = req.query;

    let query = '';
    switch (type) {
        case 'dailySales':
            query = `
                SELECT si.sale_id, p.p_name AS product, si.quantity, si.price, 
                       (si.quantity * si.price) AS total, s.date 
                FROM sales_items si
                JOIN products p ON si.product_id =p.p_id
                JOIN dev_sales s ON si.sale_id = s.id
                WHERE s.date BETWEEN ? AND ?;
            `;
            break;
        case 'paymentMode':
            query = `
                SELECT s.payment_type AS payment_mode, s.id AS transaction_id, 
                       s.payment_value AS amount, s.date
                FROM dev_sales s
                WHERE s.date BETWEEN ? AND ?;
            `;
            break;
        case 'stockRemaining':
            query = `
                SELECT p.p_name AS product, c.name AS category, 
                       p.p_quantity AS quantity_remaining, p.date AS last_restocked
                FROM products p
                JOIN p_categories c ON p.p_category = c.id
                WHERE p.date BETWEEN ? AND ?;
            `;
            break;
        case 'stockSold':
            query = `
                SELECT p.p_name AS product, c.name AS category, 
                       SUM(si.quantity) AS quantity_sold, s.date AS date_sold
                FROM sales_items si
                JOIN products p ON si.product_id = p.p_sid
                JOIN p_categories c ON p.p_category = c.id
                JOIN dev_sales s ON si.sale_id = s.id
                WHERE s.date BETWEEN ? AND ?
                GROUP BY p.p_name, c.name, s.date;
            `;
            break;
        default:
            res.status(400).send('Invalid report type');
            return;
    }

    db.query(query, [startDate, endDate], (err, results) => {
        if (err) {
            throw err;
        }
        res.json(results);
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
