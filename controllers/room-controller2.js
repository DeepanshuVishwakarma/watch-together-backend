const User = require("../models/User");
const RoomServices = require("../services/index");
const Room = require("../models/Room");

const createRoom = async (req, res) => {
  try {
    const email = req?.user?.email;
    const { isPrivate, discription, roomName } = req.body;
    const userDetails = req.userDetails;
    console.log("userDetails: " + userDetails);
    // check if we have all the feilds or not
    if (!isPrivate || !discription || !roomName) {
      console.log("all fields are required");
      console.log(req.body);

      return res
        .status(404)
        .json({ success: false, message: "All Fields are Required" });
    }

    // find user from the database
    const user = await User.findOne({ email });
    const userId = user._id;

    const room = {
      roomName,
      isPrivate,
      discription,
      createdBy: userId,
      isLive: 0,
      permissions: {
        chat: 0,
        videoCall: 0,
        audioCall: 0,
        playList0: 0,
        player: 0,
      },
      admins: [userId],
      users: [userId],
      note: req?.body?.note || "",
      requests: {},
      latestMessage: {},
      invitation: {},
    };

    //save the room data in Room model
    const response = await Room.create(room);
    return res.status(201).json({
      success: true,
      message: "room created successfully",
      data: response,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};
const getAllRooms = async (req, res) => {
  try {
    // in this user must filter those rooms who was created by him
    // and if those rooms are created by him then he must enable the button to start streaming

    const rooms = await Room.findAll({});
    for (const room of rooms) {
      room.latestMessage,
        room.invitation,
        room.requests,
        room.users,
        (room.admins = undefined);
    }
    return res.status(201).json({
      success: true,
      message: "rooms fetched successfully",
      data: rooms,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// const goLive = async (req, res) => {
//   try {
//     const user = req.userDetails;
//     // check if user is already in any room
//     if (user.inRoom) {
//       return res.status(400).json({
//         success: false,
//         message: "User is already in a room",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "User can create a room",
//     });
//     // check if the room is create by user or not
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: err.message,
//     });
//   }
// };

// const enterRoom = async (req, res) => {};

const addMember = async (req, res) => {
  try {
    const userToBeAdded = req.params.user;
    const email = req?.user?.email;
    const user = await User.findOne({ email });

    // Implementation of adding member through sockets here
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

const askForRoomOwnership = async (req, res) => {
  try {
    const email = req?.body?.email;
    const user = await User.findOne({ email });

    if (!user.inRoom) {
      return res.status(400).json({
        success: false,
        message: "Join room first",
      });
    }

    const roomId = user.inRoom;
    const room = await Room.findOne({ objectId: roomId });

    const ownerId = room.roomAdmin.id;
    const owner = await User.findOne({ objectId: ownerId });
    const ownerSocketId = owner.socketId;

    const response = await RoomServices.askForRoomOwnership(roomId, user._id);

    if (response.success) {
      const { io } = req;
      io.to(ownerSocketId).emit("requesting-for-ownership", { user });

      return res.status(200).json({
        success: true,
        message: "Requested for ownership",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to request ownership",
        error: response.error,
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      message: "Internal server error",
    });
  }
};

const joinRoom = async (req, res) => {
  try {
    const email = req?.user?.email;
    const user = await User.findOne({ email });
    const roomId = req.params.id;
    const room = await Room.findOne({ objectId: roomId });

    if (user.inRoom) {
      return res.status(400).json({
        success: false,
        message: "User is already in a room",
      });
    }

    const isPrivate = req.body?.isPrivate || false;

    if (isPrivate) {
      const ownerId = room?.roomAdmin?.id;
      if (!ownerId) {
        return res.status(404).json({
          success: false,
          message: "Owner could not be found",
        });
      }
      const owner = await User.findOne({ objectId: ownerId });
      const ownerSocketId = owner?.socketId;

      if (!ownerSocketId) {
        return res.status(404).json({
          success: false,
          message:
            "Request cannot be sent to the room owner, can't find socket ID",
        });
      }

      const { io } = req;
      io.to(ownerSocketId).emit(
        "requesting-for-joining-room",
        { user },
        async (ack) => {
          if (ack) {
            room.users.push(user._id);
            await room.save();

            user.inRoom = room._id;
            await user.save();

            return res.status(200).json({
              success: true,
              message: "Request to join room has been sent",
            });
          } else {
            return res.status(403).json({
              success: false,
              message: "Request denied by the room admin",
            });
          }
        }
      );
    } else {
      room.users.push(user._id);
      await room.save();

      user.inRoom = room._id;
      await user.save();

      const { io } = req;
      room.users.forEach(async (participantId) => {
        const participant = await User.findOne({ objectId: participantId });
        const participantSocketId = participant?.socketId;
        io.to(participantSocketId).emit("new-user-joined", { user });
      });

      return res.status(200).json({
        success: true,
        message: "User has joined the room",
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      message: "Internal server error",
    });
  }
};

const leaveRoom = async (req, res) => {
  try {
    const email = req?.user?.email;
    const user = await User.findOne({ email });

    const roomId = user.inRoom;
    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "User is not in any room",
      });
    }

    const room = await Room.findOne({ objectId: roomId });
    const participants = room.users;

    room.users = room.users.filter(
      (id) => id.toString() !== user._id.toString()
    );
    await room.save();

    user.inRoom = null;
    await user.save();

    const { io } = req;
    participants.forEach(async (participantId) => {
      const participant = await User.findOne({ objectId: participantId });
      const participantSocketId = participant?.socketId;
      io.to(participantSocketId).emit("a-user-left-the-room", { user });
    });

    return res.status(200).json({
      success: true,
      message: "Room left successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      message: "Internal server error",
    });
  }
};

const deleteRoom = async (req, res) => {
  try {
    const email = req?.user?.email;
    const user = await User.findOne({ email });
    const { io } = req;
    const roomId = user.inRoom;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "User is not in any room",
      });
    }

    const room = await Room.findOne({ objectId: roomId });
    const ownerId = room?.roomAdmin?.id;
    if (ownerId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    room.users.forEach(async (participantId) => {
      const participant = await User.findOne({ objectId: participantId });
      const participantSocketId = participant?.socketId;
      io.to(participantSocketId).emit("room-deleted");
    });

    await room.remove();

    user.inRoom = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      message: "Internal server error",
    });
  }
};

const removeMember = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const userToRemove = await User.findOne({ _id: id });
    if (!userToRemove) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const email = req?.user?.email;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const roomId = user.inRoom;
    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "User is not in any room",
      });
    }

    const room = await Room.findOne({ _id: roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const ownerId = room.roomAdmin.id;
    if (ownerId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    const userIndex = room.users.findIndex(
      (user) => user.toString() === userToRemove._id.toString()
    );
    if (userIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "User is not in the room",
      });
    }

    room.users.splice(userIndex, 1);
    await room.save();

    userToRemove.inRoom = null;
    await userToRemove.save();

    const { io } = req;
    io.to(userToRemove.socketId).emit("You-are-removed");

    return res.status(200).json({
      success: true,
      message: "User removed from the room successfully",
    });
  } catch (err) {
    console.error("Error removing member:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

const restrictMembers = async (req, res) => {
  // Implementation needed
  try {
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

const changeRoomOwnership = async (req, res) => {
  try {
    const id = req?.params?.id;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const givingOwnershipTo = await User.findOne({ _id: id });
    if (!givingOwnershipTo) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const email = req?.user?.email;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const roomId = user.inRoom;
    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "User is not in any room",
      });
    }

    const room = await Room.findOne({ _id: roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const ownerId = room.roomAdmin.id;
    if (ownerId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    const userIndex = room.users.findIndex(
      (user) => user.toString() === id.toString()
    );
    if (userIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "User is not in the room",
      });
    }

    room.roomAdmin.id = givingOwnershipTo._id;
    if (!room.users.includes(ownerId)) {
      room.users.push(ownerId);
    }
    await room.save();

    const socketId = givingOwnershipTo.socketId;
    if (socketId) {
      const { io } = req;
      io.to(socketId).emit("became-room-owner");
    }

    return res.status(200).json({
      success: true,
      message: "Room ownership transferred successfully",
    });
  } catch (err) {
    console.error("Error in changeRoomOwnership controller:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
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
