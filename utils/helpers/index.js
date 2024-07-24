const { getTotalRecords } = require("./getTotalRecords");
const { serverError } = require("./serverError");
const { successResponse } = require("./successResponse");

module.exports = {
  serverError,
  successResponse,
  getTotalRecords,
};
