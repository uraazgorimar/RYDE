
const express = require('express');
const ejs = require('ejs');
const mysql = require("mysql");
var multer = require('multer');
var upload = multer({ dest: 'uploads/' });

const app = express();

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
// app.use(express.urlencoded({
//   extended: true
// }));

app.get('/', function (req, res) {
  res.sendFile(__dirname + "/homepage.html");
});

app.get('/viewProfile', function (req, res) {
  con.query("SELECT * FROM user_info where Email='" + email + "';", function (err, result) {
    //console.log(result);
    con.query("SELECT COUNT(*) AS Count FROM booking where Rentee_id='" + result[0].User_id + "';", function (err, countdrive) {
      //console.log(countdrive);
      con.query("SELECT COUNT(*) AS rydes FROM booking where Owner_id='" + result[0].User_id + "';", function (err, countryde) {
        //console.log(countryde);
        con.query("SELECT * FROM booking where Rentee_id='" + result[0].User_id + "';", function (err, history) {
          //console.log(history);
      res.render('viewProfile', { profile: result, countdrive:countdrive[0].Count, countrydes:countryde[0].rydes, history:history });
    });
  });
});  
  });
});

app.post("/viewProfile", upload.none(), function (req, res) {
  console.log(req.body.state +req.body.City +req.body.zip +req.body.photo +req.body.description);
  con.query("UPDATE user_info SET State='"+req.body.state+"',City='"+req.body.City+"',Zip='"+req.body.zip+"',Profile_photo='"+req.body.photo+"',Description='"+req.body.description+"' WHERE Email='"+ email +"';",function (errors, result) {
    console.log(result);
    res.redirect("/viewProfile");
  });
});


app.get("/signInUp", function (req, res) {
  res.render("signInUp.ejs");

});


app.get('/list', function (req, res) {
  res.render("listing");
});

app.post("/list", upload.array('rydePaps') ,function (req, res) {
  var user_id = 1;
  var images = "";
  var features = req.body.bluetooth + "," + req.body.airConditioner + "," + req.body.carplayAndroidAuto + "," + req.body.backupCamera;
  for(let i = 0; i < req.files.length; i++) {
    images += req.files[i].filename + ",";
  }
  images = images.slice(0,-1)
  console.log(req.body);
  console.log(images);
  con.query("INSERT INTO car_list (User_id, Address, State, City, Zip, Year, Make, Model, Kmpl, No_of_doors, No_of_seats, Fuel_type, Trasmission, Description, Features, Car_img, Car_category) VALUES ('" + user_id + "','" + req.body.address + "','" + req.body.state + "','" + req.body.city + "','" + req.body.zip + "','" + req.body.year + "','" + req.body.make + "','" + req.body.model + "','" + req.body.kmpl + "','" + req.body.doors + "','" + req.body.seats + "','" + req.body.fuel + "','" + req.body.transmission + "','" + req.body.description + "','"+ features +"','" + images + "','" + req.body.category +"');", function (err, result) {
    console.log(result);
  });
});

app.get("/cars", function (req, res) {
  res.render("carsView");
});

app.listen(8000);
console.log("Server started successfully!");
