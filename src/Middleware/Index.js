const jwt = require("jsonwebtoken");
const path = require('path');
const multer = require("multer");



const JWT_SECRET = 'your_secret_key';
module.exports.authenticate = function (req, res, next) {
  console.log("hello from auth middleware");
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
  //if no token found, return response (without going to the next middelware)
  let obj = {
    status: false,
    code: "CCS-E1000",
    message: "Access denied. No token provided.",
    payload: {},
  };
  if (!token) return res.status(401).send(obj);

  try {
    console.log(process.env.JWT_SECRET, "this is secret");
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(decoded, "this is decoded token");
    req.user = decoded;
    console.log("this is decoded",req.user);
    next();
  } catch (ex) {
    res.status(400).send("Invalid token.");
  }
};



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