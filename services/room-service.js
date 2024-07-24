const RoomRepository = require("../repository/room-repository");
const roomRepository = new RoomRepository();
const User = require("../models/User");
const createRoom = async (
  userId,
  isPrivate,
  permissions,
  name,
  discription
) => {
  try {
    console.log("inside createRoom service");
    const data = {
      roomName: name,
      isPrivate,
      users: [userId],
      permissions,
      admins: [userId],
      createdBy: userId,
      discription,
      isLive: false,
      requests: [],
    };

    const response = await roomRepository.create(data);

    if (!response) {
      throw new AppError(
        "Failed to create room",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
    // Update user's inRoom field
    await User.findByIdAndUpdate(userId, { inRoom: response._id });

    return {
      success: true,
      data: response,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
};

const leaveRoom = async (userId) => {
  try {
  } catch (err) {}
};
const addMember = async (userId) => {
  try {
  } catch (err) {}
};
const askForRoomOwnership = async (roomId, userId) => {
  try {
    const response = await RoomRepository.askForRoomOwnership(roomId, userId);
  } catch (err) {}
};
const joinRoom = async (userId) => {
  try {
  } catch (err) {}
};
const deleteRoom = async (userId) => {
  try {
  } catch (err) {}
};
const removeMember = async (userId) => {
  try {
  } catch (err) {}
};

const restrictMembers = async (userId) => {
  try {
  } catch (err) {}
};

const changeRoomOwnership = async (userId) => {
  try {
  } catch (err) {}
};

module.exports = {
  createRoom,
  addMember,
  askForRoomOwnership,
  joinRoom,
  deleteRoom,
  removeMember,
  restrictMembers,
  changeRoomOwnership,
  leaveRoom,
};
