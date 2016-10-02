var express = require('express');
var session = require('express-session');
var app = express();
const port = 3000; //port to listen on
var debugMode = 1; //boolean to enable debugmode
debugLog("debuglog Enabled");
var bodyParser = require('body-parser');
var passwordjs = require('./helpers/password')


var mongoose = require('mongoose');

mongoose.connect("mongodb://127.0.0.1/Users");
var LocalUserSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: String,
    name: String,
    password: String,
    salt: Buffer
});

var Users = mongoose.model('userInfo', LocalUserSchema, 'userInfo');

//require packages for authentication
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(function(username, password, done) {
    debugLog("Username: " + username + ", Passwort: " + password);
    Users.findOne({
        'name': username
    }, function(err, user) {
        console.log(user);
        if (err) {
            debugLog("Error: " + err);
            return done(err);
        }
        if (!user) {
            //debugLog("no user found: " + user);
            return done(null, false, {
                message: 'Incorrect username.'
            });
        }

        debugLog("User.salt: " + user.salt);

        passwordjs.hash(password, user.salt, function(err, hash) {
            if (err) {
                debugLog("Error: " + err);
                return done(err);
            }
            debugLog("Hashes: " + hash + "\n" + user.password);
            if (hash == user.password) {
                return done(null, user);
            }
            done(null, false, {
                message: 'Incorrect password.'
            });
        });


    });
}));


// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function(user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
    db.users.findById(id, function(err, user) {
        if (err) {
            return cb(err);
        }
        cb(null, user);
    });
});
app.set('view engine', 'pug');
app.use(bodyParser());
app.use(session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: true
        }
    }))
    // Initialize Passport and restore authentication state, if any, from the
    // session.
app.use(passport.initialize());
app.use(passport.session());

// Define routes.
app.get('/',
    function(req, res) {
        res.render('index');
    });

app.get('/login',
    function(req, res) {
        res.render('login');
    });

app.post('/login',
    passport.authenticate('local', {
        session: true,
        failureRedirect: '/login'
    }),
    function(req, res) {
        res.session();
        res.render("index");
    }
);

app.post('/register',
    function(req, res) {
        //register user here
        var username = req.body.username;
        debugLog("new registering: " + username);
        Users.findOne({
            'name': username
        }, function(err, user) {
            if (err) {
                debugLog(err);
                return;
            }
            if (user) {
                debugLog("User already exists!!")
                return;
            }
            passwordjs.hash(req.body.password, function(err, hash, salt) {
                if (err) {
                    debugLog(err);
                    return;
                }
                mongoose.connection.collection("userInfo").insert({
                    'email': req.body.email,
                    'name': username,
                    'password': hash,
                    'salt': salt
                })
                res.redirect("/login");
            });
        })
    });
app.get('/register',
    function(req, res) {
        res.render('register');
    });
app.get('/logout',
    function(req, res) {
        req.logout();
        res.redirect('/');
    });

app.listen(port, function() {
    debugLog("Listening on Port: " + port);
})

function debugLog(msg) {
    if (debugMode) {
        console.log(msg);
    }
}
