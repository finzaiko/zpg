const GeneratorRepository = require(`../repositories/generator.repository`);
const { pgType } = require("../utils/pg.util");
const { isInt, isJSONString } = require("../utils/string.utils");

class GeneratorService {
  async getOutParams(profileId, userId, query, type) {
    query = query.replace(/;*$/, "");
    return await GeneratorRepository.getOutParams(
      profileId,
      userId,
      query,
      type
    );
  }

  async getInsertQuery(profileId, userId, query, table) {
    query = query.replace(/;*$/, "");
    const result = await GeneratorRepository.getInsertQuery(
      profileId,
      userId,
      query
    );
    let fields = [];
    for (const key in result.rows[0]) {
      fields.push(key);
    }

    const fieldsType = result.fields.reduce((acc, item) => {
      acc[item.name] = item.dataTypeID;
      return acc;
    }, {});

    let sqlAll = [];
    result.rows.forEach((o) => {
      let val = [];
      Object.entries(o).forEach((entry) => {
        const [key, value] = entry;
        if (isInt(value) || typeof value == "boolean" || value === null) {
          const isArrType = pgType[fieldsType[key]];
          if (/\[|\]/.test(isArrType)) {
            val.push(`'{${value}}'`);
          } else {
            val.push(`${value}`);
          }
        } else {
          if (typeof value === "object" && value !== null) {
            const isArrType = pgType[fieldsType[key]];
            if (/\[|\]/.test(isArrType)) {
              val.push(`'${value.replace(/'/g, "''")}'`);
            }else{
              val.push(`'${JSON.stringify(value).replace(/'/g, "''")}'`);
            }
          } else {
            val.push(`'${value.replace(/'/g, "''")}'`);
          }
        }
      });

      let sqlField = fields.join(",");
      const sqlValue = val.join(",");
      const oneSql = `INSERT INTO ${table} (${sqlField}) VALUES (${sqlValue});`;
      sqlAll.push(oneSql);
    });

    return sqlAll.join("\n");
  }
}
module.exports = new GeneratorService();
