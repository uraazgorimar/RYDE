require('dotenv').config();
const express = require("express");
const nodemailer = require("nodemailer");
const ejs = require("ejs");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const session = require("express-session");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const multer = require("multer");
const _ = require('lodash');
const app = express();
var upload = multer({
  dest: "uploads/",
});

var instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ryde.noreply@gmail.com',
    pass: 'WeAreAMU'
  }
});
transporter.verify((error, success) => {
  if (error) {
    console.log(error);
  } else {
    console.log('Server is ready to take messages');
  }
});

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
    secret: process.env.SECRET,
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
  res.render("homepage", {
    Fname: req.session.Fname,
    loggedinUser: req.session.loggedinUser
  });

});

app.get('/viewProfile', function (req, res) {
  if (req.session.loggedinUser) {
    con.query("SELECT * FROM user_info where Email='" + req.session.Email + "';", function (err, result) {

      con.query("SELECT COUNT(*) AS Count FROM booking where Rentee_id='" + result[0].User_id + "';", function (err, countdrive) {

        con.query("SELECT COUNT(*) AS rydes FROM car_list where User_id='" + result[0].User_id + "';", function (err, countryde) {

          con.query("SELECT * from booking b left join car_list c on b.Car_id=c.Car_id where b.Rentee_id= '" + result[0].User_id + "';", function (err, history) {

            con.query("SELECT * from car_list where user_id='" + result[0].User_id + "';", function (err, carslisted) {

              con.query("SELECT * from user_reviews u left join user_info i on u.reviewer_id=i.user_id where reviewee_id='" + result[0].User_id + "';", function (err, reviews) {


                res.render('viewProfile', { Fname: req.session.Fname, loggedinUser: req.session.loggedinUser, profile: result, countdrive: countdrive[0].Count, countrydes: countryde[0].rydes, history: history, carslisted: carslisted, reviews: reviews });
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
  //console.log(req.file);
  var filename = req.file;
  if (typeof filename === 'undefined') {
    con.query("UPDATE user_info SET State='" + req.body.state + "',City='" + req.body.City + "',Zip='" + req.body.zip + "',user_description='" + req.body.description + "' WHERE Email='" + req.session.Email + "';", function (errors, result) {
      //console.log(errors);
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
  //console.log(req.body);

  con.query("INSERT INTO car_reviews (User_id, Review, Stars, Car_id) VALUES (" + req.body.u + ",'" + req.body.Review + "','" + req.body.rating + "'," + req.body.Car_id + ");", function (errors, result) {

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

                  res.render('userprofile', { Fname: req.session.Fname, loggedinUser: req.session.loggedinUser, profile: result, countdrive: countdrive[0].Count, countrydes: countryde[0].rydes, history: history, carslisted: carslisted, reviews: reviews, userid: userid });
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
    //console.log(result);
    res.redirect("/viewProfile");
  });
});


app.get("/signInUp", function (req, res) {
  if (!req.session.loggedinUser) {
    var msg = '';
    //console.log(req.session);
    res.render("signInUp", {
      alertMsgup: msg,
      alertMsgin: msg,
      Fname: req.session.Fname,
      loggedinUser: req.session.loggedinUser
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
      if(!_.isEmpty(data)){
        bcrypt.compare(Password, data[0].Password, function (err, result) {
          if (err) throw err;
          if (result === true) {
            req.session.loggedinUser = true;
            req.session.Email = Email;
            req.session.user_id = data[0].User_id;
            req.session.Fname = data[0].Fname;
            //console.log(req.session);
            res.redirect("/");
          } else {
            req.session.loggedinUser = false;
            res.render("signInUp", {
              alertMsgin: "Your password is wrong!",
              alertMsgup: '',
            });
          }
        })
      } else {
        req.session.loggedinUser = false;
        res.render("signInUp", {
          alertMsgin: "Email address is not registered!",
          alertMsgup: '',
        });
      }
      
    });
  }
});

app.post("/logout", upload.none(), function (req, res) {
  req.session.destroy(function (err) {
    if (err) throw err;
    res.clearCookie('seshbro')
    res.redirect('/')
  });
});
app.post("/cars", upload.none(), function (req, res) {
  var where=req.body.where;
  where=where.charAt(0).toUpperCase()+where.slice(1).toLowerCase();
  var days = "";
  var from = new Date(req.body.from);
  var until = new Date(req.body.until);
  const oneDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round(Math.abs((from - until) / oneDay));
  var weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  //(diffDays);
  if (diffDays > 6) {
    days = "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday";
  } else {
    days += weekday[from.getDay()];
    for (var i = 1; i < diffDays; i++) {
      days += "," + weekday[from.getDay() + i];
    }
  }
  //console.log(days);
  con.query("SELECT * FROM booking b RIGHT JOIN car_list c on b.Car_id = c.Car_id WHERE c.City = '" + where + "' AND c.Availability LIKE '%" + days + "%';", function (err, result) {
    //console.log(result);
    res.render("carsView", { cars: result, where: req.body.where, from: req.body.from, until: req.body.until, days: diffDays });
  });
});

app.get("/booking", function (req, res) {
  if (req.session.loggedinUser) {
    var carid = req.query.Car_id;

    con.query("SELECT Car_id, c.User_id, Address, c.State, c.City, c.Zip, Year, Make, Model, Kmpl, No_of_doors, No_of_seats, Fuel_type, Trasmission, Description, Features, Car_img, Car_category, Availability, Price, Fname, Lname, Email, Profile_photo, License, Verification, user_description, Mobile from car_list c LEFT JOIN user_info u ON c.User_id=u.User_id where Car_id=" + carid + ";", function (err, booking) {
      //console.log(err);
      con.query("SELECT * from car_reviews c LEFT JOIN user_info u ON c.User_id=u.User_id where Car_id='" + carid + "';", function (err, car_reviews) {
        con.query("SELECT round(avg(stars),1) as 'avg' from car_reviews where Car_id='" + carid + "';", function (err, car_stars) {
          con.query("SELECT * FROM user_info WHERE Email ='" + req.session.Email + "';", function (err, booking1) {
            res.render("booking", { Fname: req.session.Fname, loggedinUser: req.session.loggedinUser, booking: booking, car_reviews: car_reviews, car_stars: car_stars, booking1: booking1, from: req.query.from, until: req.query.until, days: req.query.days });
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
  var baseprice = 0;
  var deposit = 5000;
  var tax = 0.18;
  var from = new Date(req.body.from);
  var until = new Date(req.body.until);
  var hours = Math.abs(until - from) / 36e5;
  baseprice = hours*Number(req.body.hourprice);
  var totalprice = (baseprice*tax)+baseprice+deposit;
  totalprice = Math.round(totalprice);
  //console.log(totalprice);
  var aadhar='';
  var license='';
  if (_.isEmpty(req.files)){
    aadhar=req.body.aadhar1;
    license=req.body.license1;
  }
  else if (_.isEmpty(req.files.aadhar)){
    aadhar=req.body.aadhar1;
    license=req.files.license[0].filename;
  }
  else if (_.isEmpty(req.files.license)){
    aadhar=req.files.aadhar[0].filename;
    license=req.body.license1;
  }
  else if (!_.isEmpty(req.files)){
    aadhar = req.files.aadhar[0].filename;
    license = req.files.license[0].filename;
  }
  con.query("SELECT COUNT(Receipt_id) AS count FROM receipts;", function (errors, ress) {
  var options = {
    amount: totalprice*100,  // amount in the smallest currency unit
    currency: "INR",
    receipt: "order_rcptid_" + ress.count+1,
    payment_capture: '1'
  };
  con.query("UPDATE user_info SET License='" + license+ "',Verification='" + aadhar  + "',Mobile='" + req.body.mobile + "'WHERE Email='" + req.session.Email + "';", function (errors, result) {
    //console.log(result);
    instance.orders.create(options, function (err, order) {
      //console.log(order);
      res.redirect("/checkout/" + order.id + "/" + req.body.from + "/" + req.body.until + "/" + hours + "/" + req.body.hourprice + "/" + baseprice + "/" + deposit + "/" + tax + "/" + totalprice+ "/" + req.body.car_id);
    });
  });
});
});

app.get("/checkout/:orderid/:from/:until/:hours/:hourprice/:baseprice/:deposit/:tax/:totalprice/:carid", function (req, res) {
  //console.log(req.params);
  if (req.session.loggedinUser) {
  con.query("SELECT Make,Model,Car_img,User_id FROM car_list where Car_id ='" + req.params.carid + "';", function (err, car) {
    con.query("SELECT Fname,Lname,Email,Mobile FROM user_info where User_id ='" + req.session.user_id + "';", function (err, user){
      con.query("INSERT INTO booking (Owner_id, Rentee_id, Car_id, Date, Duration_hrs, Price, Return_date) VALUES ('" + car[0].User_id + "','" + req.session.user_id + "','" + req.params.carid + "','" + req.params.from + "','" + req.params.hours + "','" + req.params.totalprice + "','" + req.params.until + "');", function (err, result) {
        //console.log(err);
      res.render("checkout", {Fname: req.session.Fname, loggedinUser: req.session.loggedinUser, details: req.params, car:car, user:user, key: process.env.KEY_ID, bookingid:result.insertId});
    })
  });
});
  } else {
    res.redirect("/signinup");
  }
});
app.post("/checkout", upload.none(), function(req, res) {
  body = req.body.order_id + "|" + req.body.payment_id;

  var expectedSignature = crypto
    .createHmac("sha256", process.env.KEY_SECRET)
    .update(body.toString())
    .digest("hex");
  // console.log("sig" + req.body.signature);
  // console.log("sig" + expectedSignature);
  if (expectedSignature === req.body.signature) {
    con.query("INSERT INTO receipts (Order_id, Payment_id, Signature, Verified, Booking_id) VALUES ('" + req.body.order_id + "','" + req.body.payment_id + "','" + req.body.signature + "',1,'" + req.body.booking_id +"');", function (err, result) {
      con.query("UPDATE booking SET Paid=1 WHERE Booking_id=" + req.body.booking_id + ";", function (err, nothing) {
        //res.render("booked");
        con.query("SELECT *, DATE_FORMAT(Date,'%d-%m-%Y %H:%i') AS Date, DATE_FORMAT(Return_date,'%d-%m-%Y %H:%i') AS Return_date  FROM booking WHERE Booking_id=" + req.body.booking_id + ";", function (err, booking) {
          //console.log(err);
          con.query("SELECT Fname,Lname,Email,City,State,Zip,Mobile FROM user_info WHERE User_id=" + booking[0].Owner_id + ";", function (err, owner) {
            //console.log(err);
            var baseprice = booking[0].Price-(booking[0].Price*0.18)-5000;
            var hourprice = baseprice / booking[0].Duration_hrs;
            res.render("booked",{ Fname: req.session.Fname, loggedinUser: req.session.loggedinUser});
            con.query("SELECT Fname,Lname,Email,City,State,Zip,Mobile FROM user_info WHERE User_id=" + booking[0].Rentee_id + ";", function (err, rentee) {
              ejs.renderFile(__dirname + "/htmlEmail/index.ejs", { order_id: result.insertId, details: booking[0], user: owner[0], baseprice: baseprice, hourprice: hourprice }, function (err, data) {
                if (err) {
                  console.log(err);
                } else {
                  var mainOptions = {
                    from: 'ryde.noreply@gmail.com',
                    to: rentee[0].Email,
                    subject: 'Your RYDE is Booked!',
                    html: data,
                    attachments: [{
                      filename: 'image-2.png',
                      path: __dirname + '/htmlEmail/image-2.png',
                      cid: 'thebigtick'
                    }, {
                      filename: 'image-1.png',
                      path: __dirname + '/htmlEmail/image-1.png',
                      cid: 'rydelogo'
                    }]
                  };
                  //console.log("html data ======================>", mainOptions.html);
                  transporter.sendMail(mainOptions, function (err, info) {
                    if (err) {
                      console.log(err);
                    } else {
                      console.log('Message sent: ' + info.response);
                    }
                  });
                }
              });
              ejs.renderFile(__dirname + "/htmlEmail/index1.ejs", { order_id: result.insertId, details: booking[0], user: rentee[0], baseprice: baseprice, hourprice: hourprice }, function (err, data) {
                if (err) {
                  console.log(err);
                } else {
                  var mainOptions = {
                    from: 'ryde.noreply@gmail.com',
                    to: owner[0].Email,
                    subject: 'Your RYDE is Booked!',
                    html: data,
                    attachments: [{
                      filename: 'image-2.png',
                      path: __dirname + '/htmlEmail/image-2.png',
                      cid: 'thebigtick'
                    }, {
                      filename: 'image-1.png',
                      path: __dirname + '/htmlEmail/image-1.png',
                      cid: 'rydelogo'
                    }]
                  };
                  //console.log("html data ======================>", mainOptions.html);
                  transporter.sendMail(mainOptions, function (err, info) {
                    if (err) {
                      console.log(err);
                    } else {
                      console.log('Message sent: ' + info.response);
                    }
                  });
                }
              });
            });
            //res.render("email", {details: booking[0], user: users[0], baseprice: baseprice, hourprice:hourprice});
            // res.render("email", { details: booking[0], owner: users[0], rentee: users[1], baseprice: baseprice, hourprice: hourprice });
            
          });
        });
      });
    });
  } else {
    con.query("UPDATE booking SET Paid=0 WHERE Booking_id=" + req.body.booking_id + ";", function (err, result) {
    });
  }
});



app.get('/list', function (req, res) {
  if (req.session.loggedinUser) {
    res.render("listing",{Fname: req.session.Fname, loggedinUser: req.session.loggedinUser});
  } else {
    res.redirect("/signinup")
  }

});

app.post("/list", upload.array('rydePaps'), function (req, res) {
  var user_id = req.session.user_id;
  var images = "";
  var ogdesc = req.body.description;
  var description = ogdesc.replace("'", "\\'");
  for (let i = 0; i < req.files.length; i++) {
    images += req.files[i].filename + ",";
  }
  images = images.slice(0, -1)
  //console.log(req.body);
  //console.log(images);
  con.query("INSERT INTO car_list (User_id, Address, State, City, Zip, Year, Make, Model, Kmpl, No_of_doors, No_of_seats, Fuel_type, Trasmission, Description, Features, Car_img, Car_category, Availability, Price) VALUES ('" + user_id + "','" + req.body.address + "','" + req.body.state + "','" + req.body.city + "','" + req.body.zip + "','" + req.body.year + "','" + req.body.make + "','" + req.body.model + "','" + req.body.kmpl + "','" + req.body.doors + "','" + req.body.seats + "','" + req.body.fuel + "','" + req.body.transmission + "','" + description + "','" + req.body.features + "','" + images + "','" + req.body.category + "','" + req.body.availability + "','" + req.body.price + "');", function (err, result) {
    //console.log(err);
    res.redirect("/viewProfile");
  });
});

//
app.get('/editCar', function (req, res) {
  if (req.session.loggedinUser) {
    con.query("SELECT * FROM car_list where Car_id ='" + req.query.Car_id + "';", function (err, edit) {
      res.render("editCar", { Fname: req.session.Fname, loggedinUser: req.session.loggedinUser, edit: edit });
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
  //console.log(req.body);
  //console.log(images);
  con.query("SELECT Car_img from car_list where Car_id ='" + req.body.carid + "';", function (err, img) {
    //console.log(img);
    images += img[0].Car_img;
    //console.log(images);
    con.query("UPDATE car_list set User_id='" + user_id + "', Address='" + req.body.address + "',State='" + req.body.state + "',City='" + req.body.city + "',Zip='" + req.body.zip + "',Year='" + req.body.year + "',Make='" + req.body.make + "', Model='" + req.body.model + "',Kmpl='" + req.body.kmpl + "',No_of_doors='" + req.body.doors + "',No_of_seats='" + req.body.seats + "',Fuel_type='" + req.body.fuel + "',Trasmission='" + req.body.transmission + "',Description='" + req.body.description + "',Features='" + req.body.features + "',Car_img='" + images + "',Car_category='" + req.body.category + "',Availability='" + req.body.availability + "',Price='" + req.body.price + "' where Car_id='" + req.body.carid + "';", function (err, result) {
      res.redirect("/booking?Car_id=" + req.body.carid)
    });
  });
});

app.get("/booked", function (req, res) {
  if (req.session.loggedinUser) {
  res.render("booked",{Fname: req.session.Fname, loggedinUser: req.session.loggedinUser})
  } else {
    res.redirect("/signinup");
  }
});

//

app.post("/cars", upload.none(), function (req, res) {
  var where = req.body.where;
  where = where.charAt(0).toUpperCase() + where.slice(1).toLowerCase();
  var days = "";
  var dateArray = [];
  var from = new Date(req.body.from);
  var until = new Date(req.body.until);
  const oneDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round(Math.abs((from - until) / oneDay));
  var weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  //console.log(diffDays);
  if (diffDays > 6) {
    days = "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday";
  } else {
    days += weekday[from.getDay()];
    for (var i = 1; i < diffDays; i++) {
      days += "," + weekday[from.getDay() + i];
    }
  }
  var currentDate = from;
  while(currentDate <= until){
    dateArray.push(new Date(currentDate));
    currentDate = currentDate.addDays(1);
  };
  console.log(dateArray);
  //console.log(days);
  // con.query("SELECT * FROM booking b RIGHT JOIN car_list c on b.Car_id = c.Car_id WHERE c.City = '" + where + "' AND c.Availability LIKE '%" + days + "%' AND c.Ongoing = 0;", function (err, result) {
  //   console.log(result);
  //   res.render("carsView", { cars: result, where: req.body.where, from: req.body.from, until: req.body.until, days: diffDays });

  // });
  con.query("SELECT * FROM car_list WHERE City = '" + where + "' AND Availability LIKE '%" + days + "%';", function (err, result) {
    //console.log(result);
    res.render("carsView", { cars: result, where: req.body.where, from: req.body.from, until: req.body.until, days: diffDays });

  });
});
app.get("/cars", function (req, res) {
  if (req.session.loggedinUser) {
    var query = req.query.sort;
    //console.log(query);

  if (req.query.where !== '' && typeof (req.query.where) !== "undefined"){
    var where = req.query.where;
    where = where.charAt(0).toUpperCase() + where.slice(1).toLowerCase();
    var days = "";
    var dateArray = [];
    var dateArray1 = [];
    var datesAvailable =[];
    var cars = [];
    var from = new Date(req.query.from);
    var until = new Date(req.query.until);
    const oneDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round(Math.abs((from - until) / oneDay));
    var weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    //console.log(diffDays);
    if (diffDays > 6) {
      days = "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday";
    } else {
      days += weekday[from.getDay()];
      for (var i = 1; i < diffDays; i++) {
        days += "," + weekday[from.getDay() + i];
      }
    }
    var currentDate = from;
    //var currentTime = from.getTime
    while (currentDate <= until) {
      dateArray.push(String(new Date(currentDate)).slice(0,15));
      currentDate.setDate(currentDate.getDate() + 1);
    };
    //console.log(dateArray);
    if (req.query.category !== '' && typeof (req.query.category) !== "undefined") {

      if (query === "Default" || typeof (query) === "undefined") {

        con.query("SELECT * FROM booking b where ('"+req.query.from.slice(0,10)+"' <= DATE(b.Return_date)) and ('"+req.query.until.slice(0,10)+"' >= DATE(b.Date)) and ('"+req.query.from.slice(0,10)+"' <= DATE(b.Return_date)) and (DATE(b.Date) <= '"+req.query.until.slice(0,10)+"');", function (err, bookings) {
          if(_.isEmpty(bookings)){
            cars.push(0);
          } else {
            for (let i = 0; i < bookings.length; i++) {
              cars.push(bookings[i].Car_id);
            }
          }
          con.query("SELECT * FROM car_list WHERE Car_id not in (" + cars + ") AND Car_category='" + req.query.category + "' AND City = '" + where + "' AND Availability LIKE '%" + days + "%';", function (err, allcars) {
          //console.log(bookings);
          //console.log(allcars);
          res.render("carsView", { Fname: req.session.Fname, loggedinUser: req.session.loggedinUser, cars: allcars, where: where, from: req.query.from, until: req.query.until, days: days });
          });
        });
       
      } else if (query === "PriceHigh") {
        con.query("SELECT * FROM booking b where ('" + req.query.from.slice(0, 10) + "' <= DATE(b.Return_date)) and ('" + req.query.until.slice(0, 10) + "' >= DATE(b.Date)) and ('" + req.query.from.slice(0, 10) + "' <= DATE(b.Return_date)) and (DATE(b.Date) <= '" + req.query.until.slice(0, 10) + "');", function (err, bookings) {
          if (_.isEmpty(bookings)) {
            cars.push(0);
          } else {
            for (let i = 0; i < bookings.length; i++) {
              cars.push(bookings[i].Car_id);
            }
          }
          con.query("SELECT * FROM car_list WHERE Car_id not in (" + cars + ") AND Car_category='" + req.query.category + "' AND City = '" + where + "' AND Availability LIKE '%" + days + "%';", function (err, allcars) {
            //console.log(bookings);
            //console.log(allcars);
            res.render("carsView", { Fname: req.session.Fname, loggedinUser: req.session.loggedinUser, cars: allcars, where: where, from: req.query.from, until: req.query.until, days: days });
          });
        });
      } else if (query === "PriceLow") {
        con.query("SELECT * FROM booking b where ('" + req.query.from.slice(0, 10) + "' <= DATE(b.Return_date)) and ('" + req.query.until.slice(0, 10) + "' >= DATE(b.Date)) and ('" + req.query.from.slice(0, 10) + "' <= DATE(b.Return_date)) and (DATE(b.Date) <= '" + req.query.until.slice(0, 10) + "');", function (err, bookings) {
          if (_.isEmpty(bookings)) {
            cars.push(0);
          } else {
            for (let i = 0; i < bookings.length; i++) {
              cars.push(bookings[i].Car_id);
            }
          }
          con.query("SELECT * FROM car_list WHERE Car_id not in (" + cars + ") AND Car_category='" + req.query.category + "' AND City = '" + where + "' AND Availability LIKE '%" + days + "%';", function (err, allcars) {
            //console.log(bookings);
            //console.log(allcars);
            res.render("carsView", { Fname: req.session.Fname, loggedinUser: req.session.loggedinUser, cars: allcars, where: where, from: req.query.from, until: req.query.until, days: days });
          });
        });
      }
    } else {
      if (query === "Default" || typeof (query) === "undefined") {
        con.query("SELECT * FROM booking b where ('" + req.query.from.slice(0, 10) + "' <= DATE(b.Return_date)) and ('" + req.query.until.slice(0, 10) + "' >= DATE(b.Date)) and ('" + req.query.from.slice(0, 10) + "' <= DATE(b.Return_date)) and (DATE(b.Date) <= '" + req.query.until.slice(0, 10) + "');", function (err, bookings) {
          if (_.isEmpty(bookings)) {
            cars.push(0);
          } else {
            for (let i = 0; i < bookings.length; i++) {
              cars.push(bookings[i].Car_id);
            }
          }
          con.query("SELECT * FROM car_list WHERE Car_id not in (" + cars + ") AND City = '" + where + "' AND Availability LIKE '%" + days + "%';", function (err, allcars) {
            //console.log(bookings);
            //console.log(allcars);
            res.render("carsView", { Fname: req.session.Fname, loggedinUser: req.session.loggedinUser, cars: allcars, where: where, from: req.query.from, until: req.query.until, days: days });
          });
        });
      } else if (query === "PriceHigh") {
        con.query("SELECT * FROM booking b where ('" + req.query.from.slice(0, 10) + "' <= DATE(b.Return_date)) and ('" + req.query.until.slice(0, 10) + "' >= DATE(b.Date)) and ('" + req.query.from.slice(0, 10) + "' <= DATE(b.Return_date)) and (DATE(b.Date) <= '" + req.query.until.slice(0, 10) + "');", function (err, bookings) {
          if (_.isEmpty(bookings)) {
            cars.push(0);
          } else {
            for (let i = 0; i < bookings.length; i++) {
              cars.push(bookings[i].Car_id);
            }
          }
          con.query("SELECT * FROM car_list WHERE Car_id not in (" + cars + ") AND City = '" + where + "' AND Availability LIKE '%" + days + "%' ORDER BY Price DESC;", function (err, allcars) {
            //console.log(bookings);
            //console.log(allcars);
            res.render("carsView", { Fname: req.session.Fname, loggedinUser: req.session.loggedinUser, cars: allcars, where: where, from: req.query.from, until: req.query.until, days: days });
          });
        });
      } else if (query === "PriceLow") {
        con.query("SELECT * FROM booking b where ('" + req.query.from.slice(0, 10) + "' <= DATE(b.Return_date)) and ('" + req.query.until.slice(0, 10) + "' >= DATE(b.Date)) and ('" + req.query.from.slice(0, 10) + "' <= DATE(b.Return_date)) and (DATE(b.Date) <= '" + req.query.until.slice(0, 10) + "');", function (err, bookings) {
          if (_.isEmpty(bookings)) {
            cars.push(0);
          } else {
            for (let i = 0; i < bookings.length; i++) {
              cars.push(bookings[i].Car_id);
            }
          }
          con.query("SELECT * FROM car_list WHERE Car_id not in (" + cars + ") AND City = '" + where + "' AND Availability LIKE '%" + days + "%' ORDER BY Price ASC;", function (err, allcars) {
            //console.log(bookings);
            //console.log(allcars);
            res.render("carsView", { Fname: req.session.Fname, loggedinUser: req.session.loggedinUser, cars: allcars, where: where, from: req.query.from, until: req.query.until, days: days });
          });
        });
      }
    }
  } else {
    if (req.query.category !== '' && typeof (req.query.category) !== "undefined") {

      if (query === "Default" || typeof (query) === "undefined") {
        con.query("SELECT * FROM car_list where Car_category='" + req.query.category + "';", function (err, cars) {
          //console.log(cars);
          res.render("carsView", { Fname: req.session.Fname, loggedinUser: req.session.loggedinUser, cars: cars, where: "", from: "", until: "", days: "" });
        });
      } else if (query === "PriceHigh") {
        con.query("SELECT * FROM car_list where Car_category='" + req.query.category + "' ORDER BY Price DESC;", function (err, cars) {
          //console.log(cars);
          res.render("carsView", { Fname: req.session.Fname, loggedinUser: req.session.loggedinUser, cars: cars, where: "", from: "", until: "", days: "" });
        });
      } else if (query === "PriceLow") {
        con.query("SELECT * FROM car_list where Car_category='" + req.query.category + "' ORDER BY Price ASC;", function (err, cars) {
          //console.log(cars);
          res.render("carsView", { Fname: req.session.Fname, loggedinUser: req.session.loggedinUser, cars: cars, where: "", from: "", until: "", days: "" });
        });
      }
    } else {
      if (query === "Default" || typeof (query) === "undefined") {
        con.query("SELECT * FROM car_list;", function (err, cars) {
          //console.log(cars);
          res.render("carsView", { Fname: req.session.Fname, loggedinUser: req.session.loggedinUser, cars: cars, where: "", from: "", until: "", days: "" });
        });
      } else if (query === "PriceHigh") {
        con.query("SELECT * FROM car_list ORDER BY Price DESC;", function (err, cars) {
          //console.log(cars);
          res.render("carsView", {Fname: req.session.Fname, loggedinUser: req.session.loggedinUser, cars: cars, where: "", from: "", until: "", days: "" });
        });
      } else if (query === "PriceLow") {
        con.query("SELECT * FROM car_list ORDER BY Price ASC;", function (err, cars) {
          //console.log(cars);
          res.render("carsView", { Fname: req.session.Fname, loggedinUser: req.session.loggedinUser, cars: cars, where: "", from: "", until: "", days: "" });
        });
      }
    }
  }
 } else {
      res.redirect("/signinup");
    }
});


app.get("/learnmore", function (req, res) {
  res.render("learnMore", {
    Fname: req.session.Fname,
    loggedinUser: req.session.loggedinUser
  });
});

app.get("/admin/login", function (req, res) {
  if (!req.session.loggedinAdmin) {
  res.render("adminLogin" , {amsg: ''});
  } else {
    res.redirect("/admin/users");
  }
});

app.post("/alogin", upload.none(), function (req, res) {
  var result = false;
  var auser = req.body.ausername;
  var apass = req.body.apass;
  var sql = "SELECT * FROM admin WHERE Admin_name = ?";
  if (auser == '' || apass == '') {
    res.render("adminLogin", {
      amsg: "Please fill out all the fields ! "
    });
  } else {
    con.query(sql, [auser], function (err, data) {
      //console.log(data)
      if(_.isEmpty(data)){
        req.session.loggedinAdmin = false;
        res.render("adminLogin", {
          amsg: "Your Email Address is wrong",
        });
      }
      else if (apass === data[0].Admin_pass) {
        req.session.loggedinAdmin = true;
        res.redirect("/admin/cars");
        } else {
          req.session.loggedinAdmin = false;
          res.render("adminLogin", {
            amsg: "Your password is wrong",
          });
        }
      });
    };
});

app.get("/admin/users", function (req, res) {
  if (req.session.loggedinAdmin){
    con.query("SELECT * FROM user_info;", function (err, users) {
      res.render("admin", { users: users });
    })
  } else {
    res.redirect("/admin/login");
  }
});

app.post("/admin", upload.none(), function (req, res) {
  con.query("DELETE FROM user_info WHERE User_id='"+req.body.userid+"';", function (err,cars) {
    res.redirect("/admin/users")
  });
});
app.get("/admin/cars", function (req, res) {
  if (req.session.loggedinAdmin) {
  con.query("SELECT * FROM car_list;", function (err, carlist) {
  res.render("adminCars",{carlist:carlist});
});
  } else {
    res.redirect("/admin/login");
  }
});
app.post("/admincars", upload.none(), function (req, res) {
  con.query("DELETE FROM car_list WHERE Car_id='"+req.body.carid+"';", function (err,cars) {
    res.redirect("/admin/cars")
  });
});

app.get("/admin/bookings", function (req, res) {
  if (req.session.loggedinAdmin) {
  con.query("SELECT *, DATE_FORMAT(Date,'%d-%m-%Y %H:%i') AS Date, DATE_FORMAT(Return_date,'%d-%m-%Y %H:%i') AS Return_date FROM booking;", function (err, booking) {
  res.render("adminbooking",{booking:booking});
});
  } else {
    res.redirect("/admin/login");
  }
});

app.post("/adminbooking", upload.none(), function (req, res) {
  con.query("DELETE FROM booking WHERE Booking_id="+req.body.bookingid+";", function (err,cars) {
    res.redirect("/admin/bookings")
  });
});

app.post("/verifyVerification", upload.none(), function (req, res) {
  con.query("UPDATE user_info SET Verification_verified=1 WHERE User_id="+req.body.userid+";", function (err,cars) {
    res.redirect("/admin/users")
  });
});

app.post("/verifyLicense", upload.none(), function (req, res) {
  con.query("UPDATE user_info SET License_verified=1 WHERE User_id="+req.body.userid+";", function (err,cars) {
    res.redirect("/admin/users")
  });
});
PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log("Listening to requests on port", PORT);
});