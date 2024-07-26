const Room = require("../models/Room");
const User = require("../models/User");

exports.isRoomExist = async (req, res, next) => {
  try {
    console.log("Checking if room exists...");
    const roomId = req.params.id;
    if (!roomId) {
      console.log("Room ID is undefined");
      return res.status(400).json({
        success: false,
        message: "Room ID is required",
      });
    }

    const room = await Room.findOne({ _id: roomId });

    if (!room) {
      console.log("Room does not exist");
      return res.status(400).json({
        success: false,
        message: "Invalid Room ID",
      });
    }

    req.room = room;
    next();

    console.log("Next called");
  } catch (err) {
    console.error("Error in isRoomExist middleware:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

exports.isRoomAdmin = async (req, res, next) => {
  try {
    console.log("Checking if user is a room admin...");
    const user = req.userDetails._id;
    const room = req.room;

    if (!room.admins.includes(user.toString())) {
      console.log("Unauthorized request: user is not a room admin");
      return res.status(403).json({
        success: false,
        message: "Unauthorized request",
      });
    }
    next();
  } catch (err) {
    console.error("Error in isRoomAdmin middleware:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

exports.isCreatedByUser = async (req, res, next) => {
  try {
    console.log("Checking if room is created by the user...");
    const user = req.userDetails._id;
    const room = req.room;

    if (room.createdBy.toString() !== user.toString()) {
      console.log("Unauthorized request: user is not the room creator");
      return res.status(403).json({
        success: false,
        message: "Unauthorized request",
      });
    }
    next();
  } catch (err) {
    console.error("Error in isCreatedByUser middleware:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};
