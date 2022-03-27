const userTable = `
CREATE TABLE user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullname text,
    email text,
    username text,
    password text, 
    salt text, 
    user_level integer DEFAULT 3,
    access_group integer,
    menu text,
    last_login TIMESTAMP,
    created_at TIMESTAMP DATE DEFAULT (datetime('now','localtime')),
    modified_at TIMESTAMP,
    UNIQUE(username)
);
`;

const settingTable = `
CREATE TABLE setting (
    m_key text PRIMARY KEY,
    m_val text,
    d_type text,  -- type data: number, combo, etc
    note text,
    u_type integer, -- 0=system, 1=admin, null/other=user
    UNIQUE(m_key)
);
`;

const dbConnTable = `
CREATE TABLE db_conn (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conn_name text,
    host text, 
    port text, 
    database text,
    user text,
    password text,
    type integer, -- 1=serverconn, 2=dbconn,
    user_id integer,
    created_at timestamp DATE DEFAULT (datetime('now','localtime')),
    modified_at TIMESTAMP,
    UNIQUE(conn_name)
);
`;

const profileTable = `
CREATE TABLE profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conn_name text,
    host text, 
    port text, 
    database text,
    user text,
    password text,
    ssl integer,
    title text,
    content text,
    type integer, -- 1=serverconn, 2=dbconn, 3=queryhistory, 4=querybookmark, 5=usersetting
    user_id integer,
    seq integer,
    created_at timestamp DATE DEFAULT (datetime('now','localtime')),
    modified_at TIMESTAMP,
    UNIQUE(conn_name)
);
`;

const taskTable = `
CREATE TABLE IF NOT EXISTS task (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_name text NOT NULL,
    source_db_id integer, -- ref to profile
    target_db_id integer,
    note text, 
    user_id integer,
    created_at timestamp DATE DEFAULT (datetime('now','localtime')),
    modified_at TIMESTAMP,
    UNIQUE(task_name)
);
`;

const taskItemTable = `
CREATE TABLE task_item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id integer,
    schema text,
    name text,
    params_in integer,
    params_out integer,
    params_inout integer,
    return_type text,
    type integer,
    sql_content text,
    oid integer, 
    FOREIGN KEY (task_id)
        REFERENCES task (id) 
        ON DELETE CASCADE 
        ON UPDATE NO ACTION
);
`;

const initSettingData = `
INSERT INTO setting (m_key, m_val, d_type, note, u_type) VALUES
('menu','{}', 'text','Menu config',0),
('allow_register','true', 'boolean','Enable self registration',1),
('theme','default', 'text','Theme',3),
('editor_font_size','12', 'int','Editor font size (in px)',3);
`;

const initUserData = `
INSERT INTO user (fullname, email, username, password) VALUES ('User1','user1@test.com','user1','$2b$10$qv6XhFzjQl/O3nvT7lTKqujQHAhDV7E9qtjagnuRz0ayDj1iPvyuK')
`;

module.exports = {
  profileTable,
  dbConnTable,
  taskTable,
  taskItemTable,
  userTable,
  settingTable,
  initSettingData,
  initUserData,
};
