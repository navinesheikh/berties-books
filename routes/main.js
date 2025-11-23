// Import the express library and create a new router
const express = require("express");
const router = express.Router();

const bcrypt = require('bcrypt');
const saltRounds = 10;

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
router.post('/registered', function(req, res, next) {
  const username      = req.body.username;
  const first         = req.body.first;
  const last          = req.body.last;
  const email         = req.body.email;
  const plainPassword = req.body.password;

  //hash password
  bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
    if (err) {
      console.log(err);
      return res.send("Error hashing password");
    }

    //insert into users table
    const sql = `
      INSERT INTO users (username, firstName, lastName, email, hashedPassword)
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [username, first, last, email, hashedPassword];

    db.query(sql, values, function(err, result) {
      if (err) {
        console.log(err);
        return res.send("Error saving user");
      }

      //message
      res.send(
        'Hello ' + first + ' ' + last +
        ', you are now registered! We will email you at ' + email +
        '<br>Your password is: ' + plainPassword +
        '<br>Your hashed password is: ' + hashedPassword
      );
    });
  });
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

router.get('/users/list', (req, res) => {
    let sql = "SELECT username, firstName, lastName, email FROM users";

    db.query(sql, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error retrieving users: " + err.message);
        } else {
            let newData = Object.assign({}, shopData, { users: result });
            res.render('userslist.ejs', newData);
        }
    });
});

router.get('/users/audit', (req, res) => {
    const sql = "SELECT * FROM login_audit ORDER BY time DESC";

    db.query(sql, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error retrieving audit logs: " + err.message);
        } else {
            let newData = Object.assign({}, shopData, { logs: result });
            res.render('audit.ejs', newData);
        }
    });
});

router.get('/users/login', (req, res) => {
    res.render('login.ejs', shopData);
});

// Task B2: login with audit logging
router.post('/users/loggedin', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const sql = "SELECT hashedPassword FROM users WHERE username = ?";

    db.query(sql, [username], (err, rows) => {
        if (err) {
            console.log(err);
            return res.send("Database error while logging in");
        }

        if (rows.length === 0) {
            // No such user -> log failed attempt
            db.query("INSERT INTO login_audit (username, success) VALUES (?, 0)", [username]);
            return res.send("Login failed: wrong username or password");
        }

        const hashedPassword = rows[0].hashedPassword;

        bcrypt.compare(password, hashedPassword, (err, result) => {
            if (err) {
                console.log(err);
                return res.send("Error comparing passwords");
            }

            if (result === true) {
                // Password matches -> log success
                db.query("INSERT INTO login_audit (username, success) VALUES (?, 1)", [username]);
                res.send("Login successful! Welcome " + username);
            } else {
                // Wrong password -> log failure
                db.query("INSERT INTO login_audit (username, success) VALUES (?, 0)", [username]);
                res.send("Login failed: wrong username or password");
            }
        });
    });
});

// Export the router object to be used in index.js
module.exports = router;