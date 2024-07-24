const { StatusCodes } = require("../utils/statics/static");
const { VideoServices } = require("../services/index");
const { serverError } = require("../utils/helpers/serverError");
const uploadVideo = async (req, res) => {
  try {
    // console.log("inside uploadVideo controller");
    // console.log(req.body, req.files);
    const { name, videoDiscription, tags } = req.body;
    const videoFile = req?.files?.video;

    if (!name || !videoFile || !tags || !tags.length || !videoDiscription) {
      console.log(name, tags, videoFile, videoDiscription);
      return res
        .status(404)
        .json({ success: false, message: "All Fields are Required" });
    }

    const response = await VideoServices.uploadVideo(req);
    // console.log("response from video service", response);

    return res.status(response.success ? 200 : 500).json(response);
  } catch (error) {
    console.error("Error while handling controller:", error);
    return res.status(500).json(serverError(error));
  }
};

const getAllVideos = async (req, res) => {
  try {
    // console.log("inside getAllVideos controller");
    const response = await VideoServices.getAllVideos();
    // console.log(response);
    return res.status(response.success ? 200 : 500).json(response);
  } catch (error) {
    // console.log("error controller : " + error);
    return res.status(500).json(serverError(error));
  }
};

const getVideoById = async (req, res) => {
  try {
    console.log("inside getVideoById controller");
    const response = await VideoServices.getVideoById(req.params.id);
    console.log(response);
    return res.status(response.success ? 200 : 500).json(response);
  } catch (error) {
    return res.status(500).json(serverError(error));
  }
};
const searchVideoByName = async (req, res) => {
  try {
    console.log("inside searchVideoByName controller");
    const name = req?.params?.name;
    console.log(name);
    const response = await VideoServices.searchVideoByName(name);
    console.log(response);
    return res.status(response.success ? 200 : 500).json(response);
  } catch (error) {
    console.log("error inside searchVideoByName controller", error);
    return res.status(500).json(serverError(error));
  }
};

//it's not implemented yet since i am sending emtpy array every time,
const searchVideoByTag = async (req, res) => {
  try {
    console.log("inside searchVideoByTag controller");
    const response = await VideoServices.searchVideoByTag(req.params.name);
    console.log(response);
    return res.status(response.success ? 200 : 500).json(response);
  } catch (error) {
    return res.status(500).json(serverError(error));
  }
};

const deleteVideoById = async (req, res) => {
  try {
    console.log("inside deleteVideoById controller");
    const id = parseInt(req?.params?.id, 10);

    // Check if id is in valid format or not
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format. ID must be an integer.",
      });
    }

    // checking if the video is uploaded by this user
    const email = req.user.email;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const video = await VideoServices.getVideoById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    if (video.uploadedBy.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Can't delete video which wasn't uploaded by you",
      });
    }

    const response = await VideoServices.deleteVideoById(id);
    console.log(response);

    return res.status(response.success ? 200 : 500).json(response);
  } catch (error) {
    return res.status(500).json(serverError(error));
  }
};

const deleteAll = async (req, res) => {
  try {
    console.log("inside deleteAll controller");

    const email = req.user.email;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const response = await VideoServices.deleteAllByCurrentUser(user._id);
    console.log(response);
    return res.status(response.success ? 200 : 500).json(response);
  } catch (error) {
    return res.status(500).json(serverError(error));
  }
};
const updateById = async (req, res) => {
  try {
    console.log("Inside updateById controller");

    const id = parseInt(req?.params?.id, 10);

    // Check if id is in valid format or not
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format. ID must be an integer.",
      });
    }

    // checking if the video is uploaded by this user
    const email = req.user.email;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const video = await VideoServices.getVideoById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    if (video.uploadedBy.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Can't delete video which wasn't uploaded by you",
      });
    }

    const updateData = req.body;

    const response = await VideoServices.updateById(id, updateData);

    console.log(response);
    return res.status(response.success ? 200 : 500).json(response);
  } catch (error) {
    return res.status(500).json(serverError(error));
  }
};
module.exports = {
  deleteAll,
  updateById,
  deleteVideoById,
  searchVideoByName,
  searchVideoByTag,
  uploadVideo,
  getVideoById,
  getAllVideos,
};
