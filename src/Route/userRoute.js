const express = require('express');
const router = express.Router();
const userController = require('../controller/User');
const { uploadSingleImage, authenticate } = require('../Middleware/Index');


router.post('/signup', uploadSingleImage, userController.Signup);
router.post('/otp-verify', userController.otpVerification);  
router.post('/login', userController.login);
router.get("/user/profile", authenticate, userController.getProfile);   // via token Get Profile
router.put('/user/profile-update', authenticate, uploadSingleImage, userController.profileUpdate);   // via token Update Profile

/*
router.get('/user/get-profile/:id', userController.getProfile);
router.put('/user/update-profile/:id', userController.updateProfile);
router.post('/user/add-user',uploadSingleImage, userController.addUser);
router.put('/user/update-user/:id', uploadSingleImage, userController.updateUser);   // By Id 
router.delete('/user/delete-user/:id', userController.deleteUser);
*/

module.exports = router;
