const cloudinary = require("cloudinary").v2;

const uploadFileToCloudinary = async (file, folder, height, quality) => {
  // console.log("inside fileUploader", file);
  // console.log(file, " ", file.tempFilePath);

  const options = { folder };
  if (height) {
    options.height = height;
  }
  if (quality) {
    options.quality = quality;
  }
  options.resource_type = "auto";
  // console.log("file Upload response", file?.tempFilePath, "fiel ,", file);
  const response = await cloudinary.uploader.upload(file.tempFilePath, options);
  // console.log("file Upload response", response);
  return response;
};

module.exports = uploadFileToCloudinary; // Correctly export the function
