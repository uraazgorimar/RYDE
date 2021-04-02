require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const session = require("express-session");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const multer = require("multer");
var upload = multer({
  dest: "uploads/",
});

var instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});

const app = express();

var con = mysql.createConnection({
  host: process.env.HOSTNAME,
  user: process.env.USER,
  password: process.env.PASS,
  database: process.env.DB
});
con.connect(function (err) {
  if (err) throw err;
  console.log("Database is connected successfully !");
});


app.use(express.static('public'));
app.use('/resources', express.static(__dirname + '/uploads'));
app.set('view engine', 'ejs');


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
  res.render("homepage");
  console.log(req.session);
});



app.get('/viewProfile', function (req, res) {
  if (req.session.loggedinUser) {
    con.query("SELECT * FROM user_info where Email='" + req.session.Email + "';", function (err, result) {

      con.query("SELECT COUNT(*) AS Count FROM booking where Rentee_id='" + result[0].User_id + "';", function (err, countdrive) {

        con.query("SELECT COUNT(*) AS rydes FROM car_list where User_id='" + result[0].User_id + "';", function (err, countryde) {

          con.query("SELECT * from booking b left join car_list c on b.Car_id=c.Car_id where b.Rentee_id= '" + result[0].User_id + "';", function (err, history) {

            con.query("SELECT * from car_list where user_id='" + result[0].User_id + "';", function (err, carslisted) {

              con.query("SELECT * from user_reviews u left join user_info i on u.reviewer_id=i.user_id where reviewee_id='" + result[0].User_id + "';", function (err, reviews) {


                res.render('viewProfile', { profile: result, countdrive: countdrive[0].Count, countrydes: countryde[0].rydes, history: history, carslisted: carslisted, reviews: reviews });
              });
            });
          });
        });
      });
    });
  } else {
    res.redirect("/signinup");
  }
});


app.post("/viewProfile", upload.single('photo'), function (req, res) {
  console.log(req.file);
  var filename = req.file;
  if (typeof filename === 'undefined') {
    con.query("UPDATE user_info SET State='" + req.body.state + "',City='" + req.body.City + "',Zip='" + req.body.zip + "',user_description='" + req.body.description + "' WHERE Email='" + req.session.Email + "';", function (errors, result) {
      console.log(errors);
      res.redirect("/viewProfile");
    });
  }
  else {
    con.query("UPDATE user_info SET State='" + req.body.state + "',City='" + req.body.City + "',Zip='" + req.body.zip + "',Profile_photo='" + req.file.filename + "',user_description='" + req.body.description + "' WHERE Email='" + req.session.Email + "';", function (errors, result) {

      res.redirect("/viewProfile");
    });
  }


});

app.post('/viewReview', upload.none(), function (req, res) {
  console.log(req.body);

  con.query("INSERT INTO car_reviews (User_id, Review, Stars, Car_id) VALUES ('" + req.body.u + "','" + req.body.Review + "','" + req.body.rating + "','" + req.body.Car_id + "');", function (errors, result) {

    res.redirect("/viewProfile")
  });

});


//user profile
app.get('/userprofile', function (req, res) {
  if (req.session.loggedinUser) {
    con.query("SELECT * FROM user_info where User_id='" + req.query.User_id + "';", function (err, result) {

      con.query("SELECT COUNT(*) AS Count FROM booking where Rentee_id='" + result[0].User_id + "';", function (err, countdrive) {

        con.query("SELECT COUNT(*) AS rydes FROM car_list where User_id='" + result[0].User_id + "';", function (err, countryde) {

          con.query("SELECT * from booking b left join car_list c on b.Car_id=c.Car_id where b.Rentee_id= '" + result[0].User_id + "';", function (err, history) {

            con.query("SELECT * from car_list where user_id='" + result[0].User_id + "';", function (err, carslisted) {

              con.query("SELECT * from user_reviews u left join user_info i on u.reviewer_id=i.user_id where reviewee_id='" + result[0].User_id + "';", function (err, reviews) {

                con.query("SELECT User_id FROM user_info where Email='" + req.session.Email + "';", function (err, userid) {

                  res.render('userprofile', { profile: result, countdrive: countdrive[0].Count, countrydes: countryde[0].rydes, history: history, carslisted: carslisted, reviews: reviews, userid: userid });
                });
              });
            });
          });
        });
      });
    });
  } else {
    res.redirect("/signinup");
  }
});

