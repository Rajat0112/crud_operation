const User = require('../Model/userModel');
const bcrypt = require('bcrypt');
const sendEmail = require('../utils/sendEmail'); 

const userController = {};

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

userController.Signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      username,
      gender,
      email,
      age,
      phoneNumber,
      password
    } = req.body;

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      firstName,
      lastName,
      username,
      gender,
      email,
      age,
      phoneNumber,
      password: hashedPassword
    });

    await newUser.save();

    // Generate OTP
    const otp = generateOTP();

    // Send OTP via email
    const subject = 'Verify Your Email - OTP';
    const message = `Hi ${firstName},\n\nYour OTP for email verification is: ${otp}`;

    await sendEmail({
      to: email,
      subject,
      text: message
    });

    return res.status(201).json({
      message: 'User registered successfully. OTP sent to email.'
    });

  } catch (err) {
    console.error('Signup Error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = userController;
