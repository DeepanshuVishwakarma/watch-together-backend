const AppError = require("../utils/errors/error");
const { StatusCodes } = require("../utils/statics/static");

class CrudRepository {
  constructor(model) {
    console.log("model", model);
    this.model = model;
  }

  async create(data) {
    console.log("Creating method called");
    const response = await this.model.create(data);
    return response;
  }

  async deleteById(id, key = "_id") {
    const query = {};
    query[key] = id;
    const response = await this.model.findOne(query);
    if (!response) {
      throw new AppError("Resource not found", StatusCodes.NOT_FOUND);
    }
    return response;
  }

  async deleteAll() {
    const response = await this.model.deleteMany({});
    return response;
  }

  async getById(id, key = "_id") {
    const query = {};
    query[key] = id;
    const response = await this.model.findOne(query);
    if (!response) {
      throw new AppError("Resource not found", StatusCodes.NOT_FOUND);
    }
    return response;
  }

  async getAll() {
    console.log("inside crudrepo");
    const response = await this.model.find({ isPrivate: false });
    return response;
  }

  async update(id, data) {
    const response = await this.model.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!response) {
      throw new AppError("Resource not found", StatusCodes.NOT_FOUND);
    }
    return response;
  }
}

module.exports = CrudRepository;
