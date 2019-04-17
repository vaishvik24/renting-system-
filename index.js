const passport = require('passport');
const express = require('express');
const path= require('path');
var mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const users = require('./routers/users');
const config = require('./config/database');
const app = express();
const socket = require('socket.io');
const port = 4000;
var MongoClient = require('mongodb').MongoClient;

var server = app.listen(port ,()=>{
    console.log("server is running on port : "+port);
    // console.log(new Date(2025,07,24));
});
// connecting to a database..
mongoose.connect(config.database);
//console.log(config.secret); just using dataTypes from cingfig/database 's file
mongoose.connection.on('connected' ,()=>{
    console.log("connectd to " + config.database);
});

let onlineuser = 0;
var io = socket(server);

MongoClient.connect('mongodb://localhost:27017/renting_system', function(err, db) {
    let chatRooms = db.db("renting_system").collection('chatRooms'); 
    
    io.on('connection',(socket)=>{
        //console.log("connected");
        onlineuser++;
        socket.on('disconnect',()=>{
        onlineuser--;
        io.sockets.emit('onlineUsers',onlineuser );
        });
        socket.on('onlineUsers',()=>{
            //console.log(onlineuser);
            io.sockets.emit('onlineUsers',onlineuser );
            //console.log("online users emitted");
        });

        // **********************************
        // 'join event'
        socket.on('join', (data) => {          
            socket.join(data.room);
            chatRooms.find({}).toArray((err, rooms) => {
                if(err){
                    console.log(err);
                    return false;
                }
                count = 0;
                rooms.forEach((room) => {
                    if(room.name == data.room){
                        count++;
                    }
                });
                // Create the chatRoom if not already created
                if(count == 0) {
                    chatRooms.insert({ name: data.room, messages: [] }); 
                }
            });
        });
        // catching the message event
        socket.on('message', (data) => {
            // emitting the 'new message' event to the clients in that room
            io.in(data.room).emit('new message', {user: data.user, message: data.message});
            // save the message in the 'messages' array of that chat-room
            chatRooms.update({name: data.room}, { $push: { messages: { user: data.user, message: data.message } } }, (err, res) => {
                if(err) {
                    console.log(err);
                    return false;
                }
            });
        });
        // Event when a client is typing
        socket.on('typing', (data) => {
            // Broadcasting to all the users except the one typing 
            socket.broadcast.in(data.room).emit('typing', {data: data, isTyping: true});
        });

        socket.on('profileRealtime',()=>{
            console.log("refreshing");
            io.sockets.emit('profileRealtime');
        });
        // **********************************
        socket.on('checkLogout',()=>{
            //console.log("checked");
            io.sockets.emit('checkLogout');
        });

        socket.on('try',()=>{
            console.log("emiting");
            io.sockets.emit('try');

        })
        socket.on('checkLogIn',()=>{
            //console.log("checked");
            io.sockets.emit('checkLogIn');
        });

        socket.on('check',()=>{
            //console.log("checked");
            io.sockets.emit('check');
        });

        socket.on('onlineUsername',(data)=>{
            //console.log("online username index : "+ data);
            io.sockets.emit('onlineUsername',data);
        })
});
});



// error handling 
mongoose.connection.on('error' ,(err)=>{
    console.log("error is :" + err);
});
//setting up the middle-wares ..
app.use(cors());
app.use(bodyParser.json());

//passport for authentication ...
app.use(passport.initialize());
app.use(passport.session());

require('./config/passport')(passport);
// set static folder :
//app.use(express.static(path.join(__dirname ,'public')));
app.use(express.static(path.join(__dirname,'public')));

app.use('/users',users);
// index main file of application 
app.get('/',(req,res,next)=>{  // write req before the res and next ....
    res.send("invalid endpoint : ");
});

app.get('*',(req,res)=>{
    res.send(path.join(__dirname , 'public/index.html'));
});

