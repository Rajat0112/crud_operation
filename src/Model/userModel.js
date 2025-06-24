
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
  phoneNumber: {
    type: Number,
    required: true
  },
  password: {
    type: String
  },
  otp: {
    type: String,
  },
  otpExpiresAt: {
    type: Date,
  },
  image: {
    type: String,
    default: null
  },
  deletedAt: {
    type: Date,
    default: null
  }
});


module.exports = mongoose.model('User', userSchema);

