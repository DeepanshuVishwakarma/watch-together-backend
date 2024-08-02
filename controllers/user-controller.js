const { StatusCodes } = require("../utils/statics/static");
const { UserServices } = require("../services/index");
const { serverError } = require("../utils/helpers/serverError");

const getUserById = async (req, res) => {
  try {
    console.log("inside getUserById controller");

    const response = await UserServices.getUserById(
      req.userDetails,
      req.params.id
    );
    console.log(response);
    return res.status(response.success ? 200 : 500).json(response);
  } catch (error) {
    return res.status(500).json(serverError(error));
  }
};

const searchUserByName = async (req, res) => {
  try {
    console.log("inside searchUserByName controller");
    const name = req?.params?.name;
    console.log(name);
    const response = await UserServices.searchUserByName(req.userDetails, name);
    console.log(response);
    return res.status(response.success ? 200 : 500).json(response);
  } catch (error) {
    console.log("error inside searchUserByName controller", error);
    return res.status(500).json(serverError(error));
  }
};

const deleteUser = async (req, res) => {
  try {
    // still need to complete

    console.log("inside deleteUser controller");

    const email = req.user.email;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const id = user._id;

    const response = await UserServices.deleteUserById(id);
    console.log(response);

    return res.status(response.success ? 200 : 500).json(response);
  } catch (error) {
    return res.status(500).json(serverError(error));
  }
};

const update = async (req, res) => {
  try {
    console.log("Inside updateById controller");

    const email = req.user.email;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const id = user._id;

    const updateData = req.body;

    const response = await UserServices.updateById(id, updateData);

    console.log(response);
    return res.status(response.success ? 200 : 500).json(response);
  } catch (error) {
    return res.status(500).json(serverError(error));
  }
};
module.exports = {
  update,
  deleteUser,
  searchUserByName,
  getUserById,
};
