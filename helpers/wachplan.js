'use strict';
var exports = module.exports = {};
var mongoose = require("mongoose");


var Wachtag = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    date: Date,
    teamSize: Number,
    teamMember: [mongoose.Schema.Types.ObjectId],
    meal: {
        name: String,
        admin: mongoose.Schema.Types.ObjectId
    }
});

var Wache = mongoose.createConnection("mongodb://127.0.0.1/Wache");

exports.createWachtag = function(date, teamSize) {
    var now = new Date();
    if (date < now) {
        console.log("Das Datum liegt in der Vergangenheit!");
    } else {
        writeToDB(date, teamSize);
    }
}
exports.createWachtag = function(date1, date2, teamSize) {
    var now = new Date();
    if (date1 < now || date2 < now) {
        console.log("Das Datum liegt in der Vergangenheit!");
    } else {
        if (date1 < date2) {
            var dateArray = getDates(new Date(date1), new Date(date2));
            console.log("dateArray: " + dateArray);
            dateArray.forEach(function(current) {
                console.log(current);
                writeToDB(current, teamSize);
            });
        }
    }
}

exports.getWachplanData = function(year,cb) {
  var Wachtage = Wache.model("year"+year, Wachtag, "year"+year);
  console.log("year"+year);
    Wachtage.find({}, function(err, data) {
      console.log("data: "+data);
        cb(data);
    })
}

function writeToDB(date, teamSize) {
    Wache.collection("year"+String(date.getFullYear())).insert(

        {
            date: date,
            teamSize: teamSize,
            teamMember: [],
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
