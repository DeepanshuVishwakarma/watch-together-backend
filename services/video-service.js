const VideoRepository = require("../repository/video-repository");
const uploadFileToCloudinary = require("../utils/fileUploader");
const dotenv = require("dotenv").config();
const videoRepository = new VideoRepository();
const User = require("../models/User");
const { serverError } = require("../utils/helpers/serverError");
const { successResponse } = require("../utils/helpers/successResponse");
const { getTotalRecords } = require("../utils/helpers");
const Video = require("../models/Videos");

const uploadVideo = async (req) => {
  try {
    console.log("inside uploadVideo video-service");

    // extract data from request
    const { name, videoDiscription, tags } = req.body;
    const videoFile = req.files.video;
    const email = req.user.email;
    const isPrivate = req?.body?.isPrivate === "true"; // converting string to boolean
    const user = await User.findOne({ email });

    // Upload video on Cloudinary
    const responseFromCloudinary = await uploadFileToCloudinary(
      videoFile,
      process.env.CLOUDINARY_FOLDER
    );
    console.log("uploaded Video on cloudinary", responseFromCloudinary);

    // Preparing video data
    const video = {
      name,
      videoDiscription,
      videoId: (await getTotalRecords(Video)) + 1,
      videoURL: responseFromCloudinary.url,
      isPrivate: isPrivate,
      uploadedBy: user._id,
      tags: [],
      likes: [],
      ratings: [],
    };

    const response = await videoRepository.create(video);

    // Update User document
    if (response) {
      try {
        await User.findByIdAndUpdate(user._id, {
          $push: { uploadedVideos: response._id },
        });
      } catch (err) {
        console.log("error updating user document while uploading video", err);
        // If updating user document fails, delete the uploaded video
        await videoRepository.deleteById(response._id);
        await cloudinary.uploader.destroy(responseFromCloudinary.public_id);

        return {
          success: false,
          message: "Error updating user document while uploading video",
          error: err,
        };
      }
    }

    return {
      success: true,
      message: "Video uploaded successfully",
      data: response,
    };
  } catch (error) {
    console.error("Error while handling service:", error);
    return {
      success: false,
      message: "Internal server error",
      error: error,
    };
  }
};

const getAllVideos = async () => {
  try {
    console.log("inside video service ");
    const response = await videoRepository.getAll();
    return successResponse(response);
  } catch (error) {
    console.log("error service : " + error);
    return serverError(error);
    an;
  }
};
const getVideoById = async (id) => {
  try {
    console.log("inside getVideoById service : " + "id " + id);
    const response = await videoRepository.getById(id, "videoId");
    return successResponse(response);
  } catch (error) {
    console.log("error service : " + error);
    return serverError(error);
  }
};

const searchVideoByName = async (name) => {
  try {
    console.log("inside getVideoById service : " + " name " + name);
    const response = await videoRepository.searchByName(name);
    return successResponse(response);
  } catch (error) {
    console.log("error service : " + error);
    return serverError(error);
  }
};
const deleteVideoById = async (id) => {
  try {
    console.log("inside deleteVideoById service : " + "id " + id);
    const response = await videoRepository.deleteById(id, "uploadedBy");
    return successResponse(response);
  } catch (error) {
    console.log("error service : " + error);
    return serverError(error);
  }
};
const deleteAllByCurrentUser = async (id) => {
  try {
    console.log("inside deleteAll service : " + "id " + id);
    const response = await videoRepository.deleteManyByUploader(id);
    return successResponse(response);
  } catch (error) {
    console.log("error service : " + error);
    return serverError(error);
  }
};

const updateById = async (id, updateData) => {
  try {
    console.log("Inside updateById service");

    // Extract fields to be updated
    const { name, videoDiscription, tags, isPrivate } = updateData;

    // Prepare data to be updated
    const updateFields = {
      ...(name && { name }),
      ...(videoDiscription && { videoDiscription }),
      ...(tags && { tags }), // Replace existing tags with new tags array
      ...(isPrivate !== undefined && { isPrivate }),
    };

    // Call repository method to update video
    const response = await videoRepository.update(id, updateFields);

    return successResponse(response);
  } catch (error) {
    console.log("Error in updateById service: ", error);
    return serverError(error);
  }
};
module.exports = {
  uploadVideo,
  getAllVideos,
  getVideoById,
  searchVideoByName,
  deleteVideoById,
  deleteAllByCurrentUser,
  updateById,
};
