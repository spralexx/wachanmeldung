const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const app = express();
const port = 3000; //port to listen on
const debugMode = 1; //boolean to enable debugmode
debugLog("debuglog Enabled");
const bodyParser = require('body-parser');
const passwordjs = require('./helpers/password')
const mongoose = require('mongoose');
const wachplanjs = require("./helpers/wachplan")
const json2csv = require('json2csv');
const MongoStore = require('connect-mongo');
const IBAN = require('iban');

var initState = true;

var LocalUserSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    //    email: String,
    name: String,
    iban: String,
    isadmin: Boolean,
    isWl: Boolean,
    isBf: Boolean,
    state: String,
    password: String,
    salt: Buffer
});
var dbconn = mongoose.createConnection("mongodb://wachanmeldungdb/Users"),
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
        //console.log(user);
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
var sessionStore = MongoStore.create({
    client: dbconn.getClient()
  });
  var sess = {
    store: sessionStore,
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      maxAge: 3600000
    }
  }
  app.use(session(sess));
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
                        var user = req.user;
                        res.render("user", {
                            freeDays,
                            user,
                            pretty: true
                        });
                    })
            }
        } else {
            res.redirect("/login");

        }
    });
app.get('/changepw',
    function(req, res) {
        if (req.isAuthenticated()) {
            //debugLog(new Date());
            switch (req.user.isadmin) {
                case true:
                    res.render("changepassword", {
                        pretty: true,
                        isadmin: true
                    });
                    break;
                default:
                    res.render("changepassword", {
                        pretty: true,
                        isadmin: false
                    });
            }
        } else {
            res.redirect("/login");

        }
    });

app.post('/changepw',
    function(req, res) {
        try {
            if (req.isAuthenticated() && req.user.isadmin) { //admin can change other pws
                if (req.body.newpw0 == req.body.newpw1) {
                    Users.findOne({
                        'name': req.body.username
                    }, function(err, user) {
                        if (err) {
                            debugLog(err);
                            return;
                        }
                        passwordjs.hash(req.body.newpw0, function(err, hash, salt) {
                            if (err) {
                                debugLog(err);
                                return;
                            }
                            user.password = hash;
                            user.salt = salt;
                            user.save();
                            res.render("notification", {
                                pretty: true,
                                msg: "Passwort erfolgreich geändert."
                            });
                            return;
                        });
                    });
                } else {
                    res.render("notification", {
                        pretty: true,
                        msg: "Die Passwörter stimmen nicht überein."
                    });
                    return;
                }
            } else if (req.isAuthenticated()) { //user changes own pw
                if (req.body.newpw0 != req.body.newpw1) {
                    res.render("notification", {
                        pretty: true,
                        msg: "Die Passwörter stimmen nicht überein."
                    });
                    return;
                } else {
                    Users.findOne({
                        'name': req.user.name
                    }, function(err, user) {
                        if (err) {
                            debugLog(err);
                            return;
                        }
                        debugLog(user);
                        passwordjs.hash(req.body.oldpw, user.salt, function(err, hash) { //get hash for old pw to compare it ith hash stored in db
                            if (err) {
                                debugLog(err);
                                return;
                            }
                            if (hash == user.password) { //if oldpw hash equals db pwhash we can change pw
                                passwordjs.hash(req.body.newpw0, function(err, hash, salt) {
                                    if (err) {
                                        debugLog(err);
                                        return;
                                    }
                                    user.password = hash;
                                    user.salt = salt;
                                    user.save();

                                    res.render("notification", {
                                        pretty: true,
                                        msg: "Passwort erfolgreich geändert."
                                    });
                                });
                            } else {
                                res.render("notification", {
                                    pretty: true,
                                    msg: "Dein altes Passwort stimmt nicht."
                                });
                                return;

                            }
                        });
                    });
                }
            }

        } catch (err) {
            res.render("notification", {
                pretty: true,
                msg: err
            });

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
                        "wg1": current.team.wg1.name,
                        "wg2": current.team.wg2.name,
                        "wg3": current.team.wg3.name,
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
                        "startdate": current.date,
                        "wl": current.team.wl.name,
                        "bf": current.team.bf.name,
                        "wg0": current.team.wg0.name,
                        "wg1": current.team.wg1.name,
                        "wg2": current.team.wg2.name,
                        "wg3": current.team.wg3.name,
                        "wh0": current.team.wh0.name,
                        "wh1": current.team.wh1.name
                    })
                })
                dataJson = JSON.stringify(dataArray);
                var fields = ['id', 'startdate', 'wl', 'bf', 'wg0','wg1','wg2','wg3', 'wh0', 'wh1'];

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
            //debugLog(req.body);
            /*
            if (req.body.startdate != "" && req.body.enddate != "") {
                wachplanjs.applyUser(req.user, req.body.wants, req.body.startdate, req.body.enddate);
            }
*/
            wachplanjs.applyUser(req.user, req.body.wants, req.body.startdate, req.body.enddate);
            res.render("notification", {
                pretty: true,
                msg: "Deine Anmeldung wurde entgegen genommen."
            });
            return;
        } else {
            res.redirect("/login");
        };
    });

app.post('/freeDays',
    function(req, res) {
        if (req.isAuthenticated()) {
/*
            if (req.body.startdate != "" && req.body.enddate != "") {
                wachplanjs.freeDays(req.user, req.body.startdate, req.body.enddate)
            }
*/
            wachplanjs.freeDays(req.user, req.body.startdate, req.body.enddate)

            res.render("notification", {
                pretty: true,
                msg: "Dein Anfrage wurde entgegen genommen."
            });
            return;
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
        if (req.body.username == "" || req.body.password == "" || req.body.state == "" || !IBAN.isValid(req.body.iban)) {
            //debugLog(req.body);
            if (!IBAN.isValid(req.body.iban)) {
                let taken = "Die eingegebene IBAN ist ungültig"
                res.render('register', {
                  taken,
                  isNotLoggedin: true,
                  pretty: true
                });
                return;
            }
            res.redirect("/register");
            return;
        }
        //debugLog(req.body);
        //register user here
        var username = req.body.username.trim();
        debugLog("new registering: " + username);
        Users.findOne({
            'name': username
        }, function(err, user) {
            if (err) {
                debugLog(err);
                return;
            }
            if (user) {
                debugLog("User already exists!!");
                var taken = "Der Benutzer exisitert bereits.";
                res.render('register', {
                    taken,
                    isNotLoggedin: true,
                    pretty: true
                });
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
                        'iban': req.body.iban,
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
                        'iban': req.body.iban,
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
