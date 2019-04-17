const mongoose = require('mongoose');
const config = require('../config/database');

const product_ = mongoose.Schema({
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
    price: {
        type: Number,
        required: true
    },
    ratting :{
        type: Number,
        required: true
    },
    discription:{
        type: String,
        required: true
    },
    url:{
        type: String
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
    status : {
        type: Boolean,
        required : true
    },
    payment : {
        type: Boolean
    },
    // false means offline and true means online
    payment_type : {
        type: Boolean
    },
    bookings :  [
        {
            buyer_name : String,
            buyer_email : String,
            time : Date,
            bookTime : Date,
            duration : Number,
            Sts : Boolean
        }
    ]
    
},{'collection':'product'});

const product = module.exports = mongoose.model("product" , product_);