const express = require('express');
const myUser = require('../models/users_schema');
const paypal = require('paypal-rest-sdk');
const routers = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('../config/database');
const product = require('../models/product');
const reqProduct = require('../models/reqProduct');
const bookProduct = require('../models/bookProduct');
const mongoose = require('mongoose');
const bookReqProduct = require('../models/bookReqProduct');
mongoose.connect('mongodb://localhost:27017/renting_system');
var ObjectId = require('mongoose').Types.ObjectId; 
var MongoClient = require('mongodb').MongoClient,
assert = require('assert');
var cmd = require('node-cmd');

routers.post('/email', (req, res, next) => {
    // console.log(req);
    sender_email = req.body.sender_email;
    sender_pw = req.body.sender_pw;
    receiver_email = req.body.receiver_email;
    message = req.body.message;
    console.log(sender_email + " "+ sender_pw + " "+ receiver_email + " "+ message);
    var pyProcess = cmd.get('python ./routers/sendOTP.py ' + sender_email + ' ' + sender_pw + ' ' + receiver_email + ' ' + message ,
              function(data, err, stderr) {
                // console.log(data)
                // console.log("**********")
                // console.log(err)
                if (!err) {
                  console.log("data from python script " + data)
                } else {
                  console.log("python script cmd error: " + err)
                  }
                }
              );
    res.json({success:true, msg : 'OTP sent successfully\n'});
  });
  

routers.get('/chatroom/:room',(req,res,next)=>{

    MongoClient.connect('mongodb://localhost:27017/renting_system', function(err, db) {
        let chatRooms = db.db("renting_system").collection('chatRooms'); 
        
        let room = req.params.room;
        chatRooms.find({name: room}).toArray((err, chatroom) => {
        if(err) {
            console.log(err);
            return false;
        }
        res.json(chatroom[0].messages);
    });
    });
});

routers.post('/register',(req,res,next)=>{
    
    let newUser = new myUser({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        username: req.body.username,
        url: req.body.url,
        phoneNum: req.body.phoneNum
 }); 
 myUser.addUser(newUser,(err,myUser)=>{
        if(err){res.json({ success:true , msg:'failed to connect : '});}
        else{res.json({success:true ,msg:'connected succesfully '});
        }
    });
   
});

routers.get('/profile', passport.authenticate('jwt', {session:false}), (req, res, next) => {
    res.json({user: req.user});
});

routers.get('/getUsers',(req,res,next)=>{

    MongoClient.connect('mongodb://localhost:27017/renting_system', function(err, db) {
        var users = [];
        assert.equal(err, null);
        var db1 = db.db('renting_system');
            var cursor = db1.collection('users').find();
            cursor.forEach(
            function(doc) {
                users.push(doc);
             },
            function(err) {
                if(err) return err;
                db.close();
               res.json(users);
            }
        );
    });
});
    
routers.post('/authentication',(req,res,next)=>{
    const username = req.body.username;
    const password = req.body.password;
    // console.log("----")
    // console.log("Password: "+ password);
    myUser.getUserByUsername(username , (err,user)=>{
        if(err)throw err;
        if(!user)return res.json({success:false , msg:'user not found '});
        console.log("User.password: "+ user.password);
        myUser.comparePassword(password , user.password ,(err,isMatch)=>{
                if(err){
                    //console.log("vvvvvvvv");
                    throw err;}
                if(isMatch){
                    //console.log("/////");
                    const token =jwt.sign(user.toJSON(),config.secert,{
                        expiresIn :100000  //1 week 
                    });
                    res.json({success:true , msg:'user found in db ',token:'JWT '+token ,
                    user:{
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        username: user.username,
                        url: user.url
                    }
                });
                }
                else 
                {
                  return res.json({success:false ,msg:'incorrect password ..'});
                 }
        })
    })
  
});

