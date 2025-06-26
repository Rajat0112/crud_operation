const jwt = require("jsonwebtoken");
const path = require('path');
const multer = require("multer");
const User = require('../Model/userModel'); 
const JWT_SECRET = 'your_secret_key'; 



module.exports.authenticate = async function (req, res, next) {
  console.log("hello from auth middleware");

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    token = req.headers.authorization.split(" ")[1];
    console.log("Received Token:", token);
  } else if (req.query && req.query.token) {
    token = req.query.token;
  } else {
    token = req.body.token || req.query.token || req.headers["x-access-token"];
  }
  if (!token) {
    return res.status(401).json({
      status: false,
      code: "CCS-E1000",
      message: "Access denied. No token provided.",
      payload: {},
    });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Decoded Token:", decoded);
    // Fetch full user data from DB
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    req.user = user; 
    next();
  } catch (ex) {
    console.error("JWT verification failed:", ex);
    return res.status(400).json({ message: "Invalid or expired token." });
  }
};


// Multer for Image --------

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const ext = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mime = allowedTypes.test(file.mimetype);
  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed (jpeg, jpg, png, gif)"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

// Use this in your routes for single file upload
module.exports.uploadSingleImage = upload.single("image");