const BaseRepository = require(`../repositories/base.repository`);

const {
  getObjectKeyName,
  getSqlStringTypeFromArray,
  getTableName,
  msToTime,
} = require("../utils/string.utils");

class CopydataService {
  async checkTable(userId, bodyData) {
    const { target_id, table_name } = bodyData;
    const { schema, table } = getTableName(table_name);

    const data = await BaseRepository.checkTableExist(
      target_id,
      userId,
      schema,
      table
    );
    return data.rows[0];
  }

  async getTableField(userId, bodyData) {
    const { source_id, source_query } = bodyData;

    const sourceData = await BaseRepository.runQuery(
      source_id,
      userId,
      source_query
    );

    const sqlField = getObjectKeyName(sourceData.rows[0]);

    let newField = [];
    sqlField.forEach((o) => {
      newField.push({ label: o, type: "combo", id: o, value: "text" });
    });

    return newField;
  }

  getCreateTableSql(schema, table, newField) {
    let newUserField = [];
    let tableFields = JSON.parse(newField);

    if (!tableFields.hasOwnProperty("id")) {
      tableFields = Object.assign({ id: "int" }, tableFields);
    }

    for (const [key, value] of Object.entries(tableFields)) {
      if (value != "") {
        if (key == "id") {
          newUserField.push(`${key} serial primary key\n`);
        } else {
          newUserField.push(`"${key}" ${value}\n`);
        }
      }
    }

    const sqlNewField = newUserField.join(",");

    const createSql = `CREATE TABLE "${schema}"."${table}" (
      ${sqlNewField}
    )`;
    return createSql;
  }

  async createTable(userId, bodyData) {
    const { target_id, table_field, table_name } = bodyData;
    const { schema, table } = getTableName(table_name);
    const sqlCreate = this.getCreateTableSql(schema, table, table_field);
    console.log("sqlCreate", sqlCreate);
    const sourceData = await BaseRepository.runQuery(
      target_id,
      userId,
      sqlCreate
    );
    console.log("sourceData", sourceData);

    return Array.isArray(sourceData.rows);
  }

  async runCopy(userId, bodyData) {
    const {
      type_copy,
      source_id,
      target_id,
      source_query,
      target_query,
      table_name,
      source_data,
      first_row,
      table_exist,
      create_table,
      table_field,
    } = bodyData;

    const { schema, table } = getTableName(table_name);

    const startTime = new Date().getTime();
    if (type_copy == "query") {
      const tblType = await BaseRepository.getTableType(
        source_id,
        userId,
        schema,
        table
      );

      const sourceData = await BaseRepository.runQuery(
        source_id,
        userId,
        source_query
      );
      const sqlField = getObjectKeyName(sourceData.rows[0]);
      const fieldTypes = tblType.rows.filter((ob) =>
        sqlField.includes(ob.column_name)
      );
      const sqlQuery = getSqlStringTypeFromArray(
        sourceData.rows,
        schema,
        table,
        false,
        fieldTypes
      );
      const result = await BaseRepository.runBatchQuery(
        target_id,
        userId,
        sqlQuery
      );
      const dataCount = sourceData.rows.length;
      const et = new Date().getTime() - startTime;
      result.data_count = dataCount;
      result.elapsed_time = msToTime(et);
      return result;
    } else {
      const sqlSpreadsheet = this.getSqlSpreadsheet(
        source_data,
        schema,
        table,
        table_field,
        table_exist
      );

      const result = await BaseRepository.runBatchQuery(
        target_id,
        userId,
        sqlSpreadsheet
      );
      const dataCount = JSON.parse(source_data).length;
      const et = new Date().getTime() - startTime;
      result.data_count = dataCount;
      result.elapsed_time = msToTime(et);
      return result;
    }
  }

  async createTableSQL(
    source_id,
    userId,
    source_query,
    create_table,
    table_field,
    schema,
    table
  ) {
    const sourceData = await BaseRepository.runQuery(
      source_id,
      userId,
      source_query
    );
    const sqlField = getObjectKeyName(sourceData.rows[0]);

    let newField = [];
    sqlField.forEach((o) => {
      newField.push({ label: o, type: "combo", id: o, value: "text" });
    });

    let newUserField = [];
    if (create_table) {
      const tableFields = JSON.parse(table_field);
      for (const [key, value] of Object.entries(tableFields)) {
        if (value != "") {
          if (key == "id") {
            newUserField.push(`${key} serial primary key\n`);
          } else {
            newUserField.push(`"${key}" ${value}\n`);
          }
        }
      }
    }

    const sqlNewField = newUserField.join(",");

    const createSql = `CREATE TABLE ${schema}.${table} (
      ${sqlNewField}
    )`;
    return createSql;
  }

  getSqlSpreadsheet(data, schema, table, table_field, table_exist) {
    const parsedData = JSON.parse(data);
    const parsedField = JSON.parse(table_field);
    let sqlAll = [];
    let field = [];

    if (!table_exist) {
      Object.entries(parsedField).forEach((entry) => {
        const [key, _] = entry;
        field.push(`"${key}"`);
      });
    } else {
      parsedField.forEach((o) => {
        field.push(`"${o.label}"`);
      });
    }

    parsedData.forEach((o) => {
      let val = [];
      Object.entries(o).forEach((entry) => {
        const [_, value] = entry;
        switch (value) {
          case "integer":
          case "boolean":
            val.push(`${value}`);
            break;
          default:
            if (value === null) {
              val.push(`${value}`);
            } else {
              val.push(`'${value}'`);
            }
            break;
        }
      });

      let sqlField = field.join(",");
      const sqlValue = val.join(",");
      const oneSql = `INSERT INTO ${schema}.${table} (${sqlField}) VALUES (${sqlValue});`;
      sqlAll.push(oneSql);
    });
    return sqlAll;
  }

  getSqlSpreadsheetDataOnly(data, schema, table, table_field) {
    let parsedData = JSON.parse(data);
    let field = [];

    Object.entries(JSON.parse(table_field)).forEach((entry) => {
      const [key, _] = entry;
      field.push(`"${key}"`);
    });

    let sqlAll = [];

    parsedData.forEach((o) => {
      let val = [];
      Object.entries(o).forEach((entry) => {
        const [key, value] = entry;
        val.push(`'${value}'`);
      });

      let sqlField = field.join(",");
      const sqlValue = val.join(",");
      const oneSql = `INSERT INTO ${schema}.${table} (${sqlField}) VALUES (${sqlValue});`;
      sqlAll.push(oneSql);
    });
    return sqlAll;
  }
}
module.exports = new CopydataService();
