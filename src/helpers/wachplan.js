'use strict';
var exports = module.exports = {};
var mongoose = require("mongoose");

var monthNamesDe = {
    'Januar': "January",
    'Februar': "February",
    'März': "March",
    'April': "April",
    'Mai': "May",
    'Juni': "June",
    'Juli': "July",
    'August': "August",
    'September': "September",
    'Oktober': "October",
    'November': "November",
    'Dezember': "December"
}


var Wachtag = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    date: Date,
    team: {
        wl: {
            name: String,
            userId: mongoose.Schema.Types.ObjectId,
            freeForChange: Boolean
        },
        bf: {
            name: String,
            userId: mongoose.Schema.Types.ObjectId,
            freeForChange: Boolean
        },
        wg0: {
            name: String,
            userId: mongoose.Schema.Types.ObjectId,
            freeForChange: Boolean
        },
        wg1: {
            name: String,
            userId: mongoose.Schema.Types.ObjectId,
            freeForChange: Boolean
        },
        wg2: {
            name: String,
            userId: mongoose.Schema.Types.ObjectId,
            freeForChange: Boolean
        },
        wg3: {
            name: String,
            userId: mongoose.Schema.Types.ObjectId,
            freeForChange: Boolean
        },
        wh0: {
            name: String,
            userId: mongoose.Schema.Types.ObjectId,
            freeForChange: Boolean
        },
        wh1: {
            name: String,
            userId: mongoose.Schema.Types.ObjectId,
            freeForChange: Boolean
        }
    },
    meal: {
        name: String,
        admin: mongoose.Schema.Types.ObjectId
    }
});

var Wache = mongoose.createConnection("mongodb://wachanmeldungdb/Wache");

exports.createWachtag = function (date1, date2) {
    date1 = parseGermanDate(date1);
    date2 = parseGermanDate(date2);
    var now = new Date();
    if (date1 < now || date2 < now) {
        console.log("Das Datum liegt in der Vergangenheit!");
    } else {
        if (date1 < date2) {
            var dateArray = getDates(date1, date2);
            console.log("dateArray: " + dateArray);
            dateArray.forEach(function (current) {
                //console.log(current);
                writeToDB(current);
            });
        }
    }
}

function parseGermanDate(dateString) {
    try {
        var dayString = dateString.split(" ")[0];
        var monthString = dateString.split(" ")[1].split(",")[0];
        var yearString = dateString.split(" ")[2];
        //Date.parse(dateString, "yyyy-MM-dd HH:mm:ss");
        var fulldate = new Date(dayString + " " + monthNamesDe[monthString] + ", " + yearString);
        return fulldate;
    } catch (err) {
        try {
            var parts = dateString.match(/(\d+)/g);
            // note parts[1]-1
            return new Date(parts[2], parts[1] - 1, parts[0]);
        } catch (err) {
            //we fucked up
            return null
        }

    }
}

exports.applyUser = function (user, wants, startdate, enddate) {
    try {
        startdate = parseGermanDate(startdate);
        enddate = parseGermanDate(enddate);


    } catch (err) {

    }
    var now = new Date();
    if (startdate < now || (enddate < now && enddate != "")) {
        console.log("Das Datum ist nicht gültig!");
    } else {
        if (startdate < enddate) {
            //console.log(enddate=="");
            var dateArray = getDates(startdate, enddate);
            //console.log("dateArray: " + dateArray);
            dateArray.forEach(function (current) {
                //console.log(current);
                writeToDB1(user, wants, current);
            });
        }
        //console.log(startdate);
        //console.log(enddate);
        try {
            var endtime = enddate.getTime();
        } catch (err) {
            endtime = ""
        }
        if (startdate.getTime() == endtime || (enddate == "" && startdate != "")) {
            var dateArray = getDates(startdate, startdate);
            //console.log("fuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu!!");
            //console.log("dateArray: " + dateArray);
            dateArray.forEach(function (current) {
                //console.log(current);
                writeToDB1(user, wants, current);
            });

        }
    }

}

exports.getWachplanData = function (year, cb) {
    var Wachtage = Wache.model("year" + year, Wachtag, "year" + year);
    //console.log("year" + year);
    Wachtage.find({}, function (err, data) {
        //console.log("data: " + data);

        cb(data);
    })
}

