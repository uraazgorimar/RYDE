
const express = require('express');
const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', function(req,res) {
    res.sendFile(__dirname+"/homepage.html");
});

app.get('/viewProfile', function(req, res) {
  res.render('viewProfile.ejs');
});

app.listen(8000);
console.log("Server started successfully!");