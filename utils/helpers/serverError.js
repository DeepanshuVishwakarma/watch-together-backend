function serverError(error) {
  return {
    success: false,
    message: "Internal server error",
    error,
  };
}

module.exports = { serverError };
