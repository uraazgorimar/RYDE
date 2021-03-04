
const express = require('express');
const bodyParser = require("body-parser");
const ejs = require('ejs');
const app = express();


app.use(express.static('public'));
app.set('view engine', 'ejs');


app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.get('/', function(req,res) {
    res.sendFile(__dirname+"/homepage.html");

app.get('/viewProfile', function(req, res) {
  res.render('viewProfile.ejs');

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/homepage.html");
});

app.get("/bookingCar", function (req, res) {
  res.render("bookingCar");
});

app.get("/signInUp", function (req, res) {
  res.render("signInUp.ejs");

});


app.get('/list', function (req, res) {
    res.render("listing");

app.listen(8000);
console.log("Server started successfully!");
