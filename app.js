const express = require('express');
const ejs = require('ejs');
const mysql = require("mysql");
var multer = require('multer');
var upload = multer({ dest: 'uploads/' });


const app = express();

var email = 'abc'
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "ryde",
  multipleStatements: true
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});


app.use(express.static('public'));
app.use('/resources',express.static(__dirname+'/uploads'));
app.set('view engine', 'ejs');


app.get('/', function (req, res) {
  res.sendFile(__dirname + "/homepage.html");
});



app.get('/viewProfile', function (req, res) {
  con.query("SELECT * FROM user_info where Email='" + email + "';", function (err, result) {
   
    con.query("SELECT COUNT(*) AS Count FROM booking where Rentee_id='" + result[0].User_id + "';", function (err, countdrive) {
    
      con.query("SELECT COUNT(*) AS rydes FROM booking where Owner_id='" + result[0].User_id + "';", function (err, countryde) {

        con.query("SELECT * from booking b left join car_list c on b.Car_id=c.Car_id where b.Rentee_id= '"+result[0].User_id + "';", function (err, history) {
          
          con.query("SELECT * from car_list where user_id='"+result[0].User_id + "';", function (err, carslisted) {

            con.query("SELECT * from user_reviews u left join user_info i on u.reviewer_id=i.user_id where reviewee_id='"+result[0].User_id + "';", function (err, reviews) {
              console.log(reviews);
          
        res.render('viewProfile', { profile: result, countdrive:countdrive[0].Count, countrydes:countryde[0].rydes, history:history, carslisted:carslisted, reviews:reviews });
      });
    });
    });
    });
    });
    });
  });


app.post("/viewProfile", upload.single('photo'), function (req, res) {
  console.log(req.file);
  var filename= req.file;
  if(typeof filename==='undefined') {
    con.query("UPDATE user_info SET State='"+req.body.state+"',City='"+req.body.City+"',Zip='"+req.body.zip+"',Description='"+req.body.description+"' WHERE Email='"+ email +"';",function (errors, result) {
      console.log(errors);
      res.redirect("/viewProfile");
    });
  }
  else {
    con.query("UPDATE user_info SET State='"+req.body.state+"',City='"+req.body.City+"',Zip='"+req.body.zip+"',Profile_photo='"+req.file.filename+"',Description='"+req.body.description+"' WHERE Email='"+ email +"';",function (errors, result) {
      console.log(errors);
      res.redirect("/viewProfile");
    });
  }
  
});
var field= [{name:'aadhar', maxCount:1},{name:'license',maxCount:1}];
app.post("/verification", upload.fields(field), function (req, res) {
  con.query("UPDATE user_info SET License='"+req.files.aadhar[0].filename+"',Verification='"+req.files.license[0].filename+"'WHERE Email='"+email+"';",function (errors, result) {
  console.log(result);
    res.redirect("/viewProfile");
  });
});





app.listen(8000);
console.log("Server started successfully!");
