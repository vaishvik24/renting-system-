const mongoose = require('mongoose');
const config = require('../config/database');

const chatRoom_ = mongoose.Schema({

},{'collection':'chatRoom'});

const product = module.exports = mongoose.model("chatRoom" , chatRoom_);