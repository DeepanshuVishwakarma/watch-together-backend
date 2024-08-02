const User = require("../models/User.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { formateUserFields } = require("../utils/helpers/addUserName.js");

exports.signup = async (req, res) => {
  console.log("Signup controller called");

  try {
    // Destructure fields from the request body
    const { firstName, lastName, email, confirmPassword, password } = req.body;
    console.log("Request body: " + JSON.stringify(req.body));
    console.log(firstName, lastName, email, req.password, confirmPassword);

    // Check if All Details are there or not
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.status(403).send({
        success: false,
        message: "All Fields are required",
      });
    }
    // Check if password and confirm password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Password and Confirm Password do not match. Please try again.",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists. Please sign in to continue.",
      });
    }

    // Find the most recent OTP for the email

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the Additional Profile For User

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      image: "",
    });

    return res.status(200).json({
      success: true,
      user,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "User cannot be registered. Please try again.",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill up all the required fields",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User is not registered with us. Please sign up to continue.",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (isPasswordMatch) {
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      user.token = token;
      user.password = undefined;

      const requestFromFormatted = await formateUserFields(user.requestFrom);
      const friendsFormatted = await formateUserFields(user.friends);

      user.requestFrom = requestFromFormatted;
      user.friends = friendsFormatted;

      const updatedUser = await {
        ...user,
        requestFrom: requestFromFormatted,
        friends: friendsFormatted,
      };
      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };

      res.status(200).json({
        success: true,
        token,
        user: updatedUser,
        message: "User login success",
      });

      console.log("Logged in");
    } else {
      console.log("Login failed: Incorrect password");
      return res.status(401).json({
        success: false,
        message: "Password is incorrect",
      });
    }
  } catch (error) {
    console.error(error);
    console.log("Login failed");
    return res.status(500).json({
      success: false,
      message: "Login failure, please try again",
    });
  }
};