routers.post('/addProduct',(req,res,next)=>{
    // console.log(req.body);
    const time = new Date();
    var day = req.body.edate;
    var monthIndex = req.body.emonth;
    var year = req.body.eyear;
    var tt = day+"-"+monthIndex+"-"+year;
    // var ttt = new Date(tt);
    var ttt  = new Date(year,monthIndex,day);
    console.log(tt+"           "+ttt+ "              "+ time);
    
    let newP = new product({
        owner_name: req.body.owner_name,
        owner_email: req.body.owner_email,
        product_name: req.body.name,
        price: req.body.price,
        discription: req.body.discription,
        ratting: req.body.ratting,
        location: {
            city: req.body.location.city,
            state: req.body.location.state
        },
        url: req.body.url,
        category: {
            main: req.body.category.main,
            sub: req.body.category.sub
        },
        payment : false,
        payment_type : false,
        ini_time: time,
        end_time: ttt,
        status : false

    });
    console.log(newP);
    newP.save((err)=>{
        if(err){res.json({success:false , msg:'there is some problem .'});
                console.log(err);        
        }
        else  res.json({success:true , msg:'product is successfully added .'});
    });
});
// *******************************************************************************************
// *****************************************************************************

// array of booking update status .........
routers.post('/paymentRecived',(req,res,next)=>{
    // console.log("update book products .....");
    var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://127.0.0.1:27017/";

    MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db('renting_system');
    console.log(req.body);
    var myquery = { 
        _id : new ObjectId(req.body.id),
        product_name : req.body.product_name,
    };
    
    var newvalues = { $set: {payment : true} };
    dbo.collection("product").updateOne(myquery, newvalues, function(err) {
            if (err) throw err;
                // console.log("1 document updated in product");
                if(err){
                    console.log(err);        
                    res.json({success:false , msg:'problem occurs during updating payment'});
                }
                else  res.json({success:true , msg:'Payment type updated  done successfully !'})
    });
        db.close();
    }); 
});

//  arrays of bookings.................
routers.post('/bookingProduct',(req,res)=>{
    console.log("booking of product");
    var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://127.0.0.1:27017/";

    MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db('renting_system');
    const time = new Date();
    var day = req.body.edate;
    var monthIndex = req.body.emonth;
    var year = req.body.eyear;
    var tt = monthIndex+"-"+day+"-"+year;
    var ttt = new Date(tt); 
    var timeDiff = Math.abs(time.getTime() - ttt.getTime());
    var diffDays_ = Math.ceil(timeDiff / (1000 * 3600 * 24));
    var myquery = { 
        _id : new ObjectId(req.body.id),
        product_name : req.body.product_name,
        // buyer_name : req.body.buyer_name,
        // owner_name : req.body.owner_name 
    };
    
    var addValue = {
        buyer_name : req.body.buyer_name,
        buyer_email: req.body.buyer_email,
        time : ttt,
        bookTime : time,
        duration : diffDays_,
        Sts : false
    }
    // console.log(myquery);
    // console.log(addValue);
 
    dbo.collection('product').update(myquery,{ $addToSet: {bookings: addValue}},(err,res_)=>{
        if(err){res.json({success:false , msg:'there is some problem in booking.'});
        console.log(err);        
        }       
        else  res.json({success:true , msg:'booking of a product is added in database'});
    });
        db.close();
    });
});

// array of booking update status .........
routers.post('/updateBookedProduct',(req,res,next)=>{
    console.log("update book products .....");
    var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://127.0.0.1:27017/";

    MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db('renting_system');
    console.log(req.body);
    var myquery = { 
        _id : new ObjectId(req.body.id),
        product_name : req.body.product_name,
    };
    
    var newvalues = { $set: {status : true} };
    dbo.collection("product").updateOne(myquery, newvalues, function(err) {
            if (err) throw err;
    });
    // { "bookings.buyer_name": req.body.buyer_name}
    dbo.collection("product").update(myquery,
        {$set: {"bookings.$[element].Sts": true}},
        {   multi: true,
            arrayFilters: [{"element.buyer_name": { $eq: req.body.buyer_name } }]
        },(err)=>{
                console.log()
                if (err) throw err;
                // console.log("1 document updated in product");
                if(err){
                    console.log(err);        
                    res.json({success:false , msg:'problem occurs during updating users status'});
                }
                else  res.json({success:true , msg:'Updating done successfully !'});

        });
        db.close();
    }); 
});