function writeToDB1(user, wants, date) {
    var Wachtage = Wache.model("year" + String(date.getFullYear()), Wachtag, "year" + String(date.getFullYear()));
    console.log("date: " + date);
    Wachtage.findOne({
        'date': date
    }, function (err, dayToModify) {
        //console.log("dayToModify: " + dayToModify+ err);
        if (dayToModify == null) {
            console.log("dieser Tag exisitiert nicht.");
        } else {
            var dayToModify = prepareDbData(user, wants, dayToModify);
            dayToModify.save();

        }
    })

}

function prepareDbData(user, wants, dayToModify) {
    for (var key in dayToModify.team) {
        try {
            if (user._id.toString() == dayToModify.team[key].userId.toString()) {
                console.log("user kann nciht 2 positionen haben!")
                return dayToModify;
            }
        } catch (e) {

        }
    }

    dayToModify.team.wl = ((dayToModify.team.wl.name == null || dayToModify.team.wl.freeForChange) && wants == "Wl") ? (function (user) {
        if (user.isWl) {
            return {
                name: user.name,
                userId: user._id,
                freeForChange: false
            };
        } else {
            return dayToModify.team.bf;
        }
    })(user) : dayToModify.team.wl;
    //console.log(typeof dayToModify.team.wl.name);
    try {
        if (dayToModify.team.wl.userId == user._id) return dayToModify;
    } catch (err) {

    }
    dayToModify.team.bf = ((dayToModify.team.bf.name == null || dayToModify.team.bf.freeForChange) && wants == "Bf") ? (function (user) {
        if (user.isBf) {
            return {
                name: user.name,
                userId: user._id,
                freeForChange: false
            };
        } else {
            return dayToModify.team.bf
        }
    })(user) : dayToModify.team.bf;
    try {
        if (dayToModify.team.bf.userId == user._id) return dayToModify;
    } catch (err) {

    }
    dayToModify.team.wg0 = ((dayToModify.team.wg0.name == null || dayToModify.team.wg0.freeForChange) && wants == "Wg") ? (function (user) {
        if (user.state == "isWg") {
            return {
                name: user.name,
                userId: user._id,
                freeForChange: false
            };
        } else {
            return dayToModify.team.wg0
        }
    })(user) : dayToModify.team.wg0;
    try {
        if (dayToModify.team.wg0.userId == user._id) return dayToModify;
    } catch (err) {

    }
    dayToModify.team.wg1 = ((dayToModify.team.wg1.name == null || dayToModify.team.wg1.freeForChange) && wants == "Wg") ? (function (user) {
        if (user.state == "isWg") {
            return {
                name: user.name,
                userId: user._id,
                freeForChange: false
            };
        } else {
            return dayToModify.team.wg1
        }
    })(user) : dayToModify.team.wg1;
    try {
        if (dayToModify.team.wg1.userId == user._id) return dayToModify;
    } catch (err) {

    }
    dayToModify.team.wg2 = ((dayToModify.team.wg2.name == null || dayToModify.team.wg2.freeForChange) && wants == "Wg") ? (function (user) {
        if (user.state == "isWg") {
            return {
                name: user.name,
                userId: user._id,
                freeForChange: false
            };
        } else {
            return dayToModify.team.wg2
        }
    })(user) : dayToModify.team.wg2;
    try {
        if (dayToModify.team.wg2.userId == user._id) return dayToModify;
    } catch (err) {

    }
    dayToModify.team.wg3 = ((dayToModify.team.wg3.name == null || dayToModify.team.wg3.freeForChange) && wants == "Wg") ? (function (user) {
        if (user.state == "isWg") {
            return {
                name: user.name,
                userId: user._id,
                freeForChange: false
            };
        } else {
            return dayToModify.team.wg3
        }
    })(user) : dayToModify.team.wg3;
    try {
        if (dayToModify.team.wg3.userId == user._id) return dayToModify;
    } catch (err) {

    }
    dayToModify.team.wh0 = ((dayToModify.team.wh0.name == null || dayToModify.team.wh0.freeForChange) && wants == "Wh") ? {
        name: user.name,
        userId: user._id,
        freeForChange: false
    } : dayToModify.team.wh0;
    try {
        if (dayToModify.team.wh0.userId == user._id) return dayToModify;
    } catch (err) {

    }
    dayToModify.team.wh1 = ((dayToModify.team.wh1.name == null || dayToModify.team.wh1.freeForChange) && wants == "Wh") ? {
        name: user.name,
        userId: user._id,
        freeForChange: false
    } : dayToModify.team.wh1;
    //console.log(returnData);
    return dayToModify;
}

