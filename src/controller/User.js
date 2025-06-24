const User = require('../Model/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
require('dotenv').config();


const userController = {};

// Signup -----
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

    // Check Validation for all Fields ---
    if (!firstName || !lastName || !username || !gender || !email || !age || !phoneNumber || !password) {
      return res.status(400).json({ message: 'Please enter a missing Field' });
    }

    if (!image) {
      return res.status(400).json({ message: 'Please upload an image' });
    }


    // Check for existing user
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already taken, Please enter a different one!!' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6-digit OTP
    const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

    // Generate OTP and expiry
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Create user with OTP and expiry
    const newUser = new User({
      firstName,
      lastName,
      username,
      gender,
      email,
      age,
      phoneNumber,
      password: hashedPassword,
      otp,
      otpExpiresAt
    });

    await newUser.save();

    // Send OTP via email
    const subject = 'Verify Your Email - OTP';
    const message = `Hi ${firstName},\n\nYour OTP for email verification is: ${otp}\n\nThis OTP will expire in 10 minutes.`;

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




// OTP verify --------------->
userController.otpVerification = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Request OTP:', otp);
    console.log('User OTP:', user.otp);
    console.log('User OTP Expiry:', user.otpExpiresAt);

    if (!user.otp || !user.otpExpiresAt) {
      return res.status(400).json({ message: 'OTP not set or expired' });
    }

    if (new Date() > user.otpExpiresAt) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    if (String(user.otp) !== String(otp)) {
      return res.status(400).json({ message: 'Invalid OTP, Please enter a valid OTP!!' });
    }

    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    return res.status(200).json({ message: 'OTP verified successfully' });

  } catch (err) {
    console.error('OTP Verification Error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};



// Login -------
const JWT_SECRET = 'your_secret_key';

userController.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check for both the Fields ---
    if (!username || !password) {
      return res.status(400).json({ message: 'Both username and password are required to login.' });
    }

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username, Please enter a valid username!' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password, Please enter a valid Password!' });
    }

    // Create JWT
    const payload = {
      userId: user._id,
      username: user.username,
    };
    const token = jwt.sign(payload, JWT_SECRET);

    res.status(200).json({
      message: 'Login successful.',
      user: {
        id: user._id,
        username: user.username
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};








module.exports = userController;
