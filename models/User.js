const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  // Define the password field with type String and required
  password: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  uploadedVideos: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "videos",
    },
  ],
  token: {
    type: String,
  },
  image: {
    type: String,
  },
  // this should be updated as true when user joio some live room , mean inside sokcet ,
  //  and also should be updated as false when user leave live room ,
  inRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    default: null,
  },
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  requestFrom: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  active: {
    type: Boolean,
    default: true,
  },
  // update only at the time of creating/joing the room
  socketId: {
    type: String,
  },
});

module.exports = mongoose.model("User", userSchema);