function writeToDB(date) {
    console.log("date: " + date);

    Wache.collection("year" + String(date.getFullYear())).insert(

        {
            date: date,
            team: {
                wl: {
                    name: null,
                    userId: null,
                    freeForChange: null
                },
                bf: {
                    name: null,
                    userId: null,
                    freeForChange: null
                },
                wg0: {
                    name: null,
                    userId: null,
                    freeForChange: null
                },
                wg1: {
                    name: null,
                    userId: null,
                    freeForChange: null
                },
                wg2: {
                    name: null,
                    userId: null,
                    freeForChange: null
                },
                wg3: {
                    name: null,
                    userId: null,
                    freeForChange: null
                },
                wh0: {
                    name: null,
                    userId: null,
                    freeForChange: null
                },
                wh1: {
                    name: null,
                    userId: null,
                    freeForChange: null
                }
            },
            meal: {
                name: null,
                admin: null
            }
        });
}

exports.getFreePositions = function (cb) {
    var now = new Date();
    exports.getWachplanData(now.getFullYear(), function (allDays) {
        var freeDays = new Array();
        allDays.forEach(function (current, index) {
            if (current.date >= now) {
                //check if there are freeed positions on this Date
                for (var key in current.team) {
                    try {
                        //console.log(dayToModify.team[key].userId.toString()==user._id.toString());
                        if (current.team[key].freeForChange) {
                            freeDays.push({
                                'date': current.date,
                                'position': key,
                            });

                        }
                    } catch (e) {

                    }
                }
            }
        })
        console.log(freeDays);
        cb(freeDays);
    });


}

exports.freeDays = function (user, startdate, enddate) {
    try {
        startdate = parseGermanDate(startdate);
        enddate = parseGermanDate(enddate);


    } catch (err) {
        console.log("date parsing error!: " + err);

    }
    var now = new Date();
    if (startdate < now || (enddate < now && enddate != null)) {
        console.log("Das Datum ist nicht gültig");
    } else {
        if (startdate <= enddate && enddate != null) {
            var dateArray = getDates(startdate, enddate);
            //console.log("dateArray: " + dateArray);
            dateArray.forEach(function (current) {
                console.log(current);
                writeToDB2(user, current);
            });
        }
        if (startdate != "" && enddate == null) {
            var dateArray = getDates(startdate, startdate);
            //console.log("dateArray: " + dateArray);
            dateArray.forEach(function (current) {
                console.log(current);
                writeToDB2(user, current);
            });
        }
    }
}

function writeToDB2(user, date) {
    var Wachtage = Wache.model("year" + String(date.getFullYear()), Wachtag, "year" + String(date.getFullYear()));
    //console.log("date: " + date);
    Wachtage.findOne({
        'date': date
    }, function (err, dayToModify) {
        console.log("user._id: " + typeof user._id + " dayToModify.team.wl.userId: " + typeof dayToModify.team.wl.userId);
        for (var key in dayToModify.team) {
            try {
                //console.log(dayToModify.team[key].userId.toString()==user._id.toString());
                if (dayToModify.team[key].userId.toString() == user._id.toString()) {
                    dayToModify.team[key].freeForChange = true;
                }
            } catch (e) {

            }
        }
        dayToModify.save();
    })
}

Date.prototype.addDays = function (days) {
    var dat = new Date(this.valueOf())
    dat.setDate(dat.getDate() + days);
    return dat;
}

function getDates(startDate, stopDate) {
    var dateArray = new Array();
    var currentDate = startDate;
    while (currentDate <= stopDate) {
        dateArray.push(new Date(currentDate))
        currentDate = currentDate.addDays(1);
    }
    return dateArray;
}