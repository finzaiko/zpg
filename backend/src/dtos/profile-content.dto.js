class ProfileContentDto {
  get title() {
    return this._title;
  }

  set title(title) {
    this._title = title;
  }

  get content() {
    return this._content;
  }

  set content(content) {
    this._content = content;
  }

  get type() {
    return this._type;
  }

  set type(type) {
    this._type = type;
  }
  get user_id() {
    return this._user_id;
  }

  set user_id(user_id) {
    this._user_id = user_id;
  }
}

module.exports = ProfileContentDto;