routers.post('/cancelBookedProduct',(req,res,next)=>{
    var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://127.0.0.1:27017/";

    MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db('renting_system');

    var myquery = { 
        _id : new ObjectId(req.body.id),
        product_name : req.body.product_name,
    };  
    var newvalues = { $set: {status : false} };
    dbo.collection("product").updateOne(myquery, newvalues, function(err) {
            if (err) throw err;
    });
    var newvalues2 =  { $set: {payment : false} }
    dbo.collection("product").updateOne(myquery,newvalues2,(err)=>{
            console.log("payment false ..........................");
            if(err) throw err;
    });
    var newQuery = {
        _id : new ObjectId(req.body.id),
        product_name : req.body.product_name
    }
    // db.bruno.update({"array.name": "Hello"}, {$set: {"array.$.value": "Change"}});
    dbo.collection("product").update(newQuery,
        {$set: {"bookings.$[].Sts": false}},(err)=>{
                if (err) throw err;
                console.log("1 document updated in product");
                if(err){res.json({success:false , msg:'there is some problem in booking.'});
                console.log(err);        
                }
                else  res.json({success:true , msg:'booking of a product is added in database'});

        });
        db.close();
    }); 
});


// ******************************************************************************
//  arrays of bookings.................
routers.post('/bookingReqProduct',(req,res)=>{

    // console.log("bookingReqProduct");
    // console.log(req.body);
    var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://127.0.0.1:27017/";

    const time = new Date();
    var day = req.body.edate;
    var monthIndex = req.body.emonth;
    var year = req.body.eyear;
    var tt = monthIndex+"-"+day+"-"+year;
    var ttt = new Date(tt); 
    var timeDiff = Math.abs(time.getTime() - ttt.getTime());
    var diffDays_ = Math.ceil(timeDiff / (1000 * 3600 * 24));
    MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db('renting_system');

    var myquery = { 
        _id : new ObjectId(req.body.id),
        product_name : req.body.product_name,
        // buyer_name : req.body.buyer_name,
        // owner_name : req.body.owner_name 
    };
    
    var addValue = {
        buyer_name : req.body.buyer_name,
        buyer_email: req.body.buyer_email,
        time : ttt,
        bookTime : time,
        duration : diffDays_,
        Sts : false
    }
    // console.log(myquery);
    // console.log(addValue);
 
    dbo.collection('reqProduct').update(myquery,{ $addToSet: {bookings: addValue}},(err,res_)=>{
        if(err){res.json({success:false , msg:'there is some problem in booking.'});
        console.log(err);        
        }       
        else  res.json({success:true , msg:'booking of a product is added in database'});
    });
        db.close();
    });
});

// array of booking update status .........
// routers.post('/updateBookingReqProduct',(req,res,next)=>{
//     var MongoClient = require('mongodb').MongoClient;
//     var url = "mongodb://127.0.0.1:27017/";

//     MongoClient.connect(url, function(err, db) {
//     if (err) throw err;
//     var dbo = db.db('renting_system');

//     var myquery = { 
//         _id : new ObjectId(req.body.id),
//         product_name : req.body.product_name,
//         // buyer_name : req.body.buyer_name,
//         // owner_name : req.body.owner_name 
//     };
    
//     var productQuery = {
//         product_name : req.body.product_name
//     }    
//     // console.log(productQuery);
//     var newvalues = { $set: {status : true} };
//     dbo.collection("reqProduct").updateOne(myquery, newvalues, function(err) {
//             if (err) throw err;
//     });

//     // db.bruno.update({"array.name": "Hello"}, {$set: {"array.$.value": "Change"}});
//     dbo.collection("reqProduct").update({"bookings.buyer_name": req.body.buyer_name},
//         {$set: {"bookings.$.Sts": true}},(err)=>{
//                 if (err) throw err;
//                 console.log("1 document updated in product");
//                 if(err){res.json({success:false , msg:'there is some problem in booking.'});
//                 console.log(err);        
//                 }
//                 else  res.json({success:true , msg:'booking of a product is added in database'});

//         });
//         db.close();
//     }); 
// });


