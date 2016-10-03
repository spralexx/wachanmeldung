'use strict';
var exports = module.exports = {};
var mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1/Wache");

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

//var Wachtage = mongoose.model('userInfo', LocalUserSchema, 'userInfo');
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
        if (date1 < data2) {
            var dateArray = getDates(date1, date2);
            dateArray.forEach(function(current) {
                writeToDB(current, teamSize);
            });
        }
    }
}

function writeToDB(date, teamSize) {
    var newWachtag = new Wachtag({
        date: date,
        teamSize: teamSize
    });
    newWachtag.save(function(err, newWachtag) {
        if (err) return console.error(err);
        console.log("Neuer Wachtag wurde angelegt:\n" + newWachtag);
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
