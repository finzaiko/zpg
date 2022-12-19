class ShareDto {
  get content() {
    return this._content;
  }

  set content(new_content) {
    this._content = new_content;
  }

  get type() {
    return this._type;
  }

  set type(new_type) {
    this._type = new_type;
  }

  get share_to() {
    return this._share_to;
  }

  set share_to(new_share_to) {
    this._share_to = new_share_to;
  }

  get user_id() {
    return this._user_id;
  }

  set user_id(new_user_id) {
    this._user_id = new_user_id;
  }
}

module.exports = ShareDto;
