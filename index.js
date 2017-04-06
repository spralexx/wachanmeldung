var express = require('express');
var session = require('express-session');
var flash = require('connect-flash');
var app = express();
const port = 3000; //port to listen on
var debugMode = 1; //boolean to enable debugmode
debugLog("debuglog Enabled");
var bodyParser = require('body-parser');
var passwordjs = require('./helpers/password')
var mongoose = require('mongoose');
var wachplanjs = require("./helpers/wachplan")
var json2csv = require('json2csv');
var initState = true;

var LocalUserSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    //    email: String,
    name: String,
    isadmin: Boolean,
    isWl: Boolean,
    isBf: Boolean,
    state: String,
    password: String,
    salt: Buffer
});
var dbconn = mongoose.createConnection("mongodb://127.0.0.1/Users"),
    Users = dbconn.model('userInfo', LocalUserSchema, 'userInfo');

Users.findOne({
    'isadmin': true
}, function(err, user) {
    //console.log(user);
    if (err) {
        debugLog("Error: " + err);
    }
    if (!user) {
        debugLog("no admin found! so initState=true");
        initState = true;
        return;
    }
    initState = false;
});


//require packages for authentication
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(function(username, password, done) {
    //debugLog("Username: " + username + ", Passwort: " + password);
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

        //debugLog("User.salt: " + user.salt);

        passwordjs.hash(password, user.salt, function(err, hash) {
            if (err) {
                debugLog("Error: " + err);
                return done(err);
            }
            //debugLog("Hashes: " + hash + "\n" + user.password);
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
    Users.findById(id, function(err, user) {
        if (err) {
            return cb(err);
        }
        cb(null, user);
    });
});
app.set('view engine', 'pug');
app.use(express.static('public'));
app.use(flash());
app.use(bodyParser());
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        maxAge: 3600000
    }
}));
// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());



// Define routes.
app.get('/',
    function(req, res) {
        if (req.isAuthenticated()) {
            //debugLog(new Date());
            switch (req.user.isadmin) {
                case true:
                    res.render("admin", {
                        pretty: true
                    });
                    break;
                default:
                    wachplanjs.getFreePositions(function(freeDays) {
                        debugLog("freeDays: " + freeDays)
                        res.render("user", {
                            freeDays,
                            pretty: true
                        });
                    })
            }
        } else {
            res.redirect("/login");

        }
    });

app.get('/returnFreeDays',
    function(req, res) {
        if (req.isAuthenticated()) {
            wachplanjs.getFreePositions(function(freeDays) {
                res.send(freeDays);
            })

        } else {
            res.redirect("/login");

        }
    });


app.get('/wachplandata',
    function(req, res) {
        if (req.isAuthenticated()) {
            var now = new Date();

            var wachplandata = wachplanjs.getWachplanData(now.getFullYear(), function(data) {
                var dataArray = new Array();
                data.forEach(function(current, index) {
                    dataArray.push({
                        "id": index + 1,
                        "name": "Wachtag",
                        "startdate": current.date,
                        "enddate": "",
                        "starttime": "10:00",
                        "endtime": "18:00",
                        "color": "blue",
                        "url": "",
                        "wl": current.team.wl.name,
                        "bf": current.team.bf.name,
                        "wg0": current.team.wg0.name,
                        //                        "wg1": current.team.wg1.name,
                        "wh0": current.team.wh0.name,
                        "wh1": current.team.wh1.name
                    })
                })
                dataJson = JSON.stringify(dataArray);
                dataJson = {
                        "monthly": JSON.parse(dataJson)
                    }
                    //debugLog(dataJson);
                res.send(dataJson);
            });
        } else {
            res.redirect("/login");
        };
    });

