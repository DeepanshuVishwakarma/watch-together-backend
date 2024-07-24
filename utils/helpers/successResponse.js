function successResponse(response, message) {
  return {
    success: true,
    message,
    data: response,
  };
}

module.exports = { successResponse };
