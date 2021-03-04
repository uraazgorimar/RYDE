
const express = require("express");
const app = express();

<<<<<<< Updated upstream
app.use(express.static('public'));
app.set('view engine', 'ejs');
=======
app.use(express.static(__dirname + "/public"));
>>>>>>> Stashed changes

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/homepage.html");
});

<<<<<<< Updated upstream
app.get('/viewProfile', function(req, res) {
  res.render('viewProfile.ejs');
=======
app.get("/bookingCar", function (req, res) {
  res.render("bookingCar");
});

app.get("/signInUp", function (req, res) {
  res.render("signInUp.ejs");
>>>>>>> Stashed changes
});

app.listen(8000);
console.log("Server started successfully!");
