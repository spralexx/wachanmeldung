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
        wl: mongoose.Schema.Types.ObjectId,
        bf: mongoose.Schema.Types.ObjectId,
        wg0: mongoose.Schema.Types.ObjectId,
        wg1: mongoose.Schema.Types.ObjectId,
        wh0: mongoose.Schema.Types.ObjectId,
        wh1: mongoose.Schema.Types.ObjectId
    },
    meal: {
        name: String,
        admin: mongoose.Schema.Types.ObjectId
    }
});

var Wache = mongoose.createConnection("mongodb://127.0.0.1/Wache");

exports.createWachtag = function(date1, date2) {
  date1=parseGermanDate(date1);
  date2=parseGermanDate(date2);
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

function parseGermanDate(dateString){
  var dayString=dateString.split(" ")[0];
  var monthString=dateString.split(" ")[1].split(",")[0];
  var yearString=dateString.split(" ")[2];
  //Date.parse(dateString, "yyyy-MM-dd HH:mm:ss");
  var fulldate= new Date(dayString+" "+monthNamesDe[monthString]+", "+yearString);
  return fulldate;
}

exports.applyUser = function(user, startdate, enddate) {
  startdate=parseGermanDate(startdate);
  enddate=parseGermanDate(enddate);
    var now = new Date();
    if (startdate < now || enddate < now) {
        console.log("Das Datum liegt in der Vergangenheit!");
    } else {
        if (startdate < enddate) {
            var dateArray = getDates(startdate, enddate);
            console.log("dateArray: " + dateArray);
            dateArray.forEach(function(current) {
                console.log(current);
                writeToDB1(user, current);
            });
        }
    }
}

exports.getWachplanData = function(year, cb) {
    var Wachtage = Wache.model("year" + year, Wachtag, "year" + year);
    //console.log("year" + year);
    Wachtage.find({}, function(err, data) {
        //console.log("data: " + data);
        cb(data);
    })
}

function writeToDB1(user, date) {
    var Wachtage = Wache.model("year" + String(date.getFullYear()), Wachtag, "year" + String(date.getFullYear()));
    //console.log("year" + year);
    Wachtage.find({
        'date': date.addDays(1)
    }, function(err, data) {
        console.log("day to modifie: " + data + "\nUser applied" + user);
    })

}

function writeToDB(date) {
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
