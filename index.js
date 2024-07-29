const User = require("./models/User");
const Video = require("./models/Videos");
const Room = require("./models/Room");
const Message = require("./models/Message");
const express = require("express");
const database = require("./config/database");
const { auth } = require("./middlewares/auth");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const { userRoutes, videoRoutes, roomRoutes } = require("./routes/index");
const dotenv = require("dotenv");
const { cloudinaryConnect } = require("./config/cloudinary");
const bodyParser = require("body-parser");
const http = require("http");
const socket = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socket(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

dotenv.config();
database.connect();
cloudinaryConnect();

//middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());

//cloudinary connection
app.use("/api/v1/app", auth);
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/app/video", videoRoutes);
app.use("/api/v1/app/room", roomRoutes);

app.get("/", (req, res) => {
  res.send("Hello, world!");
});

const PORT = process.env.PORT || 5173;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const jwt = require("jsonwebtoken");

const {
  isRoomExist,
  isRoomAdmin,
  isCreatedByUser,
} = require("./middlewares/socket-room-middleware");

io.use(async (socket, next) => {
  console.log("inside socket authentication");
  const token = socket.handshake.query.token;
  console.log(socket.handshake);
  // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImJpbkAxMjMiLCJpYXQiOjE3MjEwNTU1OTcsImV4cCI6MTcyMTE0MTk5N30.UP0QUGxn38StkLRxpqOt43lZwrR76OasJtQxdy6hzJY";

  if (!token) {
    console.log("No token provided ", token);
    return next(new Error("Token Missing"));
  }

  try {
    console.log("Verifying token");
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);

    const email = decoded.email;
    const user = await User.findOne({ email });

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.userDetails = user;
    next();
  } catch (error) {
    console.log(error);
    return next(new Error("Token is not valid"));
  }
});

const rooms = {};
// inside this we are pushing usreId , make it same everywhere
// inside that room we must push the data of
// current video which is being played,
// users
// current playlist which is being played
// playlist will be an array of videos ,
//  playlist = [
//      {
//        currentPlayingThis : true ,
//        videoDetails : {
//         videoId ,
//        videoName , videoDiscription , likes ... etc etch ,
//        }
//      },
//      {
//       currentPlayingThis : false ,
//       videoDetails : {
//        videoId ,
//       videoName , videoDiscription , likes ... etc etch ,
//       }
//     },

//   ...Room

// ]

const userToSocket = new Map();
const socketToUser = new Map();

function addUser(user, socketId) {
  userToSocket.set(user._id.toString(), socketId);
  socketToUser.set(socketId, user._id.toString());
}

function removeUser(socketId) {
  const userId = socketToUser.get(socketId);
  if (userId) {
    userToSocket.delete(userId);
    socketToUser.delete(socketId);
  }
}

async function getCurrentRoomDetailsResponse(room, responseMessage) {
  const { liveUsersDetails, liveAdminsDetails, usersCount, messages } =
    await getRoomLiveUsersInfo(room);

  const liveVideoId = rooms[roomId]?.currentVideo;
  let video = null;
  console.log("LIVe video id found", liveVideoId);
  if (liveVideoId) {
    video = await Video.findById(liveVideoId);
    console.log("Current vidoe is here: " + video);
  }
  const response = {
    success: true,
    message: responseMessage,
    data: {
      // creator : room.createdBy ,
      _id: room._id,
      messages,
      crator: room.createdBy,
      roomName: room.roomName,
      users: liveUsersDetails?.length > 0 ? liveUsersDetails : [],
      admins: liveAdminsDetails?.length > 0 ? liveAdminsDetails : [],
      playlists: [],
      currentVideo: video,
      usersCount,
    },
  };
  return response;
}

