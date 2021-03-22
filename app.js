const express = require("express");
const ejs = require("ejs");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const session = require("express-session");
var multer = require("multer");
var upload = multer({
  dest: "uploads/",
});

const router = express.Router();
var user_id = null;
var Password = '';
var email = '';
const app = express();
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "2002",
  database: "ryde",
});
con.connect(function (err) {
  if (err) throw err;
  console.log("Database is connected successfully !");
});

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({
  extended: true
}));

app.use(
  session({
    name: 'seshbro',
    resave: true,
    saveUninitialized: false,
    secret: 'issa secret',
    cookie: {
      maxAge: 1000 * 60 * 60 * 2,
      sameSite: true,
      secure: false,
    }
  }))

// const ifNotLoggedin = (req, res, next) => {
//   if (!req.session.loggedinUser) {
//     res.redirect("/signInUp");
//   }
//   next();

// };

// const ifLoggedin = (req, res, next) => {
//   if (req.session.loggedinUser) {
//     res.redirect("/");
//   }
//   next();
// };

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/homepage.html");
  console.log(req.session);
  console.log(req.session.loggedinUser);
});

app.get("/signInUp", function (req, res) {
  if(!req.session.loggedinUser){
    var msg = '';
    console.log(req.session);
    res.render("signInUp", {
      alertMsgup: msg,
      alertMsgin: msg
    });
  }
  else{
    res.redirect("/")
  }
 
});


app.post("/signup", upload.none(), function (req, res) {
  var msg = '';
  inputData = {
    Fname: req.body.firstname,
    Lname: req.body.lastname,
    Email: req.body.useremail,
    Password: req.body.userpass,
  };
  var re = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
  var ere = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  if (inputData.Fname == '' || inputData.Lname == '' || inputData.Email == '' || inputData.Password == '') {
    msg = "Please fill out all the fields ! ";
    res.render("signInUp", {
      alertMsgup: msg,
      alertMsgin: ''
    });
  } else if (!ere.test(inputData.Email)) {
    msg = "Please enter a valid email id !";
    res.render("signInUp", {
      alertMsgup: msg,
      alertMsgin: ''
    });
  } else if (!re.test(inputData.Password)) {
    msg = "Your password must be 8 characters or above!";
    res.render("signInUp", {
      alertMsgup: msg,
      alertMsgin: ''
    });
  } else {
    var sql = "SELECT * FROM user_info WHERE Email = ?";
    con.query(sql, [inputData.Email], function (err, data) {
      if (err) throw err;
      if (data.length > 1) {
        msg = inputData.Email + " is already taken ! ";
        res.render("signInUp", {
          alertMsgup: msg,
          alertMsgin: ''
        });
      } else {
        bcrypt.genSalt(10, function (err, salt) {
          bcrypt.hash(req.body.userpass, salt, function (err, hash) {
            var sql = "INSERT INTO user_info (Fname, Lname, Email, Password) VALUES ('" + req.body.firstname + "','" + req.body.lastname + "','" + req.body.useremail + "','" + hash + "')";
            con.query(sql, inputData, function (err, data) {
              if (err) throw err;
              msg = "You are successfully registered";
              res.render("signInUp", {
                alertMsgup: '',
                alertMsgin: msg

              });
            });
          })
        })
      }
    });
  }
});

app.post("/signin", upload.none(), function (req, res) {
  var result = false;
  var Email = req.body.useremail;
  var Password = req.body.userpass;
  var sql = "SELECT * FROM user_info WHERE Email = ?";
  if (Email == '' || Password == '') {
    msg = "Please fill out all the fields ! ";
    res.render("signInUp", {
      alertMsgup: '',
      alertMsgin: msg
    });
  } else {
    con.query(sql, [Email], function (err, data) {
      bcrypt.compare(Password, data[0].Password, function (err, result) {
        if (err) throw err;
        if (result === true) {
          req.session.loggedinUser = true;
          req.session.Email = Email;
          req.session.user_id = data[0].User_id;
          console.log(req.session);
          res.redirect("/");
        } else {
          req.session.loggedinUser = false;
          res.render("signInUp", {
            alertMsgin: "Your Email Address or password is wrong",
            alertMsgup: '',
          });
        }
      })
    });
  }
});


// app.post("/logout", upload.none(), function (req, res) {
//   req.session.destroy(function (err) {
//     if (err) throw err;
//     res.clearCookie(seshbro)
//     res.redirect('/')
//   })
// })


PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log("Listening to requests on port", PORT);
});