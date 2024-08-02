const CrudRepository = require("./crud-repository");
const Video = require("../models/Videos");
class VideoRepository extends CrudRepository {
  constructor() {
    super(Video);
  }
  async searchByName(name) {
    const response = await this.model.find({
      name: { $regex: new RegExp(name, "i") },
      isPrivate: false,
    });
    return response;
  }
  async deleteManyByUploader(uploaderId) {
    return this.deleteMany({ uploadedBy: uploaderId });
  }
  async getAllByUploader(uploaderId) {
    const response = await this.model.find({
      uploadedBy: uploaderId,
      isPrivate: false,
    });
    return response;
  }
}

module.exports = VideoRepository;
