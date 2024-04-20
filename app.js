const express = require('express');
const bodyParser = require('body-parser');
const { required } = require('nodemon/lib/config');


 const app = express();

 app.use(bodyParser.urlencoded({extended : true}));
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














//  create server to listen to
app.listen(4001,()=>{
    console.log('access the site via http://localhost:4001');
});