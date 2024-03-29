const UserRepository = require(`../repositories/user.repository`);
const ProfileRepository = require(`../repositories/profile.repository`);
const UserDto = require(`../dtos/user.dto`);

class UserService {
  async getAll(offset = 0, limit = 10, sort = "desc", search = "", type = 0, except="") {
    const data = await UserRepository.getAll(offset, limit, sort, search, type, except);
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
    userDto.is_admin_menu = data.is_admin_menu;

    // return await UserRepository.create(userDto);
    const saved = await UserRepository.create(userDto);
    const user = await UserRepository.getByField("username", data.username);
    await ProfileRepository.saveUserProfileSetting(
      user[0].id,
      "is_admin_menu",
      data.is_admin_menu
    );
    return saved;
  }

  async update(id, data) {
    let userDto = new UserDto();
    userDto.fullname = data.fullname;
    userDto.username = data.username;
    userDto.password = data.password;
    userDto.email = data.email;
    userDto.user_level = data.user_level;
    userDto.access_group = data.access_group;
    userDto.is_admin_menu = data.is_admin_menu;

    const saved = await UserRepository.update(id, userDto);
    const user = await UserRepository.getByField("username", data.username);
    await ProfileRepository.saveUserProfileSetting(
      user[0].id,
      "is_admin_menu",
      data.is_admin_menu
    );
    return saved;
  }

  async changePassword(id, data) {
    return await UserRepository.changePassword(
      id,
      data.old_password,
      data.new_password
    );
  }

  async delete(id) {
    return await UserRepository.delete(id);
  }
}

module.exports = new UserService();
