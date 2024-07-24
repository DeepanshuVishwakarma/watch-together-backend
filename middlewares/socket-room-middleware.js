const Room = require("../models/Room");
const User = require("../models/User");

const isRoomExist = async (socket, next) => {
  console.log("inside isRoomExist");
  try {
    const roomId = socket.handshake.query.roomId;
    if (!roomId) {
      return next(new Error("Room ID is required"));
    }

    const room = await Room.findOne({ _id: roomId });
    if (!room) {
      return next(new Error("Invalid Room ID"));
    }

    socket.room = room;
    next();
  } catch (err) {
    console.error("Error in isRoomExist middleware:", err);
    return next(new Error("Internal server error"));
  }
};

const isRoomAdmin = async (socket, next) => {
  console.log("inside isCreatedByUser");
  try {
    const userId = socket.userDetails._id;
    const room = socket.room;

    if (!room.admins.includes(userId.toString())) {
      return next(new Error("Unauthorized request"));
    }
    next();
  } catch (err) {
    console.error("Error in isRoomAdmin middleware:", err);
    return next(new Error("Internal server error"));
  }
};
const isCreatedByUser = async (socket, next) => {
  console.log("inside isCreatedByUser");
  try {
    const userId = socket.userDetails._id;
    const room = socket.room;

    if (room.createdBy.toString() !== userId.toString()) {
      return next(new Error("Unauthorized request"));
    }
    next();
  } catch (err) {
    console.error("Error in isCreatedByUser middleware:", err);
    return next(new Error("Internal server error"));
  }
};

module.exports = {
  isRoomExist,
  isCreatedByUser,
  isRoomAdmin,
};
