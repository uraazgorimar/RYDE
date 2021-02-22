// hey guys its me piss off
// heres our dbms project

const express = require('express');
const app = express();

app.use(express.static('public'));

app.get('/', function(req,res) {
    res.sendFile(__dirname+"/homepage.html");
});


app.get('/bookingCar', function (req, res) {
    res.render("views/bookingCar");
  });
app.listen(8000);
console.log("Server started successfully!");