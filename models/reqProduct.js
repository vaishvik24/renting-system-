const mongoose = require('mongoose');
const config = require('../config/database');

const reqProduct_ = mongoose.Schema({
    owner_name:{
        type: String,
        required: true
    },
    owner_email:{
        type: String,
        required: true
    },
    product_name:{
            type: String,
            required: true
        },
    location:{
            city : {
                type: String
            },
            state : {
                type: String
            }
        },
    exp_price: {
        type: Number,
        required: true
    },
    ini_time:{
        type: Date,
        required: true
    },
    end_time:{
        type: Date,
        required: true
    },
    category:{
        main : {
            type: String,
            required: true

        },
        sub : {
            type: String,
            required: true
        }
    },
    status: {
        type: Boolean,
        required: true
    },
    discription : {
        type : String
    },
    payment : {
        type : Boolean
    },
    bookings: [
        {
            buyer_name : String,
            buyer_email : String,
            time : Date,
            booktime : Date,
            duration : Number,
            Sts : Boolean
        }
    ]
},{'collection':'reqProduct'});

const product = module.exports = mongoose.model("reqProduct" , reqProduct_);