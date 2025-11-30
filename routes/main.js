// Import the express library and create a new router
const express = require("express");
const router = express.Router();

const bcrypt = require('bcrypt');
const saltRounds = 10;

const { check, validationResult } = require('express-validator');

//Session-based access control
const redirectLogin = (req, res, next) => {
    if (!req.session.userId) {
        // Not logged in → go to login page
        res.redirect('/users/login');
    } else {
        // Logged in → carry on
        next();
    }
};

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
// Route to handle search functionality
router.post(
  '/search-result',
  [
    // keyword must be at least 2 characters
    check('keyword').trim().isLength({ min: 2 })
  ],
  (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // If invalid search term, just send back to search page
      return res.render("search.ejs", shopData);
    }

    // sanitise keyword to remove any HTML / scripts
    const keyword = req.sanitize(req.body.keyword);

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
  }
);

// Route to render the register form
router.get('/register', (req, res) => {
    res.render('register.ejs', shopData);                                                                     
});

// Route to handle user registration
router.post(
  '/registered',
  [
    // ✅ VALIDATION RULES
    check('email').isEmail(),                          // must be a real email
    check('username').isLength({ min: 5, max: 20 }),   // username 5–20 chars
    check('password').isLength({ min: 8 })             // password at least 8 chars
  ],
  function (req, res, next) {

    // ✅ CHECK FOR ERRORS
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // If there are validation errors, send back to register page
      return res.render('register.ejs', shopData);
    }

    // ✅ NO ERRORS → carry on as before
    const username      = req.sanitize(req.body.username);
    const first         = req.sanitize(req.body.first);
    const last          = req.sanitize(req.body.last);
    const email         = req.sanitize(req.body.email);
    const plainPassword = req.body.password;

    // hash password
    bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
      if (err) {
        console.log(err);
        return res.send("Error hashing password");
      }

      // insert into users table
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

        // message
        res.send(
          'Hello ' + first + ' ' + last +
          ', you are now registered! We will email you at ' + email +
          '<br>Your password is: ' + plainPassword +
          '<br>Your hashed password is: ' + hashedPassword
        );
      });
    });
  }
);

// Route to list all books
router.get('/list', redirectLogin, (req, res) => {
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
router.get('/addbook', redirectLogin, (req, res) => {
    res.render('addbook.ejs', shopData); // Include shopData for consistency
});

// Route to handle book addition
router.post(
  '/bookadded',
  redirectLogin,
  [
    // name must not be empty
    check('name').trim().isLength({ min: 1 }),
    // price must be a positive number
    check('price').isFloat({ min: 0.01 })
  ],
  (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // If invalid, send back to the add book form
      return res.render('addbook.ejs', shopData);
    }

    // sanitise inputs
    const name = req.sanitize(req.body.name);
    const price = req.sanitize(req.body.price);

    let sqlquery = "INSERT INTO books (name, price) VALUES (?, ?)";
    let newrecord = [name, price];
    
    db.query(sqlquery, newrecord, (err, result) => {
        if (err) {
            res.status(500).send("Error occurred while adding book: " + err.message);
        } else {
            res.render('bookadded.ejs', { name: name, price: price });
        }
    });
  }
);

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

router.get('/users/list', redirectLogin, (req, res) => {
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

router.get('/users/audit', redirectLogin, (req, res) => {
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
    const username = req.sanitize(req.body.username);
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

                // Save user session here, when login is successful
                req.session.userId = username;

                // Send them to the protected page
                res.redirect('/list');
            } else {
                // Wrong password -> log failure
                db.query("INSERT INTO login_audit (username, success) VALUES (?, 0)", [username]);
                res.send("Login failed: wrong username or password");
            }
        });
    });
});

// Logout route
router.get('/logout', redirectLogin, (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('./');
        }

        // Clear the cookie in the browser
        res.clearCookie('connect.sid');

        res.send('You are now logged out. <a href="./">Home</a>');
    });
});


// Export the router object to be used in index.js
module.exports = router;