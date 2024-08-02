const User = require("../models/User");

const UserRepository = require("../repository/user-repo");
const userRepository = new UserRepository();
const { serverError } = require("../utils/helpers/serverError");
const { successResponse } = require("../utils/helpers/successResponse");
const { getTotalRecords } = require("../utils/helpers");
const { VideoServices } = require("../services/index");
const VideoRepository = require("../repository/user-repo");
const videoRepository = new VideoRepository();
const Video = require("../models/Videos");
const { formatUserData } = require("../utils/helpers/addUserName");

const getUserById = async (user, searchId) => {
  try {
    console.log("inside getUserById service : " + "id " + searchId);
    const search_user = await userRepository.getById(searchId, "UserId");

    formatUserData(user, search_user)
      .then((response) => {
        return successResponse(response);
      })
      .catch((error) => {
        return serverError(error);
      });
  } catch (error) {
    console.log("error service : " + error);
    return serverError(error);
  }
};

const searchUserByName = async (user, name) => {
  try {
    console.log("inside searchUserByName service : " + " name " + name);
    const search_users = await userRepository.searchByName(name);
    console.log(search_users);
    const dataPromises = search_users.map((search_user) =>
      formatUserData(user, search_user)
    );
    const data = await Promise.all(dataPromises);

    return successResponse(data);
  } catch (error) {
    console.log("error service : " + error);
    return serverError(error);
  }
};

const deleteUserById = async (id) => {
  try {
    console.log("inside deleteUserById service : " + "id " + id);
    const response = await userRepository.deleteById(id, "uploadedBy");
    return successResponse(response);
  } catch (error) {
    console.log("error service : " + error);
    return serverError(error);
  }
};

const updateById = async (id, updateData) => {
  try {
    console.log("Inside updateById service");

    const { firstName, lastName, email } = updateData;

    const updateFields = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(email && { email }),
    };

    // Call repository method to update User
    const response = await userRepository.update(id, updateFields);

    return successResponse(response);
  } catch (error) {
    console.log("Error in updateById service: ", error);
    return serverError(error);
  }
};
module.exports = {
  getUserById,
  searchUserByName,
  deleteUserById,
  updateById,
};