// array of booking update status .........
routers.post('/updateBookingReqProduct',(req,res,next)=>{
    console.log("update book products .....");
    var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://127.0.0.1:27017/";

    MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db('renting_system');
    console.log(req.body);
    var myquery = { 
        _id : new ObjectId(req.body.id),
        product_name : req.body.product_name,
    };
    
    var newvalues = { $set: {status : true} };
    dbo.collection("reqProduct").updateOne(myquery, newvalues, function(err) {
            if (err) throw err;
    });
    // { "bookings.buyer_name": req.body.buyer_name}
    dbo.collection("reqProduct").update(myquery,
        {$set: {"bookings.$[element].Sts": true}},
        {   multi: true,
            arrayFilters: [{"element.buyer_name": { $eq: req.body.buyer_name } }]
        },(err)=>{
                console.log()
                if (err) throw err;
                // console.log("1 document updated in product");
                if(err){
                    console.log(err);        
                    res.json({success:false , msg:'problem occurs during updating users status'});
                }
                else  res.json({success:true , msg:'Updating done successfully !'});

        });
        db.close();
    }); 
});


routers.post('/cancelBookingReqProduct',(req,res,next)=>{
    console.log("canceling product ");
    var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://127.0.0.1:27017/";

    MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db('renting_system');

    var myquery = { 
        _id : new ObjectId(req.body.id),
        product_name : req.body.product_name,
        // buyer_name : req.body.buyer_name,
        // owner_name : req.body.owner_name 
    };
    
    var productQuery = {
        product_name : req.body.product_name
    }    
    // console.log(productQuery);
    var newvalues = { $set: {status : false} };
    dbo.collection("reqProduct").updateOne(myquery, newvalues, function(err) {
            if (err) throw err;
    });

    var newQuery = {
        _id : new ObjectId(req.body.id),
        product_name : req.body.product_name
    }
    // db.bruno.update({"array.name": "Hello"}, {$set: {"array.$.value": "Change"}});
    dbo.collection("reqProduct").update(newQuery,
        {$set: {"bookings.$[].Sts": false}},(err)=>{
                if (err) throw err;
                console.log("1 document updated in product");
                if(err){res.json({success:false , msg:'there is some problem in booking.'});
                console.log(err);        
                }
                else  res.json({success:true , msg:'booking of a product is added in database'});

        });
        db.close();
    }); 
});


// routers.post('/cancelBookingReqProduct',(req,res,next)=>{
//     var MongoClient = require('mongodb').MongoClient;
//     var url = "mongodb://127.0.0.1:27017/";

//     MongoClient.connect(url, function(err, db) {
//     if (err) throw err;
//     var dbo = db.db('renting_system');

//     var myquery = { 
//         _id : new ObjectId(req.body.id),
//         product_name : req.body.product_name,
//         // buyer_name : req.body.buyer_name,
//         // owner_name : req.body.owner_name 
//     };

//     console.log(myquery);
//     var newvalues = { $set: {status : false} };
//     dbo.collection("reqProduct").updateOne(myquery, newvalues, function(err) {
//             if (err) throw err;
//     });
//     console.log("done");
//     // db.bruno.update({"array.name": "Hello"}, {$set: {"array.$.value": "Change"}});
//     dbo.collection("reqProduct").update({"__v":"0"},
//         {$set: {"bookings.$.Sts": false}},(err)=>{
//                 if (err) throw err;
//                 // console.log("1 document updated in product");
//                 if(err){res.json({success:false , msg:'there is some problem in canceling.'});
//                 console.log(err);        
//                 }
//                 else  res.json({success:true , msg:'booking of a product is canceled in database'});

//         });
//         db.close();
//     }); 
// });
// **********************************************************************
//  *************************************************************************************
routers.get('/getBookProduct',(req,res,next)=>{

    MongoClient.connect('mongodb://localhost:27017/renting_system', function(err, db) {
        var users = [];
        assert.equal(err, null);
        var db1 = db.db('renting_system');
            var cursor = db1.collection('product').find();
            cursor.forEach(
            function(doc) {
                users.push(doc);
             },
            function(err) {
                if(err) return err;
                db.close();
               res.json(users);
            }
        );
    });
});


