const User = require('../Model/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
require('dotenv').config();


const userController = {};

// Signup :)--------------

userController.Signup = async (req, res) => {
  try {
    const { firstName, lastName, username, phoneNumber, email, gender, age, password } = req.body;

    const image = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : null;

    if (!firstName || !lastName || !username || !phoneNumber || !email || !gender || !age || !password) {
      return res.status(400).json({ message: " All the fields are required to register" });
    }
    if (!image) {
      return res.status(400).json({ message: "Please upload the Image " });
    }
  
    // For Email :)
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "Email already exists, Please enter a different one" });
    }

    // For Username :)
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: "Username already exists, Please enter a different one!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otpGenerate = Math.floor(100000 + Math.random() * 900000);
    const otp = otpGenerate;
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const newUser = new User({
      firstName,
      lastName,
      username,
      phoneNumber,
      email,
      age,
      gender,
      password: hashedPassword,
      otp,
      otpExpiresAt,
      image
    })
    await newUser.save();

    const message = `Hi ${firstName}, your otp verification for the registration is ${otp}. This is valid for next 10minutes `;
    await sendEmail({
      to: email,
      subject: 'OTP verification',
      text: message
    })
    res.status(200).json({ message: "User Registered and OTP successfully send to the email" });
  }
  catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
}


// Otp - verification :) -------------->
userController.otpVerification = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Both Fields are required for verification" });
    }
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "This email is not exist, Please enter a different one!!" });
    }
    if (user.otp !== otp || user.otpExpiresAt < Date.now()) {
      return res.status(400).json({ message: " Invalid or expired OTP" });
    }

    // clear otp from DB after verification ------
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    res.status(200).json({ message: " OTP verified successfully" });
  }
  catch (err) {
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
}


// Login :) --------
const JWT_SECRET = 'your_secret_key';

userController.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Both Fields are required to login" });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid username, Please enter a correct one !" });
    }
    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
      return res.status(400).json({ message: " Invalid password, Please enter a valid one " });
    }

    const token = jwt.sign({
      username: user.username,
      userId : user._id,
    }, (JWT_SECRET) );

    res.status(200).json({
      message: " User Successfully Logged In :)",
      user: {
        username: user.username,
        id : user._id
      },
      token
    });
  }
  catch (err) {
    return res.status(500).json({ message: " Internal server error! ", error: err.message });
  }
}




// Get Profile  via token ---------
userController.getProfile = async(req, res) => {
  try {
    const user = req.user;
    res.status(200).json({
      success: true,
      userProfile: user
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile."
    });
  }
}


// Update Profile via token -----------:)
userController.profileUpdate = async(req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, username, gender, email, age, phoneNumber } = req.body;
    const updateData = { firstName, lastName, username, gender, email, age, phoneNumber };

    if (req.file) {
      const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      updateData.image = imageUrl;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });


    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'Profile updated successfully!',
      user: updatedUser
    });

  } catch (err) {
    console.error('Update Error:', err.message);
    return res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
}




module.exports = userController;
