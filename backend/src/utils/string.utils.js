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

function JSONToListText(data) {
  if (typeof data == "object") {
    let result = [];
    for (const [key, value] of Object.entries(data)) {
      result.push(
        `${key
          .replace(/_/g, " ")
          .replace(/\b\S/g, (t) => t.toUpperCase())}: ${value}<br>`
      );
    }
    return result.join("");
  }
}

module.exports = {
  randomString,
  getObjectKeyName,
  getSqlStringTypeFromArray,
  getTableName,
  isJSONString,
  JSONToListText
};