app.post('/userprofile', upload.none(), function (req, res) {
  con.query("INSERT INTO user_reviews (Stars, Reviews, Reviewer_id, reviewee_id) VALUES ('" + req.body.rating + "','" + req.body.Review + "','" + req.body.reviewer + "','" + req.body.reviewee + "');", function (errors, result) {
    res.redirect('/userprofile?User_id=' + req.body.reviewee);

  });
});


var field = [{ name: 'aadhar', maxCount: 1 }, { name: 'license', maxCount: 1 }];
app.post("/verification", upload.fields(field), function (req, res) {
  con.query("UPDATE user_info SET License='" + req.files.aadhar[0].filename + "',Verification='" + req.files.license[0].filename + "'WHERE Email='" + req.session.Email + "';", function (errors, result) {
    console.log(result);
    res.redirect("/viewProfile");
  });
});





app.get("/signInUp", function (req, res) {
  if (!req.session.loggedinUser) {
    var msg = '';
    console.log(req.session);
    res.render("signInUp", {
      alertMsgup: msg,
      alertMsgin: msg
    });
  } else {
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
app.post("/cars", upload.none(), function (req, res) {
  var days = "";
  var from = new Date(req.body.from);
  var until = new Date(req.body.until);
  const oneDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round(Math.abs((from - until) / oneDay));
  var weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  console.log(diffDays);
  if (diffDays > 6) {
    days = "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday";
  } else {
    days += weekday[from.getDay()];
    for (var i = 1; i < diffDays; i++) {
      days += "," + weekday[from.getDay() + i];
    }
  }
  console.log(days);
  con.query("SELECT * FROM booking b RIGHT JOIN car_list c on b.Car_id = c.Car_id WHERE c.City = '" + req.body.where + "' AND c.Availability LIKE '%" + days + "%' AND c.Ongoing = 0;", function (err, result) {
    console.log(result);
    res.render("carsView", { cars: result, where: req.body.where, from: req.body.from, until: req.body.until, days: diffDays });

  });
});

app.get("/booking", function (req, res) {
  if (req.session.loggedinUser) {
    var carid = req.query.Car_id;

    con.query("SELECT Car_id, c.User_id, Address, c.State, c.City, c.Zip, Year, Make, Model, Kmpl, No_of_doors, No_of_seats, Fuel_type, Trasmission, Description, Features, Car_img, Car_category, Offers, Availability, Price, Fname, Lname, Email, Profile_photo, License, Verification, user_description, Mobile from car_list c LEFT JOIN user_info u ON c.User_id=u.User_id where Car_id='" + carid + "';", function (err, booking) {
      console.log(booking);
      con.query("SELECT * from car_reviews c LEFT JOIN user_info u ON c.User_id=u.User_id where Car_id='" + carid + "';", function (err, car_reviews) {
        con.query("SELECT round(avg(stars),1) as 'avg' from car_reviews where Car_id='" + carid + "';", function (err, car_stars) {
          con.query("SELECT * FROM user_info WHERE Email ='" + req.session.Email + "';", function (err, booking1) {
            res.render("booking", { booking: booking, car_reviews: car_reviews, car_stars: car_stars, booking1: booking1, from: req.query.from, until: req.query.until, days: req.query.days });
          });
        });
      });
    });
  } else {
    res.redirect("/signinup");
  }
});

var fields = [{ name: 'aadhar', maxCount: 1 }, { name: 'license', maxCount: 1 }];
app.post("/booking", upload.fields(fields), function (req, res) {
  con.query("UPDATE user_info SET License='" + req.files.aadhar[0].filename + "',Verification='" + req.files.license[0].filename + "',Mobile='" + req.body.mobile + "'WHERE Email='" + req.session.Email + "';", function (errors, result) {
    console.log(errors);
  })
})



app.get('/list', function (req, res) {
  if (req.session.loggedinUser) {
    res.render("listing");
  } else {
    res.redirect("/signinup")
  }

});

app.post("/list", upload.array('rydePaps'), function (req, res) {
  var user_id = req.session.user_id;
  var images = "";
  for (let i = 0; i < req.files.length; i++) {
    images += req.files[i].filename + ",";
  }
  images = images.slice(0, -1)
  console.log(req.body);
  console.log(images);
  con.query("INSERT INTO car_list (User_id, Address, State, City, Zip, Year, Make, Model, Kmpl, No_of_doors, No_of_seats, Fuel_type, Trasmission, Description, Features, Car_img, Car_category, Availability, Price) VALUES ('" + user_id + "','" + req.body.address + "','" + req.body.state + "','" + req.body.city + "','" + req.body.zip + "','" + req.body.year + "','" + req.body.make + "','" + req.body.model + "','" + req.body.kmpl + "','" + req.body.doors + "','" + req.body.seats + "','" + req.body.fuel + "','" + req.body.transmission + "','" + req.body.description + "','" + req.body.features + "','" + images + "','" + req.body.category + "','" + req.body.availability + "','" + req.body.price + "');", function (err, result) {
    console.log(err);
    res.redirect("/viewProfile");
  });
});

//
app.get('/editCar', function (req, res) {
  if (req.session.loggedinUser) {
    con.query("SELECT * FROM car_list where Car_id ='" + req.query.Car_id + "';", function (err, edit) {
      res.render("editCar", { edit: edit });
    });
  } else {
    res.redirect("/signinup");
  }
});
app.post("/editCar", upload.array('rydePaps'), function (req, res) {
  var user_id = req.session.user_id;
  var images = "";

  for (let i = 0; i < req.files.length; i++) {
    images += req.files[i].filename + ",";
  }
  images = images.slice(0, -1)
  console.log(req.body);
  console.log(images);
  con.query("SELECT Car_img from car_list where Car_id ='" + req.body.carid + "';", function (err, img) {
    console.log(img);
    images += img[0].Car_img;
    console.log(images);
    con.query("UPDATE car_list set User_id='" + user_id + "', Address='" + req.body.address + "',State='" + req.body.state + "',City='" + req.body.city + "',Zip='" + req.body.zip + "',Year='" + req.body.year + "',Make='" + req.body.make + "', Model='" + req.body.model + "',Kmpl='" + req.body.kmpl + "',No_of_doors='" + req.body.doors + "',No_of_seats='" + req.body.seats + "',Fuel_type='" + req.body.fuel + "',Trasmission='" + req.body.transmission + "',Description='" + req.body.description + "',Features='" + req.body.features + "',Car_img='" + images + "',Car_category='" + req.body.category + "',Availability='" + req.body.availability + "',Price='" + req.body.price + "' where Car_id='" + req.body.carid + "';", function (err, result) {
      res.redirect("/booking?Car_id=" + req.body.carid)
    });
  });
});
//
app.get("/cars", function (req, res) {
  if (req.session.loggedinUser) {
    var query = req.query.sort;
    console.log(query);
    if (query === "Popular" || typeof (query) === "undefined") {
      con.query("SELECT * FROM car_list;", function (err, cars) {
        //console.log(cars);
        res.render("carsView", { cars: cars, where: "", from: "", until: "", days: "" });
      });
    } else if (query === "PriceHigh") {
      con.query("SELECT * FROM car_list ORDER BY Price DESC;", function (err, cars) {
        //console.log(cars);
        res.render("carsView", { cars: cars, where: "", from: "", until: "", days: "" });
      });
    } else if (query === "PriceLow") {
      con.query("SELECT * FROM car_list ORDER BY Price ASC;", function (err, cars) {
        console.log(cars);
        res.render("carsView", { cars: cars, where: "", from: "", until: "", days: "" });
      });
    }
  } else {
    res.redirect("/signinup");
  }
});

app.get("/learnmore", function (req, res) {
  res.render("learnMore");
});

PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log("Listening to requests on port", PORT);
});