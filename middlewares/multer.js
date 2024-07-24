const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create an Express router
const router = express.Router();

// Ensure the temporary directory exists and is writable
// const tmpDir = path.join(__dirname, "../tmp/");
// if (!fs.existsSync(tmpDir)) {
//   fs.mkdirSync(tmpDir, { recursive: true });
// }

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./temp/"); // Correct directory path
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

// Create a multer instance with the storage configuration
const upload = multer({ storage: storage });
module.exports = upload;
