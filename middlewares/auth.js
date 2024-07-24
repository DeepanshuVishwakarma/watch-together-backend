const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("./../models/User.js");
const fs = require("fs");
const path = require("path");
dotenv.config();

exports.auth = async (req, res, next) => {
  try {
    console.log("inside auth middleware");
    const token = req.header("Authorization").replace("Bearer ", "");
    // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImJpbkAxMjMiLCJpYXQiOjE3MjE1MDcxMDIsImV4cCI6MTcyMTU5MzUwMn0.iDUxhzimVDLMHORJh9M0SkcLlyd066DLqiwwoLPpVlg";
    // req.cookies.token || req.body.token||

    // console.log('token: '+token);

    if (!token) {
      console.log(" no token: ");
      return res.status(401).json({
        success: false,
        message: "Token Missing",
      });
    }

    try {
      console.log("verifying token");
      const decode = await jwt.verify(token, process.env.JWT_SECRET);
      console.log(decode);

      req.user = decode;

      const email = req.user.email;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found",
        });
      }
      req.userDetails = user;
    } catch (error) {
      console.log(error);
      return res.status(401).json({
        success: false,
        message: "toke is not valid",
      });
    }
    // next();
    // console.log("calling next function");
    const videoPath = path.join(__dirname, "../test-data/video.mp4");
    fs.readFile(videoPath, (err, data) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error reading video file",
          error: err.message,
        });
      }

      req.files = {
        video: {
          data,
          name: "video.mp4",
          mimetype: "video/mp4",
          size: data.length,
        },
      };

      next();
    });
  } catch (error) {
    return res.status(401).json({
      error: error,
      success: false,
      message: `Something Went Wrong While Validating the Token`,
    });
  }
};