app.get('/wachplandownload',
    function(req, res) {
        if (req.isAuthenticated()) {
            var now = new Date();

            var wachplandata = wachplanjs.getWachplanData(now.getFullYear(), function(data) {
                var dataArray = new Array();
                data.forEach(function(current, index) {
                    dataArray.push({
                        "id": index + 1,
                        "startdate": function(date) {
                            var d = new Date();
                            d.setDate(date.getDate() - 1);
                            return d
                        }(current.date),
                        "wl": current.team.wl.name,
                        "bf": current.team.bf.name,
                        "wg0": current.team.wg0.name,
                        //                        "wg1": current.team.wg1.name,
                        "wh0": current.team.wh0.name,
                        "wh1": current.team.wh1.name
                    })
                })
                dataJson = JSON.stringify(dataArray);
                var fields = ['id', 'startdate', 'wl', 'bf', 'wg0', 'wh0', 'wh1'];

                try {
                    var result = json2csv({
                        data: dataArray,
                        del: ";"
                    });
                    console.log(result);
                    res.send(result);
                } catch (err) {
                    // Errors are thrown for bad options, or if the data is empty and no fields are provided.
                    // Be sure to provide fields if it is possible that your data array will be empty.
                    res.send(err);
                }
                //debugLog(dataJson);

            });
        } else {
            res.redirect("/login");
        };
    });

app.get('/login',
    function(req, res) {
        if (req.isAuthenticated()) {
            res.redirect("/");
        } else {
            res.render('login', {
                isNotLoggedin: true,
                pretty: true
            });
        }
    });


app.get('/logout',
    function(req, res) {
        if (req.isAuthenticated()) {
            req.logOut();
        }
        res.redirect("/login");
    });

app.post('/createwachtage',
    function(req, res) {
        if (req.isAuthenticated() && req.user.isadmin) {
            if (req.body.enddate && req.body.startdate) {
                wachplanjs.createWachtag(req.body.startdate, req.body.enddate);
            }
            res.redirect("/");
        } else {
            res.redirect("/login");
        };
    });
app.post('/applyforwache',
    function(req, res) {
        if (req.isAuthenticated()) {
            //process user application here
            if (req.body.startdate != "" && req.body.enddate != "") {
                wachplanjs.applyUser(req.user, req.body.startdate, req.body.enddate);
            }
            res.redirect("/");
        } else {
            res.redirect("/login");
        };
    });

app.post('/freeDays',
    function(req, res) {
        if (req.isAuthenticated()) {
            if (req.body.startdate != "" && req.body.enddate != "") {
                wachplanjs.freeDays(req.user, req.body.startdate, req.body.enddate)
            }
            res.redirect("/");
        } else {
            res.redirect("/login");
        };
    });

app.post('/login',
    passport.authenticate('local', {
        failureRedirect: '/login',
        successRedirect: '/',
        failureFlash: true // allow flash messages
    })
);

app.post('/register',
    function(req, res) {
        if (req.body.username == "" || req.body.password == "" || req.body.state == "") {
            //debugLog(req.body);
            res.redirect("/register");
            return;
        }
        debugLog(req.body);
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
                var state;
                if (initState) {
                    dbconn.collection("userInfo").insert({
                        //                        'email': req.body.email,
                        'name': username,
                        'isadmin': true,
                        'isWl': (req.body.isWl == "on") ? true : false,
                        'isBf': (req.body.isBf == "on") ? true : false,
                        'state': (req.body.isWl == "on" || req.body.isBf == "on") ? "isWg" : req.body.state,
                        'password': hash,
                        'salt': salt
                    });
                    initState = false;
                } else {
                    dbconn.collection("userInfo").insert({
                        //                        'email': req.body.email,
                        'name': username,
                        'isadmin': false,
                        'isWl': (req.body.isWl == "on") ? true : false,
                        'isBf': (req.body.isBf == "on") ? true : false,
                        'state': (req.body.isWl == "on" || req.body.isBf == "on") ? "isWg" : req.body.state,
                        'password': hash,
                        'salt': salt
                    })

                }
                res.redirect("/login");
            });
        })
    });

app.get('/register',
    function(req, res) {
        if (req.isAuthenticated()) {
            res.redirect("/");
        } else {
            res.render('register', {
                isNotLoggedin: true,
                pretty: true
            });
        }
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