async function getRoomLiveUsersInfo(room) {
  if (!room) throw new Error("To get live users info, room info is required");

  const allUsers = await User.find({}, "_id firstName lastName").lean();

  const userMap = new Map();
  allUsers.forEach((user) => {
    userMap.set(user._id.toString(), user);
  });

  const liveRoom = rooms[room._id];
  const liveUsersId = liveRoom?.users || [];
  const usersCount = liveUsersId.length;

  const liveUsersDetails = [];
  const liveAdminsDetails = [];

  liveUsersId.forEach((userId) => {
    const user = userMap.get(userId.toString());

    if (user) {
      if (room.admins.some((adminId) => adminId.equals(userId))) {
        liveAdminsDetails.push(user);
      } else {
        liveUsersDetails.push(user);
      }
    }
  });

  const messages = await Message.find({ chatId: room._id })
    .sort({ createdAt: 1 })
    .lean();
  const formattedMessages = messages.map((messageObj) => {
    const sender = allUsers.find(
      (user) => user._id.toString() === messageObj.sender.toString()
    );
    return {
      _id: messageObj._id,
      message: messageObj.message,
      sender: {
        _id: sender._id,
        firstName: sender.firstName,
        lastName: sender.lastName,
      },
      sentAt: new Date(messageObj.createdAt).toLocaleTimeString(),
    };
  });

  return {
    liveUsersDetails,
    liveAdminsDetails,
    usersCount,
    messages: formattedMessages?.length ? formattedMessages : [],
  };
}

