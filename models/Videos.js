const mongoose = require("mongoose");

const VideosSchema = new mongoose.Schema({
  videoId: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    default: false,
  },
  isPrivate: {
    type: Boolean,
    required: true,
  },
  videoDiscription: {
    type: String,
    maxLength: 100,
    required: true,
  },
  //this will be a cloudinary response url , we will recive the file from
  //frontend and then upload it on cloudinary and then store that link
  videoURL: {
    type: String,
    required: true,
  },
  uploadedBy: {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  tags: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  ratings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rating",
    },
  ],
});
const Video = mongoose.model("Video", VideosSchema);
module.exports = Video;
