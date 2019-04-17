const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt =require('passport-jwt').ExtractJwt;
const user = require('../models/users_schema');
const config = require('../config/database');

module.exports = function(passport){
    let opts ={};
   
   
   //opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
   opts.jwtFromRequest =  ExtractJwt.fromAuthHeaderWithScheme("jwt");  //for new npm update...
    opts.secretOrKey =config.secert;
    passport.use(new JwtStrategy(opts,(jwt_payload,done)=>{
        user.getUserById(jwt_payload._id,(err,user)=>{
            if(err){return done(err,false);}
            if(user){return done(null,user);}
            else {return done(null,false);}

    });
}));

}