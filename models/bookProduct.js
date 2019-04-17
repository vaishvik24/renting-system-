const mongoose = require('mongoose');
const config = require('../config/database');

const bookProduct_ = mongoose.Schema({
    buyer_name:{
        type: String,
        required: true
    },
    buyer_email:{
        type: String,
        required: true
    },
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
    ratting_end :{
        type: Number
    },
    discription_end :{
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
    duration :{
        type:Number,
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
    } 
},{'collection':'bookProduct'});

const bookProduct = module.exports = mongoose.model("bookProduct" , bookProduct_);