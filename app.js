const express = require('express');
const ejs = require('ejs');
const mysql = require("mysql");
const bcrypt = require('bcryptjs');
const cookiesesh = require('cookie-session');
var multer = require('multer');
var upload = multer({ dest: 'uploads/' });
const { body, validationResult } = require('express-validator');

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

app.use(cookiesesh({
  name:'session',
  keys: ['key1', 'key2'],
  maxAge: 3600 * 1000
}));

app.get('/', function (req, res) {
  res.sendFile(__dirname + "/homepage.html");
});

const ifNotLoggedin = (req, res, next) => {
  if(!req.session.isLoggedIn){
      return res.render('signInUp');
  }
  next();
}

const ifLoggedin = (req,res,next) => {
  if(req.session.isLoggedIn){
      return res.redirect('/viewProfile');
  }
  next();
}

/* app.get('/', ifNotLoggedin, (req,res,next) => {
  con.execute("SELECT `name` FROM `user_info` WHERE `User_id`=?",[req.session.User_id])
  .then(([rows]) => {
      res.render('homepage.html',{
          name:rows[0].name
      });
  });
  
}); */


app.post('/signup', ifLoggedin, 
[
  body('useremail','Invalid email address!').isEmail().custom((value) => {
      return con.execute('SELECT `Email` FROM `user_info` WHERE `Email`=?', [value])
      .then(([rows]) => {
          if(rows.length > 0){
              return Promise.reject('This E-mail already in use!');
          }
          return true;
      });
  }),
  body('fname','First name is Empty!').trim().not().isEmpty(),
  body('lname','Last name is Empty!').trim().not().isEmpty(),
  body('userpass','The password must be of minimum length 6 characters').trim().isLength({ min: 6 }),
],

(req,res,next) => {

  const validation_result = validationResult(req);
  const {fname, lname, userpass, useremail} = req.body;
  // IF validation_result HAS NO ERROR
  if(validation_result.isEmpty()){
      // password encryption (using bcryptjs)
      bcrypt.hash(userpass, 12).then((hash_pass) => {
          // INSERTING USER INTO DATABASE
          con.execute("INSERT INTO 'user_info'('Fname','Lname','email','password') VALUES(?,?,?,?)",[fname, lname,useremail, hash_pass])
          .then(result => {
              res.send('Account successfully created ! <a href="/">Login</a>');
          }).catch(err => {
              if (err) throw err;
          });
      })
      .catch(err => {
          if (err) throw err;
      })
  }
  else{
      let allErrors = validation_result.errors.map((error) => {
          return error.msg;
      });
      res.render('signInUp',{
          register_error:allErrors,
          old_data:req.body
      });
  }
});

app.post('/signin', ifLoggedin, [
  body('useremail').custom((value) => {
      return con.execute("SELECT 'Email' FROM 'user_info' WHERE 'email'=?", [value])
      .then(([rows]) => {
          if(rows.length == 1){
              return true;
              
          }
          return Promise.reject('Invalid Email Address!');
          
      });
  }),
  body('userpass','Password is empty!').trim().not().isEmpty(),
], (req, res) => {
  const validation_result = validationResult(req);
  const {userpass, useremail} = req.body;
  if(validation_result.isEmpty()){
      
      con.execute("SELECT * FROM 'user_info' WHERE 'email'=?",[useremail])
      .then(([rows]) => {
          bcrypt.compare(userpass, rows[0].password).then(compare_result => {
              if(compare_result === true){
                  req.session.isLoggedIn = true;
                  req.session.User_id = rows[0].User_id;
                  res.redirect('/');
              }
              else{
                  res.render('signInUp',{
                      login_errors:['Invalid Password!']
                  });
              }
          })
          .catch(err => {
              if (err) throw err;
          });


      }).catch(err => {
          if (err) throw err;
      });
  }
  else{
      let allErrors = validation_result.errors.map((error) => {
          return error.msg;
      });
      res.render('signInUp',{
          login_errors:allErrors
      });
  }
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
