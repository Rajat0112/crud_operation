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

    const image = req.file
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      : null;

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
      otpExpiresAt,
      image
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
//const JWT_SECRET = 'your_secret_key';

/*
// without Token 
userController.login = async (req, res) => {
  try {
    const { username, password } = req.body;

     if(!username || !password){
      return res.status(400).json({message : "Please enter both username and password"});
     }
      if (!username){
      returnres.status(400).json({message: "please enter a valid username"});
    }
     const user = await User.findOne({username})

    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if(!isPasswordMatched){
      return res.status(400).json({message : "Please enter a valid password"});
    }
 
    {
      return res.status(200).json({ message: "user Successfully login", user })
    }

  }
  catch(err){
 return res.status(500).json({message: "Internal server error", error: err.message});
  }
}
*/

// With token ---------
const JWT_SECRET = 'your_secret_key';
userController.login = async(req, res) => {
  try{
    const { username, password} = req.body;
    if(!username || !password){
      return res.status(400).json({message: " Please Enter both the fields to login"});
    }
     const user = await User.findOne({username});
    if(!user){
      return res.status(400).json({message: "Invalid Username! Please enter a valid username "});
    }
   
    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if(!isPasswordMatched){
      return res.status(400).json({message : " Invalid Password! Please enter a valid password"});
    }

    const token = jwt.sign(
      {
      userId : user._id,
      username: user.username
    }, JWT_SECRET ) 

    return res.status(200).json({mressage : "User Login Successfully!",
      user: {
        id: user._id,
        username: user.username
      },
      token
    })
  }
  catch(err){
    return res.status(500).json({message: "Internal Server errror", error: err.message});
  }
}



// Get Profile Via token 
userController.profileList = async (req, res) => {
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
};


// Profile Update Via token ---------
userController.profileUpdation = async (req, res) => {
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
    if (!firstName || !lastName || !username || !email || !gender || !age || !phoneNumber) {
      return res.status(400).json({ message: 'Please enter all the Fields to Add User!!' });
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



// Update User By Id ----------------->>***
userController.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { firstName, lastName, username, gender, age, email, phoneNumber } = req.body;

    if (!firstName || !lastName || !phoneNumber || !email) {
      return res.status(400).json({ success: false, message: 'Required fields are missing' });
    }

    const updateData = {
      firstName,
      lastName,
      username,
      gender,
      age,
      email,
      phoneNumber
    };

    if (req.file) {
      const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      updateData.image = imageUrl;
    }
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

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
      {
        $set: {
          deletedAt: new Date()
        }
      }
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





module.exports = userController;
