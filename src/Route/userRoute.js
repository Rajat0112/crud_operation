const express = require('express');
const router = express.Router();
const userController = require('../controller/User');
const { uploadSingleImage, authenticate } = require('../Middleware/Index');


router.post('/signup', userController.Signup);
router.post('/otp-verify', userController.otpVerification);
router.post('/login', userController.login);
router.get('/user/get-profile/:id', userController.getProfile);
router.put('/user/update-profile/:id', userController.updateProfile);
router.post('/user/add-user',uploadSingleImage, userController.addUser);
router.put('/user/update-user/:id', uploadSingleImage, userController.updateUser);
router.delete('/user/delete-user/:id', userController.deleteUser);
router.get("/profile", authenticate, userController.profileList);   // via token

module.exports = router;
