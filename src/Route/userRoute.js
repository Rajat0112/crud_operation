const express = require('express');
const router = express.Router();
const userController = require('../controller/User');

router.post('/signup', userController.Signup);

module.exports = router;
