const UserRepository = require(`../repositories/user.repository`);
const UserDto = require(`../dtos/user.dto`);

class UserService {
  async getAll(offset = 0, limit = 10, sort = "desc", search="",type=0) {
    const data = await UserRepository.getAll(offset, limit, sort, search, type);
    return data;
  }

  async findOne(id) {
    const data = await UserRepository.findOne(id);
    return data.rows;
  }

  async getByField(fieldName, fieldValue) {
    const data = await UserRepository.getByField(fieldName, fieldValue);
    // console.log(`getByField//////////////`, data);
    return data[0];
  }

  async create(data) {
    let userDto = new UserDto();
    userDto.fullname = data.fullname;
    userDto.email = data.email;
    userDto.username = data.username;
    userDto.password = data.password;
    userDto.user_level = data.user_level;
    userDto.access_group = data.access_group;

    return await UserRepository.create(userDto);
  }

  async update(id, data) {
    let userDto = new UserDto();
    userDto.fullname = data.fullname;
    userDto.username = data.username;
    userDto.password = data.password;
    userDto.email = data.email;
    userDto.user_level = data.user_level;
    userDto.access_group = data.access_group;

    // console.log(`userDto`, userDto);
    return await UserRepository.update(id, userDto);
  }

  async changePassword(id, data) {
    return await UserRepository.changePassword(id, data.old_password, data.new_password);
  }

  async delete(id) {
    return await UserRepository.delete(id);
  }
}

module.exports = new UserService();