io.on("connection", (socket) => {
  console.log("new client connection", socket.id);

  const userId = socket.userDetails._id;
  addUser(userId, socket.id);

  // Middleware for authorization
  socket.use(async ([event, data], next) => {
    try {
      if (
        event === "room:goLive" ||
        event === "room:endLive" ||
        event === "room:makeAdmin" ||
        event === "room:giveOwnerShip" ||
        event === "room:demoteAdmin"
      ) {
        await isRoomExist(socket, next);
        await isCreatedByUser(socket, next);
      }
      if (
        event === "room:acceptReq" ||
        event === "room:kickUser" ||
        event === "room:changePermissions"
      ) {
        await isRoomAdmin(socket, next);
        await isRoomExist(socket, next);
      }

      if (
        event === "room:join" ||
        event === "room:leave" ||
        event === "room:message"
      ) {
        await isRoomExist(socket, next);
      }
      next();
    } catch (err) {
      next(new Error("Authorization error"));
    }
  });

  // Actions for the creator of the room
  socket.on("room:goLive", async (roomId, callback) => {
    try {
      console.log("here inside goLive socket", roomId);
      if (!rooms[roomId]) {
        rooms[roomId] = { owner: userId, users: [userId] };
        socket.join(roomId);

        const room = await Room.findById(roomId);
        if (!room) {
          throw new Error("Room not found in database");
        }
        room.isLive = true;

        await room.save();

        const message = `room ${roomId} created successfully`;

        getCurrentRoomDetailsResponse(room, message)
          .then((response) => {
            console.log(response);
            io.to(roomId).emit("room:updated", response.data);
            callback(response);
            console.log(`Room created: ${roomId} rooms : ${rooms}`);
          })
          .catch((error) => {
            console.error("Error fetching room details:", error);
            throw new Error("Error fetching room details ");
          });
      } else {
        throw new Error("room already exists");
      }
    } catch (err) {
      response = {
        success: false,
        error: err,
        message: err.message,
      };
      callback(response);
      console.error("Error going live:", err.message);
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("room:endLive", async (roomId, callback) => {
    try {
      console.log("inside room endLive");
      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error("Room not found");
      }
      if (!room.isLive) {
        throw new Error("Room is not live");
      }
      room.isLive = false;
      await room.save();
      delete rooms[roomId];
      io.socketsLeave(roomId);

      const response = {
        success: true,
        message: `Room ${room.roomName} Live ended successfully`,
        data: {},
      };
      io.to(roomId).emit("room:updated", response.data);
      socket.to(roomId).emit("room:endLive", roomId);
      callback(response);
    } catch (err) {
      response = {
        success: false,
        error: err,
        message: err.message,
      };
      callback(response);
      console.error("Error ending live session:", err.message);
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("room:makeAdmin", async (data, callback) => {
    try {
      const { roomId, newAdminId } = data;
      if (!newAdminId) {
        throw new Error("New admin's ID is required");
      }
      if (!rooms[roomId]) {
        throw new Error("No such room exists " + roomId);
      }

      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error("Room not found in database");
      }

      if (!room.users.includes(newAdminId)) {
        throw new Error("User not in the room");
      }

      if (room.admins.includes(newAdminId)) {
        throw new Error("User is already an admin");
      }

      room.admins.push(newAdminId);
      await room.save();

      const newAdminSocketId = userToSocket.get(newAdminId);
      if (newAdminSocketId) {
        io.to(newAdminSocketId).emit("room:youAreAdmin", roomId);
      }
      const user = await User.findById(newAdminId);
      const message = `${user.firstName} ${user.lastName} is now an admin`;
      const response = getCurrentRoomDetailsResponse(room, message);
      io.to(roomId).emit("room:updated", response.data);
      callback(response);
    } catch (err) {
      response = {
        success: false,
        error: err,
        message: err.message,
      };
      callback(response);
      console.error("Error making user admin:", err.message);
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("room:giveOwnerShip", async (data, callback) => {
    try {
      const { roomId, newOwnerId } = data;
      if (!newOwnerId) {
        throw new Error("New owner's ID is required");
      }

      const user = await User.findById(newOwnerId);
      if (!user) {
        throw new Error("User not found");
      }

      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error("Room not found");
      }

      if (!room.users.includes(newOwnerId)) {
        throw new Error("User is not in this room");
      }

      room.createdBy = newOwnerId;
      if (!room.admins.includes(newOwnerId)) {
        room.admins.push(newOwnerId);
      }
      await room.save();

      const socketId = userToSocketId.get(newOwnerId);
      if (socketId) {
        io.to(socketId).emit("room:becameOwner", { roomId, newOwnerId });
      }

      const message = `${user.firstName} ${user.lastName} is now the owner of the room`;
      const response = getCurrentRoomDetailsResponse(room, message);
      io.to(roomId).emit("room:updated", response.data);
      callback(response);
    } catch (err) {
      response = {
        success: false,
        error: err,
        message: err.message,
      };
      callback(response);
      console.error("Error transferring ownership:", err.message);
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("room:demoteAdmin", async (data, callback) => {
    try {
      const { roomId, adminToDemoteId } = data;
      if (!adminToDemoteId) {
        throw new Error("Admin's ID to be demoted is required");
      }

      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error("Room not found in database");
      }

      if (!room.admins.includes(socket.userDetails._id)) {
        throw new Error("Only admins can demote other admins");
      }

      const adminIndex = room.admins.indexOf(adminToDemoteId);
      if (adminIndex === -1) {
        throw new Error("User to be demoted is not an admin");
      }

      room.admins.splice(adminIndex, 1);
      await room.save();

      const demotedAdminSocketId = userToSocket.get(adminToDemoteId);
      if (demotedAdminSocketId) {
        io.to(demotedAdminSocketId).emit("room:youAreDemoted", roomId);
      }

      const user = await User.findById(adminToDemoteId);
      const message = `${user.firstName} ${user.lastName} is demoted from admin`;
      const response = getCurrentRoomDetailsResponse(room, message);
      io.to(roomId).emit("room:updated", response.data);
      callback(response);
    } catch (err) {
      response = {
        success: false,
        error: err,
        message: err.message,
      };
      callback(response);
      console.error("Error demoting admin:", err.message);
      socket.emit("error", { message: err.message });
    }
  });

  // actions for creator and admin

  socket.on("room:acceptReq", async (data, callback) => {
    try {
      const { roomId, requestId } = data;

      if (!roomId) {
        throw new Error("Room id is required");
      }
      if (!requestId) {
        throw new Error("Request id is required");
      }

      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error("Room not found in database");
      }

      const requestIndex = room.requests.findIndex(
        (req) => req.toString() === requestId.toString()
      );
      if (requestIndex === -1) {
        throw new Error("Request not found");
      }

      const userId = room.requests[requestIndex];

      room.users.push(userId);
      room.requests.splice(requestIndex, 1);
      await room.save();

      const user = await User.findById(userId);
      const response = {
        success: true,
        message: `${room.roomName} request accepted ${user.firstName} ${user.lastName} successfully`,
        data: room.users,
      };

      const message = `${user.firstName} ${user.lastName}'s request is accepted`;
      const responseDetails = getCurrentRoomDetailsResponse(room, message);
      io.to(roomId).emit("room:updated", responseDetails.data);

      const userSocketId = userToSocket.get(userId);
      if (userSocketId) {
        io.to(userSocketId).emit("room:accepted", roomId);
      }

      if (callback && typeof callback === "function") {
        callback(response);
      }
    } catch (err) {
      const response = {
        success: false,
        error: err,
        message: err.message,
      };

      callback(response);

      console.error("Error accepting request:", err.message);
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("room:kickUser", async (data, callback) => {
    try {
      const { roomId, userIdToKick } = data;
      if (!roomId) {
        throw new Error("Room id is required");
      }
      if (!userIdToKick) {
        throw new Error("User id to kick is required");
      }

      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error("Room not found in database");
      }

      const userIndex = room.users.findIndex((user) =>
        user.equals(userIdToKick)
      );
      if (userIndex === -1) {
        throw new Error("User not found in the room");
      }

      room.users.splice(userIndex, 1);
      await room.save();

      // Update the local rooms object
      if (rooms[roomId]) {
        rooms[roomId].users = rooms[roomId].users.filter(
          (userId) => !userId.equals(userIdToKick)
        );
      }

      const userSocketId = userToSocket.get(userIdToKick);
      if (userSocketId) {
        const socketToKick = io.sockets.sockets.get(userSocketId);
        if (socketToKick) {
          socketToKick.leave(roomId);
          socketToKick.emit("room:kicked", {
            message: "You have been kicked from the room",
            roomId,
          });
        }
      }

      io.to(roomId).emit("room:userKicked", { userId: userIdToKick });

      const user = await User.findById(userIdToKick);
      const message = `${user.firstName} ${user.lastName} has been kicked from the room`;
      getCurrentRoomDetailsResponse(room, message)
        .then((response) => {
          io.to(roomId).emit("room:updated", response.data);
          callback(response);
        })
        .catch((error) => {
          console.error("Error fetching room details:", error);
          throw new Error("Error fetching room details ");
        });
      // Emit the updated room details
    } catch (err) {
      const response = {
        success: false,
        error: err,
        message: err.message,
      };
      callback(response);
      console.error("Error kicking user from room:", err.message);
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("room:changePermissions", async (data, callback) => {
    try {
      const { roomId, userId, permissions } = data;
      if (!roomId) {
        throw new Error("Room id is required");
      }
      if (!userId) {
        throw new Error("User id is required");
      }
      if (!permissions || !Array.isArray(permissions)) {
        throw new Error("Permissions are required and should be an array");
      }

      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error("Room not found in database");
      }

      const userIndex = room.users.indexOf(userId);
      if (userIndex === -1) {
        throw new Error("User not found in the room");
      }

      room.permissions.set(userId, permissions);
      await room.save();

      const user = await User.findById(userId);
      const message = `${user.firstName} ${user.lastName}'s permissions are changed`;

      getCurrentRoomDetailsResponse(room, message)
        .then((response) => {
          io.to(roomId).emit("room:updated", response.data);
          callback(response);
        })
        .catch((error) => {
          console.error("Error fetching room details:", error);
          throw new Error("Error fetching room details ");
        });
    } catch (err) {
      response = {
        success: false,
        error: err,
        message: err.message,
      };
      callback(response);
      console.error("Error changing permissions:", err.message);
      socket.emit("error", { message: err.message });
    }
  });

  // actions for users
  socket.on("room:sendJoinReq", async (roomId, callback) => {
    try {
      console.log("inside send join request");

      if (!roomId) {
        throw new Error("Room id is required");
      }

      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error("Room not found in database");
      }

      const userId = socket.userDetails._id;

      // check if the user is already in the room
      if (room.users.includes(userId)) {
        throw new Error("You are already a member of this room");
      }

      if (room.isPrivate) {
        // check if the user has already sent a join request
        if (room.requests.some((request) => request.equals(userId))) {
          // `request.equals(userId)`
          throw new Error("Join request already sent");
        }

        // add the join request to the room
        room.requests.push(userId);
        await room.save();

        // send response for private room
        const response = {
          success: true,
          state: "requested",
          message: "Request sent successfully for " + room.roomName,
          data: room.users,
        };
        callback(response);
        return;
      }

      // for non-private rooms, add the user directly to the users array
      room.users.push(userId);
      await room.save();

      const response = {
        success: true,
        state: "joined",
        message: "Joined successfully to " + room.roomName,
        data: room.users,
      };
      callback(response);
    } catch (err) {
      const response = {
        success: false,
        message: err.message,
      };
      callback(response);
      console.error("Error sending join request:", err.message);
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("room:unsendJoinReq", async (roomId, callback) => {
    try {
      console.log("inside unsend join request");

      if (!roomId) {
        throw new Error("Room id is required");
      }

      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error("Room not found in database");
      }

      // check if the user has sent a join request
      const requestIndex = room.requests.findIndex((request) =>
        request.id.equals(userId)
      );
      if (requestIndex === -1) {
        throw new Error("Join request not found");
      }

      // remove the join request from the room
      room.requests.splice(requestIndex, 1);
      await room.save();

      const response = {
        success: true,
        message: "Request unsent successfully for " + room.roomName,
        data: {},
      };
      io.to(roomId).emit("room:updated", response.data); // emit updated room state
      callback(response);
    } catch (err) {
      const response = {
        success: false,
        message: err.message,
      };
      callback(response);
      console.error("Error unsending join request:", err.message);
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("room:join", async (roomId, callback) => {
    try {
      console.log("Inside join live room: ");
      if (!rooms[roomId]) {
        console.log("No such room exists", rooms);
        throw new Error("No such room exists");
      }
      if (rooms[roomId].users.includes(userId)) {
        console.log("User already in the room", rooms, roomId);

        throw new Error("User already in the room");
      }

      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error("Room not found in database");
      }

      // if (

      //     room?.requests.some((user) => user.equals(userId))

      // ) {
      //   throw new Error("User has already requested to join");
      // }

      // room.requests.push({ id: userId });
      // await room.save();

      socket.join(roomId);
      rooms[roomId].users.push(userId);

      const user = await User.findById(userId);
      const message = `${user.firstName} ${user.lastName} has joined the room`;
      getCurrentRoomDetailsResponse(room, message)
        .then((response) => {
          // console.log(response);
          io.to(roomId).emit("room:updated", response.data);
          callback(response);
          console.log("Join room executed");
        })
        .catch((error) => {
          console.error("Error fetching room details:", error);
          throw new Error("Error fetching room details ");
        });
    } catch (err) {
      response = {
        success: false,
        error: err,
        message: err.message,
      };
      callback(response);
      console.error("Error joining room:", err.message);
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("room:leave", async (roomId, callback) => {
    try {
      if (!rooms[roomId]) {
        console.log("Roooms", rooms);
        throw new Error("No such room exists");
      }

      if (!rooms[roomId].users.includes(userId)) {
        throw new Error("User not in the room");
      }

      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error("Room not found in database");
      }

      if (room.createdBy.toString() === userId.toString()) {
        throw new Error("Owner cannot leave the room");
      }

      rooms[roomId].users = rooms[roomId].users.filter(
        (user) => user !== userId
      );
      // room.users = room.users.filter(
      //   (user) => user.toString() !== userId.toString()
      // );
      // await room.save();

      socket.leave(roomId);

      const user = await User.findById(userId);
      const message = `${user.firstName} ${user.lastName} has left the room`;
      // const response = getCurrentRoomDetailsResponse(room, message);
      // io.to(roomId).emit("room:updated", response.data);
      // callback(response);

      getCurrentRoomDetailsResponse(room, message)
        .then((response) => {
          console.log(response);
          io.to(roomId).emit("room:updated", response.data);
          callback(response);
        })
        .catch((error) => {
          console.error("Error fetching room details:", error);
          throw new Error("Error fetching room details ");
        });
    } catch (err) {
      response = {
        success: false,
        error: err,
        message: err.message,
      };
      callback(response);
      console.error("Error leaving room:", err.message);
      // socket.emit("error", { message: err.message });
    }
  });

  socket.on("room:message", async (data, callback) => {
    try {
      // console.log("inside message", data);
      const { roomId, message } = data;
      // console.log("roomId: " + roomId);
      const room = await Room.findById(roomId);
      const userId = socket.userDetails._id;

      const liveRoom = rooms[roomId];
      // console.log(rooms, rooms?.roomId, rooms[roomId]);
      if (!liveRoom) {
        throw new Error("Room Is Not Live");
      }

      const liveUsrs = liveRoom.users;
      if (!liveUsrs.includes(userId)) {
        throw new Error("User Is Not Live");
      }

      const firstName = socket.userDetails.firstName;
      const lastName = socket.userDetails.lastName;

      const messageDoc = new Message({
        sender: userId,
        message,
        chatId: roomId,
      });

      const messageSavedInMongo = await messageDoc.save();

      const sentAt = messageSavedInMongo.createdAt;

      const newMessage = {
        _id: messageSavedInMongo._id,
        message,
        sender: {
          _id: userId,
          firstName,
          lastName,
        },
        sentAt,
      };

      room.latestMessage = messageSavedInMongo._id;
      await room.save();

      io.to(roomId).emit("room:message", newMessage);
      console.log(newMessage);
      callback({
        success: true,
        message: "Message sent successfully",
        data: newMessage,
      });
      //
      console.log("done execution of message event");
    } catch (err) {
      callback({
        success: false,
        error: err,
        message: err.message,
      });
      console.error(err);
    }
  });

  socket.on("video:playPause", async (isPlaying) => {
    try {
      const roomId = socket.roomId;
      const user = socket.userDetails;
      const userId = user._id;
      const room = await Room.findById(roomId);

      if (!room) {
        throw new Error("Room not found in database");
      }
      if (!rooms[roomId]) {
        throw new Error("Room is not live");
      }
      if (!rooms[roomId].users.includes(userId)) {
        throw new Error("user is not in the live room");
      }

      // const isCreator = room.creator.equals(userId);
      const isAdmin = room.admins.includes(userId);
      const hasPermission = room?.permissions?.player
        ? true
        : isAdmin
        ? true
        : false;
      const data = {
        userId,
        firstName: user.firstName,
        lastName: user.lastName,
        isPlaying,
      };
      if (hasPermission) {
        io.to(roomId).emit("video:playPause", data);
      } else {
        throw new Error(
          "Bad request , user is not allowed to play or pause video"
        );
      }
    } catch (err) {
      console.log(err);
      const response = {
        success: false,
        error: err,
        message: err.message,
      };
      callback(response);
    }
  });

  socket.on("video:perfect-sync", async (data, callback) => {
    try {
      const roomId = socket.roomId;
      const userId = socket.userDetails._id;
      const room = await Room.findById(roomId);

      if (!room) {
        throw new Error("Room not found");
      }
      if (!rooms[roomId]) {
        throw new Error("Room is not live");
      }
      if (!rooms[roomId].users.includes(userId)) {
        throw new Error("user is not in the live room");
      }

      if (room.creator.equals(userId)) {
        throw new Error(
          "Bad request , creator can't join request to perfect-sync"
        );
      }

      socket.emit("video:get-sync-details", null, (response) => {
        if (response.success) {
          callback(response);
        } else {
          throw new Error("Can't get video details from creator");
        }
      });
    } catch (err) {
      console.log(err);
      const response = {
        success: false,
        error: err,
        message: err.message,
      };
      callback(response);
    }
  });

  socket.on("video:change", async (data) => {
    try {
      const { roomId, videoId } = data;

      const userId = socket.userDetails._id;
      const room = await Room.findById(roomId);

      if (!room) {
        throw new Error("room not found in database");
      }
      if (!rooms[roomId]) {
        throw new Error("room is not live");
      }
      if (!rooms[roomId].users.includes(userId)) {
        throw new Error("user is not in the live room");
      }

      if (!room.creator.equals(userId)) {
        throw new Error("only creator can change the video");
      }

      const newRoomData = {
        ...rooms[roomId],
        currentVideo: videoId,
      };
      // update data here  of rooms[roomId]
      const message = "Video changed successfully";
      const response = await getCurrentRoomDetailsResponse(room, message);
      io.to(roomId).emit("room:updated", response.data);
      socket.emit("success", response);
    } catch (err) {
      console.log(err);
      const response = {
        success: false,
        error: err,
        message: err.message,
      };
      callback(response);
    }
  });

  socket.on("disconnect", () => {
    console.log("client disconnected", socket.id);
    removeUser(userId);
  });
});
