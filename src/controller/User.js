const User = require('../Model/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
require('dotenv').config();


const userController = {};


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

    // Send success response
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




// Get Profile By Id :)----
userController.getProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const userProfile = await User.findById(userId);

    if (!userProfile) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(userProfile);
    console.log(userProfile);

  } catch (err) {
    res.status(500).json({ message: 'Error fetching user profile', error: err.message });
  }
};



// Update profile by Id----------------->
userController.updateProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const { firstName, lastName, username, gender, email, age, phoneNumber } = req.body;
    const updatedUser = await User.findByIdAndUpdate(userId, req.body);

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Updated User:', updatedUser);
    return res.status(200).json(updatedUser);

  } catch (err) {
    console.error('Update Error:', err.message);
    return res.status(500).json({ message: 'Error updating user profile', error: err.message });
  }
};


// Add User ------------>
userController.addUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      username,
      gender,
      email,
      age,
      phoneNumber
    } = req.body;

    const image = req.file
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      : null;

    // Simple validation
    if (!firstName || !lastName || !username || !email) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    const newUser = new User({
      firstName,
      lastName,
      username,
      gender,
      email,
      age,
      phoneNumber,
      image
    });

    await newUser.save();
    res.status(201).json({ message: 'User added successfully', user: newUser });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};




// Update User By Id ----------------->>***
userController.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { firstName, lastName, username, password, gender, age, email, phoneNumber } = req.body;

    if (!firstName || !lastName || !phoneNumber || !email) {
      return res.status(400).json({ success: false, message: 'Required fields are missing' });
    }

    const updateData = {
      firstName,
      lastName,
      username,
      password,
      gender,
      age,
      email,
      phoneNumber
    };

    if (req.file) {
      const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      updateData.image = imageUrl;
    }
    const updatedUser = await User.findByIdAndUpdate(userId, updateData);

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log('Update Data:', updateData);
    return res.status(200).json({ success: true, message: 'User updated successfully', data: updatedUser });

  } catch (err) {
    console.error('Update Error:', err.message);
    return res.status(500).json({ success: false, message: 'Error updating user data', error: err.message });
  }
};



// Delete User by Id ^^^^^^^^^^^ Soft Delete >>>>>>>>>>>
userController.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const deletedUser = await User.updateOne(
      { _id: userId },
      { $set: {deletedAt: new Date()
       } }
    );

    if (deletedUser.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User soft deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// Get Profile Via token 
userController.profileList = async (req, res) => {
  try {
    const user = req.user; 

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};







module.exports = userController;
