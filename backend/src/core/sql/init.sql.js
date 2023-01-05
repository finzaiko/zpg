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
    UNIQUE(username, email)
);
`;

/*
  [
    {"m_key": "system_menu"                   , "m_val": "{}",       ,"d_type": "json",     "note": "Menu config",              "u_type": 0  },
    {"m_key": "system_allow_register"         , "m_val": true,       ,"d_type": "boolean",  "note": "Enable self registration", "u_type": 1  },
    {"m_key": "app_sidebar_state"             , "m_val": "expand",   ,"d_type": "text",     "note": "",                         "u_type": 3  },
    {"m_key": "app_theme"                     , "m_val": "default",  ,"d_type": "text",     "note": "Theme",                    "u_type": 3  },
    {"m_key": "query_editor_font_size"        , "m_val": 12,         ,"d_type": "integer",  "note": "Editor font size (in px)", "u_type": 3  },
    {"m_key": "query_data_type"               , "m_val": true,       ,"d_type": "boolean",  "note": "",                         "u_type": 3  },
    {"m_key": "query_quick_search"            , "m_val": false,      ,"d_type": "boolean",  "note": "",                         "u_type": 3  },
    {"m_key": "query_minimap"                 , "m_val": false,      ,"d_type": "boolean",  "note": "",                         "u_type": 3  },
    {"m_key": "query_enable_history"          , "m_val": true,       ,"d_type": "boolean",  "note": "",                         "u_type": 3  },
    {"m_key": "task_confirm_drop_replace"     , "m_val": false,      ,"d_type": "boolean",  "note": "",                         "u_type": 3  },
    {"m_key": "task_confirm_direct_execute"   , "m_val": false,      ,"d_type": "boolean",  "note": "",                         "u_type": 3  }
  ]

*/

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
    UNIQUE(conn_name, user_id)
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
    type integer, -- 1=serverconn, 2=dbconn, 3=queryhistory, 4=querybookmark, 5=usersetting, 6=share_to
    user_id integer,
    seq integer,
    share_to integer,
    share_status integer, -- 0=shared ok, 1=creator deleted, 2=target deleted, 3=both deleted
    created_at timestamp DATE DEFAULT (datetime('now','localtime')),
    modified_at TIMESTAMP
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

const shareTable = `
CREATE TABLE share (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title text,
    content text,
    ukey text,
    user_id integer not null,
    share_to integer,
    share_status integer, -- 0=shared ok, 1=creator deleted, 2=target deleted, 3=both deleted
    is_deleted integer default 0,
    is_read integer default 0,
    created_at timestamp DATE DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES user (id),
    UNIQUE(ukey)
);
`;

const compareTable = (tableName) => {
  return `
    CREATE TABLE ${tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        oid text,
        z_schema text,
        z_name text,
        z_return text,
        z_type text,
        z_params_in integer,
        z_params_out integer,
        z_content integer,
        z_params_in_type text
    );
    `;
};

const defaultSetting = `
    INSERT INTO setting(m_key, m_val, d_type, note, u_type) VALUES
    ('menu', '{}', 'text', 'Menu config', '0'),
    ('allow_register', 'true', 'boolean', 'Enable self registration', '1'),
    ('theme', 'default', 'text', 'Theme', '3'),
    ('editor_font_size', '12', 'int', 'Editor font size (in px)', '3');
`;

const defaultUser = `
    INSERT INTO user (fullname, email, username, password, salt, user_level) VALUES
    ('Admin', 'admin@zpg.com', 'admin', '$2b$10$AOWgReYaPvcDqaOw1h6Gfe6IHeS0rCmSQ7ctGAfzlaWnazf35AiXC', '$2b$10$AOWgReYaPvcDqaOw1h6Gfe', 1);
`;

module.exports = {
  profileTable,
  dbConnTable,
  taskTable,
  taskItemTable,
  userTable,
  settingTable,
  compareTable,
  shareTable,
  defaultSetting,
  defaultUser,
};
