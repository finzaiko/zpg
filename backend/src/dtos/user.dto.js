class UserDto {
  get username() {
    return this._username;
  }

  set username(newUsername) {
    this._username = newUsername;
  }

  get password() {
    return this._password;
  }

  set password(newPassword) {
    this._password = newPassword;
  }

  get email() {
    return this._email;
  }

  set email(newEmail) {
    this._email = newEmail;
  }

  get fullname() {
    return this._fullname;
  }

  set fullname(newFullname) {
    this._fullname = newFullname;
  }

  get user_level() {
    return this._user_level;
  }

  set user_level(newUserLevel) {
    this._user_level = newUserLevel;
  }

  get access_group() {
    return this._access_group;
  }

  set access_group(newAccessGroup) {
    this._access_group = newAccessGroup;
  }

  get is_admin_menu() {
    return this._is_admin_menu;
  }

  set is_admin_menu(isAdminMenu) {
    this._is_admin_menu = isAdminMenu;
  }
}

module.exports = UserDto;
