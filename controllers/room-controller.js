const User = require("../models/User");
const { RoomServices } = require("../services/index");
const Room = require("../models/Room");

//actions for all users
const createRoom = async (req, res) => {
  // no room middleware is required
  console.log("inside createRoom");
  try {
    const email = req?.user?.email;
    const user = await User.findOne({ email });

    // require field
    const name = req?.body?.name;
    if (!name) {
      res.status(404).json({
        success: false,
        message: " room name was not given",
      });
    }

    // default fields
    const discription = String(req?.body?.discription);

    // Check if discription's length is greater than 3 and less than 50 characters
    if (!discription) {
      res.status(404).json({
        success: false,
        message: "Description is required",
        length: discription?.length,
      });
    } else if (discription?.length < 3 || discription?.length > 50) {
      res.status(404).json({
        success: false,
        message: "Description length must be between 3 and 50 characters",
        length: discription?.length,
      });
    }

    const isPrivate = req?.body?.isPrivate || false;
    const permissions = req?.body?.permissions;

    const tempPermissions = {
      chat: permissions?.chat || false,
      videoCall: permissions?.videoCall || false,
      audioCall: permissions?.audioCall || false,
      playList: permissions?.playList || false,
      player: permissions?.player || false,
    };

    const response = await RoomServices.createRoom(
      user._id,
      isPrivate,
      tempPermissions,
      name,
      discription
    );

    if (response.success) {
      return res.status(201).json({
        success: true,
        message: "Room created successfully",
        data: response.data,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to create room",
        error: response.error,
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

const getAllRooms = async (req, res) => {
  // no room middleware is required
  try {
    const email = req?.user?.email;
    const user = await User.findOne({ email });
    const currentUserId = user._id;

    const rooms = await Room.find({}).lean();

    // Fetch all users once to avoid multiple queries in the loop
    const allUsers = await User.find({}, "_id firstName lastName").lean();

    const modifiedRooms = rooms.map((room) => {
      const isRequested = room?.requests.some((user) =>
        user.equals(currentUserId)
      );
      const isJoined = room?.users.some((user) => user.equals(currentUserId));
      const isAdmin = room?.admins.some((admin) => admin.equals(currentUserId));
      const isCreatedByUser = room?.createdBy.equals(currentUserId);
      const usersCount = room?.users?.length;

      const roomUsers = allUsers.filter((user) =>
        room?.users.some((userId) => userId.equals(user._id))
      );
      const roomAdmins = roomUsers.filter((user) =>
        room?.admins.some((adminId) => adminId.equals(user._id))
      );

      const requestedUsers = allUsers.filter((user) =>
        room?.requests.some((userId) => userId.equals(user._id))
      );
      return {
        ...room,
        admins: isCreatedByUser || isAdmin ? roomAdmins : undefined,
        users: isCreatedByUser || isAdmin ? roomUsers : undefined,
        requests: isCreatedByUser || isAdmin ? requestedUsers : undefined,
        latestMessage: undefined,
        invitation: undefined,
        usersCount,
        isJoined,
        isAdmin,
        isCreatedByUser,
        isRequested,
      };
    });

    return res.status(200).json({
      success: true,
      rooms: modifiedRooms,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

const leaveRoom = async (req, res) => {
  try {
    // middle ware  - > isRoomExist
    const email = req?.user?.email;
    const user = await User.findOne({ email });

    const roomId = req?.room?._id || req.params.id;
    const room = await Room.findOne({ _id: roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }
    const participants = room.users;
    const userIndex = room.users.findIndex(user._id);
    if (userIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "User is not a member of this room",
      });
    }

    room.users = room.users.filter(
      (id) => id.toString() !== user._id.toString()
    );
    await room.save();

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

// actions for only owner of the room
const deleteRoom = async (req, res) => {
  try {
    // middle ware -> isRoomExits -> isCreatedByUser
    const email = req?.user?.email;
    const user = await User.findOne({ email });

    const roomId = req?.params?.id;

    const room = await Room.findOne({ _id: roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    await Room.findByIdAndDelete(roomId);

    return res.status(200).json({
      success: true,
      message: "room deleted successfully",
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
  // middle ware -> isRoomExits -> isCreatedByUser

  // yet to be completed
  try {
    const userId = req?.params?.userId;
    if (!userId) {
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

    const roomId = req?.params?.id;
    const room = await Room.findOne({ _id: roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
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

    return res.status(200).json({
      success: true,
      message: "User removed from the room successfully",
      data: room.users,
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

const updateRoom = async (req, res) => {
  try {
    // Middleware -> isRoomExists -> isCreatedByUser
    const roomId = req?.params?.id;
    if (!roomId) {
      return res.status(404).json({
        success: false,
        message: "roomId is required",
      });
    }

    const room = await Room.findOne({ _id: roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const { roomName, isPrivate, permissions, description, note } =
      req?.body?.RoomInfo || {};

    // Validate and update roomName
    if (roomName !== undefined) {
      if (typeof roomName !== "string" || roomName.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Invalid roomName",
        });
      }
      room.roomName = roomName.trim();
    }

    // Validate and update isPrivate
    if (isPrivate !== undefined) {
      if (typeof isPrivate !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "Invalid isPrivate value",
        });
      }
      room.isPrivate = isPrivate;
      const request = room.request;
      const users = room.users;
      request.forEach((user) => users.push(user));
      room.users = users;
    }

    // Validate and update permissions
    if (permissions !== undefined) {
      const tempPermissions = {
        chat: permissions?.chat || false,
        videoCall: permissions?.videoCall || false,
        audioCall: permissions?.audioCall || false,
        playList: permissions?.playList || false,
        player: permissions?.player || false,
      };
      room.permissions = tempPermissions;
    }

    // Validate and update description
    if (description !== undefined) {
      if (
        typeof description !== "string" ||
        description.length < 3 ||
        description.length > 50
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid description",
        });
      }
      room.description = description.trim();
    }

    // Validate and update note
    if (note !== undefined) {
      if (typeof note !== "string" || note.length < 3 || note.length > 50) {
        return res.status(400).json({
          success: false,
          message: "Invalid note",
        });
      }
      room.note = note.trim();
    }

    // Save the updated room
    await room.save();

    return res.status(200).json({
      success: true,
      message: "Room updated successfully",
      room,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

module.exports = {
  createRoom,
  deleteRoom,
  removeMember,
  leaveRoom,
  getAllRooms,
  updateRoom,
};

// const addMember = async (req, res) => {
//   try {
//     const userToBeAdded = req.params.user;
//     const email = req?.user?.email;
//     const user = await User.findOne({ email });

//     // Implementation of adding member through sockets here
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: err.message,
//     });
//   }
// };

// const askForRoomOwnership = async (req, res) => {
//   try {
//     const email = req?.body?.email;
//     const user = await User.findOne({ email });

//     if (!user.inRoom) {
//       return res.status(400).json({
//         success: false,
//         message: "Join room first",
//       });
//     }

//     const roomId = user.inRoom;
//     const room = await Room.findOne({ objectId: roomId });

//     const ownerId = room.roomAdmin.id;
//     const owner = await User.findOne({ objectId: ownerId });
//     const ownerSocketId = owner.socketId;

//     const response = await RoomServices.askForRoomOwnership(roomId, user._id);

//     if (response.success) {
//       const { io } = req;
//       io.to(ownerSocketId).emit("requesting-for-ownership", { user });

//       return res.status(200).json({
//         success: true,
//         message: "Requested for ownership",
//       });
//     } else {
//       return res.status(500).json({
//         success: false,
//         message: "Failed to request ownership",
//         error: response.error,
//       });
//     }
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       error: err.message,
//       message: "Internal server error",
//     });
//   }
// };

// const restrictMembers = async (req, res) => {
//   // Implementation needed
//   try {
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: err.message,
//     });
//   }
// };

// const changeRoomOwnership = async (req, res) => {
//   try {
//     const id = req?.params?.id;
//     if (!id) {
//       return res.status(400).json({
//         success: false,
//         message: "User ID is required",
//       });
//     }

//     const givingOwnershipTo = await User.findOne({ _id: id });
//     if (!givingOwnershipTo) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     const email = req?.user?.email;
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       });
//     }

//     const roomId = user.inRoom;
//     if (!roomId) {
//       return res.status(400).json({
//         success: false,
//         message: "User is not in any room",
//       });
//     }

//     const room = await Room.findOne({ _id: roomId });
//     if (!room) {
//       return res.status(404).json({
//         success: false,
//         message: "Room not found",
//       });
//     }

//     const ownerId = room.roomAdmin.id;
//     if (ownerId.toString() !== user._id.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: "Unauthorized request",
//       });
//     }

//     const userIndex = room.users.findIndex(
//       (user) => user.toString() === id.toString()
//     );
//     if (userIndex === -1) {
//       return res.status(400).json({
//         success: false,
//         message: "User is not in the room",
//       });
//     }

//     room.roomAdmin.id = givingOwnershipTo._id;
//     if (!room.users.includes(ownerId)) {
//       room.users.push(ownerId);
//     }
//     await room.save();

//     const socketId = givingOwnershipTo.socketId;
//     if (socketId) {
//       const { io } = req;
//       io.to(socketId).emit("became-room-owner");
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Room ownership transferred successfully",
//     });
//   } catch (err) {
//     console.error("Error in changeRoomOwnership controller:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: err.message,
//     });
//   }
// };
