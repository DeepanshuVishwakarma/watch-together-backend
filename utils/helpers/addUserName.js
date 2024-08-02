const User = require("../../models/User");
const Video = require("../../models/Videos");

const addUserName = async (_id) => {
  try {
    const user = await User.findById(_id).select("_id firstName lastName");
    if (!user) {
      return { success: false, message: "User not found" };
    }
    return {
      success: true,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An error occurred" };
  }
};

const formateUserFields = async (data) => {
  // data should be array
  const tempData = [];
  for (const _id of data) {
    const response = await addUserName(_id);
    if (response.success) {
      tempData.push(response.data);
    } else {
      console.error("error while processing req array", response.message);
    }
  }

  return tempData;
};

async function formatUserData(user, search_user) {
  const id = search_user._id;
  const uploaded_videos = await Video.find({
    uploadedBy: id,
    isPrivate: false,
  }).exec();

  const isFriend = search_user?.friends.includes(user._id);
  const isRequested = search_user?.requestFrom.includes(user._id);

  return {
    ...search_user.toObject(),
    uploadedVideos: uploaded_videos,
    isFriend,
    isRequested,
    email: undefined,
    password: undefined,
    token: undefined,
    socketId: undefined,
    roomInvites: undefined,
    requestFrom: undefined,
    friends: undefined,
    inRoom: undefined,
  };
}

module.exports = { addUserName, formateUserFields, formatUserData };
