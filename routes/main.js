// Import the express library and create a new router
const express = require("express");
const router = express.Router();

// Define the shop data to be used across templates
var shopData = { shopName: "Bertie's Books" };

// Route to render the home page
router.get('/', (req, res) => {
    res.render('index.ejs', shopData);
});

// Route to render the about page
router.get('/about', (req, res) => {
    res.render('about.ejs', shopData);
});

// Route to render the search form
router.get('/search', (req, res) => {
    res.render("search.ejs", shopData);
});

// Route to handle search functionality
router.post('/search-result', (req, res) => {
    let keyword = req.body.keyword;
    let sqlquery = "SELECT name, price FROM books WHERE name LIKE ?";
    let searchValue = `%${keyword}%`;
    
    db.query(sqlquery, [searchValue], (err, result) => {
        if (err) {
            res.status(500).send("Error occurred while searching: " + err.message);
        } else {
            let newData = Object.assign({}, shopData, { searchResults: result });
            res.render('searchresult.ejs', newData);
        }
    });
});

// Route to render the register form
router.get('/register', (req, res) => {
    res.render('register.ejs', shopData);                                                                     
});

// Route to handle user registration
router.post('/registered', (req, res) => {
    // Sending a registration confirmation message
    res.send(`Hello ${req.body.first} ${req.body.last}, you are now registered! 
              We will send an email to you at ${req.body.email}.`);
});

// Route to list all books
router.get('/list', (req, res) => {
    let sqlquery = "SELECT * FROM books"; // Query to retrieve all books

    db.query(sqlquery, (err, result) => {
        if (err) {
            res.status(500).send("Error occurred while retrieving books: " + err.message);
        } else {
            let newData = Object.assign({}, shopData, { availableBooks: result });
            res.render("list.ejs", newData);
        }
    });
});

// Route to render the add book form
router.get('/addbook', (req, res) => {
    res.render('addbook.ejs', shopData); // Include shopData for consistency
});

// Route to handle book addition
router.post('/bookadded', (req, res) => {
    let sqlquery = "INSERT INTO books (name, price) VALUES (?,?)"; // Query to insert a new book
    let newrecord = [req.body.name, req.body.price];
    
    db.query(sqlquery, newrecord, (err, result) => {
        if (err) {
            res.status(500).send("Error occurred while adding book: " + err.message);
        } else {
            res.render('bookadded.ejs', { name: req.body.name, price: req.body.price });
        }
    });
});

// Route to list bargain books (priced under £20)
router.get('/bargainbooks', (req, res) => {
    let sqlquery = "SELECT name, price FROM books WHERE price < 20"; // Query to retrieve bargain books

    db.query(sqlquery, (err, result) => {
        if (err) {
            res.status(500).send("Error occurred while retrieving bargain books: " + err.message);
        } else {
            let newData = Object.assign({}, shopData, { bargainBooks: result });
            res.render('bargainbooks.ejs', newData);
        }
    });
});

// Export the router object to be used in index.js
module.exports = router;