const randomString = (length) => {
  let result = "";
  let characters =
    //"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    "abcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const getObjectKeyName = (obj) => {
  let field = [];
  Object.entries(obj).forEach((entry) => {
    const [key, value] = entry;
    field.push(key);
  });
  // return field.join(",");
  return field;
};

const getSqlStringTypeFromArray = (
  data,
  schema,
  table,
  first_row,
  typeField
) => {
  console.log("data", data);

  // let parsedData = JSON.parse(data);
  let parsedData = data;
  let frName;
  if (first_row) {
    frName = Object.values(parsedData[0]);
    parsedData.shift();
  }
  let sqlAll = [];
  parsedData.forEach((o) => {
    let field = [],
      val = [];
    Object.entries(o).forEach((entry) => {
      const [key, value] = entry;
      if (typeof typeField != "undefined") {
        field.push(`"${key}"`);
        const tt = typeField.find((tp) => tp.column_name == key);
        switch (tt.data_type) {
          case "integer":
          case "boolean":
            val.push(`${value}`);
            break;
          default:
            val.push(`'${value}'`);
            break;
        }
      } else {
        field.push(`"${key}"`);
        val.push(`'${value}'`);
      }
    });

    let sqlField = field.join(",");
    if (first_row) {
      sqlField = frName.join(",");
    }

    const sqlValue = val.join(",");
    const oneSql = `INSERT INTO ${schema}.${table} (${sqlField}) VALUES (${sqlValue});`;
    sqlAll.push(oneSql);
  });

  return sqlAll;
};

const getTableName = (schemaTable) => {
  let schema = "public",
    table = "";
  if (schemaTable.includes(".")) {
    const ts = schemaTable.split(".");
    schema = ts[0];
    table = ts[1];
  } else {
    table = schemaTable;
  }
  return { schema, table };
};

const isJSONString = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

function msToTime(ms) {
  if (!Number.isInteger(ms)) {
    return null;
  }
  const allocate = (msUnit) => {
    const units = Math.trunc(ms / msUnit);
    ms -= units * msUnit;
    return units;
  };
  const tObj = {
    // weeks: allocate(604800000), // Uncomment for weeks
    day: allocate(86400000),
    hour: allocate(3600000),
    min: allocate(60000),
    sec: allocate(1000),
    ms: ms, // remainder
  };

  let tt = [];
  Object.entries(tObj).filter(([key, value]) => {
    if (value > 0) {
      tt.push(`${value} ${key}`);
    }
  });
  return tt.join(" ");
}

module.exports = {
  randomString,
  getObjectKeyName,
  getSqlStringTypeFromArray,
  getTableName,
  isJSONString,
  msToTime,
};
