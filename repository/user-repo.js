const CrudRepository = require("./crud-repository");
const User = require("../models/User");
class UserRepository extends CrudRepository {
  constructor() {
    super(User);
  }
  async searchByName(name) {
    const names = String(name).split(" ");
    let query;

    if (names.length === 2) {
      const [firstName, lastName] = names;
      query = {
        $or: [
          { firstName: { $regex: new RegExp(firstName, "i") } },
          { lastName: { $regex: new RegExp(lastName, "i") } },
        ],
      };
    } else {
      query = {
        $or: [
          { firstName: { $regex: new RegExp(name, "i") } },
          { lastName: { $regex: new RegExp(name, "i") } },
        ],
      };
    }

    const response = await this.model.find(query);
    return response;
  }

  async getUserByEmail(email) {
    const user = await User.findOne({ email });
    return user;
  }
}

module.exports = UserRepository;