routers.post('/updateBookedReqProduct',(req,res,next)=>{
    var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://127.0.0.1:27017/";

    MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db('renting_system');

    var myquery = { 
        _id : new ObjectId(req.body.id),
        product_name : req.body.product_name,
        buyer_name : req.body.buyer_name,
        owner_name : req.body.owner_name };
    // console.log(myquery);
    var productQuery = {
        product_name : req.body.product_name
    }    
    var newvalues = { $set: {status : true} };
        dbo.collection("bookReqProduct").updateOne(myquery, newvalues, function(err, res_) {
            if (err) throw err;
        });
        dbo.collection("reqProduct").updateOne(productQuery, newvalues, function(err, res_) {
            if (err) throw err;
            console.log("1 document updated in product");
            if(err){res.json({success:false , msg:'there is some problem in booking.'});
            console.log(err);        
            }
            else  res.json({success:true , msg:'booking of a product is added in database'});
            // db.close();
        });
        db.close();
    }); 
});


routers.get('/getBookReqProduct',(req,res,next)=>{

    MongoClient.connect('mongodb://localhost:27017/renting_system', function(err, db) {
        var users = [];
        assert.equal(err, null);
        var db1 = db.db('renting_system');
            var cursor = db1.collection('bookReqProduct').find();
            cursor.forEach(
            function(doc) {
                users.push(doc);
             },
            function(err) {
                if(err) return err;
                db.close();
               res.json(users);
            }
        );
    });
});

routers.get('/getProduct',(req,res,next)=>{

    MongoClient.connect('mongodb://localhost:27017/renting_system', function(err, db) {
        var users = [];
        assert.equal(err, null);
        var db1 = db.db('renting_system');
            var cursor = db1.collection('product').find();
            cursor.forEach(
            function(doc) {
                users.push(doc);
             },
            function(err) {
                if(err) return err;
                db.close();
               res.json(users);
            }
        );
    });
});

routers.post('/addReqProduct',(req,res,next)=>{
    // console.log(req.body);
    console.log
    const time = new Date();
    var day = req.body.edate;
    var monthIndex = req.body.emonth;
    var year = req.body.eyear;
    var tt = day+"-"+monthIndex+"-"+year;
    var ttt = new Date(year,(monthIndex-1),day);    
    let newP = new reqProduct({
        owner_name: req.body.owner_name,
        owner_email: req.body.owner_email,
        product_name: req.body.name,
        exp_price: req.body.price,
        discription: req.body.discription,
        location: {
            city: req.body.location.city,
            state: req.body.location.state
        },
        category: {
            main: req.body.category.main,
            sub: req.body.category.sub
        },
        ini_time: time,
        end_time: ttt,
        status : 0,
        // price_by_other : 0,
        discription : req.body.discription,
        payment : false
        // lander_name : null

    });
    // console.log(newP);
    newP.save((err)=>{
        if(err){res.json({success:false , msg:'there is some problem .'});
                console.log(err);        
        }
        else  res.json({success:true , msg:'product is successfully added .'});
    });
});


routers.get('/getReqProduct',(req,res,next)=>{

    MongoClient.connect('mongodb://localhost:27017/renting_system', function(err, db) {
        var users = [];
        assert.equal(err, null);
        var db1 = db.db('renting_system');
            var cursor = db1.collection('reqProduct').find();
            cursor.forEach(
            function(doc) {
                users.push(doc);
             },
            function(err) {
                if(err) return err;
                db.close();
               res.json(users);
            }
        );
    });
});

module.exports = routers;
const path = require('path');
const crypto = require('crypto');
const mongoose2 = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
// Mongo URI
const mongoURI = 'mongodb://localhost:27017/renting_system';
// Create mongo connection
const conn = mongoose2.createConnection(mongoURI);
// Init gfs
let gfs;
conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose2.mongo);
  gfs.collection('uploads');
});

// Create storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = file.originalname; //+ path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage  });

// @route GET /
// @desc Loads form
routers.get('/', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      res.render('index', { files: false });
    } else {
      files.map(file => {
        if (
          file.contentType === 'image/jpeg' ||
          file.contentType === 'image/png'
        ) {
          file.isImage = true;
        } else {
          file.isImage = false;
        }
      });
      res.render('index', { files: files });
    }
  });
});

// @route POST /upload
// @desc  Uploads file to DB
routers.post('/upload', upload.single('file'), (req, res) => {
  res.json({success:true , msg:'uploaded'});
});

