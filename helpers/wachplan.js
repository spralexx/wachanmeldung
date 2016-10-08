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
        wl: String,
        bf: String,
        wg0: String,
        wg1: String,
        wh0: String,
        wh1: String
    },
    meal: {
        name: String,
        admin: mongoose.Schema.Types.ObjectId
    }
});

var Wache = mongoose.createConnection("mongodb://127.0.0.1/Wache");

exports.createWachtag = function(date1, date2) {
    date1 = parseGermanDate(date1);
    date2 = parseGermanDate(date2);
    var now = new Date();
    if (date1 < now || date2 < now) {
        console.log("Das Datum liegt in der Vergangenheit!");
    } else {
        if (date1 < date2) {
            var dateArray = getDates(date1, date2);
            console.log("dateArray: " + dateArray);
            dateArray.forEach(function(current) {
                //console.log(current);
                writeToDB(current);
            });
        }
    }
}

function parseGermanDate(dateString) {
    var dayString = dateString.split(" ")[0];
    var monthString = dateString.split(" ")[1].split(",")[0];
    var yearString = dateString.split(" ")[2];
    //Date.parse(dateString, "yyyy-MM-dd HH:mm:ss");
    var fulldate = new Date(dayString + " " + monthNamesDe[monthString] + ", " + yearString);
    return fulldate;
}

exports.applyUser = function(user, startdate, enddate) {
    startdate = parseGermanDate(startdate);
    enddate = parseGermanDate(enddate);
    var now = new Date();
    if (startdate < now || enddate < now) {
        console.log("Das Datum liegt in der Vergangenheit!");
    } else {
        if (startdate < enddate) {
            var dateArray = getDates(startdate, enddate);
            //console.log("dateArray: " + dateArray);
            dateArray.forEach(function(current) {
                //console.log(current);
                writeToDB1(user, current);
            });
        }
    }
}

exports.getWachplanData = function(year, cb) {
    var Wachtage = Wache.model("year" + year, Wachtag, "year" + year);
    //console.log("year" + year);
    Wachtage.find({}, function(err, data) {
        console.log("data: " + data);

        cb(data);
    })
}

function writeToDB1(user, date) {
    var Wachtage = Wache.model("year" + String(date.getFullYear()), Wachtag, "year" + String(date.getFullYear()));
    console.log("date: " + date);
    Wachtage.findOne({
        'date': date.addDays(1)
    }, function(err, dayToModify) {
        var dayToModify = prepareDbData(user, dayToModify);
        dayToModify.save();
    })

}

function prepareDbData(user, dayToModify) {

    dayToModify.team.wl = (dayToModify.team.wl == null) ? (function(user) {
        if (user.isWl) {
            return user.name;
        } else {
            return null;
        }
    })(user) : dayToModify.team.wl;
    console.log(typeof dayToModify.team.wl);
try{
    if(dayToModify.team.wl.toString()==user.name.toString()) return dayToModify;
}
catch(err){

}
    dayToModify.team.bf = (dayToModify.team.bf == null) ? (function(user) {
        if (user.isBf) {
            return user.name;
        } else {
            return null;
        }
    })(user) : dayToModify.team.bf;
try{
    if(dayToModify.team.bf.toString()==user.name.toString()) return dayToModify;
}
catch(err){

}
    dayToModify.team.wg0 = (dayToModify.team.wg0 == null) ? (function(user) {
        if (user.state == "isWg") {
            return user.name;
        } else {
            return null;
        }
    })(user) : dayToModify.team.wg0;
try{
    if(dayToModify.team.wg0.toString()==user.name.toString()) return dayToModify;
}
catch(err){

}
    dayToModify.team.wg1 = (dayToModify.team.wg1 == null) ? (function(user) {
        if (user.state == "isWg") {
            return user.name;
        } else {
            return null;
        }
    })(user) : dayToModify.team.wg1;
try{
    if(dayToModify.team.wg1.toString()==user.name.toString()) return dayToModify;
}
catch(err){

}
    dayToModify.team.wh0 = (dayToModify.team.wh0 == null) ? user.name : dayToModify.team.wh0;
try{
    if(dayToModify.team.wh0.toString()==user.name.toString()) return dayToModify;
}
catch(err){

}
    dayToModify.team.wh1 = (dayToModify.team.wh1 == null) ? user.name : dayToModify.team.wh1;
    //console.log(returnData);
    return dayToModify;
}

function writeToDB(date) {
    console.log("date: " + date);

    Wache.collection("year" + String(date.getFullYear())).insert(

        {
            date: date.addDays(1),
            team: {
                wl: null,
                bf: null,
                wg0: null,
                wg1: null,
                wh0: null,
                wh1: null
            },
            meal: {
                name: null,
                admin: null
            }
        });
}

Date.prototype.addDays = function(days) {
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
