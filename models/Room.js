const mongoose = require("mongoose");

const roomSchema = mongoose.Schema(
  {
    roomName: {
      type: String,
      required: true,
    },
    isPrivate: {
      type: Boolean,
      required: true,
    },
    isLive: {
      type: Boolean,
      required: true,
    },
    permissions: {
      chat: {
        type: Boolean,
        required: true,
      },
      videoCall: {
        type: Boolean,
        required: true,
      },
      audioCall: {
        type: Boolean,
        required: true,
      },
      playList: {
        type: Boolean,
        required: true,
      },
      player: {
        type: Boolean,
        required: true,
      },
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    discription: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 50,
    },
    note: {
      type: String,
      minlength: 3,
      maxlength: 50,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    requests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    invitation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);
const Room = mongoose.model("Room", roomSchema);
module.exports = Room;
