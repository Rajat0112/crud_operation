
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    minlength: [2, "Minimum length is 2"]
  },
  lastName: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  gender: {
    type: String
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  age: {
    type: Number
  },
  phoneNumber:{
    type:Number,
    required : true
  },
  password: {
    type: String
  }
});


module.exports = mongoose.model('User', userSchema);

