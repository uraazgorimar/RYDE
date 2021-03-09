
const express = require('express');
//const bodyParser = require("body-parser");
const ejs = require('ejs');
const app = express();
const mysql = require("mysql");
var email = 'def'
var con = mysql.createConnection({
  host: "localhost",
  user: "foo",
  password: "bar",
  database: "ryde",
  multipleStatements: true
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});


app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({
  extended: true
}));

app.get('/', function (req, res) {
  res.sendFile(__dirname + "/homepage.html");
});

app.get('/viewProfile', function (req, res) {
  con.query("SELECT * FROM user_info where Email='" + email + "';", function (err, result) {
    console.log(result);
    con.query("SELECT COUNT(*) AS Count FROM booking where Rentee_id='" + result[0].User_id + "';", function (err, countdrive) {
      console.log(countdrive);
      con.query("SELECT COUNT(*) AS rydes FROM booking where Owner_id='" + result[0].User_id + "';", function (err, countryde) {
        console.log(countdrive);
      res.render('viewProfile', { profile: result, countdrive:countdrive[0].Count, countrydes:countryde[0].rydes });
    });
  });
    
  });
});


app.get("/signInUp", function (req, res) {
  res.render("signInUp.ejs");

});


app.get('/list', function (req, res) {
  res.render("listing");
});

app.post("/list",function (req, res) {
  var user_id = 1;
  console.log(req.body);
  con.query("INSERT INTO car_list (User_id, Address, State, City, Zip, Year, Make, Model, Kmpl, No_of_doors, No_of_seats, Fuel_type, Trasmission, Description, Features, Car_img, Car_category) VALUES ('" + user_id + "','" + req.body.address + "','" + req.body.state + "','" + req.body.city + "','" + req.body.zip + "','" + req.body.year + "','" + req.body.make + "','" + req.body.model + "','" + req.body.kmpl + "','" + req.body.doors + "','" + req.body.seats + "','" + req.body.fuel + "','" + req.body.transmission + "','" + req.body.description + "','" + req.body.inlineCheckbox1 + "," + req.body.inlineCheckbox2 + "," + req.body.inlineCheckbox3 + "," + req.body.inlineCheckbox4 + "','" + req.body.rydePaps + "','" + req.body.category +"');", function (err, result) {
    console.log(result);
  });
});

app.get("/cars", function (req, res) {
  res.render("carsView");
});

app.listen(8000);
console.log("Server started successfully!");
