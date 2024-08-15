const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { required } = require('nodemon/lib/config');


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


// logout user
app.get('/logout',(req,res)=>{
   res.render('./home');
})









//  create server to listen to
app.listen(4002,()=>{
    console.log('access the site via http://localhost:4002');
});