// @route GET /files
// @desc  Display all files in JSON
routers.get('/files', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: 'No files exist'
      });
    }

    // Files exist
    return res.json(files);
  });
});

// @route GET /files/:filename
// @desc  Display single file object
routers.get('/files/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }
    // File exists
    return res.json(file);
  });
});

// @route GET /image/:filename
// @desc Display Image
routers.get('/image/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }

    // Check if image
    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: 'Not an image'
      });
    }
  });
});

// @route DELETE /files/:id
// @desc  Delete file
routers.delete('/files/:id', (req, res) => {
  console.log("deleting");  
  gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
    if (err) {
      return res.status(404).json({ err: err });
    }
    res.json({success:true , msg:'deleted'});
    // res.redirect('/');
  });
});

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'ARnIB36gmVQVudXCSEvGUf_JNN35-jgG2F-bMYgwtnItSsVhRPGxqNL0bHediVCuGvvV_LgZwdVu1NCg',
    'client_secret': 'EKjXTh_U4R4C1YOR_mCzn9RdaDulT4W9exmGwEXYilCFND0e7_4Oz1il5BGnl3bpG82Iugvpm6yu653y'
  });

routers.post('/pay', (req, res) => {
    // console.log("paying");

    const create_payment_json = {
      "intent": "sale",
      "payer": {
          "payment_method": "paypal"
      },
      "redirect_urls": {
          "return_url": "http://localhost:4000/users/success/"+req.body.price,
          "cancel_url": "http://localhost:4000/users/cancel"
      },
      "transactions": [{
          "item_list": {
              "items": [{
                  "name": req.body.name,
                  "sku": "001",
                  "price": req.body.price,
                  "currency": "USD",
                  "quantity": 1
              }]
          },
          "amount": {
              "currency": "USD",
              "total": req.body.price
          },
          "description": req.body.discription
      }]
  };
  
  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
        console.log(error);
        res.send({url : 'you should have internet connection for payment',
            success: false});
        // throw error;
    } else {

        for(let i = 0;i < payment.links.length;i++){
          if(payment.links[i].rel === 'approval_url'){
            // console.log("URL : " + payment.links[i].hrefs);  
            res.send({url :payment.links[i].href,
                      success: true});
          }
        }
    }
  });
  
  });
  
  routers.get('/success/:money', (req, res) => {
    let money_ = req.param("money"); 
    // console.log(money_); 
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    // console.log(req.query);
    const execute_payment_json = {
      "payer_id": payerId,
      "transactions": [{
          "amount": {
              "currency": "USD",
              "total": money_
          }
      }]
    };
  
    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
      if (error) {
          console.log(error.response);
          throw error;
      } else {
        // console.log(JSON.stringify(payment));
        //res.send('Success');
        MongoClient.connect('mongodb://localhost:27017/renting_system', function(err, db) {
            var db1 = db.db('renting_system');
            let payment_ = db1.collection("payment"); 
            payment_.insertOne(payment , (err,res)=>{
                if(err){
                    console.log("Err " + err);
                }else {
                    console.log("REs " + res);
                }
            });
            var myquery = { 
                // _id : new ObjectId(req.body.id),
                product_name : payment.transactions[0].item_list.items[0].name
            };        
            var newvalues2 =  { $set: {payment : true} }
            db1.collection("product").updateOne(myquery,newvalues2,(err)=>{
                    if(err) throw err;
            });
            var newvalues3 =  { $set: {payment_type : true} }
            db1.collection("product").updateOne(myquery,newvalues3,(err)=>{
                    if(err) throw err;
            });
        });
        // console.log(payment.id);
        res.redirect("http://localhost:4200/payment/" + payment.id);
      }
  });
  });
  
  routers.get('/cancel', (req, res) => res.send('Cancelled'));
  
  routers.get('/paymentDetails/:id',(req,res,next)=>{
    // console.log("start");  
    let id_ = req.param("id"); 
    // console.log(id_);
    MongoClient.connect('mongodb://localhost:27017/renting_system', function(err, db) {

        var users = null;
        assert.equal(err, null);
        var db1 = db.db('renting_system');
            var cursor = db1.collection('payment').find();
            cursor.forEach(
            function(doc) {
                // console.log(doc);
                if(doc.id == id_)
                    users = doc;
                    console.log(users);
             },
            function(err) {
                if(err) return err;
                db.close();
               res.json(users);
            }
        );
    });
});


