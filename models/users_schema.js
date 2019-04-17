const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');
const config = require('../config/database');

const userSchema = mongoose.Schema({

         name:{
            type: String,
            required: true
         },
         email:{
            type: String,
            required: true
         },
         password:{
            type: String,
            required: true
         },
         username:{
            type: String,
            required: true
         },
         url: {
             type: String
         },
         phoneNum: {
             type: Number,
             required: true
         }
});
// for Renting_system
const users_schema = module.exports = mongoose.model('users',userSchema);

    
module.exports.getUserById = function(id,callback){
    users_schema.findById(id,callback);
};


module.exports.getUserByUsername = function(username,callback){
    const query = {username:username};
    users_schema.findOne(query,callback);
    console.log(username);
};

module.exports.addUser = function(newUser , callback){
    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(newUser.password , salt,(err,hash)=>{
        if(err) throw err;
        newUser.password =hash;
        newUser.save(callback);
    });
});

};

module.exports.comparePassword = function(candidatePassword ,hash,callback){
   
    console.log("canidate pw : "+candidatePassword);
    console.log("hash : "+ hash);
   
    bcrypt.compare(candidatePassword,hash,(err,isMatch)=>{
         if(err) console.log(err);
         callback(null,isMatch);
    });
}