// ********************************
// old method of booking ...
// routers.post('/bookProduct',(req,res,next)=>{
//     // console.log(req.body);
//     const time = new Date();
//     var day = req.body.edate;
//     var monthIndex = req.body.emonth;
//     var year = req.body.eyear;
//     var tt = monthIndex+"-"+day+"-"+year;
//     var ttt = new Date(tt); 
//     var timeDiff = Math.abs(time.getTime() - ttt.getTime());
//     var diffDays_ = Math.ceil(timeDiff / (1000 * 3600 * 24));   
//     let newP = new bookProduct({
//         buyer_name: req.body.buyer_name,
//         buyer_email: req.body.buyer_email,
//         owner_name: req.body.owner_name,
//         owner_email: req.body.owner_email,
//         product_name: req.body.name,
//         price: req.body.price,
//         ratting_end: 0,
//         discription_end: "",
//         location: {
//             city: req.body.location.city,
//             state: req.body.location.state
//         },
//         category: {
//             main: req.body.category.main,
//             sub: req.body.category.sub
//         },
//         duration: diffDays_,
//         ini_time: time,
//         end_time: ttt,
//         status: false
//     });
//     // console.log(newP);
//     newP.save((err)=>{
//         if(err){res.json({success:false , msg:'there is some problem in booking.'});
//                 console.log(err);        
//         }
//         else  res.json({success:true , msg:'booking of a product is added in database'});
//     });
// });
// //old
// routers.post('/bookReqProduct',(req,res,next)=>{
//     // console.log(req.body);
//     const time = new Date();
//     var day = req.body.edate;
//     var monthIndex = req.body.emonth;
//     var year = req.body.eyear;
//     var tt = monthIndex+"-"+day+"-"+year;
//     var ttt = new Date(tt); 
//     var timeDiff = Math.abs(time.getTime() - ttt.getTime());
//     var diffDays_ = Math.ceil(timeDiff / (1000 * 3600 * 24));   
//     let newP = new bookReqProduct({
//         buyer_name: req.body.buyer_name,
//         buyer_email: req.body.buyer_email,
//         owner_name: req.body.owner_name,
//         owner_email: req.body.owner_email,
//         product_name: req.body.name,
//         proposed_price: req.body.price,
//         location: {
//             city: req.body.location.city,
//             state: req.body.location.state
//         },
//         category: {
//             main: req.body.category.main,
//             sub: req.body.category.sub
//         },
//         duration: diffDays_,
//         ini_time: time,
//         end_time: ttt,
//         status: false
//     });
//     // console.log(newP);
//     newP.save((err)=>{
//         if(err){res.json({success:false , msg:'there is some problem in booking.'});
//                 console.log(err);        
//         }
//         else  res.json({success:true , msg:'booking of a product is added in database'});
//     });
// });
//old
// routers.post('/updateBookedProduct',(req,res,next)=>{
//     var MongoClient = require('mongodb').MongoClient;
//     var url = "mongodb://127.0.0.1:27017/";

//     MongoClient.connect(url, function(err, db) {
//     if (err) throw err;
//     var dbo = db.db('renting_system');

//     var myquery = { 
//         _id : new ObjectId(req.body.id),
//         product_name : req.body.product_name,
//         buyer_name : req.body.buyer_name,
//         owner_name : req.body.owner_name };
    
//     var productQuery = {
//         product_name : req.body.product_name
//     }    
//     // console.log(productQuery);
//     var newvalues = { $set: {status : true} };
//         dbo.collection("bookProduct").updateOne(myquery, newvalues, function(err) {
//             if (err) throw err;
//         });

//         dbo.collection("product").updateOne(productQuery, newvalues, function(err, res_) {
//             if (err) throw err;
//             console.log("1 document updated in product");
//             if(err){res.json({success:false , msg:'there is some problem in booking.'});
//             console.log(err);        
//             }
//             else  res.json({success:true , msg:'booking of a product is added in database'});
//             // db.close();
//         });
//         db.close();
//     }); 
// });
//old
